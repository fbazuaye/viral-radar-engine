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