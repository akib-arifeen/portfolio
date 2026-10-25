"use client";

import { useEffect, useRef } from "react";

const DURATION = 900;

/** Renders `text` as-is on the server. In the browser, counts every number in it up from 0 once it scrolls into view. */
export default function CountUp({ text }: { text: string }) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const parts = text.split(/(\d+)/); // odd indexes are the numbers
    // only the last number of a range animates, and a number followed by a letter ("4K") stays put
    const nums = parts.flatMap((_, i) => (i % 2 ? [i] : []));
    const live = nums.length ? nums[nums.length - 1]! : -1;
    if (live < 0 || /^[A-Za-z]/.test(parts[live + 1] ?? "")) return;
    const at = (k: number) => parts.map((p, i) => (i === live ? String(Math.round(Number(p) * k)) : p)).join("");
    let raf = 0;
    el.textContent = at(0);
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        io.disconnect();
        const t0 = performance.now();
        const tick = (now: number) => {
          const k = Math.min(1, (now - t0) / DURATION);
          el.textContent = at(1 - Math.pow(1 - k, 3));
          if (k < 1) raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
      },
      { threshold: 0.6 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
      el.textContent = text;
    };
  }, [text]);

  // One copy of the number, not two: the link that carries it is named in full by its own label.
  return (
    <span ref={ref} aria-hidden="true">{text}</span>
  );
}
