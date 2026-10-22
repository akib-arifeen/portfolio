"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { appDef } from "@/lib/os/apps";
import { TRASH, openAction, resolvePath } from "@/lib/os/fs";
import type { AppId, Appearance, LaunchArg, MenuAction, Notice, OsApi } from "@/lib/os/types";
import { initialWm, topWindow, wmReducer } from "@/lib/os/wm";
import { studioSound } from "@/lib/sound";
import ControlCentre from "./ControlCentre";
import DesktopIcons from "./DesktopIcons";
import Dock from "./Dock";
import LockScreen from "./LockScreen";
import MenuBar from "./MenuBar";
import Notifications from "./Notifications";
import { OsContext } from "./OsContext";
import { appComponents } from "./registry";
import Search from "./Search";
import Wallpaper from "./Wallpaper";
import Window from "./Window";
import "./os-chrome.css";
import "./os-overlays.css";
import "./apps/apps-tools.css";
import "./apps/apps-files.css";
import "./apps/apps-content.css";

const UNLOCKED_KEY = "akibos-unlocked";

/** True when keystrokes belong to a text field: Esc and the Alt shortcuts must leave what is being typed alone. */
function isTyping(t: EventTarget | null) {
  if (!(t instanceof HTMLElement)) return false;
  if (t.isContentEditable || t.tagName === "TEXTAREA" || t.tagName === "SELECT") return true;
  return t.tagName === "INPUT" && !["range", "checkbox", "radio", "button", "submit"].includes((t as HTMLInputElement).type);
}

function readUnlocked() {
  try { return sessionStorage.getItem(UNLOCKED_KEY) === "1"; } catch { return false; }
}

