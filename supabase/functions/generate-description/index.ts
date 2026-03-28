import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { title, script } = await req.json();
    if (!title) throw new Error("Title is required");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const authHeader = req.headers.get("authorization");
    let userId: string | null = null;
    if (authHeader) {
      const userClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_PUBLISHABLE_KEY") || Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: authHeader } } });
      const { data: { user } } = await userClient.auth.getUser();
      userId = user?.id ?? null;
    }
    if (userId) {
      const { data: success } = await supabase.rpc("deduct_tokens", { _user_id: userId, _amount: 3, _action_type: "description_generation", _description: `Description: ${title}` });
      if (!success) return new Response(JSON.stringify({ error: "Insufficient tokens. Please purchase more tokens or upgrade your plan." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const userPrompt = script
      ? `Create a YouTube video description for the video titled: "${title}"\n\nHere is the script for context:\n${script}`
      : `Create a YouTube video description for the video titled: "${title}"`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `You are an expert YouTube SEO specialist. Generate a highly optimized YouTube video description that maximizes discoverability and engagement. The description MUST include:

1. A compelling first 2 lines (visible before "Show more") that hook the viewer and contain the primary keyword
2. A detailed paragraph summarizing the video content with naturally embedded keywords
3. Timestamps/chapters if a script is provided (format: 0:00 Introduction)
4. 3-5 relevant hashtags at the end
5. A call-to-action encouraging likes, subscriptions, and comments
6. Related search terms/keywords section

Keep the total length between 800-1500 characters. Use natural language — avoid keyword stuffing. Return ONLY the description text, ready to paste into YouTube.`
          },
          { role: "user", content: userPrompt }
        ],
      }),
    });

    if (!response.ok) {
      const status = response.status;
      await response.text();
      if (status === 429) return new Response(JSON.stringify({ error: "Rate limit exceeded." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (status === 402) return new Response(JSON.stringify({ error: "AI credits exhausted." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const description = data.choices?.[0]?.message?.content || "";

    if (userId) {
      await supabase.from("insights").insert({ user_id: userId, type: "description", input_text: title, output_data: { description } });
    }

    return new Response(JSON.stringify({ description }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("generate-description error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
