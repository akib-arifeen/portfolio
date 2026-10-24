"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { appDef } from "@/lib/os/apps";
import type { MenuAction, MenuBarProps, MenuDef, MenuItem } from "@/lib/os/types";

/** An Edit item runs in the browser (clipboard, selection) instead of asking the OS to do something. */
type LocalItem = { label: string; shortcut?: string; disabled?: boolean; local: () => void };
type BarItem = MenuItem | LocalItem;
type BarMenu = { id: string; label: string; strong?: boolean; mark?: boolean; items: BarItem[] };

const isField = (el: Element | null): el is HTMLInputElement | HTMLTextAreaElement =>
  el instanceof HTMLTextAreaElement || (el instanceof HTMLInputElement && typeof el.selectionStart === "number");

/** The selected text, including inside an input or textarea (window.getSelection() reports "" for those). */
function selectedText(field: Element | null): string {
  if (isField(field) && field.selectionStart !== field.selectionEnd) return field.value.slice(field.selectionStart ?? 0, field.selectionEnd ?? 0);
  return window.getSelection()?.toString() ?? "";
}

/** Select the text field the user was in, else the focused window's text field, else everything in its body. */
function selectAll(field: Element | null) {
  const body = document.querySelector<HTMLElement>('.os-win[data-focused="true"] .os-win__body');
  const target = isField(field) ? field : body?.querySelector<HTMLTextAreaElement>("textarea") ?? null;
  if (target) { target.focus(); target.select(); return; }
  if (!body) return;
  const range = document.createRange();
  range.selectNodeContents(body);
  const sel = window.getSelection();
  sel?.removeAllRanges();
  sel?.addRange(range);
}

function clockText(d: Date) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", hour12: false })
      .formatToParts(d)
      .map((p) => [p.type, p.value]),
  );
  return `${parts.weekday} ${parts.day} ${parts.month} ${parts.hour}:${parts.minute}`;
}

function Clock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(t);
  }, []);
  return <span className="os-clock">{clockText(now)}</span>;
}

/** Own "a" monogram in a circle. */
function Mark() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeLinecap="round" aria-hidden="true" focusable="false">
      <circle cx="8" cy="8" r="7" strokeWidth="1.2" />
      <circle cx="7.3" cy="8.4" r="2.1" strokeWidth="1.3" />
      <path d="M9.4 6.2 V10.6" strokeWidth="1.3" />
    </svg>
  );
}

const enabledIdx = (items: BarItem[]) => items.flatMap((it, i) => (it !== "separator" && !it.disabled ? [i] : []));

