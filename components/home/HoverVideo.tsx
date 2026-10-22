"use client";

import { useEffect, useRef } from "react";

/**
 * A cover video that shows its poster and plays the muted loop only while the pointer is over (or focus is inside)
 * the surrounding [data-hover-play] card. Never plays on touch devices or with reduced motion.
 */
export default function HoverVideo({ src, poster, w, h }: { src: string; poster: string; w: number; h: number }) {
  const video = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const v = video.current;
    const card = v?.closest<HTMLElement>("[data-hover-play]");
    if (!v || !card) return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    // play() rejects when a pause interrupts it, which is expected when the pointer leaves quickly.
    const play = () => { v.play().catch(() => {}); };
    const stop = () => { v.pause(); v.currentTime = 0; };
    card.addEventListener("pointerenter", play);
    card.addEventListener("focusin", play);
    card.addEventListener("pointerleave", stop);
    card.addEventListener("focusout", stop);
    return () => {
      card.removeEventListener("pointerenter", play);
      card.removeEventListener("focusin", play);
      card.removeEventListener("pointerleave", stop);
      card.removeEventListener("focusout", stop);
    };
  }, []);

  return (
    <video
      ref={video}
      className="hcard__media"
      src={src}
      poster={poster}
      width={w}
      height={h}
      muted
      loop
      playsInline
      preload="none"
      aria-hidden="true"
      tabIndex={-1}
    />
  );
}
