import { describe, expect, it } from "vitest";
import { appDef } from "@/lib/os/apps";
import {
  CASCADE,
  DOCK_H,
  EDGE_GRAB,
  MENU_H,
  TITLE_KEEP,
  OPEN_MARGIN,
  frameOf,
  initialWm,
  topWindow,
  workArea,
  wmReducer,
} from "@/lib/os/wm";
import type { AppId, LaunchArg, Size, WinState, WmAction, WmState } from "@/lib/os/types";

const V: Size = { w: 1440, h: 900 };

function open(s: WmState, app: AppId, arg?: LaunchArg, viewport: Size = V): WmState {
  return wmReducer(s, { type: "open", app, arg, viewport });
}
function win(s: WmState, id: string): WinState {
  const w = s.wins.find((x) => x.id === id);
  if (!w) throw new Error(`no window ${id}`);
  return w;
}
function deepFreeze<T>(o: T): T {
  if (o && typeof o === "object" && !Object.isFrozen(o)) {
    Object.freeze(o);
    for (const v of Object.values(o as Record<string, unknown>)) deepFreeze(v);
  }
  return o;
}
function makeWin(over: Partial<WinState> & { id: string; app: AppId }): WinState {
  return {
    title: over.app,
    rect: { x: 100, y: 100, w: 600, h: 400 },
    minimized: false,
    maximized: false,
    z: 1,
    launch: 1,
    ...over,
  };
}

describe("constants and geometry helpers", () => {
  it("exposes the documented constants", () => {
    expect(MENU_H).toBe(28);
    expect(DOCK_H).toBe(84);
    expect(CASCADE).toBe(28);
    expect(EDGE_GRAB).toBe(96);
    expect(TITLE_KEEP).toBe(DOCK_H + 40);
    expect(OPEN_MARGIN).toBe(16);
  });

  it("initialWm is empty", () => {
    expect(initialWm).toEqual({ wins: [], z: 0, seq: 0, focused: null });
  });

  it("workArea is full width, below the menu bar, above the dock", () => {
    expect(workArea(V)).toEqual({ x: 0, y: MENU_H, w: 1440, h: 900 - MENU_H - DOCK_H });
  });

  it("frameOf returns the own rect, or the work area when maximized", () => {
    const w = makeWin({ id: "files-1", app: "files" });
    expect(frameOf(w, V)).toEqual(w.rect);
    expect(frameOf({ ...w, maximized: true }, V)).toEqual(workArea(V));
  });

  it("topWindow is null for no windows, picks the highest z, skips minimized", () => {
    expect(topWindow(initialWm)).toBeNull();
    let s = open(initialWm, "files");
    s = open(s, "notes");
    expect(topWindow(s)?.id).toBe("notes-2");
    s = wmReducer(s, { type: "minimize", id: "notes-2" });
    expect(topWindow(s)?.id).toBe("files-1");
    s = wmReducer(s, { type: "minimize", id: "files-1" });
    expect(topWindow(s)).toBeNull();
  });
});

