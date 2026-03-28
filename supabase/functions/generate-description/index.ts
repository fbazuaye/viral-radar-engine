import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { title, script, refineInstruction, currentDescription } = await req.json();
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

    let userPrompt: string;
    if (refineInstruction && currentDescription) {
      userPrompt = `Here is the current YouTube video description for "${title}":\n\n${currentDescription}\n\nPlease refine it with these instructions: ${refineInstruction}`;
    } else if (script) {
      userPrompt = `Create a YouTube video description for the video titled: "${title}"\n\nHere is the script for context:\n${script}`;
    } else {
      userPrompt = `Create a YouTube video description for the video titled: "${title}"`;
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `You are an expert YouTube SEO specialist. Generate a highly optimized YouTube video description that maximizes discoverability and engagement.

STYLE GUIDE — follow this structure closely:
1. Start with the exact video title as the first line
2. A powerful opening hook (1-2 sentences) that creates urgency or curiosity, using emojis sparingly (⚠️, 🔥, etc.)
3. A "Why it matters" or key points section using bold subheadings followed by concise explanations with real data, statistics, or specific details
4. End with an engaging question or call-to-action inviting comments (e.g. "Is this the start of...? 👇 Let us know your thoughts in the comments.")
5. If a script is provided, add timestamps/chapters (format: 0:00 Introduction)
6. Add 3-5 relevant hashtags at the very end

KEY RULES:
- Use a journalistic, punchy tone — not generic or fluffy
- Include specific numbers, percentages, and facts when possible
- Use subheadings with colons (e.g. "Supply Shock:", "Global Impact:") to break up content
- Keep it scannable — short paragraphs, no walls of text
- Total length: 800-2000 characters
- Return ONLY the description text, ready to paste into YouTube
- Do NOT add subscribe/like boilerplate — weave engagement naturally into the closing question`
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
