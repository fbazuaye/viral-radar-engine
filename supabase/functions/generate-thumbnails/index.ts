import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { topic } = await req.json();
    if (!topic) throw new Error("Topic is required");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabase = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    // Auth & token deduction
    const authHeader = req.headers.get("authorization");
    let userId: string | null = null;
    if (authHeader) {
      const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: authHeader } } });
      const { data: { user } } = await userClient.auth.getUser();
      userId = user?.id ?? null;
    }
    if (userId) {
      const { data: success } = await supabase.rpc("deduct_tokens", { _user_id: userId, _amount: 5, _action_type: "thumbnail_ideas", _description: `Thumbnails: ${topic}` });
      if (!success) return new Response(JSON.stringify({ error: "Insufficient tokens. Please purchase more tokens or upgrade your plan." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Phase 1: Generate text concepts
    const conceptResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
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
                      colors: { type: "string", description: "Recommended color palette as 2-3 hex codes separated by commas, e.g. #FF0000, #00FF00" },
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

    if (!conceptResponse.ok) {
      const status = conceptResponse.status;
      await conceptResponse.text();
      if (status === 429) return new Response(JSON.stringify({ error: "Rate limit exceeded." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (status === 402) return new Response(JSON.stringify({ error: "AI credits exhausted." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      throw new Error("AI gateway error during concept generation");
    }

    const conceptData = await conceptResponse.json();
    const toolCall = conceptData.choices?.[0]?.message?.tool_calls?.[0];
    const result = toolCall ? JSON.parse(toolCall.function.arguments) : { concepts: [] };
    const concepts = result.concepts || [];

    // Phase 2: Generate images for each concept in parallel
    const imagePromises = concepts.map(async (concept: any, index: number) => {
      try {
        const imagePrompt = `Create a YouTube video thumbnail image in 16:9 landscape format. Style: ${concept.style}. Description: ${concept.desc}. Colors: ${concept.colors}. Text overlay on the image: "${concept.textOverlay}". Make it eye-catching, professional, and optimized for clicks.`;

        const imgResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash-image",
            messages: [{ role: "user", content: imagePrompt }],
            modalities: ["image", "text"],
          }),
        });

        if (!imgResponse.ok) {
          console.error(`Image generation failed for concept ${index}: ${imgResponse.status}`);
          return concept;
        }

        const imgData = await imgResponse.json();
        const imageDataUrl = imgData.choices?.[0]?.message?.images?.[0]?.image_url?.url;

        if (!imageDataUrl || !imageDataUrl.startsWith("data:image/")) {
          console.error(`No image data returned for concept ${index}`);
          return concept;
        }

        // Extract base64 and upload to storage
        const base64 = imageDataUrl.split(",")[1];
        const binaryStr = atob(base64);
        const bytes = new Uint8Array(binaryStr.length);
        for (let i = 0; i < binaryStr.length; i++) {
          bytes[i] = binaryStr.charCodeAt(i);
        }

        const fileName = `${userId || "anon"}/${Date.now()}-${index}.png`;
        const { error: uploadError } = await supabase.storage
          .from("thumbnail-images")
          .upload(fileName, bytes, { contentType: "image/png", upsert: true });

        if (uploadError) {
          console.error(`Upload failed for concept ${index}:`, uploadError);
          return concept;
        }

        const { data: publicUrlData } = supabase.storage
          .from("thumbnail-images")
          .getPublicUrl(fileName);

        return { ...concept, imageUrl: publicUrlData.publicUrl };
      } catch (err) {
        console.error(`Image generation error for concept ${index}:`, err);
        return concept;
      }
    });

    const conceptsWithImages = await Promise.all(imagePromises);

    // Save to insights
    if (userId) {
      const { error: insightError } = await supabase.from("insights").insert({ user_id: userId, type: "thumbnail_ideas", input_text: topic, output_data: conceptsWithImages });
      if (insightError) console.error("Failed to save insight:", JSON.stringify(insightError));
      else console.log("Insight saved successfully for user:", userId);
    }

    return new Response(JSON.stringify({ concepts: conceptsWithImages }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("generate-thumbnails error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
