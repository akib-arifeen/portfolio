"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { KeyboardEvent, ReactNode } from "react";
import { HOME, TRASH, displayPath, listDir, normalizePath, openAction, resolvePath } from "@/lib/os/fs";
import type { AppProps, FsNode } from "@/lib/os/types";
import { useOs } from "../OsContext";

const DEFAULT_PATH = `${HOME}/Projects`;

type Place = { label: string; path: string; icon: GlyphKind };
const FAVOURITES: Place[] = [
  { label: "Projects", path: `${HOME}/Projects`, icon: "folder" },
  { label: "Desktop", path: `${HOME}/Desktop`, icon: "desktop" },
  { label: "Documents", path: `${HOME}/Documents`, icon: "doc" },
  { label: "Downloads", path: `${HOME}/Downloads`, icon: "download" },
  { label: "Pictures", path: `${HOME}/Pictures`, icon: "image" },
  { label: "Music", path: `${HOME}/Music`, icon: "audio" },
  { label: "Applications", path: "/Applications", icon: "app" },
];
const LOCATIONS: Place[] = [
  { label: "Akib HD", path: "/", icon: "drive" },
  { label: "Trash", path: TRASH, icon: "trash" },
];

type GlyphKind = "folder" | "desktop" | "doc" | "download" | "image" | "audio" | "app" | "drive" | "trash" | "pdf" | "link" | "video";

function glyphFor(node: FsNode): GlyphKind {
  if (node.kind === "folder") return "folder";
  switch (node.type) {
    case "image": return "image";
    case "pdf": return "pdf";
    case "link": return "link";
    case "app": return "app";
    case "video": return "video";
    case "audio": return "audio";
    default: return "doc";
  }
}

function kindLabel(node: FsNode): string {
  if (node.kind === "folder") return "Folder";
  switch (node.type) {
    case "image": return "Image";
    case "pdf": return "PDF document";
    case "link": return "Web link";
    case "app": return "Application";
    case "video": return "Video";
    case "audio": return "Audio";
    default: return node.name.toLowerCase().endsWith(".md") ? "Markdown text" : "Text document";
  }
}

function Glyph({ kind, size = 20 }: { kind: GlyphKind; size?: number }) {
  const common = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true };
  let body: ReactNode;
  switch (kind) {
    case "folder":
      body = <path d="M3 7.5a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v7.5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />;
      break;
    case "desktop":
      body = <><rect x="3" y="4.5" width="18" height="12" rx="2" /><path d="M9 20h6M12 16.5V20" /></>;
      break;
    case "doc":
      body = <><path d="M6 3h8l4 4v14H6z" /><path d="M14 3v4h4M9 12h6M9 16h6" /></>;
      break;
    case "pdf":
      body = <><path d="M6 3h8l4 4v14H6z" /><path d="M14 3v4h4" /><path d="M8.5 16.5v-4h1.4a1.2 1.2 0 0 1 0 2.4H8.5M13 16.5v-4h1a2 2 0 0 1 0 4z" strokeWidth={1.2} /></>;
      break;
    case "download":
      body = <><path d="M12 4v11M7.5 11l4.5 4.5 4.5-4.5M5 19.5h14" /></>;
      break;
    case "image":
      body = <><rect x="3.5" y="4.5" width="17" height="15" rx="2" /><circle cx="9" cy="10" r="1.6" /><path d="M4 17l5-4.5 4 3.5 3-2.5 4 3.5" /></>;
      break;
    case "audio":
      body = <><path d="M9 18V6l10-2v12" /><circle cx="6.5" cy="18" r="2.5" /><circle cx="16.5" cy="16" r="2.5" /></>;
      break;
    case "video":
      body = <><rect x="3" y="5.5" width="13" height="13" rx="2" /><path d="M16 10l5-3v10l-5-3" /></>;
      break;
    case "app":
      body = <><rect x="4" y="4" width="16" height="16" rx="4" /><path d="M9 15l3-6 3 6M10 13.5h4" /></>;
      break;
    case "link":
      body = <><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1" /><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" /></>;
      break;
    case "drive":
      body = <><rect x="3" y="8" width="18" height="9" rx="2" /><path d="M7 12.5h.01M11 12.5h6" /></>;
      break;
    case "trash":
      body = <><path d="M4.5 7h15M9.5 7V4.5h5V7M6.5 7l1 13h9l1-13M10 11v6M14 11v6" /></>;
      break;
  }
  return <svg {...common}>{body}</svg>;
}

function Chevron({ dir }: { dir: "left" | "right" }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={dir === "left" ? "M15 5l-7 7 7 7" : "M9 5l7 7-7 7"} />
    </svg>
  );
}

/** Only files Preview can show get Quick Look; links, playlists and apps do nothing on Space. */
function isQuickLook(n: FsNode): boolean {
  return n.kind === "file" && (n.type === "image" || n.type === "pdf" || n.type === "video" || n.type === "audio" || n.type === "text");
}

