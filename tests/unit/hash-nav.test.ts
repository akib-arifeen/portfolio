import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { samePageLayer, STUDIO_OPEN_EVENT, studioLayerFromHash, tileIntent } from "@/lib/hash-nav";

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
});

const click = (over: Partial<{ button: number; metaKey: boolean; ctrlKey: boolean; shiftKey: boolean; altKey: boolean }> = {}) => ({
  button: 0,
  metaKey: false,
  ctrlKey: false,
  shiftKey: false,
  altKey: false,
  ...over,
});

describe("a click on a play tile", () => {
  it("sets the hash on a first activation and asks Hero directly on a repeat", () => {
    // following the hash is a normal history entry, so Back still works; a repeat has no hashchange to follow
    expect(tileIntent(click(), "/#booth", "/", "")).toEqual({ kind: "hash", hash: "#booth" });
    expect(tileIntent(click(), "/#booth", "/", "#booth")).toEqual({ kind: "reopen", layer: "booth" });
    expect(tileIntent(click(), "/#laptop", "/", "#booth")).toEqual({ kind: "hash", hash: "#laptop" });
  });

  it("leaves a modified click to the browser", () => {
    for (const modifier of ["metaKey", "ctrlKey", "shiftKey", "altKey"] as const) {
      expect(tileIntent(click({ [modifier]: true }), "/#booth", "/", ""), modifier).toEqual({ kind: "ignore" });
      // even when the hash is already on the layer: a Cmd-click must not reopen in place
      expect(tileIntent(click({ [modifier]: true }), "/#booth", "/", "#booth"), modifier).toEqual({ kind: "ignore" });
    }
  });

  it("leaves a non-primary button to the browser", () => {
    for (const button of [1, 2, 3, 4]) {
      expect(tileIntent(click({ button }), "/#booth", "/", ""), String(button)).toEqual({ kind: "ignore" });
    }
  });

  it("only claims layers on this page", () => {
    expect(tileIntent(click(), "/play/gravity-wars", "/", "")).toEqual({ kind: "ignore" });
    expect(tileIntent(click(), "/#booth", "/blog", "")).toEqual({ kind: "ignore" });
  });
});

describe("closing a layer", () => {
  const hero = read("components/Hero.tsx");

  it("clears the hash it owns, without a new history entry", () => {
    expect(hero).toContain('history.replaceState(history.state, "", window.location.pathname + window.location.search)');
    expect(hero).toContain('clearLayerHash("laptop")');
    expect(hero).toContain('clearLayerHash("booth")');
  });

  it("treats a hash that no longer names a layer as a close", () => {
    expect(hero).toMatch(/const layer = studioLayerFromHash\(location\.hash\);\s*if \(layer\) \{ linkRef\.current\[layer\]\(\); return; \}/);
    expect(hero).toContain("closeLayerRef.current();");
  });

  it("has a listener in Hero for the reopen event", () => {
    expect(hero).toContain("STUDIO_OPEN_EVENT");
    expect(hero).toContain("window.addEventListener(STUDIO_OPEN_EVENT, reopen)");
    expect(hero).toContain("window.removeEventListener(STUDIO_OPEN_EVENT, reopen)");
    expect(hero).toContain("studioLayerFromHash(location.hash)");
  });
});

it("uses the shared event name, not a second string", () => {
  expect(STUDIO_OPEN_EVENT).toBe("studio:open");
});
