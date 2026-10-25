import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { playItems } from "@/lib/os/playground";

const read = (path: string) => readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");

describe("looping case-study clips", () => {
  const loop = read("components/work/LoopVideo.tsx");
  const item = read("components/work/MediaItem.tsx");

  it("starts on the poster when the visitor asked for reduced motion", () => {
    expect(loop).toContain('matchMedia("(prefers-reduced-motion: reduce)")');
    expect(loop).toContain("if (!motion.matches) el.play()");
    expect(loop).toContain("if (motion.matches) el.pause()");
    // no autoplay attribute, so nothing starts before the preference is read
    expect(loop).not.toContain("autoPlay");
  });

  it("keeps pause and play reachable outside the video element", () => {
    expect(loop).toContain("<video");
    expect(loop).toMatch(/\/>\s*<button/);
    expect(loop).toContain('className="media__toggle"');
    expect(loop).toContain("onClick={toggle}");
    expect(loop).toContain('aria-label={playing ? "Pause the looping clip" : "Play the looping clip"}');
  });

  it("gives the clip and its control the visible caption as a description", () => {
    expect(loop).toContain("aria-describedby={captionId}");
    expect(item).toContain("aria-describedby={captionId}");
    expect(item).toContain('id={captionId}');
  });

  it("routes every loop through it and leaves other clips on native controls", () => {
    expect(item).toContain("item.loop ? (");
    expect(item).toMatch(/<LoopVideo[\s\S]*?\/>/);
    expect(item).toMatch(/\) : \(\s*<video[\s\S]*?controls/);
  });
});

describe("the media gallery", () => {
  it("offers an external download outside the video element", () => {
    for (const path of ["components/projects/VideoPlayer.tsx", "components/projects/FilmFrame.tsx"]) {
      const source = read(path);
      expect(source, path).toContain('className="gpiece__alt"');
      expect(source.match(/<\/video>/g)?.length ?? 0, path).toBe(1);
      const altAt = source.indexOf('className="gpiece__alt"');
      expect(altAt, path).toBeGreaterThan(source.indexOf("</video>"));
    }
  });

  it("keeps the fallback link visible for every piece and film", () => {
    const player = read("components/projects/VideoPlayer.tsx");
    const film = read("components/projects/FilmFrame.tsx");
    expect(player).toContain("Download the clip (MP4)");
    expect(film).toContain("Download the film (MP4)");
  });
});

describe("play items", () => {
  it("still declares which embeds need media access", () => {
    const loopcraft = playItems.find((p) => p.slug === "loopcraft");
    const culinary = playItems.find((p) => p.slug === "culinary-companion");
    expect(loopcraft?.allow).toContain("microphone");
    expect(culinary?.allow).toContain("camera");
    expect(culinary?.allow).toContain("microphone");
  });
});
