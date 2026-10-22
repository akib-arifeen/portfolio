"use client";

import { useEffect, useRef, useState } from "react";
import type { StudioProps } from "./Studio";

/**
 * The room without WebGL: a still illustration. The "Look at" chips, the detail panels and the laptop live in Hero, so they keep
 * working; the booth gets its real touchscreen drawn as plain DOM, and the printed card simply appears.
 */
export default function StudioFallback({ boothMode, boothScreen, cardUrl, onCardPresented }: StudioProps) {
  const [width, setWidth] = useState(() => Math.min(window.innerWidth * 0.92, 640));
  useEffect(() => {
    const on = () => setWidth(Math.min(window.innerWidth * 0.92, 640));
    window.addEventListener("resize", on);
    return () => window.removeEventListener("resize", on);
  }, []);

  // in 3D the card feeds out and is "presented" after an animation; here it is shown, then presented a moment later
  const presented = useRef(onCardPresented);
  presented.current = onCardPresented;
  useEffect(() => {
    if (!boothMode || !cardUrl) return;
    const id = setTimeout(() => presented.current?.(), 900);
    return () => clearTimeout(id);
  }, [boothMode, cardUrl]);

  return (
    <div className="studio-fallback">
      {/* eslint-disable-next-line @next/next/no-img-element -- a static still: nothing for next/image to optimise */}
      <img className="studio-fallback__room" src="/studio/room-poster.jpg" alt="A picture of my studio: a desk with a monitor and a laptop, a shelf, a window and a photobooth." />
      {boothMode && (
        <div className="studio-fallback__booth">
          {cardUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- a data URL made in the browser
            <img className="studio-fallback__card" src={cardUrl} alt="Your printed card" />
          ) : (
            boothScreen?.(Math.round(width))
          )}
        </div>
      )}
    </div>
  );
}
