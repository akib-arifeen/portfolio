import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { samePageLayer, STUDIO_OPEN_EVENT, studioLayerFromHash } from "@/lib/hash-nav";

const read = (path: string) => readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");

describe("studio layers in the hash", () => {
  it("knows the two layers and nothing else", () => {
    expect(studioLayerFromHash("#booth")).toBe("booth");
    expect(studioLayerFromHash("#laptop")).toBe("laptop");
    for (const hash of ["", "#", "#play", "#boothx", "#BOOTH"]) {
      expect(studioLayerFromHash(hash), hash).toBeNull();
    }
  });
});

describe("PlayStrip tiles", () => {
  it("treats a tile as a same-page layer only on the home page", () => {
    expect(samePageLayer("/#booth", "/", "")?.layer).toBe("booth");
    expect(samePageLayer("/#laptop", "/", "#booth")?.layer).toBe("laptop");
    expect(samePageLayer("/#booth", "/blog", "")).toBeNull();
    expect(samePageLayer("/play/gravity-wars", "/", "")).toBeNull();
  });

  it("tells a first activation from one where the hash is already set", () => {
    expect(samePageLayer("/#booth", "/", "")?.alreadyThere).toBe(false);
    expect(samePageLayer("/#booth", "/", "#play")?.alreadyThere).toBe(false);
    expect(samePageLayer("/#booth", "/", "#booth")?.alreadyThere).toBe(true);
  });

  it("sets the hash on a first activation and asks Hero directly on a repeat", () => {
    // following the hash is a normal history entry, so Back still works; a repeat has no hashchange to follow
    const strip = read("components/home/PlayStrip.tsx");
    expect(strip).toContain("window.location.hash = target.hash");
    expect(strip).toContain(`new CustomEvent<StudioLayer>(STUDIO_OPEN_EVENT, { detail: target.layer })`);
    expect(strip).toContain("e.preventDefault()");
  });

  it("has a listener in Hero for the reopen event", () => {
    const hero = read("components/Hero.tsx");
    expect(hero).toContain("STUDIO_OPEN_EVENT");
    expect(hero).toContain("window.addEventListener(STUDIO_OPEN_EVENT, reopen)");
    expect(hero).toContain("window.removeEventListener(STUDIO_OPEN_EVENT, reopen)");
    expect(hero).toContain("studioLayerFromHash(location.hash)");
  });

  it("uses the shared event name, not a second string", () => {
    expect(STUDIO_OPEN_EVENT).toBe("studio:open");
  });
});