/** The desktop: menu bar, wallpaper, windows, dock and the overlays. Owns window state; apps reach it via useOs(). */
export default function OsShell({ onExit }: { onExit(): void }) {
  const router = useRouter();
  const [wm, dispatch] = useReducer(wmReducer, initialWm);
  const [viewport, setViewport] = useState(() => ({ w: window.innerWidth, h: window.innerHeight }));
  const [locked, setLocked] = useState(() => !readUnlocked());
  const [searchOpen, setSearchOpen] = useState(false);
  const [ccOpen, setCcOpen] = useState(false);
  const [appearance, setAppearance] = useState<Appearance>(() => {
    const h = new Date().getHours();
    return h >= 7 && h < 18 ? "light" : "dark";
  });
  const [brightness, setBrightness] = useState(1);
  const [soundOn, setSoundOn] = useState(studioSound.enabled);
  const [notices, setNotices] = useState<(Notice & { id: string })[]>([]);
  const noticeSeq = useRef(0);
  const viewportRef = useRef(viewport);
  viewportRef.current = viewport;
  const wmRef = useRef(wm);
  wmRef.current = wm;

  useEffect(() => {
    const onResize = () => {
      const v = { w: window.innerWidth, h: window.innerHeight };
      setViewport(v);
      dispatch({ type: "fit", viewport: v });
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const open = useCallback((app: AppId, arg?: LaunchArg) => {
    studioSound.blip("open");
    dispatch({ type: "open", app, arg, viewport: viewportRef.current });
  }, []);

  const notify = useCallback((n: Notice) => {
    const id = `n${++noticeSeq.current}`;
    setNotices((ns) => [...ns.slice(-2), { ...n, id }]);
  }, []);

  const toggleSound = useCallback(async () => {
    const next = !studioSound.enabled;
    await studioSound.setEnabled(next);
    setSoundOn(next);
    if (next) studioSound.blip("click");
  }, []);

  const run = useCallback((a: MenuAction) => {
    const top = topWindow(wmRef.current);
    switch (a.type) {
      case "open": return open(a.app, a.arg);
      case "href":
        if (a.newTab || /^https?:\/\//.test(a.href)) window.open(a.href, "_blank", "noopener,noreferrer");
        else router.push(a.href);
        return;
      case "close-window": if (top) dispatch({ type: "close", id: top.id }); return;
      case "minimize": if (top) dispatch({ type: "minimize", id: top.id }); return;
      case "zoom": if (top) dispatch({ type: "toggleMaximize", id: top.id }); return;
      case "quit-app": if (top) dispatch({ type: "quitApp", app: top.app }); return;
      case "search": setSearchOpen(true); return;
      case "lock": setLocked(true); return;
      case "exit": onExit(); return;
    }
  }, [open, onExit, router]);

  const unlock = useCallback(() => {
    try { sessionStorage.setItem(UNLOCKED_KEY, "1"); } catch { /* private mode: the lock screen just shows again next time */ }
    setLocked(false);
  }, []);

  // first unlock of the session: open the notes and point at Search
  const greeted = useRef(false);
  useEffect(() => {
    if (locked || greeted.current) return;
    greeted.current = true;
    if (!wmRef.current.wins.length) open("notes");
    const t = setTimeout(() => notify({
      app: "about",
      title: "Welcome to Akib’s laptop",
      body: "Press ⌘K to search anything: projects, notes, photos, commands.",
      action: { type: "search" },
    }), 900);
    return () => clearTimeout(t);
  }, [locked, open, notify]);

  // keyboard: ⌘K search · ⌥W close · ⌥M minimize · ⌥Q quit · Esc peels back one layer at a time
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (locked) {
        // the lock screen is a way out too
        if (e.key === "Escape" && !e.repeat) onExit();
        return;
      }
      const k = e.key.toLowerCase();
      if ((e.metaKey || e.ctrlKey) && k === "k") { e.preventDefault(); setSearchOpen((o) => !o); return; }
      if (e.altKey && !e.metaKey && !e.ctrlKey) {
        if (isTyping(e.target)) return;
        const map: Record<string, MenuAction> = { w: { type: "close-window" }, m: { type: "minimize" }, q: { type: "quit-app" } };
        const action = map[e.code === "KeyW" ? "w" : e.code === "KeyM" ? "m" : e.code === "KeyQ" ? "q" : ""];
        if (action) { e.preventDefault(); run(action); }
        return;
      }
      if (e.key !== "Escape" || e.repeat || isTyping(e.target)) return;
      if (searchOpen) return setSearchOpen(false);
      if (ccOpen) return setCcOpen(false);
      const top = topWindow(wmRef.current);
      if (top) dispatch({ type: "close", id: top.id });
      else onExit();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [locked, searchOpen, ccOpen, run, onExit]);

  const api: OsApi = useMemo(() => ({
    wide: true,
    open,
    close: (id) => dispatch({ type: "close", id }),
    setTitle: (id, title) => dispatch({ type: "setTitle", id, title }),
    notify,
    run,
    openSearch: () => setSearchOpen(true),
    exit: onExit,
    sound: { on: soundOn, toggle: () => void toggleSound(), blip: (kind) => void studioSound.blip(kind) },
  }), [open, notify, run, onExit, soundOn, toggleSound]);

  const focusedWin = wm.focused ? wm.wins.find((w) => w.id === wm.focused) ?? null : null;

  return (
    <OsContext.Provider value={api}>
      <div className="os" data-appearance={appearance} style={brightness < 1 ? { filter: `brightness(${brightness})` } : undefined}>
        <Wallpaper appearance={appearance} />
        <MenuBar
          app={focusedWin ? appDef(focusedWin.app) : null}
          onAction={run}
          onSearch={() => setSearchOpen(true)}
          onControlCentre={() => setCcOpen((o) => !o)}
          controlCentreOpen={ccOpen}
        />
        <DesktopIcons
          onOpen={(path) => {
            const node = resolvePath(path);
            if (!node) return;
            if (node.kind === "folder") open("files", { path });
            else run(openAction(node, path));
          }}
        />
        {wm.wins.map((w) => {
          const App = appComponents[w.app];
          return (
            <Window
              key={w.id}
              win={w}
              def={appDef(w.app)}
              viewport={viewport}
              focused={wm.focused === w.id}
              onFocus={() => dispatch({ type: "focus", id: w.id })}
              onClose={() => dispatch({ type: "close", id: w.id })}
              onMinimize={() => dispatch({ type: "minimize", id: w.id })}
              onToggleMaximize={() => dispatch({ type: "toggleMaximize", id: w.id })}
              onMove={(x, y) => dispatch({ type: "move", id: w.id, x, y, viewport: viewportRef.current })}
              onResize={(rect) => dispatch({ type: "resize", id: w.id, rect, viewport: viewportRef.current })}
            >
              <App win={{ id: w.id, arg: w.arg, launch: w.launch, focused: wm.focused === w.id }} />
            </Window>
          );
        })}
        <Dock
          wins={wm.wins}
          onOpen={(app) => open(app)}
          onRestore={(id) => dispatch({ type: "restore", id })}
          onTrash={() => open("files", { path: TRASH })}
        />
        <Search open={searchOpen} onClose={() => setSearchOpen(false)} onPick={(item) => { setSearchOpen(false); run(item.action); }} />
        <ControlCentre
          open={ccOpen}
          onClose={() => setCcOpen(false)}
          appearance={appearance}
          onAppearance={setAppearance}
          soundOn={soundOn}
          onToggleSound={() => void toggleSound()}
          brightness={brightness}
          onBrightness={setBrightness}
        />
        <Notifications
          notices={notices}
          onDismiss={(id) => setNotices((ns) => ns.filter((n) => n.id !== id))}
          onAct={(id) => {
            const n = notices.find((x) => x.id === id);
            setNotices((ns) => ns.filter((x) => x.id !== id));
            if (n?.action) run(n.action);
          }}
        />
        {locked && <LockScreen onUnlock={unlock} />}
      </div>
    </OsContext.Provider>
  );
}
