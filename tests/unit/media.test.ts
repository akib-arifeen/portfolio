import { readFileSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { films, formatSeconds, studioPieces, techniqueCredits } from "@/lib/media";

const ROOT = fileURLToPath(new URL("../../", import.meta.url));
const file = (publicPath: string) => `${ROOT}public${publicPath}`;

/** The two 16-bit fields an MP4 `avc1` sample entry carries: width then height. */
function avcSize(bytes: Buffer): { w: number; h: number } {
  // The ftyp brands also spell "avc1", so start looking inside moov.
  const moov = bytes.indexOf("moov");
  const i = bytes.indexOf("avc1", moov);
  expect(moov, "moov box").toBeGreaterThan(0);
  expect(i, "avc1 sample entry").toBeGreaterThan(0);
  return { w: bytes.readUInt16BE(i + 28), h: bytes.readUInt16BE(i + 30) };
}

// Faststart puts the index (moov) before the media data (mdat), so a player can start before
// the whole file has arrived.
function isFaststart(bytes: Buffer): boolean {
  const moov = bytes.indexOf("moov");
  const mdat = bytes.indexOf("mdat");
  return moov > 0 && mdat > 0 && moov < mdat;
}

const all = [...studioPieces, ...films];

describe("what the gallery ships", () => {
  it("lists five Studio pieces and four films, each once", () => {
    expect(studioPieces.length).toBe(5);
    expect(films.length).toBe(4);
    const slugs = all.map((p) => p.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const slug of slugs) expect(slug).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
  });

  it("serves every file from this site, never a remote URL", () => {
    for (const p of all) {
      expect(p.src, p.slug).toMatch(/^\/projects\/[\w/-]+\.mp4$/);
      expect(p.poster, p.slug).toMatch(/^\/projects\/[\w/-]+\.jpg$/);
    }
    for (const f of films) expect(f.film, f.slug).toMatch(/^\/projects\/films\/[\w-]+\.html$/);
  });

  it("ships a video and a poster that exist, at the recorded byte size", () => {
    for (const p of all) {
      expect(statSync(file(p.src)).size, p.slug).toBe(p.bytes);
      expect(statSync(file(p.poster)).size, `${p.slug} poster`).toBeGreaterThan(5000);
    }
  });

  it("is 720 on the short edge, as recorded", () => {
    for (const p of all) {
      expect(Math.min(p.w, p.h), p.slug).toBe(720);
    }
    expect(studioPieces.filter((p) => p.w === 720).map((p) => p.slug)).toEqual(["podcast-vertical-cut"]);
    for (const f of films) expect([f.w, f.h], f.slug).toEqual([720, 720]);
  });

  it("ships files whose real pixels match the recorded size", () => {
    for (const p of all) {
      const bytes = readFileSync(file(p.src));
      expect(avcSize(bytes), p.slug).toEqual({ w: p.w, h: p.h });
    }
  });

  it("ships faststart MP4s", () => {
    for (const p of all) {
      const bytes = readFileSync(file(p.src)).subarray(0, 500_000);
      expect(bytes.subarray(4, 8).toString("latin1"), p.slug).toBe("ftyp");
      expect(isFaststart(bytes), p.slug).toBe(true);
    }
  });

  it("keeps the whole gallery under 25 MB", () => {
    const total = all.reduce((n, p) => n + statSync(file(p.src)).size + statSync(file(p.poster)).size, 0);
    const html = films.reduce((n, f) => n + statSync(file(f.film)).size, 0);
    expect(total + html).toBeLessThan(25 * 1024 * 1024);
  });
});

describe("the film pages", () => {
  const sources = films.map((f) => [f.slug, readFileSync(file(f.film), "utf8")] as const);

  it("makes no remote request", () => {
    for (const [slug, html] of sources) {
      expect(html, slug).not.toMatch(/https?:\/\//);
    }
  });

  it("carries the two accessibility-only changes and nothing else visible", () => {
    for (const [slug, html] of sources) {
      expect(html, slug).toContain('aria-label="Frame"');
      expect(html, slug).toContain("#pl::after");
      expect(html, slug).toContain("inset: -12px -8px");
      expect(html, slug).toContain("#sc { height: 44px; margin-block: -12px; }");
      expect(html, slug).toContain("Accessibility only");
    }
  });

  it("never asks for same-origin, forms, popups or downloads", () => {
    for (const [slug, html] of sources) {
      expect(html, slug).not.toContain("allow-same-origin");
      expect(html, slug).not.toContain("allow-forms");
      expect(html, slug).not.toContain("allow-popups");
      expect(html, slug).not.toContain("allow-downloads");
    }
  });

  it("still seeds its own randomness rather than reading the wall clock", () => {
    // The films patch Math.random / Date.now / performance.now in their own realm; the parent
    // page must never load these scripts, so this is only a check that the guard is still there.
    for (const [slug, html] of sources) {
      expect(html, slug).toContain("Math.random");
    }
  });
});

describe("credits and labels", () => {
  it("credits both documented techniques", () => {
    const text = techniqueCredits.map((c) => `${c.technique} ${c.credit}`).join(" ");
    expect(text).toContain("Kevin Ngo");
    expect(text).toContain("alesha-pro");
    expect(text).toContain("MIT");
  });

  it("claims no licence it was not given", () => {
    const text = techniqueCredits.map((c) => c.credit).join(" ");
    expect(text).not.toMatch(/public domain|CC0|fair use/i);
  });

  it("does not imply the presenter is a real person", () => {
    const presenter = studioPieces.find((p) => p.slug === "presenter-avatar");
    expect(presenter?.line).toMatch(/synthetic/);
  });

  it("writes a duration a reader can read", () => {
    expect(formatSeconds(10.741)).toBe("0:11");
    expect(formatSeconds(60)).toBe("1:00");
    expect(formatSeconds(59.6)).toBe("1:00");
    expect(formatSeconds(0)).toBe("0:00");
  });
});
