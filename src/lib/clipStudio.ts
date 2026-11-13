export type Clip = {
  id: string; prompt: string; kind: "b-roll" | "clip"; aspect_ratio: "16:9" | "9:16";
  duration: number; resolution: string; status: string; progress: number;
  created_at: string; video_url?: string; error_message?: string;
};
export const isActiveClip = (clip: Clip) => ["queued", "starting", "in_progress"].includes(clip.status);