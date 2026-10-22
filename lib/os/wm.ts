// akibOS window manager — a pure reducer, so it is unit-tested without a browser.
import { appDef } from "./apps";
import type { Rect, Size, WinState, WmAction, WmState } from "./types";

/** Menu bar height; no window may go under it. */
export const MENU_H = 28;
/** Space kept clear above the bottom edge for the dock (also what a maximized window leaves free). */
export const DOCK_H = 84;
/** Offset between cascaded new windows. */
export const CASCADE = 28;
/** Pixels of a window's width that must stay on screen horizontally. */
export const EDGE_GRAB = 96;
/** A title bar's top edge may go no lower than viewport.h - TITLE_KEEP: it always stays clear of the dock (40 px above it). */
export const TITLE_KEEP = DOCK_H + 40;
/** Margin kept around a new window when its preferred size is clamped to the work area. */
export const OPEN_MARGIN = 16;

export const initialWm: WmState = { wins: [], z: 0, seq: 0, focused: null };

/** Where windows live: full width, from below the menu bar to above the dock. */
export function workArea(v: Size): Rect {
  return { x: 0, y: MENU_H, w: v.w, h: Math.max(0, v.h - MENU_H - DOCK_H) };
}

/** The frame a window is drawn at: the work area when maximized, otherwise its own rect. */
export function frameOf(win: WinState, v: Size): Rect {
  return win.maximized ? workArea(v) : win.rect;
}

/** The highest-z window that is not minimized, or null. */
export function topWindow(s: WmState): WinState | null {
  let top: WinState | null = null;
  for (const w of s.wins) if (!w.minimized && (!top || w.z > top.z)) top = w;
  return top;
}

const clamp = (n: number, lo: number, hi: number) => Math.min(Math.max(n, lo), hi);

/** Highest-z non-minimized window other than the ones in `skip`, or null. */
function topExcept(wins: WinState[], skip: (w: WinState) => boolean): WinState | null {
  let top: WinState | null = null;
  for (const w of wins) if (!w.minimized && !skip(w) && (!top || w.z > top.z)) top = w;
  return top;
}

function clampSize(r: Rect, min: Size, v: Size): Size {
  const wa = workArea(v);
  return {
    w: Math.round(clamp(r.w, Math.min(min.w, wa.w), wa.w)),
    h: Math.round(clamp(r.h, Math.min(min.h, wa.h), wa.h)),
  };
}

function clampPos(x: number, y: number, w: number, v: Size): { x: number; y: number } {
  return {
    x: Math.round(clamp(x, EDGE_GRAB - w, v.w - EDGE_GRAB)),
    y: Math.round(clamp(y, MENU_H, v.h - TITLE_KEEP)),
  };
}

const sameRect = (a: Rect, b: Rect) => a.x === b.x && a.y === b.y && a.w === b.w && a.h === b.h;

/** Replace one window; returns the new state. */
function patch(s: WmState, id: string, fn: (w: WinState) => WinState, extra: Partial<WmState> = {}): WmState {
  return { ...s, ...extra, wins: s.wins.map((w) => (w.id === id ? fn(w) : w)) };
}

/** Raise and focus a window (un-minimizing it). */
function raise(s: WmState, id: string, fn: (w: WinState) => WinState = (w) => w): WmState {
  const z = s.z + 1;
  return patch(s, id, (w) => ({ ...fn(w), minimized: false, z }), { z, focused: id });
}

/** After removing windows: keep focus if it survives, else the top remaining window. */
function refocus(s: WmState, wins: WinState[]): WmState {
  const keeps = s.focused !== null && wins.some((w) => w.id === s.focused);
  const focused = keeps ? s.focused : (topExcept(wins, () => false)?.id ?? null);
  return { ...s, wins, focused };
}

/**
 * Every app is single-window. Behaviour, exactly:
 *
 * open(app, arg?, viewport)
 *   - A window of `app` exists → minimized=false, raised (z = s.z + 1, s.z updated), focused; when `arg` is given,
 *     win.arg = arg and win.launch += 1. Its rect is unchanged.
 *   - Otherwise create { id: `${app}-${s.seq + 1}`, app, title: appDef(app).name, minimized: false, maximized: false,
 *     z: s.z + 1, arg, launch: 1 } and set s.seq += 1, s.z += 1, focused = id.
 *     Size: appDef(app).size, each side clamped to (work area side − 2·OPEN_MARGIN) and then raised to at least
 *     appDef(app).minSize — unless the work area side itself is smaller than minSize, in which case the work area side wins.
 *     Position: with no other non-minimized window, centred in the work area. Otherwise at the top window's
 *     rect.x + CASCADE, rect.y + CASCADE (topWindow), so each new window steps visibly down and right of the last;
 *     if that would cross the work area's right or bottom edge, centred instead.
 *     All coordinates are rounded with Math.round.
 * close(id)          Remove it. If it was focused, focus the highest-z remaining non-minimized window, else null.
 * quitApp(app)       Remove every window of `app`; refocus as for close.
 * focus(id)          Raise it (z = s.z + 1), focus it, and un-minimize it if minimized.
 * minimize(id)       minimized = true. If it was focused, focus the highest-z other non-minimized window, else null.
 * restore(id)        minimized = false, raised and focused.
 * toggleMaximize(id) maximized = !maximized, raised and focused. rect is untouched (it is the normal frame).
 * move(id, x, y, v)  Ignored when maximized. Otherwise rect.x = clamp(x, EDGE_GRAB − rect.w, v.w − EDGE_GRAB) and
 *                    rect.y = clamp(y, MENU_H, v.h − TITLE_KEEP), both rounded.
 * resize(id, r, v)   Ignored when maximized. w/h clamped to [minSize, work area side] (work area wins when it is
 *                    smaller than minSize), then x/y clamped exactly as in move. Rounded.
 * setTitle(id, t)    title = t. No z or focus change.
 * fit(v)             For every window: w/h clamped as in resize, x/y clamped as in move.
 *
 * Any action naming an unknown id, and any action that changes nothing (move/resize of a maximized window, setTitle
 * to the same title), returns the SAME state object so React can skip the render. Every other action returns a new
 * state object and never mutates the old one.
 */