describe("open: new window", () => {
  it("creates a window with the documented shape, centred in the work area", () => {
    const s = open(initialWm, "files");
    expect(s.seq).toBe(1);
    expect(s.z).toBe(1);
    expect(s.focused).toBe("files-1");
    expect(s.wins).toHaveLength(1);
    expect(s.wins[0]).toMatchObject({
      id: "files-1",
      app: "files",
      title: "Files",
      minimized: false,
      maximized: false,
      z: 1,
      launch: 1,
    });
    // 1440x900: work area is 1440 x 788 starting at y = 28; files is 880 x 560.
    expect(s.wins[0].rect).toEqual({ x: 280, y: 142, w: 880, h: 560 });
  });

  it("title is the app display name", () => {
    expect(open(initialWm, "about").wins[0].title).toBe("About This Laptop");
  });

  it("stores the launch arg", () => {
    const s = open(initialWm, "files", { path: "/Applications" });
    expect(s.wins[0].arg).toEqual({ path: "/Applications" });
  });

  it("uses the registry size when it fits", () => {
    const s = open(initialWm, "terminal");
    const { size } = appDef("terminal");
    expect(s.wins[0].rect.w).toBe(size.w);
    expect(s.wins[0].rect.h).toBe(size.h);
  });

  it("ids use a session-wide sequence, never reused after close", () => {
    let s = open(initialWm, "files");
    s = open(s, "notes");
    expect(s.wins.map((w) => w.id)).toEqual(["files-1", "notes-2"]);
    s = wmReducer(s, { type: "close", id: "files-1" });
    s = open(s, "files");
    expect(s.wins.map((w) => w.id)).toContain("files-3");
    expect(s.seq).toBe(3);
  });

  it("each open raises z by one and focuses the new window", () => {
    let s = open(initialWm, "files");
    s = open(s, "notes");
    s = open(s, "mail");
    expect(s.z).toBe(3);
    expect(win(s, "notes-2").z).toBe(2);
    expect(win(s, "mail-3").z).toBe(3);
    expect(s.focused).toBe("mail-3");
  });

  it("clamps each side to the work area minus 2 * OPEN_MARGIN", () => {
    // 1000 x 700: work area 1000 x 588. files 880 x 560 -> w fits (968), h -> 556.
    const s = open(initialWm, "files", undefined, { w: 1000, h: 700 });
    expect(s.wins[0].rect.w).toBe(880);
    expect(s.wins[0].rect.h).toBe(588 - 2 * OPEN_MARGIN);
    // wider squeeze: 600 x 900 -> w = 600 - 32 = 568 (>= minSize 520)
    const t = open(initialWm, "files", undefined, { w: 600, h: 900 });
    expect(t.wins[0].rect.w).toBe(568);
  });

  it("raises a clamped side to at least minSize when the work area can hold it", () => {
    // 600 x 440: work area h = 328 (>= minSize.h 320). 328 - 32 = 296 -> raised to 320.
    const s = open(initialWm, "files", undefined, { w: 600, h: 440 });
    expect(s.wins[0].rect).toEqual({ x: 16, y: MENU_H + 4, w: 568, h: 320 });
  });

  it("lets the work area win when it is smaller than minSize", () => {
    // 400 x 300: work area 400 x 188; files minSize is 520 x 320.
    const s = open(initialWm, "files", undefined, { w: 400, h: 300 });
    expect(s.wins[0].rect).toEqual({ x: 0, y: MENU_H, w: 400, h: 188 });
  });

  it("rounds coordinates with Math.round", () => {
    // width 1001: (1001 - 880) / 2 = 60.5 -> 61
    const s = open(initialWm, "files", undefined, { w: 1001, h: 900 });
    expect(s.wins[0].rect.x).toBe(61);
    expect(Number.isInteger(s.wins[0].rect.y)).toBe(true);
  });

  it("the first window is centred; later ones step CASCADE down and right of the previous top window", () => {
    let s = open(initialWm, "files"); // 880 x 560
    expect(win(s, "files-1").rect).toEqual({ x: 280, y: 142, w: 880, h: 560 });
    s = open(s, "notes"); // 840 x 560
    expect(win(s, "notes-2").rect).toMatchObject({ x: 280 + CASCADE, y: 142 + CASCADE, w: 840, h: 560 });
    s = open(s, "mail"); // 640 x 540, a different size again
    expect(win(s, "mail-3").rect).toMatchObject({ x: 280 + 2 * CASCADE, y: 142 + 2 * CASCADE, w: 640, h: 540 });
  });

  it("each step is exactly CASCADE from the previous top window, whatever the sizes", () => {
    let s = initialWm;
    let prev: WinState | null = null;
    for (const app of ["files", "terminal", "mail", "notes"] as const) {
      s = open(s, app);
      const w = s.wins.find((x) => x.app === app)!;
      if (prev) {
        expect(w.rect.x - prev.rect.x, app).toBe(CASCADE);
        expect(w.rect.y - prev.rect.y, app).toBe(CASCADE);
      }
      prev = w;
    }
  });

  it("does not count minimized windows when cascading", () => {
    let s = open(initialWm, "files");
    s = wmReducer(s, { type: "minimize", id: "files-1" });
    s = open(s, "notes");
    const r = win(s, "notes-2").rect;
    expect(r.x).toBe(Math.round((V.w - r.w) / 2));
    expect(r.y).toBe(MENU_H + Math.round((V.h - MENU_H - DOCK_H - r.h) / 2));
  });

  it("steps from the top window by z, not from the most recently created one", () => {
    let s = open(initialWm, "files");
    s = open(s, "notes");
    s = wmReducer(s, { type: "focus", id: "files-1" }); // files is on top again
    s = open(s, "mail");
    const files = win(s, "files-1").rect;
    expect(win(s, "mail-3").rect).toMatchObject({ x: files.x + CASCADE, y: files.y + CASCADE });
  });

  it("skips a minimized top window and steps from the next non-minimized one", () => {
    let s = open(initialWm, "files");
    s = open(s, "notes"); // top, at (308, 170)
    s = wmReducer(s, { type: "minimize", id: "notes-2" });
    s = open(s, "mail");
    const files = win(s, "files-1").rect;
    expect(win(s, "mail-3").rect).toMatchObject({ x: files.x + CASCADE, y: files.y + CASCADE });
  });

  it("is centred when every other window is minimized", () => {
    let s = open(initialWm, "files");
    s = open(s, "notes");
    s = wmReducer(s, { type: "minimize", id: "notes-2" });
    s = wmReducer(s, { type: "minimize", id: "files-1" });
    s = open(s, "mail");
    const r = win(s, "mail-3").rect;
    expect(r.x).toBe(Math.round((V.w - r.w) / 2));
    expect(r.y).toBe(MENU_H + Math.round((V.h - MENU_H - DOCK_H - r.h) / 2));
  });

  it("falls back to centred when the stepped window would cross the bottom edge", () => {
    // 1000 x 700: files is 880 x 556 at (60, 44); notes (840 x 556) stepped to (88, 72) ends at y 628 > 616.
    const v: Size = { w: 1000, h: 700 };
    let s = open(initialWm, "files", undefined, v);
    expect(win(s, "files-1").rect).toEqual({ x: 60, y: 44, w: 880, h: 556 });
    s = open(s, "notes", undefined, v);
    expect(win(s, "notes-2").rect).toEqual({
      x: Math.round((1000 - 840) / 2),
      y: MENU_H + Math.round((588 - 556) / 2),
      w: 840,
      h: 556,
    });
  });

  it("falls back to centred when the stepped window would cross the right edge", () => {
    let s = open(initialWm, "files");
    s = wmReducer(s, { type: "move", id: "files-1", x: 700, y: 142, viewport: V });
    s = open(s, "notes"); // 700 + 28 + 840 = 1568 > 1440
    const r = win(s, "notes-2").rect;
    expect(r.x).toBe(Math.round((V.w - r.w) / 2));
    expect(r.y).toBe(MENU_H + Math.round((V.h - MENU_H - DOCK_H - r.h) / 2));
  });

  it("steps when the window lands inside the work area", () => {
    let s = open(initialWm, "files");
    s = wmReducer(s, { type: "move", id: "files-1", x: 400, y: 100, viewport: V });
    s = open(s, "notes"); // 428 + 840 = 1268 <= 1440; 128 + 560 = 688 <= 816
    expect(win(s, "notes-2").rect).toMatchObject({ x: 428, y: 128 });
  });
});

