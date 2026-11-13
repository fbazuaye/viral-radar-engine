import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { z } from "npm:zod@3";
import { ClipConfig, videoRequest, sceneDurations } from "./contract.ts";

const Body = z.discriminatedUnion("action", [
  ClipConfig.extend({ action: z.literal("create"), request_id: z.string().uuid() }),
  z.object({ action: z.literal("list") }),
  z.object({ action: z.literal("status"), id: z.string().uuid() }),
  z.object({ action: z.literal("finalize"), id: z.string().uuid() }),
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
    if (!parsed.success) return json({ error: "Enter a scene (5–4,000 characters), a valid format, and a duration of 3 seconds to 20 minutes." }, 400);
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
      const result = { ...clip, duration: clip.target_duration || clip.duration };
      if (clip.status === "assembling" && Array.isArray(clip.scene_paths)) {
        const urls = await Promise.all(clip.scene_paths.map(async (path: string) => {
          const { data, error } = await db.storage.from("studio-clips").createSignedUrl(path, 3600); must(error); return data?.signedUrl;
        }));
        return { ...result, scene_urls: urls };
      }
      if (!clip.storage_path) return result;
      const { data, error } = await db.storage.from("studio-clips").createSignedUrl(String(clip.storage_path), 3600); must(error);
      const { data: download, error: downloadError } = await db.storage.from("studio-clips").createSignedUrl(String(clip.storage_path), 3600, { download: `ytradar-${clip.kind}-${result.duration}s.mp4` }); must(downloadError);
      return { ...result, video_url: data?.signedUrl, download_url: download?.signedUrl };
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
      const { data, error } = await db.from("studio_clips").insert({ ...config, duration: sceneDurations(config.duration)[0], target_duration: config.duration, request_id, user_id: user.id }).select().single(); must(error); clip = data;
    } else {
      const { data, error } = await db.from("studio_clips").select("*").eq("id", body.id).eq("user_id", user.id).maybeSingle(); must(error); clip = data;
    }
    if (!clip) return json({ error: "Clip not found." }, 404);
    if (body.action === "finalize") {
      if (clip.status === "completed") return json({ clip: await present(clip) });
      if (clip.status !== "assembling") return json({ error: "Scenes are not ready to join yet." }, 400);
      const path = `${user.id}/${clip.id}/assembled.mp4`;
      const { data: files, error } = await db.storage.from("studio-clips").list(`${user.id}/${clip.id}`, { search: "assembled.mp4" }); must(error);
      if (!files?.some(f => f.name === "assembled.mp4")) return json({ error: "Upload the joined video before saving." }, 400);
      await update(clip.id, { status: "completed", progress: 100, storage_path: path });
      return json({ clip: await present({ ...clip, status: "completed", progress: 100, storage_path: path }) });
    }
    if (["completed", "failed", "assembling"].includes(clip.status)) return json({ clip: await present(clip) });
    // No polling or queued creation is allowed while a service pause is persisted.
    const state = await pause();
    if (state) return json({ error: state.message }, state.status);
    const leaseToken = crypto.randomUUID();
    const { data: leased, error: leaseError } = await db.rpc("lease_studio_clip", { _id: clip.id, _token: leaseToken }); must(leaseError);
    if (!leased) return json({ clip: await present(clip) });
    try {
    // Re-read after acquiring the lease so simultaneous polls cannot replay a finished scene.
    const { data: leasedClip, error: readError } = await db.from("studio_clips").select("*").eq("id", clip.id).single(); must(readError);
    clip = leasedClip;
    const durations = sceneDurations(clip.target_duration || clip.duration);
    const sceneIndex = clip.scene_paths.length;
    const startScene = async () => {
      const scenePrompt = durations.length > 1 ? `${clip.prompt}\nScene ${sceneIndex + 1} of ${durations.length}. Show a distinct shot developing this subject, maintaining consistent subjects, visual style and atmosphere. This is part of a longer sequence, not a looping video.` : clip.prompt;
      const response = await gateway(base, { method: "POST", body: JSON.stringify(videoRequest(ClipConfig.parse({ ...clip, prompt: scenePrompt, duration: durations[sceneIndex] }))) });
      const job = await response.json();
      if (!job.id || job.status === "failed") throw new Error(job.error?.message || "Video generation was refused.");
      await update(clip.id, { gateway_id: job.id, status: "in_progress", progress: Math.floor(sceneIndex / durations.length * 95) });
    };
    if (clip.status === "queued") {
      const { data: claimed, error } = await db.rpc("claim_studio_clip", { _id: clip.id }); must(error);
      if (claimed) {
        await startScene();
      }
    } else if (clip.status === "in_progress" && !clip.gateway_id && sceneIndex < durations.length) {
      await startScene();
    } else if (clip.status === "in_progress" && clip.gateway_id) {
      const job = await (await gateway(`${base}/${encodeURIComponent(clip.gateway_id)}`)).json();
      if (job.status === "failed") {
        await update(clip.id, { status: "failed", error_message: job.error?.message || "Video generation failed." });
      } else if (job.status === "completed") {
        const name = `scene-${sceneIndex}.mp4`;
        const folder = `${clip.user_id}/${clip.id}`;
        const path = `${folder}/${name}`;
        const { data: files, error: fileError } = await db.storage.from("studio-clips").list(folder, { search: name }); must(fileError);
        if (!files?.some((file) => file.name === name)) {
          const content = await gateway(`${base}/${encodeURIComponent(clip.gateway_id)}/content`);
          const { error } = await db.storage.from("studio-clips").upload(path, await content.blob(), { contentType: "video/mp4", upsert: true }); must(error);
        }
        const paths = [...clip.scene_paths, path];
        const finished = paths.length === durations.length;
        await update(clip.id, { scene_paths: paths, completed_seconds: durations.slice(0, paths.length).reduce((a,b) => a+b,0), gateway_id: null,
          status: finished ? durations.length === 1 ? "completed" : "assembling" : "in_progress",
          progress: finished && durations.length === 1 ? 100 : Math.floor(paths.length / durations.length * 95), storage_path: finished && durations.length === 1 ? path : null });
      } else await update(clip.id, { progress: Math.floor((sceneIndex + (job.progress || 0) / 100) / durations.length * 95) });
    }
    const { data: latest, error } = await db.from("studio_clips").select("*").eq("id", clip.id).single(); must(error);
    return json({ clip: await present(latest) });
    } catch (e) {
      await update(clip.id, { status: "failed", error_message: e instanceof Error ? e.message : "Video generation failed." });
      throw e;
    } finally {
      const { error } = await db.from("studio_clips").update({ lease_until: null, lease_token: null }).eq("id", clip.id).eq("lease_token", leaseToken); must(error);
    }
  } catch (error) {
    const status = typeof error === "object" && error && "status" in error ? Number(error.status) : 500;
    return json({ error: error instanceof Error ? error.message : "Video generation failed." }, status);
  }
});