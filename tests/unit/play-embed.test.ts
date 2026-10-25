import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { allowFor, playPermissions } from "@/lib/os/playground";

const read = (path: string) => readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");

describe("play permissions", () => {
  it("keeps the safe capabilities for the first load", () => {
    const perms = playPermissions("fullscreen; gamepad");
    expect(perms).toEqual({ base: "fullscreen; gamepad", camera: false, microphone: false });
    expect(allowFor(perms, false)).toBe("fullscreen; gamepad");
    expect(allowFor(perms, true)).toBe("fullscreen; gamepad");
  });

  it("withholds camera and microphone until the visitor shares them", () => {
    const perms = playPermissions("camera; microphone; autoplay");
    expect(perms).toEqual({ base: "autoplay", camera: true, microphone: true });
    expect(allowFor(perms, false)).toBe("autoplay");
    expect(allowFor(perms, true)).toBe("autoplay; camera; microphone");
  });

  it("only asks for what a game declared", () => {
    const loopcraft = playPermissions("autoplay; microphone");
    expect(loopcraft).toEqual({ base: "autoplay", camera: false, microphone: true });
    expect(allowFor(loopcraft, true)).toBe("autoplay; microphone");
  });

  it("returns no attribute at all when there is nothing to delegate", () => {
    expect(allowFor(playPermissions(undefined), false)).toBeUndefined();
  });
});

describe("the play frame", () => {
  const frame = read("components/play/PlayFrame.tsx");

  it("runs the game in the tightest sandbox that still works", () => {
    expect(frame).toContain('sandbox="allow-scripts allow-same-origin allow-downloads"');
    expect(frame).not.toContain("allow-top-navigation");
    expect(frame).not.toContain("allow-popups");
    expect(frame).not.toContain("allow-forms");
  });

  it("sends no referrer and does not hold up the page", () => {
    expect(frame).toContain('referrerPolicy="no-referrer"');
    expect(frame).toContain('loading="lazy"');
  });

  it("keeps the original allow list, split from the media capabilities", () => {
    expect(frame).toContain("allow={allowFor(perms, shared)}");
    expect(frame).not.toMatch(/allow=\{allow\}/);
    expect(frame).not.toMatch(/allow=\{item\.allow\}/);
  });

  it("asks first, and says what will be shared", () => {
    expect(frame).toContain("Nothing is shared until you allow it.");
    expect(frame).toContain("Allow ${sharedList}");
    expect(frame).toContain("Stop sharing ${sharedList}");
    expect(frame).toContain("setShared");
  });

  it("offers a way out when the game refuses to embed", () => {
    expect(frame).toContain("If the game does not load, it may refuse to be embedded.");
    expect(frame).toContain("Open it in a new tab");
  });

  it("is the frame the play route uses", () => {
    expect(read("app/play/[slug]/page.tsx")).toContain(
      "<PlayFrame src={item.url} title={item.name} allow={item.allow} />",
    );
  });
});