describe("open: existing window", () => {
  function setup() {
    let s = open(initialWm, "files");
    s = open(s, "notes");
    return s; // notes-2 on top, files-1 below
  }

  it("raises, focuses and un-minimizes, leaving the rect and id alone", () => {
    let s = setup();
    s = wmReducer(s, { type: "minimize", id: "files-1" });
    const rect = win(s, "files-1").rect;
    const before = s.z;
    s = open(s, "files");
    const w = win(s, "files-1");
    expect(s.wins).toHaveLength(2);
    expect(w.minimized).toBe(false);
    expect(w.z).toBe(before + 1);
    expect(s.z).toBe(before + 1);
    expect(s.focused).toBe("files-1");
    expect(w.rect).toEqual(rect);
    expect(s.seq).toBe(2);
  });

  it("without an arg keeps the arg and launch count", () => {
    let s = open(initialWm, "files", { path: "/Trash" });
    s = open(s, "files");
    expect(win(s, "files-1").arg).toEqual({ path: "/Trash" });
    expect(win(s, "files-1").launch).toBe(1);
  });

  it("with an arg replaces the arg and adds one to launch", () => {
    let s = open(initialWm, "files", { path: "/Trash" });
    s = open(s, "files", { path: "/Applications" });
    expect(win(s, "files-1").arg).toEqual({ path: "/Applications" });
    expect(win(s, "files-1").launch).toBe(2);
    s = open(s, "files", { path: "/" });
    expect(win(s, "files-1").launch).toBe(3);
  });

  it("does not move or resize the window", () => {
    let s = setup();
    s = wmReducer(s, { type: "move", id: "files-1", x: 10, y: 60, viewport: V });
    const rect = win(s, "files-1").rect;
    s = open(s, "files", { path: "/" }, { w: 800, h: 600 });
    expect(win(s, "files-1").rect).toEqual(rect);
  });
});