export default function MenuBar({ app, onAction, onSearch, onControlCentre, controlCentreOpen }: MenuBarProps) {
  const name = app?.name ?? "Files";
  const [open, setOpen] = useState<number | null>(null);
  const [active, setActive] = useState(-1);
  const root = useRef<HTMLDivElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  // what the user had selected, and where, when the bar was opened: clicking a menu moves focus off it
  const [picked, setPicked] = useState("");
  const field = useRef<Element | null>(null);

  const menus: BarMenu[] = useMemo(() => {
    const own: MenuDef[] = (app ?? appDef("files")).menus;
    return [
      {
        id: "system", label: "System", mark: true,
        items: [
          { label: "About This Laptop", action: { type: "open", app: "about" } },
          "separator",
          { label: "Search…", shortcut: "⌘K", action: { type: "search" } },
          { label: "Lock Screen", action: { type: "lock" } },
          { label: "Close the Lid", action: { type: "exit" } },
        ],
      },
      {
        id: "app", label: name, strong: true,
        items: [
          { label: `About ${name}`, action: { type: "open", app: "about" } },
          "separator",
          { label: `Quit ${name}`, shortcut: "⌥Q", action: { type: "quit-app" } },
        ],
      },
      { id: "file", label: "File", items: [{ label: "Close Window", shortcut: "⌥W", action: { type: "close-window" } }] },
      {
        id: "edit", label: "Edit",
        items: [
          { label: "Copy", shortcut: "⌘C", disabled: picked === "", local: () => { void navigator.clipboard?.writeText(picked).catch(() => {}); } },
          { label: "Select All", shortcut: "⌘A", local: () => selectAll(field.current) },
        ],
      },
      { id: "view", label: "View", items: [{ label: "Enter Full Screen", action: { type: "zoom" } }] },
      ...own.map((m, i) => ({ id: `own-${i}`, label: m.label, items: m.items })),
      {
        id: "window", label: "Window",
        items: [
          { label: "Minimize", shortcut: "⌥M", action: { type: "minimize" } },
          { label: "Zoom", action: { type: "zoom" } },
        ],
      },
      {
        id: "help", label: "Help",
        items: [
          { label: "Search", shortcut: "⌘K", action: { type: "search" } },
          { label: "Read the case studies", action: { type: "href", href: "/blog" } },
        ],
      },
    ];
  }, [app, name, picked]);

  const close = () => { setOpen(null); setActive(-1); };
  const run = (item: BarItem) => {
    if (item === "separator" || item.disabled) return;
    close();
    if ("local" in item) item.local();
    else onAction(item.action);
  };

  // keep keyboard focus on the active row
  useEffect(() => {
    if (open === null || active < 0) return;
    panel.current?.querySelector<HTMLElement>(`[data-idx="${active}"]`)?.focus();
  }, [open, active]);

  // while a menu is open: outside click closes; Esc, arrows and Enter are handled here, before the shell sees them
  useEffect(() => {
    if (open === null) return;
    const onDown = (e: PointerEvent) => { if (!root.current?.contains(e.target as Node)) close(); };
    const onKey = (e: KeyboardEvent) => {
      const items = menus[open]?.items ?? [];
      const ok = enabledIdx(items);
      const stop = () => { e.preventDefault(); e.stopPropagation(); };
      switch (e.key) {
        case "Escape": stop(); close(); return;
        case "ArrowRight":
        case "ArrowLeft": {
          stop();
          const next = (open + (e.key === "ArrowRight" ? 1 : -1) + menus.length) % menus.length;
          setOpen(next);
          setActive(enabledIdx(menus[next].items)[0] ?? -1);
          return;
        }
        case "ArrowDown": stop(); setActive(ok.length ? ok[(ok.indexOf(active) + 1) % ok.length] : -1); return;
        case "ArrowUp": stop(); setActive(!ok.length ? -1 : ok.includes(active) ? ok[(ok.indexOf(active) - 1 + ok.length) % ok.length] : ok[ok.length - 1]); return;
        case "Enter":
        case " ": {
          const it = items[active];
          if (it) { stop(); run(it); }
          return;
        }
      }
    };
    document.addEventListener("pointerdown", onDown, true);
    window.addEventListener("keydown", onKey, true);
    return () => {
      document.removeEventListener("pointerdown", onDown, true);
      window.removeEventListener("keydown", onKey, true);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, active, menus]);

  return (
    <div className="os-menubar" ref={root}>
      <div className="os-menubar__side" role="menubar" aria-label="Menu bar">
        {menus.map((m, i) => (
          <div className="os-menu" key={m.id}>
            <button
              type="button"
              role="menuitem"
              className="os-menu__btn"
              data-strong={m.strong || undefined}
              aria-haspopup="menu"
              aria-expanded={open === i}
              aria-label={m.mark ? "System menu" : undefined}
              onMouseDown={(e) => e.preventDefault()}
              onClick={(e) => {
                if (open === i) return close();
                if (open === null) {
                  field.current = document.activeElement;
                  setPicked(selectedText(document.activeElement));
                }
                setOpen(i);
                setActive(e.detail === 0 ? (enabledIdx(m.items)[0] ?? -1) : -1);
              }}
              onPointerEnter={() => { if (open !== null && open !== i) { setOpen(i); setActive(-1); } }}
            >
              {m.mark ? <Mark /> : m.label}
            </button>
            {open === i && (
              <div className="os-menu__panel" role="menu" aria-label={m.label} ref={panel}>
                {m.items.map((it, j) =>
                  it === "separator" ? (
                    <div key={j} className="os-menu__sep" role="separator" />
                  ) : (
                    <button
                      key={j}
                      type="button"
                      role="menuitem"
                      className="os-menu__item"
                      tabIndex={-1}
                      data-idx={j}
                      aria-disabled={it.disabled || undefined}
                      data-active={active === j}
                      onPointerEnter={() => { if (!it.disabled) setActive(j); }}
                      onClick={() => run(it)}
                    >
                      <span>{it.label}</span>
                      {it.shortcut && <span className="os-menu__key">{it.shortcut}</span>}
                    </button>
                  ),
                )}
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="os-menubar__side">
        <button type="button" className="os-bar-btn" aria-label="Control Centre" aria-expanded={controlCentreOpen} onClick={onControlCentre}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2" aria-hidden="true" focusable="false">
            <rect x="1.5" y="3" width="13" height="4" rx="2" />
            <circle cx="5" cy="5" r="1.1" fill="currentColor" stroke="none" />
            <rect x="1.5" y="9" width="13" height="4" rx="2" />
            <circle cx="11" cy="11" r="1.1" fill="currentColor" stroke="none" />
          </svg>
        </button>
        <button type="button" className="os-bar-btn" aria-label="Search" onClick={onSearch}>
          <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" aria-hidden="true" focusable="false">
            <circle cx="7" cy="7" r="4.6" />
            <path d="M10.5 10.5 L14 14" />
          </svg>
        </button>
        <span className="os-bar-glyph" aria-hidden="true">
          <svg width="16" height="14" viewBox="0 0 16 14" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
            <path d="M1.5 5 a9 9 0 0 1 13 0" />
            <path d="M3.8 7.5 a5.8 5.8 0 0 1 8.4 0" />
            <path d="M6.1 10 a2.6 2.6 0 0 1 3.8 0" />
          </svg>
        </span>
        <span className="os-bar-glyph" aria-hidden="true">
          <svg width="24" height="12" viewBox="0 0 24 12" fill="none" stroke="currentColor" strokeWidth="1.1">
            <rect x="0.7" y="0.7" width="19" height="10.6" rx="3" opacity="0.6" />
            <rect x="2.4" y="2.4" width="13" height="7.2" rx="1.6" fill="currentColor" stroke="none" />
            <path d="M21.5 4 v4" strokeLinecap="round" opacity="0.6" />
          </svg>
        </span>
        <Clock />
      </div>
    </div>
  );
}
