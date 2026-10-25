"use client";

import { useEffect } from "react";

/**
 * Stops the page behind an overlay from scrolling, and puts it back exactly where it was.
 *
 * The scrolling element is usually <html>, not <body>, so both are locked: `body` alone leaves the
 * document scroller live on most desktop browsers. The overlays are fixed-position layers with
 * their own scrollers, so nothing inside them is affected. Overlays can overlap while one closes,
 * so locks are counted and only the last release restores the page.
 */
let locks = 0;
let saved: { html: string; padding: string; body: string; y: number } | null = null;

export function useScrollLock() {
  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;
    if (locks === 0) {
      saved = { html: root.style.overflow, padding: root.style.paddingRight, body: body.style.overflow, y: window.scrollY };
      // the scrollbar's width is held so the page behind does not jump sideways when it disappears
      const gap = window.innerWidth - root.clientWidth;
      root.style.overflow = "hidden";
      body.style.overflow = "hidden";
      if (gap > 0) root.style.paddingRight = `${gap}px`;
    }
    locks += 1;
    return () => {
      locks -= 1;
      if (locks > 0 || !saved) return;
      const { html, padding, body: bodyOverflow, y } = saved;
      saved = null;
      root.style.overflow = html;
      root.style.paddingRight = padding;
      body.style.overflow = bodyOverflow;
      if (window.scrollY !== y) window.scrollTo(0, y);
    };
  }, []);
}