describe("close and quitApp", () => {
  function three() {
    let s = open(initialWm, "files");
    s = open(s, "notes");
    s = open(s, "mail");
    return s; // z: files 1, notes 2, mail 3; focused mail-3
  }

  it("removes the window", () => {
    const s = wmReducer(three(), { type: "close", id: "notes-2" });
    expect(s.wins.map((w) => w.id)).toEqual(["files-1", "mail-3"]);
  });

  it("closing the focused window focuses the highest-z remaining non-minimized one", () => {
    const s = wmReducer(three(), { type: "close", id: "mail-3" });
    expect(s.focused).toBe("notes-2");
  });

  it("skips minimized windows when refocusing", () => {
    let s = three();
    s = wmReducer(s, { type: "minimize", id: "notes-2" });
    s = wmReducer(s, { type: "focus", id: "mail-3" });
    s = wmReducer(s, { type: "close", id: "mail-3" });
    expect(s.focused).toBe("files-1");
  });

  it("focuses nothing when only minimized windows remain, and when the last one closes", () => {
    let s = open(initialWm, "files");
    s = open(s, "notes");
    s = wmReducer(s, { type: "minimize", id: "files-1" });
    s = wmReducer(s, { type: "close", id: "notes-2" });
    expect(s.focused).toBeNull();
    s = wmReducer(s, { type: "close", id: "files-1" });
    expect(s.wins).toEqual([]);
    expect(s.focused).toBeNull();
  });

  it("closing an unfocused window leaves focus alone", () => {
    const s = wmReducer(three(), { type: "close", id: "files-1" });
    expect(s.focused).toBe("mail-3");
  });

  it("quitApp removes every window of that app and refocuses", () => {
    const base: WmState = {
      wins: [
        makeWin({ id: "files-1", app: "files", z: 1 }),
        makeWin({ id: "notes-2", app: "notes", z: 2 }),
        makeWin({ id: "files-3", app: "files", z: 3 }),
      ],
      z: 3,
      seq: 3,
      focused: "files-3",
    };
    const s = wmReducer(base, { type: "quitApp", app: "files" });
    expect(s.wins.map((w) => w.id)).toEqual(["notes-2"]);
    expect(s.focused).toBe("notes-2");
  });

  it("quitApp of the last app focuses nothing", () => {
    let s = open(initialWm, "files");
    s = wmReducer(s, { type: "quitApp", app: "files" });
    expect(s.wins).toEqual([]);
    expect(s.focused).toBeNull();
  });

  it("quitApp keeps focus when the focused window is not of that app", () => {
    let s = open(initialWm, "files");
    s = open(s, "notes");
    s = wmReducer(s, { type: "quitApp", app: "files" });
    expect(s.focused).toBe("notes-2");
  });
});

describe("focus, minimize, restore, toggleMaximize", () => {
  it("focus raises and focuses", () => {
    let s = open(initialWm, "files");
    s = open(s, "notes");
    s = wmReducer(s, { type: "focus", id: "files-1" });
    expect(s.focused).toBe("files-1");
    expect(win(s, "files-1").z).toBe(3);
    expect(s.z).toBe(3);
  });

  it("focus un-minimizes", () => {
    let s = open(initialWm, "files");
    s = wmReducer(s, { type: "minimize", id: "files-1" });
    s = wmReducer(s, { type: "focus", id: "files-1" });
    expect(win(s, "files-1").minimized).toBe(false);
    expect(s.focused).toBe("files-1");
  });

  it("minimize of the focused window focuses the highest-z other non-minimized one", () => {
    let s = open(initialWm, "files");
    s = open(s, "notes");
    s = open(s, "mail");
    s = wmReducer(s, { type: "minimize", id: "mail-3" });
    expect(win(s, "mail-3").minimized).toBe(true);
    expect(s.focused).toBe("notes-2");
  });

  it("minimize skips already-minimized windows and falls back to null", () => {
    let s = open(initialWm, "files");
    s = open(s, "notes");
    s = wmReducer(s, { type: "minimize", id: "files-1" });
    s = wmReducer(s, { type: "minimize", id: "notes-2" });
    expect(s.focused).toBeNull();
  });

  it("minimize of an unfocused window keeps focus", () => {
    let s = open(initialWm, "files");
    s = open(s, "notes");
    s = wmReducer(s, { type: "minimize", id: "files-1" });
    expect(s.focused).toBe("notes-2");
  });

  it("minimize keeps the rect", () => {
    let s = open(initialWm, "files");
    const rect = win(s, "files-1").rect;
    s = wmReducer(s, { type: "minimize", id: "files-1" });
    expect(win(s, "files-1").rect).toEqual(rect);
  });

  it("restore un-minimizes, raises and focuses", () => {
    let s = open(initialWm, "files");
    s = open(s, "notes");
    s = wmReducer(s, { type: "minimize", id: "files-1" });
    s = wmReducer(s, { type: "restore", id: "files-1" });
    const w = win(s, "files-1");
    expect(w.minimized).toBe(false);
    expect(w.z).toBe(s.z);
    expect(w.z).toBe(3);
    expect(s.focused).toBe("files-1");
  });

  it("toggleMaximize flips the flag, raises, focuses and leaves the rect alone", () => {
    let s = open(initialWm, "files");
    s = open(s, "notes");
    const rect = win(s, "files-1").rect;
    s = wmReducer(s, { type: "toggleMaximize", id: "files-1" });
    expect(win(s, "files-1").maximized).toBe(true);
    expect(win(s, "files-1").rect).toEqual(rect);
    expect(win(s, "files-1").z).toBe(s.z);
    expect(s.focused).toBe("files-1");
    s = wmReducer(s, { type: "toggleMaximize", id: "files-1" });
    expect(win(s, "files-1").maximized).toBe(false);
    expect(win(s, "files-1").rect).toEqual(rect);
  });
});

