"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  src: string;
  poster: string;
  width: number;
  height: number;
  className: string;
  /** The visible caption, so the clip and its control are not just "video" and "Pause". */
  captionId?: string;
};

/**
 * A looping clip that starts itself only when the visitor has not asked for reduced motion.
 * It is muted and inline, and the pause/play button stays outside the video element so it is
 * reachable by keyboard, touch and screen readers at every size.
 */
export function LoopVideo({ src, poster, width, height, className, captionId }: Props) {
  const ref = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    // Reduced motion starts on the poster and never plays until the visitor asks it to.
    if (!motion.matches) el.play().catch(() => {});
    const onChange = () => { if (motion.matches) el.pause(); };
    motion.addEventListener("change", onChange);
    return () => motion.removeEventListener("change", onChange);
  }, []);

  const toggle = () => {
    const el = ref.current;
    if (!el) return;
    if (el.paused) el.play().catch(() => {});
    else el.pause();
  };

  return (
    <span className="media__loop">
      <video
        ref={ref}
        className={className}
        src={src}
        poster={poster}
        width={width}
        height={height}
        muted
        playsInline
        loop
        preload="metadata"
        aria-label="Looping clip"
        aria-describedby={captionId}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
      />
      <button
        type="button"
        className="media__toggle"
        onClick={toggle}
        aria-label={playing ? "Pause the looping clip" : "Play the looping clip"}
        aria-describedby={captionId}
      >
        {playing ? "Pause" : "Play"}
      </button>
    </span>
  );
}
