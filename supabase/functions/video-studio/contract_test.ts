import { ClipConfig, videoRequest } from "./contract.ts";
import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
const config = { prompt: "A sunlit forest with birdsong", duration: 3, resolution: "360p", kind: "b-roll" };
Deno.test("16:9 video uses landscape Gemini response format", () => {
  const body = videoRequest(ClipConfig.parse({ ...config, aspect_ratio: "16:9" }));
  assertEquals(body.response_format.aspect_ratio, "16:9");
  assertEquals(body.model, "google/gemini-omni-1.1-flash");
});
Deno.test("9:16 video uses portrait Gemini response format", () => {
  const body = videoRequest(ClipConfig.parse({ ...config, aspect_ratio: "9:16" }));
  assertEquals(body.response_format.aspect_ratio, "9:16");
});
Deno.test("unsupported aspect ratios are rejected", () => {
  assertEquals(ClipConfig.safeParse({ ...config, aspect_ratio: "1:1" }).success, false);
});