describe("move", () => {
  function one() {
    return open(initialWm, "files"); // rect 280,142 880x560
  }

  it("moves within bounds", () => {
    const s = wmReducer(one(), { type: "move", id: "files-1", x: 300, y: 200, viewport: V });
    expect(win(s, "files-1").rect).toEqual({ x: 300, y: 200, w: 880, h: 560 });
  });

  it("clamps x to [EDGE_GRAB - w, viewport.w - EDGE_GRAB]", () => {
    let s = wmReducer(one(), { type: "move", id: "files-1", x: -5000, y: 200, viewport: V });
    expect(win(s, "files-1").rect.x).toBe(EDGE_GRAB - 880);
    s = wmReducer(s, { type: "move", id: "files-1", x: 5000, y: 200, viewport: V });
    expect(win(s, "files-1").rect.x).toBe(V.w - EDGE_GRAB);
  });

  it("clamps y to [MENU_H, viewport.h - TITLE_KEEP]", () => {
    let s = wmReducer(one(), { type: "move", id: "files-1", x: 300, y: -100, viewport: V });
    expect(win(s, "files-1").rect.y).toBe(MENU_H);
    s = wmReducer(s, { type: "move", id: "files-1", x: 300, y: 5000, viewport: V });
    expect(win(s, "files-1").rect.y).toBe(V.h - TITLE_KEEP);
  });

  it("rounds", () => {
    const s = wmReducer(one(), { type: "move", id: "files-1", x: 100.6, y: 200.4, viewport: V });
    expect(win(s, "files-1").rect.x).toBe(101);
    expect(win(s, "files-1").rect.y).toBe(200);
  });

  it("is ignored (same object) when maximized", () => {
    const m = wmReducer(one(), { type: "toggleMaximize", id: "files-1" });
    const s = wmReducer(m, { type: "move", id: "files-1", x: 5, y: 60, viewport: V });
    expect(s).toBe(m);
  });

  it("does not change size, z or focus", () => {
    const before = one();
    const s = wmReducer(before, { type: "move", id: "files-1", x: 300, y: 200, viewport: V });
    expect(s.z).toBe(before.z);
    expect(s.focused).toBe(before.focused);
    expect(win(s, "files-1").z).toBe(win(before, "files-1").z);
  });
});

describe("resize", () => {
  function one() {
    return open(initialWm, "files"); // minSize 520 x 320
  }

  it("applies an in-range rect", () => {
    const s = wmReducer(one(), {
      type: "resize",
      id: "files-1",
      rect: { x: 100, y: 100, w: 700, h: 500 },
      viewport: V,
    });
    expect(win(s, "files-1").rect).toEqual({ x: 100, y: 100, w: 700, h: 500 });
  });

  it("clamps w/h up to minSize", () => {
    const s = wmReducer(one(), {
      type: "resize",
      id: "files-1",
      rect: { x: 100, y: 100, w: 10, h: 10 },
      viewport: V,
    });
    const r = win(s, "files-1").rect;
    expect(r.w).toBe(appDef("files").minSize.w);
    expect(r.h).toBe(appDef("files").minSize.h);
  });

  it("clamps w/h down to the work area", () => {
    const s = wmReducer(one(), {
      type: "resize",
      id: "files-1",
      rect: { x: 0, y: 0, w: 5000, h: 5000 },
      viewport: V,
    });
    const r = win(s, "files-1").rect;
    expect(r.w).toBe(V.w);
    expect(r.h).toBe(V.h - MENU_H - DOCK_H);
    expect(r.y).toBe(MENU_H);
  });

  it("lets the work area win when it is smaller than minSize", () => {
    const small: Size = { w: 400, h: 300 };
    const s = wmReducer(one(), {
      type: "resize",
      id: "files-1",
      rect: { x: 0, y: 28, w: 700, h: 700 },
      viewport: small,
    });
    const r = win(s, "files-1").rect;
    expect(r.w).toBe(400);
    expect(r.h).toBe(300 - MENU_H - DOCK_H);
  });

  it("clamps x/y like move, using the new width", () => {
    const s = wmReducer(one(), {
      type: "resize",
      id: "files-1",
      rect: { x: -9000, y: 9000, w: 700, h: 500 },
      viewport: V,
    });
    const r = win(s, "files-1").rect;
    expect(r.x).toBe(EDGE_GRAB - 700);
    expect(r.y).toBe(V.h - TITLE_KEEP);
  });

  it("rounds", () => {
    const s = wmReducer(one(), {
      type: "resize",
      id: "files-1",
      rect: { x: 100.4, y: 100.6, w: 700.6, h: 500.4 },
      viewport: V,
    });
    expect(win(s, "files-1").rect).toEqual({ x: 100, y: 101, w: 701, h: 500 });
  });

  it("is ignored (same object) when maximized", () => {
    const m = wmReducer(one(), { type: "toggleMaximize", id: "files-1" });
    const s = wmReducer(m, {
      type: "resize",
      id: "files-1",
      rect: { x: 100, y: 100, w: 700, h: 500 },
      viewport: V,
    });
    expect(s).toBe(m);
  });
});

