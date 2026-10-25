import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { allowFor, PLAY_SANDBOX, playItems, playPermissions } from "@/lib/os/playground";

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

  it("gates a media feature however its allowlist is spelled", () => {
    const cases: Array<[string, { camera: boolean; microphone: boolean }]> = [
      ["camera", { camera: true, microphone: false }],
      ["camera *", { camera: true, microphone: false }],
      ["camera 'self'", { camera: true, microphone: false }],
      ["camera https://meet.example 'self'", { camera: true, microphone: false }],
      ["microphone 'self'", { camera: false, microphone: true }],
      ["MICROPHONE *", { camera: false, microphone: true }],
      ["  Camera   https://a.example  ", { camera: true, microphone: false }],
    ];
    for (const [allow, expected] of cases) {
      const perms = playPermissions(allow);
      expect({ camera: perms.camera, microphone: perms.microphone }, allow).toEqual(expected);
      expect(allowFor(perms, false), allow).toBeUndefined();
    }
  });

  it("never passes a media feature through as an up-front capability", () => {
    const perms = playPermissions("fullscreen; camera *; microphone 'self'; autoplay");
    expect(perms).toEqual({ base: "fullscreen; autoplay", camera: true, microphone: true });
    // once the visitor shares them, the frame asks for the plain feature, not a copied allowlist
    expect(allowFor(perms, true)).toBe("fullscreen; autoplay; camera; microphone");
    expect(perms.base.toLowerCase()).not.toContain("camera");
    expect(perms.base.toLowerCase()).not.toContain("microphone");
  });
});

describe("the play frame", () => {
  const frame = read("components/play/PlayFrame.tsx");

  it("runs the game in the tightest sandbox that still works", () => {
    expect(PLAY_SANDBOX).toBe("allow-scripts allow-same-origin allow-downloads");
    expect(frame).toContain("sandbox={sandbox ?? PLAY_SANDBOX}");
    for (const token of ["allow-forms", "allow-popups", "allow-top-navigation", "allow-modals", "allow-presentation"]) {
      expect(frame).not.toContain(token);
    }
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
      "<PlayFrame src={item.url} title={item.name} allow={item.allow} sandbox={item.sandbox} />",
    );
  });
});

describe("what each embed is allowed to do", () => {
  const embeddable = playItems.filter((item) => item.embeddable);

  it("grants fullscreen through the allow list alone, so the frame carries one grant", () => {
    expect(read("components/play/PlayFrame.tsx")).not.toContain("allowFullScreen");
    for (const item of embeddable) {
      expect(playPermissions(item.allow).base.split("; "), item.slug).toContain("fullscreen");
    }
  });

  it("adds a sandbox token only where a probe proved the game needs it", () => {
    expect(embeddable.filter((item) => item.sandbox).map((item) => item.slug)).toEqual(["save-your-princess"]);
    for (const item of embeddable) {
      const sandbox = item.sandbox ?? PLAY_SANDBOX;
      expect(sandbox, item.slug).toContain("allow-scripts");
      expect(sandbox, item.slug).toContain("allow-same-origin");
      for (const token of ["allow-forms", "allow-popups", "allow-top-navigation", "allow-modals", "allow-presentation", "allow-orientation-lock"]) {
        expect(sandbox, item.slug).not.toContain(token);
      }
    }
    // the 3D game asks for pointer lock on every click, and a sandbox blocks it until the token is named
    expect(playItems.find((item) => item.slug === "save-your-princess")?.sandbox).toBe(`${PLAY_SANDBOX} allow-pointer-lock`);
  });
});
