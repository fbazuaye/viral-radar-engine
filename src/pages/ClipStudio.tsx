import { useEffect, useState } from "react";
import { Clapperboard, Download, Film, Loader2, Monitor, Smartphone, Sparkles, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { extractEdgeFunctionError } from "@/lib/edgeFunctionError";
import { Clip, isActiveClip } from "@/lib/clipStudio";
import { cn } from "@/lib/utils";
import { useIsAdmin } from "@/hooks/useAdminUsers";

async function call(body: Record<string, unknown>) {
  const { data, error } = await supabase.functions.invoke("video-studio", { body });
  if (error) throw new Error(await extractEdgeFunctionError(error));
  if (data?.error) throw new Error(data.error);
  return data;
}

export default function ClipStudio() {
  const [prompt, setPrompt] = useState("");
  const [kind, setKind] = useState<"b-roll" | "clip">("b-roll");
  const [ratio, setRatio] = useState<"16:9" | "9:16">("16:9");
  const [duration, setDuration] = useState(5);
  const [resolution, setResolution] = useState("720p");
  const [clips, setClips] = useState<Clip[]>([]);
  const [selected, setSelected] = useState<string>();
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pollStopped, setPollStopped] = useState(false);
  const { data: isAdmin } = useIsAdmin();
  const current = clips.find(c => c.id === selected) || clips[0];
  const active = clips.find(isActiveClip);
  const merge = (clip: Clip) => setClips(list => [clip, ...list.filter(c => c.id !== clip.id)].sort((a, b) => b.created_at.localeCompare(a.created_at)));
  const reload = async () => {
    try {
      const data = await call({ action: "list" });
      setClips(data.clips); setError(data.paused?.message || ""); setPollStopped(Boolean(data.paused));
    } catch (e) { setError(e instanceof Error ? e.message : "Unable to load clips."); }
    finally { setLoading(false); }
  };
  useEffect(() => { void reload(); }, []);
  useEffect(() => {
    if (!active || pollStopped) return;
    let cancelled = false;
    const timer = setTimeout(async () => {
      try { const data = await call({ action: "status", id: active.id }); if (!cancelled) merge(data.clip); }
      catch (e) { if (!cancelled) { setError(e instanceof Error ? e.message : "Unable to check video."); setPollStopped(true); } }
    }, 8000);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [clips, pollStopped]);
  const generate = async () => {
    setBusy(true); setError("");
    try {
      const data = await call({ action: "create", request_id: crypto.randomUUID(), prompt, kind, aspect_ratio: ratio, duration, resolution });
      merge(data.clip); setSelected(data.clip.id); setPollStopped(false);
    } catch (e) { setError(e instanceof Error ? e.message : "Unable to generate video."); await reload(); }
    finally { setBusy(false); }
  };
  const download = async (clip: Clip) => {
    if (!clip.video_url) return;
    try {
      const response = await fetch(clip.video_url);
      if (!response.ok) throw new Error("Download link expired. Refresh your clips and try again.");
      const url = URL.createObjectURL(await response.blob());
      const link = document.createElement("a"); link.href = url; link.download = `ytradar-${clip.kind}-${clip.aspect_ratio.replace(":", "x")}.mp4`; link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (e) { setError(e instanceof Error ? e.message : "Download failed."); }
  };
  return <div className="mx-auto max-w-6xl space-y-8">
    <header className="flex flex-wrap items-center justify-between gap-3">
      <h1 className="flex items-center gap-3 text-2xl font-display font-bold"><Clapperboard className="h-6 w-6 text-primary" />B-Roll & Clip Studio</h1>
      <span className="text-xs font-medium text-muted-foreground">Gemini Omni · Video</span>
    </header>
    <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
      <form className="space-y-6 min-w-0" onSubmit={e => { e.preventDefault(); void generate(); }}>
        <div className="flex gap-2" aria-label="Video type">{(["b-roll", "clip"] as const).map(value => <Button key={value} type="button" variant={kind === value ? "secondary" : "ghost"} aria-pressed={kind === value} onClick={() => setKind(value)}><Film />{value === "b-roll" ? "B-Roll" : "Short Clip"}</Button>)}</div>
        <div className="space-y-2"><Label htmlFor="scene">Scene</Label><Textarea id="scene" value={prompt} onChange={e => setPrompt(e.target.value)} maxLength={4000} rows={7} placeholder="A slow tracking shot through a sunlit coffee shop, steam rising from a fresh espresso. Warm morning light, natural café sounds." /><p className="text-right text-xs text-muted-foreground">{prompt.length.toLocaleString()} / 4,000</p></div>
        <fieldset className="space-y-2"><legend className="mb-2 text-sm font-medium">Format</legend><div className="grid grid-cols-2 gap-3">{(["16:9", "9:16"] as const).map(value => <Button className="h-16 flex-col gap-1" type="button" key={value} variant={ratio === value ? "default" : "outline"} aria-pressed={ratio === value} onClick={() => setRatio(value)}>{value === "16:9" ? <Monitor /> : <Smartphone />}{value} · {value === "16:9" ? "Landscape" : "Portrait"}</Button>)}</div></fieldset>
        <div className="grid grid-cols-2 gap-4"><div className="space-y-2"><Label htmlFor="duration">Duration</Label><select id="duration" className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={duration} onChange={e => setDuration(Number(e.target.value))}>{Array.from({ length: 8 }, (_, i) => i + 3).map(n => <option key={n} value={n}>{n} seconds</option>)}</select></div><div className="space-y-2"><Label htmlFor="resolution">Resolution</Label><select id="resolution" className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={resolution} onChange={e => setResolution(e.target.value)}>{["360p", "720p", "1080p"].map(n => <option key={n}>{n}</option>)}</select></div></div>
        <Button type="submit" className="w-full" disabled={busy || Boolean(active) || prompt.trim().length < 5}>{busy ? <Loader2 className="animate-spin" /> : <Sparkles />}{busy ? "Submitting…" : active ? "Generation in progress" : "Generate video"}</Button>
        <p className="text-xs text-muted-foreground">Uses workspace AI credits. Generated clips include audio.</p>
      </form>
      <section className="min-w-0 space-y-3" aria-label="Clip preview">
        <div className="flex items-center justify-between"><h2 className="font-display font-semibold">Preview</h2>{current && <span className="text-xs text-muted-foreground">{current.aspect_ratio} · {current.duration}s · {current.resolution}</span>}</div>
        <div className={cn("flex items-center justify-center overflow-hidden rounded-lg border border-border bg-muted/40", current?.aspect_ratio === "9:16" ? "aspect-[9/16] max-h-[560px] mx-auto" : "aspect-video")}>
          {current?.video_url ? <video key={current.video_url} src={current.video_url} controls playsInline preload="metadata" className="h-full w-full object-contain" /> : <div className="space-y-3 px-6 text-center">{current && isActiveClip(current) ? <Loader2 className="mx-auto h-10 w-10 animate-spin text-primary" /> : <Film className="mx-auto h-12 w-12 text-muted-foreground" />}<p className="text-sm text-muted-foreground">{loading ? "Loading clips…" : current?.status === "failed" ? current.error_message : current && isActiveClip(current) ? current.status === "queued" ? "Queued" : `Generating${current.progress ? ` · ${current.progress}%` : "…"}` : "No clip selected"}</p></div>}
        </div>
        {current?.video_url && <Button variant="outline" onClick={() => void download(current)}><Download />Download MP4</Button>}
      </section>
    </div>
    {error && <div role="alert" className="border-l-2 border-destructive bg-destructive/10 p-4 text-sm space-y-3"><p>{error}</p><div className="flex flex-wrap gap-2"><Button variant="outline" size="sm" onClick={() => void reload()}><RefreshCw />Refresh clips</Button>{isAdmin && <Button variant="outline" size="sm" onClick={async () => { try { await call({ action: "resume" }); setError(""); setPollStopped(false); } catch (e) { setError(e instanceof Error ? e.message : "Cannot resume."); } }}>Resume after restoring access</Button>}</div></div>}
    <section className="space-y-4 border-t border-border pt-6"><div className="flex items-center justify-between"><h2 className="text-lg font-display font-semibold">Saved clips <span className="text-muted-foreground text-sm">{clips.length}</span></h2><Button variant="ghost" size="icon" aria-label="Refresh saved clips" title="Refresh saved clips" onClick={() => void reload()}><RefreshCw /></Button></div>
      {!loading && !clips.length && <p className="text-sm text-muted-foreground">No saved clips yet.</p>}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{clips.map(clip => <article key={clip.id} className={cn("overflow-hidden rounded-lg border bg-card", current?.id === clip.id ? "border-primary" : "border-border")}>
        {clip.video_url && <video src={clip.video_url} muted playsInline preload="metadata" className="aspect-video w-full bg-muted object-contain" />}
        <div className="space-y-3 p-4"><p className="line-clamp-2 text-sm font-medium">{clip.prompt}</p><p className="text-xs text-muted-foreground">{clip.aspect_ratio} · {clip.duration}s · {clip.resolution} · {clip.status.replace("_", " ")}</p><div className="flex gap-2"><Button variant="secondary" size="sm" onClick={() => setSelected(clip.id)}>View clip</Button>{clip.video_url && <Button variant="ghost" size="icon" aria-label="Download clip" title="Download clip" onClick={() => void download(clip)}><Download /></Button>}</div></div>
      </article>)}</div>
    </section>
  </div>;
}