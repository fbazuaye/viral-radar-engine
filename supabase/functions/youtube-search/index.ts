import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, maxResults = 10 } = await req.json();
    if (!query || typeof query !== "string" || query.trim().length === 0) {
      return new Response(JSON.stringify({ error: "query is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const API_KEY = Deno.env.get("YOUTUBE_API_KEY");
    if (!API_KEY) throw new Error("YOUTUBE_API_KEY not configured");

    // 1. Search for videos
    const searchUrl = new URL("https://www.googleapis.com/youtube/v3/search");
    searchUrl.searchParams.set("part", "snippet");
    searchUrl.searchParams.set("q", query.trim());
    searchUrl.searchParams.set("type", "video");
    searchUrl.searchParams.set("order", "viewCount");
    searchUrl.searchParams.set("maxResults", String(Math.min(Number(maxResults), 25)));
    searchUrl.searchParams.set("key", API_KEY);

    const searchRes = await fetch(searchUrl.toString());
    if (!searchRes.ok) {
      const err = await searchRes.text();
      throw new Error(`YouTube search failed [${searchRes.status}]: ${err}`);
    }
    const searchData = await searchRes.json();
    const videoIds = (searchData.items || []).map((i: any) => i.id.videoId).filter(Boolean);

    if (videoIds.length === 0) {
      return new Response(JSON.stringify({ results: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. Get video statistics
    const statsUrl = new URL("https://www.googleapis.com/youtube/v3/videos");
    statsUrl.searchParams.set("part", "snippet,statistics,contentDetails");
    statsUrl.searchParams.set("id", videoIds.join(","));
    statsUrl.searchParams.set("key", API_KEY);

    const statsRes = await fetch(statsUrl.toString());
    if (!statsRes.ok) {
      const err = await statsRes.text();
      throw new Error(`YouTube videos failed [${statsRes.status}]: ${err}`);
    }
    const statsData = await statsRes.json();

    const now = Date.now();
    const results = (statsData.items || []).map((v: any) => {
      const views = Number(v.statistics?.viewCount || 0);
      const likes = Number(v.statistics?.likeCount || 0);
      const comments = Number(v.statistics?.commentCount || 0);
      const publishedAt = v.snippet?.publishedAt;
      const ageHours = publishedAt
        ? Math.max(1, (now - new Date(publishedAt).getTime()) / 3600000)
        : 1;
      const vph = Math.round(views / ageHours);
      const engagement = views > 0 ? ((likes + comments) / views) * 100 : 0;

      return {
        video_id: v.id,
        title: v.snippet?.title || "",
        channel_name: v.snippet?.channelTitle || "",
        channel_id: v.snippet?.channelId || "",
        thumbnail_url: v.snippet?.thumbnails?.high?.url || v.snippet?.thumbnails?.default?.url || "",
        published_at: publishedAt,
        view_count: views,
        like_count: likes,
        comment_count: comments,
        views_per_hour: vph,
        engagement_rate: Number(engagement.toFixed(2)),
        age_hours: Math.round(ageHours),
      };
    });

    // Sort by views descending
    results.sort((a: any, b: any) => b.view_count - a.view_count);

    // Aggregate stats
    const totalViews = results.reduce((s: number, r: any) => s + r.view_count, 0);
    const totalLikes = results.reduce((s: number, r: any) => s + r.like_count, 0);
    const totalComments = results.reduce((s: number, r: any) => s + r.comment_count, 0);
    const avgVph = results.length > 0 ? Math.round(results.reduce((s: number, r: any) => s + r.views_per_hour, 0) / results.length) : 0;
    const avgEngagement = results.length > 0 ? Number((results.reduce((s: number, r: any) => s + r.engagement_rate, 0) / results.length).toFixed(2)) : 0;

    return new Response(
      JSON.stringify({
        query: query.trim(),
        total_results: results.length,
        aggregate: { total_views: totalViews, total_likes: totalLikes, total_comments: totalComments, avg_vph: avgVph, avg_engagement: avgEngagement },
        results,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("youtube-search error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
