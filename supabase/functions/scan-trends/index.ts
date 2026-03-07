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
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const YOUTUBE_API_KEY = Deno.env.get("YOUTUBE_API_KEY");
    if (!YOUTUBE_API_KEY) {
      throw new Error("YOUTUBE_API_KEY is not configured");
    }

    // Use service role to insert into trends/predictions (no user-level RLS)
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Step 1: Fetch trending videos from YouTube
    const categories = ["0"]; // 0 = all categories
    const regions = ["US"];
    const allTrendingVideos: any[] = [];

    for (const region of regions) {
      for (const cat of categories) {
        const ytUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&chart=mostPopular&regionCode=${region}&videoCategoryId=${cat}&maxResults=25&key=${YOUTUBE_API_KEY}`;
        const ytRes = await fetch(ytUrl);
        const ytData = await ytRes.json();
        if (ytData.items) {
          allTrendingVideos.push(
            ...ytData.items.map((v: any) => ({
              title: v.snippet.title,
              channelTitle: v.snippet.channelTitle,
              category: v.snippet.categoryId,
              tags: v.snippet.tags?.slice(0, 5) || [],
              viewCount: parseInt(v.statistics.viewCount) || 0,
              likeCount: parseInt(v.statistics.likeCount) || 0,
              commentCount: parseInt(v.statistics.commentCount) || 0,
              publishedAt: v.snippet.publishedAt,
            }))
          );
        }
      }
    }

    console.log(`Fetched ${allTrendingVideos.length} trending videos`);

    // Step 2: Build a summary for the AI
    const videoSummary = allTrendingVideos
      .map(
        (v) =>
          `"${v.title}" by ${v.channelTitle} — ${v.viewCount.toLocaleString()} views, ${v.likeCount.toLocaleString()} likes, tags: ${v.tags.join(", ")}`
      )
      .join("\n");

    // Step 3: Call Lovable AI to extract trends and predictions
    const systemPrompt = `You are a YouTube trend analyst. Analyze the following trending YouTube videos and extract:
1. Current trending TOPICS (not individual videos) — group related videos into broader topics
2. Predictions for topics that will trend in the next 24-72 hours based on patterns

For each trend, assess the trend_score (0-100), velocity (growth rate percentage), and categorize it.
For each prediction, provide trend_probability (0-100), competition_score (0-1), a suggested video idea, and time_window.`;

    const userPrompt = `Here are the current trending YouTube videos:\n\n${videoSummary}\n\nAnalyze these and extract trends and predictions.`;

    const aiResponse = await fetch(AI_GATEWAY, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "save_trends_and_predictions",
              description:
                "Save analyzed YouTube trends and predictions to the database",
              parameters: {
                type: "object",
                properties: {
                  trends: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        topic: { type: "string", description: "The trending topic name" },
                        category: { type: "string", description: "Category like Tech, Entertainment, Gaming, etc." },
                        trend_score: { type: "number", description: "Score 0-100 indicating how trending this topic is" },
                        velocity: { type: "number", description: "Growth rate percentage" },
                        source: { type: "string", description: "Source: youtube" },
                        region: { type: "string", description: "Region code like US, global" },
                      },
                      required: ["topic", "category", "trend_score", "velocity"],
                      additionalProperties: false,
                    },
                  },
                  predictions: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        topic: { type: "string", description: "Predicted trending topic" },
                        trend_probability: { type: "number", description: "Probability 0-100 of trending" },
                        competition_score: { type: "number", description: "Competition 0-1 (0=low, 1=high)" },
                        suggested_idea: { type: "string", description: "A video idea for this predicted trend" },
                        time_window: { type: "string", description: "When it will trend: 24h, 48h, or 72h" },
                        status: { type: "string", description: "Status: active" },
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
          },
        ],
        tool_choice: {
          type: "function",
          function: { name: "save_trends_and_predictions" },
        },
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI usage limit reached. Please add credits in Settings → Workspace → Usage." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errText = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, errText);
      throw new Error(`AI gateway error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      throw new Error("AI did not return structured output");
    }

    const parsed = JSON.parse(toolCall.function.arguments);
    const { trends, predictions } = parsed;

    console.log(`AI extracted ${trends.length} trends and ${predictions.length} predictions`);

    // Step 4: Clear old data and insert new
    await supabase.from("trends").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await supabase.from("predictions").delete().neq("id", "00000000-0000-0000-0000-000000000000");

    const trendRows = trends.map((t: any) => ({
      topic: t.topic,
      category: t.category || null,
      trend_score: t.trend_score,
      velocity: t.velocity,
      source: t.source || "youtube",
      region: t.region || "US",
    }));

    const predictionRows = predictions.map((p: any) => ({
      topic: p.topic,
      trend_probability: p.trend_probability,
      competition_score: p.competition_score,
      suggested_idea: p.suggested_idea,
      time_window: p.time_window || "24-72h",
      status: p.status || "active",
    }));

    const { error: tErr } = await supabase.from("trends").insert(trendRows);
    if (tErr) console.error("Trends insert error:", tErr);

    const { error: pErr } = await supabase.from("predictions").insert(predictionRows);
    if (pErr) console.error("Predictions insert error:", pErr);

    return new Response(
      JSON.stringify({
        success: true,
        trendsInserted: trendRows.length,
        predictionsInserted: predictionRows.length,
      }),
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
