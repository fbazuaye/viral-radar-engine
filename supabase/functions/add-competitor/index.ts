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
    if (!channelInput || typeof channelInput !== "string" || channelInput.trim().length === 0) {
      return new Response(JSON.stringify({ error: "channelInput is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Resolve channel ID from URL, handle, or raw ID
    let channelId = channelInput.trim();

    if (channelId.includes("youtube.com")) {
      const url = new URL(channelId);
      const parts = url.pathname.split("/").filter(Boolean);
      if (parts[0] === "channel") channelId = parts[1];
      else if (parts[0]?.startsWith("@")) channelId = parts[0];
      else channelId = parts[1] || parts[0];
    }

    // Handle @username → resolve to channel ID
    if (channelId.startsWith("@")) {
      const handleRes = await fetch(
        `${YT_BASE}/channels?part=id,snippet,statistics&forHandle=${channelId}&key=${YOUTUBE_API_KEY}`
      );
      const handleData = await handleRes.json();
      if (!handleData.items?.length) {
        return new Response(JSON.stringify({ error: `Channel not found for "${channelInput}"` }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      channelId = handleData.items[0].id;
    }

    // Fetch channel stats
    const channelRes = await fetch(
      `${YT_BASE}/channels?part=snippet,statistics&id=${channelId}&key=${YOUTUBE_API_KEY}`
    );
    const channelData = await channelRes.json();

    // If not found by ID, try searching by name
    if (!channelData.items?.length) {
      const searchRes = await fetch(
        `${YT_BASE}/search?part=snippet&type=channel&q=${encodeURIComponent(channelInput.trim())}&maxResults=1&key=${YOUTUBE_API_KEY}`
      );
      const searchData = await searchRes.json();
      if (!searchData.items?.length) {
        return new Response(JSON.stringify({ error: `Channel not found for "${channelInput}"` }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      channelId = searchData.items[0].snippet.channelId;
      const retry = await fetch(
        `${YT_BASE}/channels?part=snippet,statistics&id=${channelId}&key=${YOUTUBE_API_KEY}`
      );
      const retryData = await retry.json();
      if (!retryData.items?.length) {
        return new Response(JSON.stringify({ error: "Channel not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      channelData.items = retryData.items;
    }

    const ch = channelData.items[0];
    const subscriberCount = parseInt(ch.statistics.subscriberCount) || 0;

    // Fetch top video by views
    const vidSearchRes = await fetch(
      `${YT_BASE}/search?part=id&channelId=${ch.id}&maxResults=10&order=viewCount&type=video&key=${YOUTUBE_API_KEY}`
    );
    const vidSearchData = await vidSearchRes.json();
    const videoIds = (vidSearchData.items || []).map((v: any) => v.id.videoId).filter(Boolean);

    let topVideoTitle: string | null = null;
    let topVideoViews = 0;
    let avgViews = 0;

    if (videoIds.length > 0) {
      const vidRes = await fetch(
        `${YT_BASE}/videos?part=snippet,statistics&id=${videoIds.join(",")}&key=${YOUTUBE_API_KEY}`
      );
      const vidData = await vidRes.json();
      const videos = vidData.items || [];

      let totalViews = 0;
      let maxViews = 0;

      for (const v of videos) {
        const views = parseInt(v.statistics.viewCount) || 0;
        totalViews += views;
        if (views > maxViews) {
          maxViews = views;
          topVideoTitle = v.snippet.title;
          topVideoViews = views;
        }
      }

      avgViews = videos.length > 0 ? Math.round(totalViews / videos.length) : 0;
    }

    // Upsert into competitors table
    const competitorRow = {
      user_id: userId,
      channel_id: ch.id,
      channel_name: ch.snippet.title,
      subscriber_count: subscriberCount,
      avg_views: avgViews,
      top_video_title: topVideoTitle,
      top_video_views: topVideoViews,
    };

    const { data: existing } = await supabase
      .from("competitors")
      .select("id")
      .eq("user_id", userId)
      .eq("channel_id", ch.id)
      .maybeSingle();

    if (existing) {
      const { error } = await supabase
        .from("competitors")
        .update(competitorRow)
        .eq("id", existing.id);
      if (error) throw error;
    } else {
      const { error } = await supabase.from("competitors").insert(competitorRow);
      if (error) throw error;
    }

    return new Response(
      JSON.stringify({ success: true, competitor: competitorRow }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("add-competitor error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
