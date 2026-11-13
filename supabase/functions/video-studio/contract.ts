import { z } from "npm:zod@3";

export const ClipConfig = z.object({
  prompt: z.string().trim().min(5).max(4000),
  aspect_ratio: z.enum(["16:9", "9:16"]),
  duration: z.number().int().min(3).max(10),
  resolution: z.enum(["360p", "720p", "1080p"]),
  kind: z.enum(["b-roll", "clip"]),
});
export function videoRequest(config: z.infer<typeof ClipConfig>) {
  return {
    model: "google/gemini-omni-1.1-flash",
    input: `${config.prompt}\n${config.kind === "b-roll" ? "B-roll footage, in a single continuous shot, no dialogue, no on-screen text." : "A polished short video clip."} Consider micro-detail, camera movement, lighting and timing. Natural scene audio unless otherwise specified.`,
    response_format: { type: "video", resolution: config.resolution, duration: `${config.duration}s`, aspect_ratio: config.aspect_ratio },
  };
}