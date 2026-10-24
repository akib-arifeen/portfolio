import { describe, expect, it } from "vitest";
import { lights, phaseForHour, phases } from "@/components/studio/palette";

describe("phaseForHour", () => {
  it("starts the morning at 06:00", () => {
    expect(phaseForHour(0)).toBe("night");
    expect(phaseForHour(5)).toBe("night");
    expect(phaseForHour(6)).toBe("morning");
    expect(phaseForHour(10)).toBe("morning");
  });

  it("switches to day at 11:00", () => {
    expect(phaseForHour(11)).toBe("day");
    expect(phaseForHour(15)).toBe("day");
  });

  it("switches to evening at 16:00", () => {
    expect(phaseForHour(16)).toBe("evening");
    expect(phaseForHour(19)).toBe("evening");
  });

  it("switches to night at 20:00 and wraps", () => {
    expect(phaseForHour(20)).toBe("night");
    expect(phaseForHour(23)).toBe("night");
  });
});

describe("phases", () => {
  it("covers every phase once, in the order the light cycles", () => {
    expect(phases).toEqual(["morning", "day", "evening", "night"]);
  });

  it("has a light for every phase", () => {
    for (const phase of phases) expect(lights[phase]).toBeDefined();
  });

  it("keeps the room dark: daylight never outshines the screens", () => {
    for (const phase of phases) {
      const light = lights[phase];
      expect(light.ambient).toBeLessThanOrEqual(0.5);
      expect(light.screenGlow).toBeGreaterThanOrEqual(1);
    }
  });

  it("lights the lamp in the evening and the night, not at midday", () => {
    expect(lights.day.lamp).toBe(0);
    expect(lights.evening.lamp).toBeGreaterThan(0);
    expect(lights.night.lamp).toBeGreaterThan(lights.evening.lamp);
  });
});
