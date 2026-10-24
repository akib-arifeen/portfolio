"use client";

import type { StudioProps } from "./Studio";

/**
 * The room without WebGL: a still of the studio. Everything actionable lives in Hero — the object
 * buttons, the detail panel, the laptop and the booth dialog — so the page still works without 3D.
 */
export default function StudioFallback({ selected }: StudioProps) {
  return (
    <div className="studio-fallback">
      {/* eslint-disable-next-line @next/next/no-img-element -- a static still: nothing for next/image to optimise */}
      <img
        className="studio-fallback__room"
        src="/studio/room-poster.jpg"
        alt="A still of my studio: a desk with a monitor and a laptop, a dark photo booth against the wall, a shelf and a window."
      />
      {selected && <span className="studio-fallback__note">The 3D room needs WebGL, but everything in it still opens from the buttons.</span>}
    </div>
  );
}