describe("setTitle", () => {
  it("sets the title without touching z or focus", () => {
    let s = open(initialWm, "files");
    s = open(s, "notes");
    const next = wmReducer(s, { type: "setTitle", id: "files-1", title: "Projects" });
    expect(win(next, "files-1").title).toBe("Projects");
    expect(win(next, "files-1").z).toBe(win(s, "files-1").z);
    expect(next.z).toBe(s.z);
    expect(next.focused).toBe(s.focused);
  });

  it("returns the same state when the title is unchanged", () => {
    const s = open(initialWm, "files");
    expect(wmReducer(s, { type: "setTitle", id: "files-1", title: "Files" })).toBe(s);
  });
});

describe("fit", () => {
  it("clamps every window to a smaller viewport, minimized ones included", () => {
    let s = open(initialWm, "files");
    s = open(s, "notes");
    s = wmReducer(s, { type: "minimize", id: "notes-2" });
    const small: Size = { w: 600, h: 400 };
    const next = wmReducer(s, { type: "fit", viewport: small });
    const files = win(next, "files-1").rect;
    // w within [520, 600]; h: the 288 work area is smaller than minSize 320, so it wins.
    expect(files.w).toBe(600);
    expect(files.h).toBe(400 - MENU_H - DOCK_H);
    expect(files.x).toBeGreaterThanOrEqual(EDGE_GRAB - files.w);
    expect(files.x).toBeLessThanOrEqual(small.w - EDGE_GRAB);
    expect(files.y).toBeGreaterThanOrEqual(MENU_H);
    expect(files.y).toBeLessThanOrEqual(small.h - TITLE_KEEP);
    const notes = win(next, "notes-2").rect;
    expect(notes.w).toBeLessThanOrEqual(600);
    expect(notes.h).toBeLessThanOrEqual(400 - MENU_H - DOCK_H);
  });
});

describe("unknown ids and no-ops return the same state object", () => {
  const s = open(open(initialWm, "files"), "notes");
  const actions: WmAction[] = [
    { type: "close", id: "nope-9" },
    { type: "focus", id: "nope-9" },
    { type: "minimize", id: "nope-9" },
    { type: "restore", id: "nope-9" },
    { type: "toggleMaximize", id: "nope-9" },
    { type: "move", id: "nope-9", x: 1, y: 1, viewport: V },
    { type: "resize", id: "nope-9", rect: { x: 1, y: 1, w: 600, h: 400 }, viewport: V },
    { type: "setTitle", id: "nope-9", title: "x" },
  ];
  for (const a of actions) {
    it(`${a.type} on an unknown id`, () => {
      expect(wmReducer(s, a)).toBe(s);
    });
  }
});

describe("immutability", () => {
  it("never mutates the input state and returns new objects for real changes", () => {
    let s: WmState = initialWm;
    const steps: WmAction[] = [
      { type: "open", app: "files", viewport: V },
      { type: "open", app: "notes", arg: { noteId: "a" }, viewport: V },
      { type: "open", app: "files", arg: { path: "/" }, viewport: V },
      { type: "move", id: "files-1", x: 50, y: 50, viewport: V },
      { type: "resize", id: "files-1", rect: { x: 60, y: 60, w: 700, h: 500 }, viewport: V },
      { type: "setTitle", id: "files-1", title: "Elsewhere" },
      { type: "minimize", id: "notes-2" },
      { type: "restore", id: "notes-2" },
      { type: "focus", id: "files-1" },
      { type: "toggleMaximize", id: "files-1" },
      { type: "toggleMaximize", id: "files-1" },
      { type: "fit", viewport: { w: 800, h: 500 } },
      { type: "close", id: "notes-2" },
      { type: "quitApp", app: "files" },
    ];
    for (const a of steps) {
      const snapshot = structuredClone(s);
      deepFreeze(s);
      let next: WmState | undefined;
      expect(() => {
        next = wmReducer(s, a);
      }).not.toThrow();
      expect(s).toEqual(snapshot);
      expect(next).not.toBe(s);
      s = next as WmState;
    }
    expect(s.wins).toEqual([]);
  });
});


