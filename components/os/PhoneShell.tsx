"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { appDef, apps } from "@/lib/os/apps";
import { buildIndex, searchItems } from "@/lib/os/search";
import type { AppId, LaunchArg, MenuAction, Notice, OsApi, PhoneShellProps, SearchItem } from "@/lib/os/types";
import { studioSound } from "@/lib/sound";
import AppIcon from "./AppIcon";
import { OsContext } from "./OsContext";
import { appComponents } from "./registry";
import "./phone.css";
import "./apps/apps-tools.css";
import "./apps/apps-files.css";
import "./apps/apps-content.css";

const DOCK_APPS: AppId[] = ["browser", "mail", "notes", "music"];
const HOME_APPS = apps.filter((a) => a.id !== "about" && !DOCK_APPS.includes(a.id));
const BANNER_MS = 4000;

type Current = { app: AppId; arg?: LaunchArg; launch: number };
type Banner = Notice & { id: number };

/** What a search result is, in words. */
function caption(r: SearchItem): string | undefined {
  if (r.kind === "command") return "Terminal command";
  if (r.kind === "project") {
    if (r.action.type === "href") return "Case study";
    if (r.action.type === "open" && r.action.app === "playground") return "Play it";
    return "Project files";
  }
  return r.subtitle;
}

