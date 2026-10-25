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
        <source media="(max-width: 59.99rem)" type="image/avif" srcSet="/studio/room-poster-390.avif" />
        <source media="(max-width: 59.99rem)" type="image/webp" srcSet="/studio/room-poster-390.webp" />
        <source type="image/avif" srcSet="/studio/room-poster.avif" />
        <source type="image/webp" srcSet="/studio/room-poster.webp" />
        {/* eslint-disable-next-line @next/next/no-img-element -- a static still: nothing for next/image to optimise */}
        <img
          className="studio-fallback__room"
          src="/studio/room-poster.jpg"
          srcSet="/studio/room-poster-390.jpg 390w, /studio/room-poster.jpg 1024w"
          sizes="(max-width: 59.99rem) 100vw, 71vw"
          width={1024}
          height={900}
          loading="eager"
          fetchPriority="high"
          alt="A still of my studio in the evening: a game character with dark hair and rectangular glasses using a laptop at a walnut desk, with a warm lamp and shelves."
        />
      </picture>
      {selected && <span className="studio-fallback__note">The 3D room needs WebGL, but everything in it still opens from the buttons.</span>}
    </div>
  );
}
