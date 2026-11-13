import { describe, expect, it } from "vitest";
import { STUDIO_DURATIONS, durationLabel } from "./clipStudio";

describe("studio duration choices", () => {
  it("offers 30 seconds", () => {
    expect(STUDIO_DURATIONS).toContain(30);
  });
  it("offers durations up to 20 minutes without exceeding it", () => {
    expect(STUDIO_DURATIONS).toContain(1200);
    expect(Math.max(...STUDIO_DURATIONS)).toBe(1200);
    expect(durationLabel(1200)).toBe("20 minutes");
  });
});
import { videoTokenCost } from "./clipStudio";
describe("video token cost", () => {
  it("charges 15 per 10s scene at 360p", () => expect(videoTokenCost(10, "360p")).toBe(15));
  it("charges 45 per 10s scene at 720p", () => expect(videoTokenCost(30, "720p")).toBe(135));
  it("charges 70 per 10s scene at 1080p", () => expect(videoTokenCost(1200, "1080p")).toBe(8400));
});
