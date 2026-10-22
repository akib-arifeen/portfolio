"use client";

import { useEffect, useState } from "react";
import { playlists } from "@/lib/desk";
import type { AppProps } from "@/lib/os/types";

/** Cover art from tokens only: two tinted stops and an angle that vary with the index. */
function art(i: number): React.CSSProperties {
  const tints = ["--color-accent", "--color-icon-amber", "--color-icon-sage", "--color-icon-blue", "--color-icon-plum"];
  const a = tints[i % tints.length];
  const b = tints[(i * 2 + 1) % tints.length];
  return {
    background: `radial-gradient(circle at ${20 + ((i * 23) % 60)}% ${15 + ((i * 37) % 60)}%, color-mix(in oklab, var(${a}) 85%, var(--color-paper)), transparent 62%), linear-gradient(${(i * 47) % 360}deg, var(${a}), color-mix(in oklab, var(${b}) 70%, var(--color-ink)))`,
  };
}

export default function Music({ win }: AppProps) {
  const wanted = win.arg?.playlist;
  const [playing, setPlaying] = useState<number | null>(typeof wanted === "number" && playlists[wanted] ? wanted : null);
  const [tab, setTab] = useState<"listen" | "playlists">("listen");

  useEffect(() => {
    if (typeof wanted === "number" && playlists[wanted]) setPlaying(wanted);
  }, [wanted, win.launch]);

  const current = playing === null ? null : playlists[playing];

  return (
    <div className="ac ac-music">
      <nav className="ac-side" aria-label="Music">
        <p className="ac-side-h">Library</p>
        <button type="button" className="ac-side-item" aria-current={tab === "listen" ? "true" : undefined} onClick={() => setTab("listen")}>Listen now</button>
        <button type="button" className="ac-side-item" aria-current={tab === "playlists" ? "true" : undefined} onClick={() => setTab("playlists")}>
          Playlists <span>{playlists.length}</span>
        </button>
      </nav>
      <div className="ac-music-main">
        <header className="ac-music-head">
          <h2>{tab === "listen" ? "Listen now" : "Playlists"}</h2>
          <p>What&rsquo;s on repeat while I build. Picking one loads Spotify&rsquo;s player.</p>
        </header>
        <section className="ac-now" aria-label="Now playing">
          {current ? (
            <>
              <p className="ac-now-h">Now playing: {current.name}</p>
              <iframe
                key={current.embed}
                title={`Spotify player: ${current.name}`}
                src={current.embed}
                width="100%"
                height="152"
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                loading="lazy"
              />
            </>
          ) : (
            <p className="ac-now-empty">Nothing playing. Pick a card below.</p>
          )}
        </section>
        <ul className="ac-cards">
          {(tab === "listen" ? playlists.slice(0, 4) : playlists).map((p) => {
            const i = playlists.indexOf(p);
            return (
              <li key={p.embed}>
                <button type="button" className="ac-card" aria-pressed={playing === i} onClick={() => setPlaying(i)}>
                  <span className="ac-card-art" style={art(i)} aria-hidden="true" />
                  <span className="ac-card-name">{p.name}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
