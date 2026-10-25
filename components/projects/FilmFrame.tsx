"use client";

import { useState } from "react";
import { formatSeconds, type Film } from "@/lib/media";

/**
 * A drawing film. The MP4 is the default so the piece can be watched without running anything.
 * "Try it live" swaps in the film itself, in a frame sandboxed to scripts only: it runs its own
 * code in its own realm, and never gets this page's origin, storage or dialogs.
 */
export function FilmFrame({ film }: { film: Film }) {
  const [live, setLive] = useState(false);
  const slotId = `film-${film.slug}`;

  return (
    <figure className="gpiece gpiece--film">
      <div className="gpiece__slot" id={slotId}>
        {live ? (
          <iframe
            className="gpiece__frame"
            src={film.film}
            title={`${film.title}: the film, running live`}
            sandbox="allow-scripts"
            loading="lazy"
          />
        ) : (
          <video
            className="gpiece__video"
            controls
            playsInline
            preload="none"
            poster={film.poster}
            width={film.w}
            height={film.h}
            aria-label={`${film.title} (${formatSeconds(film.seconds)})`}
          >
            <source src={film.src} type="video/mp4" />
            This browser cannot play the film. <a href={film.src}>Download it instead</a>.
          </video>
        )}
      </div>
      <figcaption className="gpiece__cap">
        <p className="gpiece__title">{film.title}</p>
        <p className="gpiece__line">{film.line}</p>
        <p className="gpiece__meta">{film.w} × {film.h} · {formatSeconds(film.seconds)}</p>
      </figcaption>
      <a className="gpiece__alt" href={film.src} download>
        Trouble playing it? Download the film (MP4)
      </a>
      <button
        type="button"
        className="gpiece__toggle"
        aria-expanded={live}
        aria-controls={slotId}
        onClick={() => setLive((on) => !on)}
      >
        {live ? "Show the video" : "Try it live"}
      </button>
    </figure>
  );
}
