import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { scene } from "@/components/studio/palette";
import { AVATAR_FACING, AVATAR_ORIGIN } from "@/lib/studio/avatar";
import { DESK_BACK_EDGE_Z, DESK_CENTER, DESK_DEPTH } from "@/components/studio/Room";
import { LAPTOP_POS } from "@/components/studio/Studio";

const read = (path: string) => readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");

const booth = read("components/studio/Photobooth.tsx");
const studio = read("components/studio/Studio.tsx");
const boothScreen = read("components/booth/BoothScreen.tsx");

describe("the booth is functional equipment, not a set piece", () => {
  it("carries English signage for what it actually does", () => {
    for (const line of ["PHOTO BOOTH", "READY", "MAKE A", "COLLECT YOUR PRINT", "PRINTS"]) {
      expect(booth).toContain(line);
    }
  });

  it("has no character, arch, brass or borrowed motif left in it", () => {
    expect(booth).not.toMatch(/ariMark|boothHalo|boothBrass|Marquee|archShape|Egypt|\bARI\b|\bAri\b/);
  });

  it("keeps its warm light in step with the room, without its own animation", () => {
    expect(booth).toMatch(/export function Booth\(\{ phase \}/);
    expect(booth).toMatch(/phase === "night"/);
    expect(booth).not.toMatch(/useFrame\([\s\S]{0,400}?Math\.sin\(/);
  });

  it("stands as secondary equipment against the left wall, beside the desk", () => {
    expect(booth).toContain("new THREE.Vector3(-2.72, 0, -1.35)");
    expect(studio).toMatch(/booth: \[BOOTH_POS\.x/);
  });

  it("hangs its instructions on the side the camera sees, not the back wall", () => {
    // BOOTH_ROT turns local -x into the room; a +x poster renders facing the wall and can never be read
    expect(booth).toMatch(/position=\{\[-CAB_W \/ 2 - 0\.008, 1\.26, 0\]\} rotation=\{\[0, -Math\.PI \/ 2, 0\]\}/);
  });
});

describe("the palette keeps the room's booth quiet", () => {
  it("has no leftover keys for the old booth character", () => {
    const keys = Object.keys(scene);
    expect(keys.filter((k) => /^ari/i.test(k))).toEqual([]);
    expect(keys.filter((k) => /halo|brass/i.test(k))).toEqual([]);
  });

  it("gives the booth a charcoal cabinet, a cream face and one warm glow", () => {
    expect(scene.boothCabinet).toMatch(/^#[0-9a-f]{6}$/i);
    expect(scene.boothPanel).toMatch(/^#[0-9a-f]{6}$/i);
    expect(scene.boothGlow).toMatch(/^#[0-9a-f]{6}$/i);
  });
});

describe("the workstation is physically coherent", () => {
  it("keeps the avatar slot behind the desk, out of the desktop volume", () => {
    expect(studio).toContain("<Avatar pose={phone ? \"phone_idle\" : \"laptop_idle\"}");
    expect(AVATAR_FACING).toBeCloseTo(0.55); // turned from the stool toward the laptop
    expect(AVATAR_ORIGIN[2]).toBeLessThan(DESK_BACK_EDGE_Z);
  });

  it("puts the laptop on the desktop within natural arm reach", () => {
    expect(LAPTOP_POS[2]).toBeGreaterThan(DESK_BACK_EDGE_Z);
    expect(LAPTOP_POS[2]).toBeLessThan(DESK_CENTER[2] + DESK_DEPTH / 2);
    expect(Math.abs(LAPTOP_POS[2] - AVATAR_ORIGIN[2])).toBeLessThan(0.85);
    expect(LAPTOP_POS[1]).toBeGreaterThan(DESK_CENTER[1]);
  });

  it("is framed by a close, low lens rather than a top-down isometric", () => {
    expect(studio).toContain("new THREE.Vector3(1, 0.66, 1)");
    expect(studio).toContain("new THREE.Vector3(-0.75, 1.6, -1.65)");
  });
});

describe("the booth dialog explains the real booth honestly", () => {
  it("says the kiosk is a model and this page is the demo", () => {
    expect(boothScreen).toContain("The kiosk in the room is a model of the booth I built");
    expect(boothScreen).toContain("This page is the demo");
    expect(boothScreen).toContain("shown in demo mode with my own photo");
    // the look count comes from the data, and the result is a card, never a physical print
    expect(boothScreen).toContain("{styles.length} looks");
    expect(boothScreen).toContain("Here’s your card.");
    expect(boothScreen).not.toMatch(/Here’s your print/);
  });

  it("does not claim a physical print was tested here", () => {
    expect(boothScreen).not.toMatch(/tested the print|printed a card for me|I printed this|print was tested/i);
  });
});