export function wmReducer(s: WmState, a: WmAction): WmState {
  switch (a.type) {
    case "open": {
      const existing = s.wins.find((w) => w.app === a.app);
      if (existing) {
        return raise(s, existing.id, (w) => (a.arg !== undefined ? { ...w, arg: a.arg, launch: w.launch + 1 } : w));
      }
      const def = appDef(a.app);
      const wa = workArea(a.viewport);
      const want = { w: Math.min(def.size.w, wa.w - 2 * OPEN_MARGIN), h: Math.min(def.size.h, wa.h - 2 * OPEN_MARGIN) };
      const size = clampSize({ x: 0, y: 0, ...want }, def.minSize, a.viewport);
      const cx = wa.x + (wa.w - size.w) / 2;
      const cy = wa.y + (wa.h - size.h) / 2;
      // step down and right of the top window; centred when there is none or the step would leave the work area
      const top = topWindow(s);
      let x = cx, y = cy;
      if (top) {
        const sx = top.rect.x + CASCADE, sy = top.rect.y + CASCADE;
        if (sx + size.w <= wa.x + wa.w && sy + size.h <= wa.y + wa.h) { x = sx; y = sy; }
      }
      const id = `${a.app}-${s.seq + 1}`;
      const win: WinState = {
        id, app: a.app, title: def.name,
        rect: { x: Math.round(x), y: Math.round(y), w: size.w, h: size.h },
        minimized: false, maximized: false, z: s.z + 1, arg: a.arg, launch: 1,
      };
      return { wins: [...s.wins, win], z: s.z + 1, seq: s.seq + 1, focused: id };
    }
    case "close": {
      if (!s.wins.some((w) => w.id === a.id)) return s;
      return refocus(s, s.wins.filter((w) => w.id !== a.id));
    }
    case "quitApp": {
      if (!s.wins.some((w) => w.app === a.app)) return s;
      return refocus(s, s.wins.filter((w) => w.app !== a.app));
    }
    case "focus":
    case "restore":
    case "toggleMaximize": {
      if (!s.wins.some((w) => w.id === a.id)) return s;
      return raise(s, a.id, a.type === "toggleMaximize" ? (w) => ({ ...w, maximized: !w.maximized }) : undefined);
    }
    case "minimize": {
      const w = s.wins.find((x) => x.id === a.id);
      if (!w || w.minimized) return s;
      const next = patch(s, a.id, (x) => ({ ...x, minimized: true }));
      if (s.focused !== a.id) return next;
      return { ...next, focused: topExcept(next.wins, (x) => x.id === a.id)?.id ?? null };
    }
    case "move": {
      const w = s.wins.find((x) => x.id === a.id);
      if (!w || w.maximized) return s;
      const p = clampPos(a.x, a.y, w.rect.w, a.viewport);
      if (p.x === w.rect.x && p.y === w.rect.y) return s;
      return patch(s, a.id, (x) => ({ ...x, rect: { ...x.rect, ...p } }));
    }
    case "resize": {
      const w = s.wins.find((x) => x.id === a.id);
      if (!w || w.maximized) return s;
      const size = clampSize(a.rect, appDef(w.app).minSize, a.viewport);
      const rect = { ...clampPos(a.rect.x, a.rect.y, size.w, a.viewport), ...size };
      if (sameRect(rect, w.rect)) return s;
      return patch(s, a.id, (x) => ({ ...x, rect }));
    }
    case "setTitle": {
      const w = s.wins.find((x) => x.id === a.id);
      if (!w || w.title === a.title) return s;
      return patch(s, a.id, (x) => ({ ...x, title: a.title }));
    }
    case "fit": {
      let changed = false;
      const wins = s.wins.map((w) => {
        const size = clampSize(w.rect, appDef(w.app).minSize, a.viewport);
        const rect = { ...clampPos(w.rect.x, w.rect.y, size.w, a.viewport), ...size };
        if (sameRect(rect, w.rect)) return w;
        changed = true;
        return { ...w, rect };
      });
      return changed ? { ...s, wins } : s;
    }
  }
}
