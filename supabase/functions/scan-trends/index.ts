import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const AI_GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const YOUTUBE_API_KEY = Deno.env.get("YOUTUBE_API_KEY");
    if (!YOUTUBE_API_KEY) throw new Error("YOUTUBE_API_KEY is not configured");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // No token deduction for scan-trends — it populates shared data

    // Fetch trending videos from YouTube
    const ytUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&chart=mostPopular&regionCode=US&maxResults=25&key=${YOUTUBE_API_KEY}`;
    const ytRes = await fetch(ytUrl);
    const ytData = await ytRes.json();

    const videos = (ytData.items || []).map((v: any) => {
      const viewCount = parseInt(v.statistics.viewCount) || 0;
      const likeCount = parseInt(v.statistics.likeCount) || 0;
      const commentCount = parseInt(v.statistics.commentCount) || 0;
      const publishedAt = new Date(v.snippet.publishedAt);
      const hoursLive = Math.max(1, (Date.now() - publishedAt.getTime()) / 3600000);
      const vph = Math.round(viewCount / hoursLive);
      const engagementRate = viewCount > 0 ? ((likeCount + commentCount) / viewCount) * 100 : 0;

      return {
        title: v.snippet.title,
        channelTitle: v.snippet.channelTitle,
        category: v.snippet.categoryId,
        tags: v.snippet.tags?.slice(0, 5) || [],
        viewCount, likeCount, commentCount,
        publishedAt: v.snippet.publishedAt,
        vph,
        engagementRate: Math.round(engagementRate * 100) / 100,
        hoursLive: Math.round(hoursLive),
      };
    });

    console.log(`Fetched ${videos.length} trending videos`);

    const videoSummary = videos
      .map((v: any) => `"${v.title}" by ${v.channelTitle} — ${v.viewCount.toLocaleString()} views, ${v.likeCount.toLocaleString()} likes, ${v.commentCount.toLocaleString()} comments, VPH: ${v.vph.toLocaleString()}, engagement: ${v.engagementRate}%, tags: ${v.tags.join(", ")}`)
      .join("\n");

    const systemPrompt = `You are a YouTube trend analyst. Analyze the following trending YouTube videos and extract:
1. Current trending TOPICS (not individual videos) — group related videos into broader topics
2. Predictions for topics that will trend in the next 24-72 hours

For each trend, provide: topic name, category, trend_score (0-100), velocity (growth %), total_views (sum of grouped videos), views_per_hour (average VPH), engagement_rate (average %), like_count (sum), comment_count (sum), video_count (how many videos in this trend), and top_channel (channel with most views in this trend).
For each prediction, provide trend_probability (0-100), competition_score (0-1), suggested video idea, and time_window.`;

    const aiResponse = await fetch(AI_GATEWAY, {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Here are the current trending YouTube videos:\n\n${videoSummary}\n\nAnalyze these and extract trends and predictions.` },
        ],
        tools: [{
          type: "function",
          function: {
            name: "save_trends_and_predictions",
            description: "Save analyzed YouTube trends and predictions to the database",
            parameters: {
              type: "object",
              properties: {
                trends: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      topic: { type: "string" }, category: { type: "string" }, trend_score: { type: "number" },
                      velocity: { type: "number" }, total_views: { type: "number" }, views_per_hour: { type: "number" },
                      engagement_rate: { type: "number" }, like_count: { type: "number" }, comment_count: { type: "number" },
                      video_count: { type: "number" }, top_channel: { type: "string" }, source: { type: "string" }, region: { type: "string" },
                    },
                    required: ["topic", "category", "trend_score", "velocity", "total_views", "views_per_hour", "engagement_rate", "video_count"],
                    additionalProperties: false,
                  },
                },
                predictions: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      topic: { type: "string" }, trend_probability: { type: "number" }, competition_score: { type: "number" },
                      suggested_idea: { type: "string" }, time_window: { type: "string" }, status: { type: "string" },
                    },
                    required: ["topic", "trend_probability", "competition_score", "suggested_idea", "time_window"],
                    additionalProperties: false,
                  },
                },
              },
              required: ["trends", "predictions"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "save_trends_and_predictions" } },
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (aiResponse.status === 402) return new Response(JSON.stringify({ error: "AI usage limit reached." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const errText = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, errText);
      throw new Error(`AI gateway error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("AI did not return structured output");

    const parsed = JSON.parse(toolCall.function.arguments);
    const { trends, predictions } = parsed;

    await supabase.from("trends").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await supabase.from("predictions").delete().neq("id", "00000000-0000-0000-0000-000000000000");

    const trendRows = trends.map((t: any) => ({
      topic: t.topic, category: t.category || null, trend_score: t.trend_score, velocity: t.velocity,
      source: t.source || "youtube", region: t.region || "US", total_views: t.total_views || 0,
      views_per_hour: t.views_per_hour || 0, engagement_rate: t.engagement_rate || 0,
      like_count: t.like_count || 0, comment_count: t.comment_count || 0, video_count: t.video_count || 0,
      top_channel: t.top_channel || null,
    }));

    const predictionRows = predictions.map((p: any) => ({
      topic: p.topic, trend_probability: p.trend_probability, competition_score: p.competition_score,
      suggested_idea: p.suggested_idea, time_window: p.time_window || "24-72h", status: p.status || "active",
    }));

    const { error: tErr } = await supabase.from("trends").insert(trendRows);
    if (tErr) console.error("Trends insert error:", tErr);
    const { error: pErr } = await supabase.from("predictions").insert(predictionRows);
    if (pErr) console.error("Predictions insert error:", pErr);

    return new Response(
      JSON.stringify({ success: true, trendsInserted: trendRows.length, predictionsInserted: predictionRows.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("scan-trends error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
