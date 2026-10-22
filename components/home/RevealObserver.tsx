"use client";

import { useEffect } from "react";

/** Subtle reveal-on-scroll: elements marked data-reveal that start below the fold fade up once. Renders nothing. */
export default function RevealObserver() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const targets = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]"));
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          (e.target as HTMLElement).dataset.reveal = "in";
          io.unobserve(e.target);
        }
      },
      { rootMargin: "0px 0px -8% 0px" },
    );
    for (const el of targets) {
      // Only hide what is below the fold, so nothing flashes on first paint.
      if (el.getBoundingClientRect().top <= window.innerHeight) continue;
      el.dataset.reveal = "pending";
      io.observe(el);
    }
    return () => io.disconnect();
  }, []);
  return null;
}
