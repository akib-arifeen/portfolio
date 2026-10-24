"use client";

import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { playItems } from "@/lib/os/playground";
import { sites } from "@/lib/os/sites";
import type { AppProps, Site } from "@/lib/os/types";
import { useOs } from "../OsContext";

/** One history entry: the start page (url null), a bookmarked page, or a URL that is not in my bookmarks. */
type Entry = { url: string | null };

function parseUrl(text: string): URL | null {
  const t = text.trim();
  if (!t) return null;
  try {
    const u = new URL(/^[a-z][a-z0-9+.-]*:\/\//i.test(t) ? t : `https://${t}`);
    return u.protocol === "http:" || u.protocol === "https:" ? u : null;
  } catch {
    return null;
  }
}

function siteFor(url: string | null): Site | null {
  if (!url) return null;
  const u = parseUrl(url);
  if (!u) return null;
  return sites.find((s) => new URL(s.url).origin === u.origin) ?? null;
}

const fold = (t: string) => t.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

/** A bare word with no dot, slash or scheme searches my bookmarks by title or id (accent-folded). */
function bookmarkFor(text: string): Site | null {
  const q = fold(text);
  if (!q || /[./:]/.test(q)) return null;
  return sites.find((s) => fold(s.id).includes(q) || fold(s.title).includes(q)) ?? null;
}

/** iframe `allow` for a bookmark, taken from the matching Playground entry. */
function allowFor(site: Site): string | undefined {
  return playItems.find((p) => p.url && new URL(p.url).origin === new URL(site.url).origin)?.allow;
}

function initials(title: string): string {
  const words = title.split(/\s+/).filter(Boolean);
  return (words.length > 1 ? words[0][0] + words[1][0] : title.slice(0, 2)).toUpperCase();
}

const TINTS = ["--color-icon-amber", "--color-icon-sage", "--color-icon-blue", "--color-icon-plum"];

function tileStyle(i: number) {
  const a = TINTS[i % TINTS.length];
  const b = TINTS[(i + 1) % TINTS.length];
  return { background: `linear-gradient(135deg, var(${a}), color-mix(in oklch, var(${b}) 60%, var(--color-accent)))` };
}

function openNewTab(url: string) {
  window.open(url, "_blank", "noopener,noreferrer");
}

const SLOW_MS = 8000;

export default function Browser({ win }: AppProps) {
  const os = useOs();
  const [stack, setStack] = useState<Entry[]>([{ url: win.arg?.url ?? null }]);
  const [at, setAt] = useState(0);
  const [reload, setReload] = useState(0);
  const [draft, setDraft] = useState(win.arg?.url ?? "");
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const [slowKey, setSlowKey] = useState<string | null>(null);
  const seenLaunch = useRef(win.launch);

  const entry = stack[at];
  const site = siteFor(entry.url);
  const frameKey = `${at}:${reload}:${entry.url ?? ""}`;
  const showFrame = !!(site && site.embeddable);

  const visit = (url: string | null) => {
    setStack((s) => [...s.slice(0, at + 1), { url }]);
    setAt((i) => i + 1);
    setDraft(url ?? "");
  };

  // Retarget on a new launch of this window.
  useEffect(() => {
    if (seenLaunch.current === win.launch) return;
    seenLaunch.current = win.launch;
    visit(win.arg?.url ?? null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [win.launch, win.arg?.url]);

  useEffect(() => { os.setTitle(win.id, site ? site.title : entry.url ? "Page not bookmarked" : "Start Page"); }, [os, win.id, site, entry.url]);

  useEffect(() => {
    if (!showFrame) return;
    const t = window.setTimeout(() => setSlowKey(frameKey), SLOW_MS);
    return () => window.clearTimeout(t);
  }, [showFrame, frameKey]);

  const go = (d: number) => {
    const n = at + d;
    if (n < 0 || n >= stack.length) return;
    setAt(n);
    setDraft(stack[n].url ?? "");
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const u = parseUrl(draft);
    if (!draft.trim()) { visit(null); return; }
    const hit = bookmarkFor(draft);
    if (hit) { visit(hit.url); return; }
    if (!u) { visit(draft.trim()); return; }
    const s = siteFor(u.href);
    visit(s && u.pathname === "/" && !u.search && !u.hash ? s.url : u.href);
  };

  const loaded = loadedKey === frameKey;
  const slow = slowKey === frameKey && !loaded;

  let content;
  if (!entry.url) {
    content = (
      <div className="br-start">
        <h2 className="br-h">Favourites</h2>
        <ul className="br-grid">
          {sites.map((s, i) => (
            <li key={s.id}>
              <button type="button" className="br-tile" onClick={() => visit(s.url)}>
                <span className="br-mark" style={tileStyle(i)} aria-hidden="true">{initials(s.title)}</span>
                <span className="br-ttl">{s.title}</span>
                <span className="br-blurb">{s.blurb}</span>
              </button>
            </li>
          ))}
          <li>
            <button type="button" className="br-tile" onClick={() => os.run({ type: "href", href: "/blog" })}>
              <span className="br-mark" style={tileStyle(sites.length)} aria-hidden="true">CS</span>
              <span className="br-ttl">Case studies</span>
              <span className="br-blurb">How each project was built, with the real code.</span>
            </button>
          </li>
        </ul>
        <p className="br-note">Nothing you do here is tracked.</p>
      </div>
    );
  } else if (!site) {
    content = (
      <div className="br-card">
        <h2>That page isn&apos;t in my bookmarks.</h2>
        <p className="br-url">{entry.url}</p>
        <button type="button" className="br-btn" onClick={() => { const u = parseUrl(entry.url!); if (u) openNewTab(u.href); }} disabled={!parseUrl(entry.url)}>Open it in a new tab</button>
      </div>
    );
  } else if (!site.embeddable) {
    content = (
      <div className="br-card">
        <h2>{site.title}</h2>
        <p>{site.blurb}</p>
        <p className="br-url">This site does not allow itself to be shown inside another page.</p>
        <button type="button" className="br-btn" onClick={() => openNewTab(entry.url!)}>Open in new tab</button>
      </div>
    );
  } else {
    content = (
      <div className="br-pane">
        {!loaded && <div className="br-progress" role="progressbar" aria-label="Loading" />}
        <iframe
          key={frameKey}
          className="br-frame"
          src={entry.url}
          title={site.title}
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
          referrerPolicy="strict-origin-when-cross-origin"
          allow={allowFor(site)}
          loading="lazy"
          onLoad={() => setLoadedKey(frameKey)}
        />
        {slow && (
          <button type="button" className="br-slow" onClick={() => openNewTab(entry.url!)}>Taking a while? Open in new tab</button>
        )}
      </div>
    );
  }

  const arrow = (d: "l" | "r") => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={d === "l" ? "M15 5l-7 7 7 7" : "M9 5l7 7-7 7"} />
    </svg>
  );

  return (
    <div className="br">
      <form className="br-toolbar" onSubmit={submit}>
        <button type="button" className="br-icon" aria-label="Back" disabled={at === 0} onClick={() => go(-1)}>{arrow("l")}</button>
        <button type="button" className="br-icon" aria-label="Forward" disabled={at >= stack.length - 1} onClick={() => go(1)}>{arrow("r")}</button>
        <button type="button" className="br-icon" aria-label="Reload" disabled={!showFrame} onClick={() => setReload((r) => r + 1)}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 12a8 8 0 1 1-2.6-5.9M20 4v5h-5" /></svg>
        </button>
        <label className="br-address">
          <span className="br-sr">Address</span>
          <input type="text" value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Search my bookmarks or type an address" autoComplete="off" autoCapitalize="off" spellCheck={false} />
        </label>
        <button type="button" className="br-icon" aria-label="Open in new tab" disabled={!parseUrl(entry.url ?? "")} onClick={() => { const u = parseUrl(entry.url ?? ""); if (u) openNewTab(u.href); }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" /></svg>
        </button>
      </form>
      <div className="br-content">{content}</div>
    </div>
  );
}