/* ── unchanged actions return the SAME object ────────────────────── */

describe("no-op actions return the same state object", () => {
  const one = () => open(initialWm, "files"); // rect 280,142 880x560 in V

  it("move to the position the window already has", () => {
    const s = one();
    expect(wmReducer(s, { type: "move", id: "files-1", x: 280, y: 142, viewport: V })).toBe(s);
  });

  it("move whose target clamps to the current position", () => {
    let s = one();
    s = wmReducer(s, { type: "move", id: "files-1", x: 5000, y: 5000, viewport: V });
    expect(win(s, "files-1").rect.x).toBe(V.w - EDGE_GRAB);
    expect(wmReducer(s, { type: "move", id: "files-1", x: 9999, y: 9999, viewport: V })).toBe(s);
  });

  it("move that rounds to the current position", () => {
    const s = one();
    expect(wmReducer(s, { type: "move", id: "files-1", x: 280.2, y: 141.8, viewport: V })).toBe(s);
  });

  it("resize to the rect the window already has", () => {
    const s = one();
    const rect = win(s, "files-1").rect;
    expect(wmReducer(s, { type: "resize", id: "files-1", rect: { ...rect }, viewport: V })).toBe(s);
  });

  it("resize whose target clamps to the current rect", () => {
    let s = one();
    s = wmReducer(s, { type: "resize", id: "files-1", rect: { x: 0, y: 0, w: 5000, h: 5000 }, viewport: V });
    expect(wmReducer(s, { type: "resize", id: "files-1", rect: { x: 0, y: 0, w: 9000, h: 9000 }, viewport: V })).toBe(s);
  });

  it("fit on a layout that already fits", () => {
    let s = one();
    s = open(s, "notes");
    expect(wmReducer(s, { type: "fit", viewport: V })).toBe(s);
  });

  it("fit with no windows", () => {
    expect(wmReducer(initialWm, { type: "fit", viewport: V })).toBe(initialWm);
  });

  it("setTitle to the same title", () => {
    const s = one();
    expect(wmReducer(s, { type: "setTitle", id: "files-1", title: "Files" })).toBe(s);
  });

  it("quitApp with no matching window", () => {
    const s = one();
    expect(wmReducer(s, { type: "quitApp", app: "mail" })).toBe(s);
    expect(wmReducer(initialWm, { type: "quitApp", app: "mail" })).toBe(initialWm);
  });

  it("close with no matching window", () => {
    const s = one();
    expect(wmReducer(s, { type: "close", id: "files-99" })).toBe(s);
    expect(wmReducer(initialWm, { type: "close", id: "files-1" })).toBe(initialWm);
  });

  it("real changes do return a new object", () => {
    const s = one();
    expect(wmReducer(s, { type: "move", id: "files-1", x: 300, y: 142, viewport: V })).not.toBe(s);
    expect(wmReducer(s, { type: "setTitle", id: "files-1", title: "Other" })).not.toBe(s);
    expect(wmReducer(s, { type: "quitApp", app: "files" })).not.toBe(s);
    expect(wmReducer(s, { type: "fit", viewport: { w: 700, h: 500 } })).not.toBe(s);
  });
});

/* ── work area shorter than minSize ──────────────────────────────── */

describe("work area shorter than minSize (height)", () => {
  const SHORT: Size = { w: 1440, h: 300 }; // work area height 188 < files minSize.h 320

  it("open: the work area height wins, the width still follows the normal rules", () => {
    const s = open(initialWm, "files", undefined, SHORT);
    expect(s.wins[0].rect).toEqual({ x: 280, y: MENU_H, w: 880, h: 300 - MENU_H - DOCK_H });
  });

  it("resize: height is clamped to the work area, not raised to minSize", () => {
    let s = open(initialWm, "files");
    s = wmReducer(s, { type: "resize", id: "files-1", rect: { x: 100, y: 60, w: 700, h: 700 }, viewport: SHORT });
    expect(win(s, "files-1").rect.h).toBe(300 - MENU_H - DOCK_H);
    expect(win(s, "files-1").rect.w).toBe(700);
  });

  it("resize: a tiny height also becomes the work area height", () => {
    let s = open(initialWm, "files");
    s = wmReducer(s, { type: "resize", id: "files-1", rect: { x: 100, y: 60, w: 700, h: 10 }, viewport: SHORT });
    expect(win(s, "files-1").rect.h).toBe(300 - MENU_H - DOCK_H);
  });

  it("fit: height shrinks to the work area while width stays within [minSize, work area]", () => {
    let s = open(initialWm, "files");
    s = wmReducer(s, { type: "fit", viewport: SHORT });
    const r = win(s, "files-1").rect;
    expect(r.h).toBe(300 - MENU_H - DOCK_H);
    expect(r.w).toBe(880);
  });
});