function clock(d: Date): string {
  return d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

/** The iOS-like phone shell for narrow screens: a home grid, one app at a time, full screen. */
export default function PhoneShell({ onExit }: PhoneShellProps) {
  const router = useRouter();
  const [current, setCurrent] = useState<Current | null>(null);
  const [query, setQuery] = useState("");
  const [banner, setBanner] = useState<Banner | null>(null);
  const [soundOn, setSoundOn] = useState(studioSound.enabled);
  const [now, setNow] = useState(() => new Date());
  // follows the hour like the desktop: dark from 18:00 to 07:00
  const appearance = now.getHours() >= 7 && now.getHours() < 18 ? "light" : "dark";
  const searchRef = useRef<HTMLInputElement>(null);
  const bannerSeq = useRef(0);
  const currentRef = useRef(current);
  currentRef.current = current;

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!banner) return;
    const t = setTimeout(() => setBanner((b) => (b?.id === banner.id ? null : b)), banner.ttlMs ?? BANNER_MS);
    return () => clearTimeout(t);
  }, [banner]);

  const open = useCallback((app: AppId, arg?: LaunchArg) => {
    studioSound.blip("open");
    setQuery("");
    setCurrent((c) => ({ app, arg, launch: c && c.app === app ? c.launch + 1 : 1 }));
  }, []);

  const home = useCallback(() => setCurrent(null), []);

  const focusSearch = useCallback(() => {
    setCurrent(null);
    setTimeout(() => searchRef.current?.focus(), 60);
  }, []);

  const notify = useCallback((n: Notice) => {
    setBanner({ ...n, ttlMs: BANNER_MS, id: ++bannerSeq.current });
  }, []);

  const run = useCallback((a: MenuAction) => {
    switch (a.type) {
      case "open": return open(a.app, a.arg);
      case "href":
        if (a.newTab || /^https?:\/\//.test(a.href)) window.open(a.href, "_blank", "noopener,noreferrer");
        else router.push(a.href);
        return;
      case "close-window":
      case "minimize":
      case "zoom":
      case "quit-app": return home();
      case "search": return focusSearch();
      case "lock": return;
      case "exit": return onExit();
    }
  }, [open, home, focusSearch, onExit, router]);

  // Esc: app -> home -> exit
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (e.target === searchRef.current) {
        // Esc in the search box clears it and leaves the box; it does not close the laptop
        setQuery("");
        searchRef.current?.blur();
        return;
      }
      if (currentRef.current) setCurrent(null);
      else onExit();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onExit]);

  const toggleSound = useCallback(async () => {
    const next = !studioSound.enabled;
    await studioSound.setEnabled(next);
    setSoundOn(next);
    if (next) studioSound.blip("click");
  }, []);

  const api: OsApi = useMemo(() => ({
    wide: false,
    open,
    close: () => home(),
    setTitle: () => {},
    notify,
    run,
    openSearch: focusSearch,
    exit: onExit,
    sound: { on: soundOn, toggle: () => void toggleSound(), blip: (kind) => void studioSound.blip(kind) },
  }), [open, home, notify, run, focusSearch, onExit, soundOn, toggleSound]);

  const hasQuery = query.trim().length > 0;
  const results = useMemo(() => (hasQuery ? searchItems(query, buildIndex(), 8) : []), [hasQuery, query]);

  const App = current ? appComponents[current.app] : null;

  return (
    <OsContext.Provider value={api}>
      {/* "os" brings in the dark token block (.os[data-appearance="dark"], tokens.css); its layout rules match .os-phone's own */}
      <div className="os-phone os" data-appearance={appearance}>
        <header className="os-phone-status">
          <span className="os-phone-time">{clock(now)}</span>
          <span className="os-phone-sys" aria-hidden="true">
            <svg width="18" height="12" viewBox="0 0 18 12"><rect x="0" y="8" width="3" height="4" rx="1" fill="currentColor" /><rect x="5" y="5" width="3" height="7" rx="1" fill="currentColor" /><rect x="10" y="2" width="3" height="10" rx="1" fill="currentColor" /><rect x="15" y="0" width="3" height="12" rx="1" fill="currentColor" opacity="0.35" /></svg>
            <svg width="16" height="12" viewBox="0 0 16 12"><path d="M1 4.2a10 10 0 0 1 14 0M3.6 7a6.2 6.2 0 0 1 8.8 0M6.2 9.8a2.5 2.5 0 0 1 3.6 0" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
            <svg width="26" height="12" viewBox="0 0 26 12"><rect x="0.5" y="0.5" width="21" height="11" rx="3" fill="none" stroke="currentColor" opacity="0.5" /><rect x="2" y="2" width="15" height="8" rx="2" fill="currentColor" /><rect x="23" y="4" width="2" height="4" rx="1" fill="currentColor" opacity="0.5" /></svg>
          </span>
          <button type="button" className="os-phone-close" onClick={onExit}>Close</button>
        </header>

        {banner && (
          <div className="os-phone-banner-wrap" role="status" aria-live="polite">
            <button
              type="button"
              className="os-phone-banner"
              onClick={() => { const a = banner.action; setBanner(null); if (a) run(a); }}
            >
              {banner.app && <span className="os-phone-banner-icon"><AppIcon id={banner.app} size={32} /></span>}
              <span className="os-phone-banner-text">
                <strong>{banner.title}</strong>
                <span>{banner.body}</span>
              </span>
            </button>
          </div>
        )}

        {!current && (
          <main className="os-phone-home">
            <div className="os-phone-search">
              <input
                ref={searchRef}
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key !== "Enter" || !results[0]) return;
                  e.preventDefault();
                  setQuery("");
                  run(results[0].action);
                }}
                placeholder="Search projects, notes, photos"
                aria-label="Search"
                enterKeyHint="search"
                autoComplete="off"
              />
            </div>
            {hasQuery ? (
              <ul className="os-phone-results" aria-label="Search results">
                {results.length === 0 && <li className="os-phone-empty">Nothing found for &ldquo;{query.trim()}&rdquo;.</li>}
                {results.map((r) => (
                  <li key={r.id}>
                    <button type="button" onClick={() => { setQuery(""); run(r.action); }}>
                      <span className="os-phone-result-title">{r.title}</span>
                      {caption(r) && <span className="os-phone-result-sub">{caption(r)}</span>}
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <>
                <ul className="os-phone-grid">
                  {HOME_APPS.map((a) => (
                    <li key={a.id}>
                      <button type="button" className="os-phone-app" onClick={() => open(a.id)}>
                        <AppIcon id={a.id} size={60} />
                        <span>{a.name}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </>
            )}
            <nav className="os-phone-dock" aria-label="Dock">
              {DOCK_APPS.map((id) => (
                <button key={id} type="button" className="os-phone-app os-phone-app--dock" onClick={() => open(id)} aria-label={appDef(id).name}>
                  <AppIcon id={id} size={60} />
                </button>
              ))}
            </nav>
          </main>
        )}

        {current && App && (
          <section className="os-phone-view" aria-label={appDef(current.app).name}>
            <div className="os-phone-nav">
              <button type="button" className="os-phone-back" onClick={home}><span aria-hidden="true">&lsaquo;</span> Home</button>
              <h1>{appDef(current.app).name}</h1>
            </div>
            <div className="os-phone-frame">
              <App key={current.app} win={{ id: `phone-${current.app}`, arg: current.arg, launch: current.launch, focused: true }} />
            </div>
            <button type="button" className="os-phone-indicator" aria-label="Go home" onClick={home}><i /></button>
          </section>
        )}
      </div>
    </OsContext.Provider>
  );
}
