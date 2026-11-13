import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { z } from "npm:zod@3";
import { ClipConfig, videoRequest } from "./contract.ts";

const Body = z.discriminatedUnion("action", [
  ClipConfig.extend({ action: z.literal("create"), request_id: z.string().uuid() }),
  z.object({ action: z.literal("list") }),
  z.object({ action: z.literal("status"), id: z.string().uuid() }),
  z.object({ action: z.literal("resume") }),
]);
const base = "https://ai.gateway.lovable.dev/v1/videos";
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const url = Deno.env.get("SUPABASE_URL");
    const anon = Deno.env.get("SUPABASE_ANON_KEY");
    const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const key = Deno.env.get("LOVABLE_API_KEY");
    if (!url || !anon || !service || !key) return json({ error: "Video generation is not configured." }, 503);
    const authorization = req.headers.get("Authorization");
    if (!authorization) return json({ error: "Please sign in." }, 401);
    const auth = createClient(url, anon, { global: { headers: { Authorization: authorization } } });
    const { data: { user }, error: authError } = await auth.auth.getUser();
    if (authError || !user) return json({ error: "Please sign in again." }, 401);
    const parsed = Body.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return json({ error: "Enter a scene (5–4,000 characters), a valid format, and a duration of 3–10 seconds." }, 400);
    const body = parsed.data;
    const db = createClient(url, service);
    const must = (error: { message: string } | null) => { if (error) throw new Error(error.message); };
    const update = async (id: string, values: Record<string, unknown>) => {
      const { error } = await db.from("studio_clips").update({ ...values, updated_at: new Date().toISOString() }).eq("id", id); must(error);
    };
    const pause = async () => {
      const { data, error } = await db.from("studio_service_state").select("*").eq("id", "gemini-video").maybeSingle(); must(error); return data;
    };
    if (body.action === "resume") {
      const { data: admin } = await auth.rpc("has_role", { _user_id: user.id, _role: "admin" });
      if (!admin) return json({ error: "Only the workspace owner can resume video generation." }, 403);
      const state = await pause();
      if (state?.provider_denied) return json({ error: state.message }, state.status);
      const { error } = await db.from("studio_service_state").delete().eq("id", "gemini-video"); must(error);
      return json({ resumed: true });
    }
    const gateway = async (path: string, init?: RequestInit) => {
      const response = await fetch(path, { ...init, headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" } });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        const message = data.message || `Video service returned ${response.status}.`;
        if ([402, 403, 404, 401].includes(response.status)) {
          const workspaceBlock = response.status === 402 || ["credit_limit_reached", "ai_disabled", "workspace_ai_disabled"].includes(data.type);
          const { error } = await db.from("studio_service_state").upsert({ id: "gemini-video", status: response.status, message, provider_denied: !workspaceBlock }); must(error);
        }
        throw Object.assign(new Error(message), { status: response.status });
      }
      return response;
    };
    const present = async (clip: Record<string, unknown>) => {
      if (!clip.storage_path) return clip;
      const { data, error } = await db.storage.from("studio-clips").createSignedUrl(String(clip.storage_path), 3600); must(error);
      return { ...clip, video_url: data?.signedUrl };
    };
    if (body.action === "list") {
      const { data, error } = await db.from("studio_clips").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(30); must(error);
      return json({ clips: await Promise.all((data || []).map(present)), paused: await pause() });
    }
    let clip;
    if (body.action === "create") {
      const { data: existing, error: lookupError } = await db.from("studio_clips").select("*").eq("user_id", user.id).eq("request_id", body.request_id).maybeSingle(); must(lookupError);
      if (existing) return json({ clip: await present(existing) });
      const state = await pause();
      if (state) return json({ error: state.message }, state.status);
      const { action: _action, request_id, ...config } = body;
      const { data, error } = await db.from("studio_clips").insert({ ...config, request_id, user_id: user.id }).select().single(); must(error); clip = data;
    } else {
      const { data, error } = await db.from("studio_clips").select("*").eq("id", body.id).eq("user_id", user.id).maybeSingle(); must(error); clip = data;
    }
    if (!clip) return json({ error: "Clip not found." }, 404);
    // No polling or queued creation is allowed while a service pause is persisted.
    const state = await pause();
    if (state) return json({ error: state.message }, state.status);
    if (clip.status === "queued") {
      const { data: claimed, error } = await db.rpc("claim_studio_clip", { _id: clip.id }); must(error);
      if (claimed) {
        try {
          const response = await gateway(base, { method: "POST", body: JSON.stringify(videoRequest(ClipConfig.parse(clip))) });
          const job = await response.json();
          if (!job.id || job.status === "failed") throw new Error(job.error?.message || "Video generation was refused.");
          await update(clip.id, { gateway_id: job.id, status: "in_progress", progress: job.progress || 0 });
        } catch (e) {
          await update(clip.id, { status: "failed", error_message: e instanceof Error ? e.message : "Video generation failed." });
          throw e;
        }
      }
    } else if (clip.status === "in_progress" && clip.gateway_id) {
      const job = await (await gateway(`${base}/${encodeURIComponent(clip.gateway_id)}`)).json();
      if (job.status === "failed") {
        await update(clip.id, { status: "failed", error_message: job.error?.message || "Video generation failed." });
      } else if (job.status === "completed") {
        const path = `${clip.user_id}/${clip.id}.mp4`;
        const { data: files, error: fileError } = await db.storage.from("studio-clips").list(clip.user_id, { search: `${clip.id}.mp4` }); must(fileError);
        if (!files?.some((file) => file.name === `${clip.id}.mp4`)) {
          const content = await gateway(`${base}/${encodeURIComponent(clip.gateway_id)}/content`);
          const { error } = await db.storage.from("studio-clips").upload(path, await content.blob(), { contentType: "video/mp4", upsert: true }); must(error);
        }
        await update(clip.id, { status: "completed", progress: 100, storage_path: path });
      } else await update(clip.id, { progress: job.progress || 0 });
    }
    const { data: latest, error } = await db.from("studio_clips").select("*").eq("id", clip.id).single(); must(error);
    return json({ clip: await present(latest) });
  } catch (error) {
    const status = typeof error === "object" && error && "status" in error ? Number(error.status) : 500;
    return json({ error: error instanceof Error ? error.message : "Video generation failed." }, status);
  }
});