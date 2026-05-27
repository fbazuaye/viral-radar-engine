import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const YT_BASE = "https://www.googleapis.com/youtube/v3";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

async function ytFetch(url: string, label: string) {
  const res = await fetch(url);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const reason =
      data?.error?.errors?.[0]?.reason ||
      data?.error?.status ||
      `HTTP_${res.status}`;
    const message = data?.error?.message || `YouTube ${label} failed`;
    throw new Error(`YouTube ${label} error [${reason}]: ${message}`);
  }
  return data;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const YOUTUBE_API_KEY = Deno.env.get("YOUTUBE_API_KEY");
    if (!YOUTUBE_API_KEY) return json({ error: "YOUTUBE_API_KEY not configured" }, 500);

    const authHeader = req.headers.get("authorization");
    if (!authHeader) return json({ error: "Unauthorized" }, 401);

    // Identify the user via the anon client + their JWT
    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_PUBLISHABLE_KEY") || Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user }, error: userErr } = await userClient.auth.getUser();
    if (userErr || !user) return json({ error: "Unauthorized" }, 401);
    const userId = user.id;

    // Service client for DB writes (avoids RLS edge-cases)
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { channelInput } = await req.json().catch(() => ({}));
    if (!channelInput || typeof channelInput !== "string") {
      return json({ error: "channelInput is required" }, 400);
    }

    // ---- Resolve channel ID ----
    let raw = channelInput.trim();
    let channelId: string | null = null;
    let handle: string | null = null;
    let searchTerm: string | null = null;

    if (raw.includes("youtube.com") || raw.includes("youtu.be")) {
      try {
        const u = new URL(raw.startsWith("http") ? raw : `https://${raw}`);
        const parts = u.pathname.split("/").filter(Boolean);
        if (parts[0] === "channel" && parts[1]) channelId = parts[1];
        else if (parts[0]?.startsWith("@")) handle = parts[0];
        else if (parts[0] === "c" || parts[0] === "user") searchTerm = parts[1] ?? null;
        else if (parts[0]?.startsWith("@") === false && parts[0]) searchTerm = parts[0];
      } catch {
        // fall through
      }
    } else if (raw.startsWith("@")) {
      handle = raw;
    } else if (/^UC[\w-]{20,}$/.test(raw)) {
      channelId = raw;
    } else {
      searchTerm = raw;
    }

    if (!channelId && handle) {
      const h = handle.startsWith("@") ? handle : `@${handle}`;
      const data = await ytFetch(
        `${YT_BASE}/channels?part=id&forHandle=${encodeURIComponent(h)}&key=${YOUTUBE_API_KEY}`,
        "handle lookup"
      );
      if (data.items?.length) channelId = data.items[0].id;
      else searchTerm = h.replace(/^@/, "");
    }

    if (!channelId && searchTerm) {
      const data = await ytFetch(
        `${YT_BASE}/search?part=snippet&type=channel&maxResults=1&q=${encodeURIComponent(searchTerm)}&key=${YOUTUBE_API_KEY}`,
        "channel search"
      );
      const item = data.items?.[0];
      channelId = item?.id?.channelId || item?.snippet?.channelId || null;
    }

    if (!channelId) return json({ error: `Channel not found for "${raw}"` }, 404);

    // ---- Fetch channel info ----
    const channelData = await ytFetch(
      `${YT_BASE}/channels?part=snippet,statistics&id=${channelId}&key=${YOUTUBE_API_KEY}`,
      "channel lookup"
    );
    if (!channelData.items?.length) return json({ error: "Channel not found" }, 404);

    const ch = channelData.items[0];
    const channelInfo = {
      channel_id: ch.id,
      channel_name: ch.snippet.title,
      thumbnail_url: ch.snippet.thumbnails?.default?.url || null,
      subscriber_count: parseInt(ch.statistics?.subscriberCount) || 0,
      view_count: parseInt(ch.statistics?.viewCount) || 0,
      video_count: parseInt(ch.statistics?.videoCount) || 0,
      user_id: userId,
    };

    // Upsert channel
    const { data: channelRow, error: chErr } = await supabase
      .from("channels")
      .upsert(channelInfo, { onConflict: "channel_id,user_id" })
      .select()
      .single();

    if (chErr || !channelRow) {
      return json({ error: `Failed to save channel: ${chErr?.message || "unknown"}` }, 500);
    }
    const dbChannelId = channelRow.id;

    await supabase.from("profiles").update({ youtube_channel_id: ch.id }).eq("user_id", userId);

    // ---- Fetch recent videos ----
    const searchData = await ytFetch(
      `${YT_BASE}/search?part=id&channelId=${ch.id}&maxResults=50&order=date&type=video&key=${YOUTUBE_API_KEY}`,
      "video search"
    );
    const videoIds = (searchData.items || []).map((v: any) => v.id?.videoId).filter(Boolean);

    let videosInserted = 0;
    if (videoIds.length > 0) {
      const videoData = await ytFetch(
        `${YT_BASE}/videos?part=snippet,statistics&id=${videoIds.join(",")}&key=${YOUTUBE_API_KEY}`,
        "video stats"
      );

      const videoRows = (videoData.items || []).map((v: any) => ({
        video_id: v.id,
        title: v.snippet.title,
        thumbnail_url: v.snippet.thumbnails?.medium?.url || null,
        published_at: v.snippet.publishedAt,
        view_count: parseInt(v.statistics?.viewCount) || 0,
        like_count: parseInt(v.statistics?.likeCount) || 0,
        comment_count: parseInt(v.statistics?.commentCount) || 0,
        channel_id: dbChannelId,
      }));

      await supabase.from("videos").delete().eq("channel_id", dbChannelId);
      const { error: vidErr } = await supabase.from("videos").insert(videoRows);
      if (vidErr) return json({ error: `Failed to save videos: ${vidErr.message}` }, 500);
      videosInserted = videoRows.length;
    }

    return json({ success: true, channel: channelInfo, videosInserted });
  } catch (err) {
    console.error("youtube-sync error:", err);
    return json({ error: err instanceof Error ? err.message : "Unknown error" }, 500);
  }
});
