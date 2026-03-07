import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const YT_BASE = "https://www.googleapis.com/youtube/v3";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claimsData.claims.sub as string;

    const YOUTUBE_API_KEY = Deno.env.get("YOUTUBE_API_KEY");
    if (!YOUTUBE_API_KEY) {
      return new Response(JSON.stringify({ error: "YouTube API key not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { channelInput } = await req.json();
    if (!channelInput) {
      return new Response(JSON.stringify({ error: "channelInput is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Resolve channel ID — support channel ID, handle (@username), or URL
    let channelId = channelInput.trim();

    if (channelId.includes("youtube.com")) {
      const url = new URL(channelId);
      const parts = url.pathname.split("/").filter(Boolean);
      if (parts[0] === "channel") channelId = parts[1];
      else if (parts[0]?.startsWith("@")) channelId = parts[0];
      else channelId = parts[1] || parts[0];
    }

    // If it's a handle (@username), resolve to channel ID
    if (channelId.startsWith("@")) {
      const handleRes = await fetch(
        `${YT_BASE}/channels?part=id,snippet,statistics&forHandle=${channelId}&key=${YOUTUBE_API_KEY}`
      );
      const handleData = await handleRes.json();
      if (!handleData.items?.length) {
        return new Response(JSON.stringify({ error: `Channel not found for handle ${channelId}` }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      channelId = handleData.items[0].id;
    }

    // 1. Fetch channel info
    const channelRes = await fetch(
      `${YT_BASE}/channels?part=snippet,statistics&id=${channelId}&key=${YOUTUBE_API_KEY}`
    );
    const channelData = await channelRes.json();
    if (!channelData.items?.length) {
      return new Response(JSON.stringify({ error: "Channel not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const ch = channelData.items[0];
    const channelInfo = {
      channel_id: ch.id,
      channel_name: ch.snippet.title,
      thumbnail_url: ch.snippet.thumbnails?.default?.url || null,
      subscriber_count: parseInt(ch.statistics.subscriberCount) || 0,
      view_count: parseInt(ch.statistics.viewCount) || 0,
      video_count: parseInt(ch.statistics.videoCount) || 0,
      user_id: userId,
    };

    // Upsert channel
    const { data: channelRow, error: chErr } = await supabase
      .from("channels")
      .upsert(channelInfo, { onConflict: "channel_id,user_id" })
      .select()
      .single();

    if (chErr) {
      // If conflict error, try update instead
      const { data: existingChannel } = await supabase
        .from("channels")
        .select()
        .eq("channel_id", channelInfo.channel_id)
        .eq("user_id", userId)
        .single();

      if (existingChannel) {
        await supabase
          .from("channels")
          .update({
            channel_name: channelInfo.channel_name,
            thumbnail_url: channelInfo.thumbnail_url,
            subscriber_count: channelInfo.subscriber_count,
            view_count: channelInfo.view_count,
            video_count: channelInfo.video_count,
          })
          .eq("id", existingChannel.id);
        
        // Use existing channel for video inserts
        var dbChannelId = existingChannel.id;
      } else {
        throw chErr;
      }
    } else {
      var dbChannelId = channelRow.id;
    }

    // Update profile with youtube_channel_id
    await supabase
      .from("profiles")
      .update({ youtube_channel_id: ch.id })
      .eq("user_id", userId);

    // 2. Fetch recent videos (up to 50)
    const searchRes = await fetch(
      `${YT_BASE}/search?part=id&channelId=${ch.id}&maxResults=50&order=date&type=video&key=${YOUTUBE_API_KEY}`
    );
    const searchData = await searchRes.json();
    const videoIds = (searchData.items || []).map((v: any) => v.id.videoId).filter(Boolean);

    let videosInserted = 0;
    if (videoIds.length > 0) {
      // Fetch video details in batches of 50
      const videoRes = await fetch(
        `${YT_BASE}/videos?part=snippet,statistics&id=${videoIds.join(",")}&key=${YOUTUBE_API_KEY}`
      );
      const videoData = await videoRes.json();

      const videoRows = (videoData.items || []).map((v: any) => ({
        video_id: v.id,
        title: v.snippet.title,
        thumbnail_url: v.snippet.thumbnails?.medium?.url || null,
        published_at: v.snippet.publishedAt,
        view_count: parseInt(v.statistics.viewCount) || 0,
        like_count: parseInt(v.statistics.likeCount) || 0,
        comment_count: parseInt(v.statistics.commentCount) || 0,
        channel_id: dbChannelId,
      }));

      // Delete existing videos for this channel and re-insert
      await supabase.from("videos").delete().eq("channel_id", dbChannelId);
      const { error: vidErr } = await supabase.from("videos").insert(videoRows);
      if (!vidErr) videosInserted = videoRows.length;
    }

    return new Response(
      JSON.stringify({
        success: true,
        channel: channelInfo,
        videosInserted,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("youtube-sync error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
