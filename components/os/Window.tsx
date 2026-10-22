"use client";

import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import type { Rect, WindowProps } from "@/lib/os/types";
import { DOCK_H, frameOf, workArea } from "@/lib/os/wm";

type Dir = "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw";
const DIRS: Dir[] = ["n", "s", "e", "w", "ne", "nw", "se", "sw"];

/** One pointer gesture: capture, call `onDelta` at most once per animation frame, clean up on every way it can end. */
function useGesture() {
  const cleanup = useRef<(() => void) | null>(null);
  useEffect(() => () => cleanup.current?.(), []);
  return useCallback(
    (e: ReactPointerEvent<HTMLElement>, onDelta: (dx: number, dy: number) => void, onEnd: () => void) => {
      const el = e.currentTarget;
      const sx = e.clientX;
      const sy = e.clientY;
      const id = e.pointerId;
      let pending: [number, number] | null = null;
      let raf = 0;
      try { el.setPointerCapture(id); } catch { /* the pointer already ended */ }
      const flush = () => {
        raf = 0;
        if (pending) { const [dx, dy] = pending; pending = null; onDelta(dx, dy); }
      };
      const move = (ev: PointerEvent) => {
        if (ev.pointerId !== id) return;
        pending = [ev.clientX - sx, ev.clientY - sy];
        if (!raf) raf = requestAnimationFrame(flush);
      };
      const end = () => {
        if (raf) cancelAnimationFrame(raf);
        flush();
        el.removeEventListener("pointermove", move);
        el.removeEventListener("pointerup", end);
        el.removeEventListener("pointercancel", end);
        el.removeEventListener("lostpointercapture", end);
        try { el.releasePointerCapture(id); } catch { /* already released */ }
        cleanup.current = null;
        onEnd();
      };
      el.addEventListener("pointermove", move);
      el.addEventListener("pointerup", end);
      el.addEventListener("pointercancel", end);
      el.addEventListener("lostpointercapture", end);
      cleanup.current = end;
    },
    [],
  );
}

const Glyph = {
  close: <path d="M2 2 L6 6 M6 2 L2 6" />,
  minimize: <path d="M1.5 4 H6.5" />,
  zoom: <path d="M2 2 H5.5 V5.5 Z M6 6 H2.5 V2.5 Z" fill="currentColor" strokeWidth="0.6" />,
};

export default function Window({ win, def, viewport, focused, onFocus, onClose, onMinimize, onToggleMaximize, onMove, onResize, children }: WindowProps) {
  const [live, setLive] = useState(false);
  const gesture = useGesture();
  const f = frameOf(win, viewport);

  const startDrag = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (win.maximized || e.button !== 0 || (e.target as HTMLElement).closest("button")) return;
    const { x, y } = win.rect;
    setLive(true);
    gesture(e, (dx, dy) => onMove(x + dx, y + dy), () => setLive(false));
  };

  const startResize = (dir: Dir) => (e: ReactPointerEvent<HTMLDivElement>) => {
    if (win.maximized || e.button !== 0) return;
    e.stopPropagation();
    const r = win.rect;
    const wa = workArea(viewport);
    const maxW = wa.w;
    const maxH = wa.h;
    const minW = Math.min(def.minSize.w, maxW);
    const minH = Math.min(def.minSize.h, maxH);
    setLive(true);
    gesture(
      e,
      (dx, dy) => {
        const next: Rect = { ...r };
        if (dir.includes("e")) next.w = Math.min(maxW, Math.max(minW, r.w + dx));
        if (dir.includes("w")) { next.w = Math.min(maxW, Math.max(minW, r.w - dx)); next.x = r.x + r.w - next.w; }
        if (dir.includes("s")) next.h = Math.min(maxH, Math.max(minH, r.h + dy));
        if (dir.includes("n")) {
          // the bottom edge stays put; the top edge stops at the menu bar and the window shrinks or grows from there
          const bottom = r.y + r.h;
          const top = Math.min(bottom - minH, Math.max(wa.y, bottom - maxH, r.y + dy));
          next.y = top;
          next.h = bottom - top;
        }
        onResize(next);
      },
      () => setLive(false),
    );
  };

  // minimize flies toward the bottom centre, where the dock is
  const fx = viewport.w / 2 - (f.x + f.w / 2);
  const fy = viewport.h - DOCK_H / 2 - (f.y + f.h / 2);

  return (
    <section
      className="os-win"
      aria-label={win.title}
      aria-hidden={win.minimized || undefined}
      data-focused={focused}
      data-minimized={win.minimized}
      data-live={live}
      onPointerDownCapture={() => { if (!focused) onFocus(); }}
      style={{
        left: f.x,
        top: f.y,
        width: f.w,
        height: f.h,
        zIndex: 100 + win.z,
        ["--os-fx" as string]: `${Math.round(fx)}px`,
        ["--os-fy" as string]: `${Math.round(fy)}px`,
      }}
    >
      <div
        className="os-win__bar"
        onPointerDown={startDrag}
        onDoubleClick={(e) => { if (!(e.target as HTMLElement).closest("button")) onToggleMaximize(); }}
      >
        <div className="os-lights">
          <button type="button" className="os-light os-light--close" aria-label="Close" onClick={onClose}>
            <svg viewBox="0 0 8 8" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" aria-hidden="true">{Glyph.close}</svg>
          </button>
          <button type="button" className="os-light os-light--minimize" aria-label="Minimize" onClick={onMinimize}>
            <svg viewBox="0 0 8 8" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" aria-hidden="true">{Glyph.minimize}</svg>
          </button>
          <button type="button" className="os-light os-light--zoom" aria-label="Zoom" onClick={onToggleMaximize}>
            <svg viewBox="0 0 8 8" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" aria-hidden="true">{Glyph.zoom}</svg>
          </button>
        </div>
        <div className="os-win__title">{win.title}</div>
      </div>
      <div className="os-win__body">{children}</div>
      <div className="os-win__ring" aria-hidden="true" />
      {!win.maximized && DIRS.map((d) => <div key={d} className={`os-grip os-grip--${d}`} onPointerDown={startResize(d)} />)}
    </section>
  );
}
