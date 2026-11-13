export type Clip = {
  id: string; prompt: string; kind: "b-roll" | "clip"; aspect_ratio: "16:9" | "9:16";
  duration: number; resolution: string; status: string; progress: number;
  created_at: string; video_url?: string; download_url?: string; error_message?: string;
  scene_urls?: string[]; scene_paths?: string[]; completed_seconds?: number;
};
export const isActiveClip = (clip: Clip) => ["queued", "starting", "in_progress"].includes(clip.status);
export const STUDIO_DURATIONS = [...Array.from({ length: 8 }, (_, i) => i + 3), 30, 45, ...Array.from({ length: 20 }, (_, i) => (i + 1) * 60)];
export const durationLabel = (seconds: number) => seconds < 60 ? `${seconds} seconds` : `${seconds / 60} ${seconds === 60 ? "minute" : "minutes"}`;export const SCENE_TOKEN_COSTS: Record<string, number> = { "360p": 15, "720p": 45, "1080p": 70 };
export const videoTokenCost = (duration: number, resolution: string) => Math.ceil(duration / 10) * (SCENE_TOKEN_COSTS[resolution] ?? SCENE_TOKEN_COSTS["1080p"]);
