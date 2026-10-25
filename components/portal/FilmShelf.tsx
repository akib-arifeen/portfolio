"use client";

import { useState } from "react";
import { films, formatSeconds, type Film } from "@/lib/media";

function FilmCard({ film }: { film: Film }) {
  const [live, setLive] = useState(false);
  const slotId = `portal-film-${film.slug}`;
  const captionId = `${slotId}-caption`;

  return (
    <article className="film-card">
      <div className="film-card__media" id={slotId}>
        {live ? (
          <iframe
            src={film.film}
            title={`${film.title}: the film, running live`}
            sandbox="allow-scripts"
            loading="lazy"
          />
        ) : (
          <video
            controls
            playsInline
            preload="none"
            poster={film.poster}
            width={film.w}
            height={film.h}
            aria-label={`${film.title} (${formatSeconds(film.seconds)})`}
            aria-describedby={captionId}
          >
            <source src={film.src} type="video/mp4" />
            This browser cannot play the film. <a href={film.src}>Download it instead</a>.
          </video>
        )}
      </div>
      <div className="film-card__body">
        <p className="portal-kicker">Drawn film · {formatSeconds(film.seconds)}</p>
        <h3>{film.title}</h3>
        <p id={captionId}>{film.line}</p>
        <div className="film-card__actions">
          <button type="button" className="portal-text-button" onClick={() => setLive((on) => !on)} aria-expanded={live} aria-controls={slotId}>
            {live ? "Show the video" : "Run the original"}
          </button>
          <a href={film.film} target="_blank" rel="noreferrer">Source & making-of</a>
          <a href={film.src} download>Download MP4</a>
        </div>
      </div>
    </article>
  );
}

export default function FilmShelf() {
  return (
    <div className="film-grid">
      {films.map((film) => <FilmCard key={film.slug} film={film} />)}
    </div>
  );
}
