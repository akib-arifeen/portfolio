"use client";

import { useEffect, useRef, useState } from "react";
import { playItems } from "@/lib/os/playground";
import { getWork } from "@/lib/work";
import type { AppProps, PlayItem } from "@/lib/os/types";
import { useOs } from "../OsContext";

const STATUS: Record<PlayItem["status"], string> = {
  playable: "Playable",
  beta: "Beta",
  rebuilding: "Rebuilding",
  retired: "Retired",
};

const TINTS = ["--color-icon-amber", "--color-icon-sage", "--color-icon-blue", "--color-icon-plum"];

function openNewTab(url: string) {
  window.open(url, "_blank", "noopener,noreferrer");
}

export default function Playground({ win }: AppProps) {
  const os = useOs();
  const [slug, setSlug] = useState<string | null>(win.arg?.game ?? null);
  const seenLaunch = useRef(win.launch);

  useEffect(() => {
    if (seenLaunch.current === win.launch) return;
    seenLaunch.current = win.launch;
    setSlug(win.arg?.game ?? null);
  }, [win.launch, win.arg?.game]);

  const item = slug ? playItems.find((p) => p.slug === slug) ?? null : null;

  useEffect(() => { os.setTitle(win.id, item ? item.name : "Playground"); }, [os, win.id, item]);

  if (!item) {
    return (
      <div className="pg">
        <ul className="pg-grid">
          {playItems.map((p, i) => (
            <li key={p.slug}>
              <button
                type="button"
                className="pg-tile"
                style={{ background: `linear-gradient(160deg, color-mix(in oklch, var(${TINTS[i % TINTS.length]}) 38%, var(--os-window)), var(--os-window))` }}
                onClick={() => setSlug(p.slug)}
              >
                <span className="pg-badge" data-status={p.status}>{STATUS[p.status]}</span>
                <span className="pg-name">{p.name}</span>
                <span className="pg-blurb">{p.blurb}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  const canRun = !!item.url && item.embeddable;

  return (
    <div className="pg pg-player">
      <div className="pg-bar">
        <button type="button" className="pg-btn" onClick={() => setSlug(null)}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg>
          <span>All</span>
        </button>
        <h2 className="pg-title">{item.name}</h2>
        <span className="pg-badge" data-status={item.status}>{STATUS[item.status]}</span>
        {item.url && <button type="button" className="pg-btn" onClick={() => openNewTab(item.url!)}>Open in new tab</button>}
        {item.workSlug && getWork(item.workSlug) && <button type="button" className="pg-btn" onClick={() => os.run({ type: "href", href: `/work/${item.workSlug}` })}>Case study</button>}
      </div>
      <div className="pg-stage">
        {canRun ? (
          <iframe
            key={item.slug}
            className="pg-frame"
            src={item.url}
            title={item.name}
            allow={item.allow}
            allowFullScreen
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
            referrerPolicy="strict-origin-when-cross-origin"
          />
        ) : (
          <div className="pg-card">
            <h3>{item.url ? item.name : item.status === "retired" ? "Retired" : "Coming soon"}</h3>
            <p>{item.blurb}</p>
            {item.url && <button type="button" className="pg-btn pg-primary" onClick={() => openNewTab(item.url!)}>Open in new tab</button>}
          </div>
        )}
      </div>
    </div>
  );
}