/* ── focus when the affected window is not the focused one ───────── */

describe("focus bookkeeping", () => {
  function abc() {
    let s = open(initialWm, "files");
    s = open(s, "notes");
    s = open(s, "mail");
    return s; // z: files 1, notes 2, mail 3. focused mail-3
  }

  it("closing an unfocused window keeps focus and the focused window's z", () => {
    const s = abc();
    const next = wmReducer(s, { type: "close", id: "notes-2" });
    expect(next.focused).toBe("mail-3");
    expect(win(next, "mail-3").z).toBe(3);
    expect(next.z).toBe(s.z);
  });

  it("minimizing an unfocused window keeps focus", () => {
    const s = abc();
    const next = wmReducer(s, { type: "minimize", id: "notes-2" });
    expect(next.focused).toBe("mail-3");
    expect(win(next, "notes-2").minimized).toBe(true);
    expect(win(next, "mail-3").z).toBe(3);
  });

  it("after an unfocused window went away, closing the focused one falls to the highest-z non-minimized", () => {
    let s = abc();
    s = wmReducer(s, { type: "minimize", id: "notes-2" });
    s = wmReducer(s, { type: "close", id: "mail-3" });
    expect(s.focused).toBe("files-1");
    let t = abc();
    t = wmReducer(t, { type: "close", id: "notes-2" });
    t = wmReducer(t, { type: "close", id: "mail-3" });
    expect(t.focused).toBe("files-1");
  });

  it("refocus uses z order, not array order", () => {
    let s = abc();
    s = wmReducer(s, { type: "focus", id: "files-1" }); // files z 4
    s = wmReducer(s, { type: "focus", id: "notes-2" }); // notes z 5, files 4, mail 3
    s = wmReducer(s, { type: "close", id: "notes-2" });
    expect(s.focused).toBe("files-1");
  });

  it("minimize of the focused window also falls back by z order", () => {
    let s = abc();
    s = wmReducer(s, { type: "focus", id: "files-1" }); // files 4
    s = wmReducer(s, { type: "focus", id: "mail-3" }); // mail 5, files 4, notes 2
    s = wmReducer(s, { type: "minimize", id: "mail-3" });
    expect(s.focused).toBe("files-1");
  });

  it("quitApp of an unfocused app keeps focus; of the focused app refocuses by z", () => {
    const base: WmState = {
      wins: [
        makeWin({ id: "files-1", app: "files", z: 1 }),
        makeWin({ id: "notes-2", app: "notes", z: 5 }),
        makeWin({ id: "mail-3", app: "mail", z: 3 }),
      ],
      z: 5,
      seq: 3,
      focused: "mail-3",
    };
    expect(wmReducer(base, { type: "quitApp", app: "files" }).focused).toBe("mail-3");
    expect(wmReducer(base, { type: "quitApp", app: "mail" }).focused).toBe("notes-2");
  });

  it("closing the focused window when everything else is minimized leaves nothing focused", () => {
    let s = abc();
    s = wmReducer(s, { type: "minimize", id: "notes-2" });
    s = wmReducer(s, { type: "minimize", id: "files-1" });
    s = wmReducer(s, { type: "close", id: "mail-3" });
    expect(s.focused).toBeNull();
    expect(s.wins).toHaveLength(2);
  });
});

describe("title bar stays clear of the dock", () => {
  it("TITLE_KEEP is DOCK_H + 40 (124)", () => {
    expect(TITLE_KEEP).toBe(124);
  });

  it("a window dragged to the bottom keeps its title bar at y <= viewport.h - DOCK_H - 40", () => {
    for (const v of [V, { w: 1000, h: 700 }]) {
      let s = open(initialWm, "files", undefined, v);
      s = wmReducer(s, { type: "move", id: "files-1", x: 100, y: 99999, viewport: v });
      expect(win(s, "files-1").rect.y).toBe(v.h - DOCK_H - 40);
    }
  });

  it("resize and fit clamp y the same way", () => {
    let s = open(initialWm, "files");
    s = wmReducer(s, { type: "resize", id: "files-1", rect: { x: 100, y: 99999, w: 700, h: 500 }, viewport: V });
    expect(win(s, "files-1").rect.y).toBe(V.h - DOCK_H - 40);
    let t = open(initialWm, "files");
    t = wmReducer(t, { type: "move", id: "files-1", x: 100, y: 500, viewport: V });
    t = wmReducer(t, { type: "fit", viewport: { w: 1440, h: 600 } });
    expect(win(t, "files-1").rect.y).toBeLessThanOrEqual(600 - DOCK_H - 40);
  });
});
