import { describe, expect, it } from "vitest";
import { BOOTH_DAILY_LIMIT, facts, styles } from "@/lib/booth";

describe("booth looks", () => {
  it("offers four looks with unique ids and names", () => {
    expect(styles).toHaveLength(4);
    expect(new Set(styles.map((s) => s.id)).size).toBe(4);
    expect(new Set(styles.map((s) => s.name)).size).toBe(4);
  });

  it("names and describes every look", () => {
    for (const s of styles) {
      expect(s.name.trim().length).toBeGreaterThan(0);
      expect(s.line.trim().length).toBeGreaterThan(0);
    }
  });

  it("keeps the daily limit a positive whole number", () => {
    expect(Number.isInteger(BOOTH_DAILY_LIMIT)).toBe(true);
    expect(BOOTH_DAILY_LIMIT).toBeGreaterThan(0);
  });
});

describe("booth copy", () => {
  it("has facts to show while the photo develops", () => {
    expect(Array.isArray(facts)).toBe(true);
    expect(facts.length).toBeGreaterThan(0);
    for (const fact of facts) expect(fact.trim().length).toBeGreaterThan(0);
  });

  it("never shows the internal name of the voice character", () => {
    const visible = [...styles.flatMap((s) => [s.name, s.line]), ...facts].join(" ");
    expect(visible).not.toMatch(/ARI/i);
  });
});
