"use client";

import type { StudioProps } from "./Studio";

/**
 * The room without WebGL: a still of the studio. Everything actionable lives in Hero — the object
 * buttons, the detail panel, the laptop and the booth dialog — so the page still works without 3D.
 */
export default function StudioFallback({ selected }: StudioProps) {
  return (
    <div className="studio-fallback">
      <picture>
        <source type="image/avif" srcSet="/studio/room-poster-390.avif 390w, /studio/room-poster.avif 820w" sizes="(max-width: 600px) 100vw, 50vw" />
        <source type="image/webp" srcSet="/studio/room-poster-390.webp 390w, /studio/room-poster.webp 820w" sizes="(max-width: 600px) 100vw, 50vw" />
        {/* eslint-disable-next-line @next/next/no-img-element -- a static still: nothing for next/image to optimise */}
        <img
          className="studio-fallback__room"
          src="/studio/room-poster.jpg"
          srcSet="/studio/room-poster-390.jpg 390w, /studio/room-poster.jpg 820w"
          sizes="(max-width: 600px) 100vw, 50vw"
          width={820}
          height={456}
          loading="eager"
          fetchPriority="high"
          alt="A still of my studio: Akib sits at a walnut desk working on his laptop, with a project monitor, a warm lamp, shelves and the edge of the photo booth."
        />
      </picture>
      {selected && <span className="studio-fallback__note">The 3D room needs WebGL, but everything in it still opens from the buttons.</span>}
    </div>
  );
}
