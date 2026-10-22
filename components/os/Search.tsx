"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { buildIndex, searchItems } from "@/lib/os/search";
import type { AppId, SearchItem, SearchKind, SearchProps } from "@/lib/os/types";
import AppIcon from "./AppIcon";

const HEADINGS: Record<SearchKind, string> = {
  app: "Apps", project: "Projects", page: "Pages", note: "Notes", file: "Files", photo: "Photos", site: "Sites", command: "Commands",
};

const SUGGESTIONS: SearchItem[] = [
  { id: "suggest:projects", kind: "project", title: "Projects", subtitle: "Folder", action: { type: "open", app: "files", arg: { path: "/Users/akib/Projects" } } },
  { id: "suggest:gravity-wars", kind: "project", title: "Gravity Wars", subtitle: "Playground", action: { type: "open", app: "playground", arg: { game: "gravity-wars" } } },
  { id: "suggest:work", kind: "page", title: "All work", subtitle: "Case studies", action: { type: "href", href: "/work" } },
  { id: "suggest:neofetch", kind: "command", title: "neofetch", action: { type: "open", app: "terminal", arg: { command: "neofetch" } } },
  { id: "suggest:mail", kind: "app", title: "Mail", subtitle: "Write to me", action: { type: "open", app: "mail" } },
];

const KIND_APP: Partial<Record<SearchKind, AppId>> = { command: "terminal", site: "browser", photo: "photos", note: "notes" };

function iconApp(item: SearchItem): AppId | null {
  const byKind = KIND_APP[item.kind];
  if (byKind) return byKind;
  if (item.kind === "app" || item.kind === "file") return item.action.type === "open" ? item.action.app : null;
  return null;
}

function Glyph({ kind }: { kind: "search" | "folder" | "page" }) {
  const paths = {
    search: <><circle cx="11" cy="11" r="6.5" /><path d="m16 16 4.5 4.5" /></>,
    folder: <path d="M3.5 7.5a2 2 0 0 1 2-2h4l2 2.5h7a2 2 0 0 1 2 2v7.5a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2z" />,
    page: <><path d="M6.5 3.5h7l4 4v13h-11z" /><path d="M13.5 3.5v4h4" /></>,
  };
  return (
    <svg viewBox="0 0 24 24" width="100%" height="100%" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {paths[kind]}
    </svg>
  );
}

function RowIcon({ item }: { item: SearchItem }) {
  const app = iconApp(item);
  if (app) return <AppIcon id={app} size={28} />;
  return <span className="os-search__glyph"><Glyph kind={item.kind === "project" ? "folder" : "page"} /></span>;
}

/** The Cmd/Ctrl+K palette: one box over every app, project, note, photo, file and command. */
export default function Search({ open, onClose, onPick }: SearchProps) {
  const index = useMemo(buildIndex, []);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const uid = useId();
  const listId = `${uid}-list`;

  // grouped in heading order; the flat list is what the arrow keys walk
  const { groups, flat } = useMemo(() => {
    const q = query.trim();
    const found = q ? searchItems(q, index, 8) : SUGGESTIONS;
    // `found` is best-score first, so groups ordered by first appearance are ordered by their best score
    const kinds = [...new Set(found.map((i) => i.kind))];
    const groups = q
      ? kinds.map((kind) => ({ heading: HEADINGS[kind], items: found.filter((i) => i.kind === kind) }))
      : [{ heading: "Suggestions", items: found }];
    return { groups, flat: groups.flatMap((g) => g.items) };
  }, [query, index]);

  // focus the input on open, hand focus back on close
  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    setQuery("");
    setSelected(0);
    inputRef.current?.focus();
    return () => { previous?.focus?.(); };
  }, [open]);

  useEffect(() => { setSelected(0); }, [query]);

  useEffect(() => {
    listRef.current?.querySelector<HTMLElement>('[aria-selected="true"]')?.scrollIntoView({ block: "nearest" });
  }, [selected, flat]);

  if (!open) return null;

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") { e.stopPropagation(); e.preventDefault(); onClose(); return; }
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (!flat.length) return;
      setSelected((s) => (e.key === "ArrowDown" ? (s + 1) % flat.length : (s - 1 + flat.length) % flat.length));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const item = flat[selected];
      if (item) onPick(item);
    }
  };

  let row = -1;
  return (
    <>
      <div className="os-search__catcher" onClick={onClose} aria-hidden="true" />
      <div className="os-search" role="dialog" aria-modal="true" aria-label="Search" onKeyDown={onKeyDown}>
        <div className="os-search__field">
          <span className="os-search__mag"><Glyph kind="search" /></span>
          <input
            ref={inputRef}
            className="os-search__input"
            type="text"
            role="combobox"
            aria-expanded={flat.length > 0}
            aria-controls={listId}
            aria-activedescendant={flat.length ? `${uid}-opt-${selected}` : undefined}
            aria-autocomplete="list"
            aria-label="Search"
            placeholder="Search projects, notes, photos, commands"
            autoComplete="off"
            spellCheck={false}
            value={query}
            onChange={(e) => { setQuery(e.target.value); setSelected(0); }}
          />
        </div>
        <div className="os-search__results" id={listId} role="listbox" aria-label="Results" ref={listRef}>
          {groups.map((g) => (
            <div className="os-search__group" role="presentation" key={g.heading}>
              <div className="os-search__heading" role="presentation">{g.heading}</div>
              {g.items.map((item) => {
                const i = ++row;
                return (
                  <div
                    key={item.id}
                    id={`${uid}-opt-${i}`}
                    role="option"
                    aria-selected={i === selected}
                    className="os-search__row"
                    onMouseMove={() => setSelected(i)}
                    onClick={() => onPick(item)}
                  >
                    <RowIcon item={item} />
                    <span className="os-search__title">{item.title}</span>
                    {(item.kind === "command" || item.subtitle) && <span className="os-search__sub">{item.kind === "command" ? "Terminal command" : item.subtitle}</span>}
                  </div>
                );
              })}
            </div>
          ))}
          {!flat.length && <div className="os-search__empty" role="presentation">No matches for “{query.trim()}”</div>}
        </div>
      </div>
    </>
  );
}