function folderName(path: string): string {
  if (path === "/") return "Akib HD";
  if (path === HOME) return "akib";
  return path.slice(path.lastIndexOf("/") + 1);
}

/** The folder a path means: a folder is itself; a file is its parent (and gets selected). */
function settle(raw: string | undefined): { dir: string; select: string | null } {
  const p = normalizePath(raw && raw.length > 0 ? raw : DEFAULT_PATH);
  const node = resolvePath(p);
  if (node && node.kind === "file") return { dir: normalizePath("..", p), select: node.name };
  if (node && node.kind === "folder") return { dir: p, select: null };
  return { dir: DEFAULT_PATH, select: null };
}

type Hist = { stack: string[]; at: number };

export default function Files({ win }: AppProps) {
  const os = useOs();
  const first = useMemo(() => settle(win.arg?.path), []); // eslint-disable-line react-hooks/exhaustive-deps
  const [hist, setHist] = useState<Hist>({ stack: [first.dir], at: 0 });
  const [selected, setSelected] = useState<string | null>(first.select);
  const [view, setView] = useState<"icons" | "list">("icons");
  const [query, setQuery] = useState("");
  const listRef = useRef<HTMLDivElement>(null);
  const seenLaunch = useRef(win.launch);

  const dir = hist.stack[hist.at];

  const go = useCallback((path: string, select: string | null = null) => {
    setHist((h) => {
      if (h.stack[h.at] === path) return h;
      const stack = [...h.stack.slice(0, h.at + 1), path];
      return { stack, at: stack.length - 1 };
    });
    setSelected(select);
    setQuery("");
  }, []);

  // A new launch of this window (menu, search, dock) retargets the folder.
  useEffect(() => {
    if (seenLaunch.current === win.launch) return;
    seenLaunch.current = win.launch;
    const s = settle(win.arg?.path);
    go(s.dir, s.select);
  }, [win.launch, win.arg?.path, go]);

  useEffect(() => { os.setTitle(win.id, folderName(dir)); }, [os, win.id, dir]);

  const all = useMemo(() => listDir(dir) ?? [], [dir]);
  const q = query.trim().toLowerCase();
  const items = useMemo(() => (q ? all.filter((n) => n.name.toLowerCase().includes(q)) : all), [all, q]);

  const sel = selected && items.some((n) => n.name === selected) ? selected : null;
  const childPath = (n: FsNode) => normalizePath(n.name, dir);

  const openNode = (n: FsNode) => {
    const p = childPath(n);
    if (n.kind === "folder") go(p);
    else os.run(openAction(n, p));
  };

  const back = () => { setHist((h) => (h.at > 0 ? { ...h, at: h.at - 1 } : h)); setQuery(""); };
  const forward = () => { setHist((h) => (h.at < h.stack.length - 1 ? { ...h, at: h.at + 1 } : h)); setQuery(""); };

  const columns = () => {
    const els = listRef.current?.querySelectorAll<HTMLElement>("[data-fl-item]");
    if (!els || els.length < 2) return 1;
    const top = els[0].offsetTop;
    let n = 0;
    for (const el of els) { if (el.offsetTop === top) n++; else break; }
    return Math.max(1, n);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (items.length === 0) return;
    const idx = sel ? items.findIndex((n) => n.name === sel) : -1;
    const move = (to: number) => {
      const next = items[Math.min(items.length - 1, Math.max(0, to))];
      setSelected(next.name);
      requestAnimationFrame(() => listRef.current?.querySelector<HTMLElement>(`[data-fl-name="${CSS.escape(next.name)}"]`)?.scrollIntoView({ block: "nearest" }));
    };
    const step = view === "icons" ? columns() : 1;
    switch (e.key) {
      case "ArrowRight": if (view === "icons") { e.preventDefault(); move(idx + 1); } break;
      case "ArrowLeft": if (view === "icons") { e.preventDefault(); move(idx < 0 ? 0 : idx - 1); } break;
      case "ArrowDown": e.preventDefault(); move(idx < 0 ? 0 : idx + step); break;
      case "ArrowUp": e.preventDefault(); move(idx < 0 ? 0 : idx - step); break;
      case "Enter": if (idx >= 0) { e.preventDefault(); openNode(items[idx]); } break;
      case " ":
        if (idx >= 0 && isQuickLook(items[idx])) { e.preventDefault(); os.open("preview", { path: childPath(items[idx]) }); }
        break;
    }
  };

  const crumbs = useMemo(() => {
    const out: { label: string; path: string }[] = [{ label: "Akib HD", path: "/" }];
    let acc = "";
    for (const seg of dir.split("/").filter(Boolean)) {
      acc += `/${seg}`;
      out.push({ label: seg, path: acc });
    }
    return out;
  }, [dir]);

  const placeButton = (p: Place) => (
    <button key={p.path} type="button" className="fl-place" aria-current={dir === p.path ? "page" : undefined} onClick={() => go(p.path)}>
      <Glyph kind={p.icon} size={18} />
      <span>{p.label}</span>
    </button>
  );

  const known = [...FAVOURITES, ...LOCATIONS].some((p) => p.path === dir);

  return (
    <div className="fl" data-view={view}>
      <div className="fl-toolbar">
        <div className="fl-nav">
          <button type="button" className="fl-btn" aria-label="Back" disabled={hist.at === 0} onClick={back}><Chevron dir="left" /></button>
          <button type="button" className="fl-btn" aria-label="Forward" disabled={hist.at >= hist.stack.length - 1} onClick={forward}><Chevron dir="right" /></button>
        </div>
        <label className="fl-placepick">
          <span className="fl-sr">Go to folder</span>
          <select value={known ? dir : ""} onChange={(e) => e.target.value && go(e.target.value)}>
            {!known && <option value="">{folderName(dir)}</option>}
            <optgroup label="Favourites">{FAVOURITES.map((p) => <option key={p.path} value={p.path}>{p.label}</option>)}</optgroup>
            <optgroup label="Locations">{LOCATIONS.map((p) => <option key={p.path} value={p.path}>{p.label}</option>)}</optgroup>
          </select>
        </label>
        <h2 className="fl-title">{folderName(dir)}</h2>
        <div className="fl-views" role="group" aria-label="View">
          <button type="button" className="fl-btn" aria-label="Icon view" aria-pressed={view === "icons"} onClick={() => setView("icons")}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><rect x="4" y="4" width="7" height="7" rx="1.5" /><rect x="13" y="4" width="7" height="7" rx="1.5" /><rect x="4" y="13" width="7" height="7" rx="1.5" /><rect x="13" y="13" width="7" height="7" rx="1.5" /></svg>
          </button>
          <button type="button" className="fl-btn" aria-label="List view" aria-pressed={view === "list"} onClick={() => setView("list")}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
          </button>
        </div>
        <label className="fl-search">
          <span className="fl-sr">Search this folder</span>
          <input type="search" placeholder="Search" value={query} onChange={(e) => setQuery(e.target.value)} autoComplete="off" spellCheck={false} />
        </label>
      </div>

      <div className="fl-body">
        <nav className="fl-sidebar" aria-label="Places">
          <p className="fl-side-h">Favourites</p>
          {FAVOURITES.map(placeButton)}
          <p className="fl-side-h">Locations</p>
          {LOCATIONS.map(placeButton)}
        </nav>

        <div className="fl-main">
          {items.length === 0 ? (
            <p className="fl-empty">{q ? "No matches in this folder." : dir === TRASH ? "Trash is empty." : "This folder is empty."}</p>
          ) : (
            <div
              ref={listRef}
              className="fl-list"
              role="listbox"
              aria-label={folderName(dir)}
              aria-activedescendant={sel ? `fl-${win.id}-${items.findIndex((n) => n.name === sel)}` : undefined}
              tabIndex={0}
              onKeyDown={onKeyDown}
            >
              {view === "list" && (
                <div className="fl-head" aria-hidden="true">
                  <span /><span>Name</span><span>Date modified</span><span>Size</span><span>Kind</span>
                </div>
              )}
              {items.map((n, i) => {
                const isSel = n.name === sel;
                return (
                  <div
                    key={n.name}
                    id={`fl-${win.id}-${i}`}
                    role="option"
                    aria-selected={isSel}
                    data-fl-item=""
                    data-fl-name={n.name}
                    className="fl-item"
                    onClick={(e) => {
                      setSelected(n.name);
                      // Touch has no double click: a single tap opens on coarse pointers and in the phone shell.
                      if (e.currentTarget.closest(".os-phone") || window.matchMedia("(pointer: coarse)").matches) openNode(n);
                    }}
                    onDoubleClick={() => openNode(n)}
                  >
                    <span className="fl-icon">
                      {n.kind === "file" && n.type === "image" && n.src ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={n.src} alt="" loading="lazy" draggable={false} />
                      ) : (
                        <Glyph kind={glyphFor(n)} size={view === "icons" ? 44 : 18} />
                      )}
                    </span>
                    <span className="fl-name">{n.name}</span>
                    {view === "list" && (
                      <>
                        <span className="fl-cell">{n.modified ?? "--"}</span>
                        <span className="fl-cell">{n.kind === "file" ? (n.size ?? "--") : "--"}</span>
                        <span className="fl-cell">{kindLabel(n)}</span>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="fl-status">
        <nav className="fl-crumbs" aria-label="Path">
          {crumbs.map((c, i) => (
            <span key={c.path} className="fl-crumb">
              {i > 0 && <span className="fl-sep" aria-hidden="true">/</span>}
              <button type="button" aria-current={i === crumbs.length - 1 ? "page" : undefined} onClick={() => go(c.path)}>{c.label}</button>
            </span>
          ))}
          <span className="fl-sr">{displayPath(dir)}</span>
        </nav>
        <span className="fl-count">{items.length} {items.length === 1 ? "item" : "items"}</span>
      </div>
    </div>
  );
}
