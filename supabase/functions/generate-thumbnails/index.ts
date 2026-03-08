import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};


async function uploadBase64ToStorage(
  supabase: any,
  base64DataUri: string,
  path: string
): Promise<string | null> {
  try {
    // Extract base64 data from data URI
    const matches = base64DataUri.match(/^data:([^;]+);base64,(.+)$/);
    if (!matches) return base64DataUri; // It's already a URL, return as-is

    const mimeType = matches[1];
    const base64Data = matches[2];
    const bytes = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));

    const { error } = await supabase.storage
      .from("thumbnail-images")
      .upload(path, bytes, { contentType: mimeType, upsert: true });

    if (error) {
      console.error("Storage upload error:", error);
      return null;
    }

    const { data: urlData } = supabase.storage
      .from("thumbnail-images")
      .getPublicUrl(path);

    return urlData?.publicUrl ?? null;
  } catch (e) {
    console.error("Upload error:", e);
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { topic } = await req.json();
    if (!topic) throw new Error("Topic is required");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const authHeader = req.headers.get("authorization");
    let userId: string | null = null;
    if (authHeader) {
      const userClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: authHeader } } });
      const { data: { user } } = await userClient.auth.getUser();
      userId = user?.id ?? null;
    }
    if (userId) {
      const { data: success } = await supabase.rpc("deduct_tokens", { _user_id: userId, _amount: 5, _action_type: "thumbnail_ideas", _description: `Thumbnails: ${topic}` });
      if (!success) return new Response(JSON.stringify({ error: "Insufficient tokens. Please purchase more tokens or upgrade your plan." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Step 1: Generate text concepts
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "You are a YouTube thumbnail design expert. Given a video topic, generate 4 creative thumbnail concepts optimized for maximum click-through rate. Each concept should have a distinct visual style." },
          { role: "user", content: `Generate 4 thumbnail concepts for: "${topic}"` }
        ],
        tools: [{
          type: "function",
          function: {
            name: "create_thumbnails",
            description: "Return thumbnail concept ideas",
            parameters: {
              type: "object",
              properties: {
                concepts: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      style: { type: "string", description: "Short style name e.g. Split Comparison" },
                      desc: { type: "string", description: "Visual description of the thumbnail layout and elements" },
                      colors: { type: "string", description: "Recommended color palette" },
                      textOverlay: { type: "string", description: "Suggested bold text overlay for the thumbnail" }
                    },
                    required: ["style", "desc", "colors", "textOverlay"],
                    additionalProperties: false
                  }
                }
              },
              required: ["concepts"],
              additionalProperties: false
            }
          }
        }],
        tool_choice: { type: "function", function: { name: "create_thumbnails" } }
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
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    const result = toolCall ? JSON.parse(toolCall.function.arguments) : { concepts: [] };

    // Step 2: Generate images for each concept in parallel
    const timestamp = Date.now();
    const imagePromises = result.concepts.map(async (concept: any, index: number) => {
      const imageDataUri = await generateImage(
        `${concept.style} thumbnail: ${concept.desc}. Color palette: ${concept.colors}.`,
        LOVABLE_API_KEY
      );

      if (imageDataUri) {
        const storagePath = `${userId || "anon"}/${timestamp}-${index}.png`;
        const publicUrl = await uploadBase64ToStorage(supabase, imageDataUri, storagePath);
        if (publicUrl) {
          concept.imageUrl = publicUrl;
        }
      }
    });

    await Promise.all(imagePromises);

    return new Response(JSON.stringify(result), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("generate-thumbnails error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
