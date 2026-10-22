"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { photos } from "@/lib/desk";
import type { AppProps } from "@/lib/os/types";

const MONTHS = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];

function parse(date: string): { year: number; month: number } {
  const [m, y] = date.toLowerCase().split(/\s+/);
  return { year: Number(y) || 0, month: MONTHS.indexOf(m) };
}

function thumb(src: string): string {
  return src.replace("/photos/", "/photos/thumbs/");
}

type Entry = { index: number; src: string; caption: string; date: string };

export default function Photos({ win }: AppProps) {
  const [viewing, setViewing] = useState<number | null>(win.arg?.photoIndex ?? null);
  const [year, setYear] = useState<number | null>(null); // null = Library (all years)
  const wanted = win.arg?.photoIndex;

  useEffect(() => {
    if (typeof wanted === "number" && wanted >= 0 && wanted < photos.length) setViewing(wanted);
  }, [wanted, win.launch]);

  const groups = useMemo(() => {
    const by = new Map<number, Entry[]>();
    photos.forEach((p, index) => {
      const { year: y } = parse(p.date);
      by.set(y, [...(by.get(y) ?? []), { index, ...p }]);
    });
    return [...by.entries()]
      .sort((a, b) => b[0] - a[0])
      .map(([y, list]) => ({ year: y, list: list.sort((a, b) => parse(b.date).month - parse(a.date).month) }));
  }, []);

  const shown = year === null ? groups : groups.filter((g) => g.year === year);

  // Esc and the arrow keys belong to the viewer while it is open and this window is focused.
  const isOpen = viewing !== null;
  const viewingRef = useRef(viewing);
  viewingRef.current = viewing;
  useEffect(() => {
    if (!isOpen || !win.focused) return;
    const onKey = (e: KeyboardEvent) => {
      const v = viewingRef.current;
      if (v === null) return;
      // Yield to the shell's layers (search, control centre, open menu) and to text fields.
      const t = e.target as Element | null;
      if (t?.closest?.("input, textarea") || document.querySelector(".os-search, .os-cc, .os-menu__panel")) return;
      if (e.key === "Escape") { e.stopPropagation(); setViewing(null); }
      else if (e.key === "ArrowLeft") { e.stopPropagation(); setViewing((v + photos.length - 1) % photos.length); }
      else if (e.key === "ArrowRight") { e.stopPropagation(); setViewing((v + 1) % photos.length); }
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [isOpen, win.focused]);

  const backRef = useRef<HTMLButtonElement>(null);
  useEffect(() => { if (isOpen) backRef.current?.focus(); }, [isOpen]);

  if (viewing !== null) {
    const p = photos[viewing];
    return (
      <div className="ac ac-viewer">
        <div className="ac-viewer-bar">
          <button ref={backRef} type="button" className="ac-back ac-back--always" onClick={() => setViewing(null)}>
            <span aria-hidden="true">&lsaquo;</span> Library
          </button>
          <span className="ac-viewer-count">{viewing + 1} of {photos.length}</span>
        </div>
        <div className="ac-viewer-stage">
          <button type="button" className="ac-viewer-nav" aria-label="Previous photo" onClick={() => setViewing((viewing + photos.length - 1) % photos.length)}>
            <span aria-hidden="true">&lsaquo;</span>
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img key={p.src} src={p.src} alt={p.caption} />
          <button type="button" className="ac-viewer-nav" aria-label="Next photo" onClick={() => setViewing((viewing + 1) % photos.length)}>
            <span aria-hidden="true">&rsaquo;</span>
          </button>
        </div>
        <p className="ac-viewer-caption"><strong>{p.caption}</strong> <span>{p.date}</span></p>
      </div>
    );
  }

  return (
    <div className="ac ac-photos">
      <nav className="ac-side" aria-label="Photos">
        <p className="ac-side-h">Library</p>
        <button type="button" className="ac-side-item" aria-current={year === null ? "true" : undefined} onClick={() => setYear(null)}>
          All photos <span>{photos.length}</span>
        </button>
        <p className="ac-side-h">Years</p>
        {groups.map((g) => (
          <button key={g.year} type="button" className="ac-side-item" aria-current={year === g.year ? "true" : undefined} onClick={() => setYear(g.year)}>
            {g.year} <span>{g.list.length}</span>
          </button>
        ))}
      </nav>
      <div className="ac-photos-main">
        {shown.map((g) => (
          <section key={g.year} aria-label={String(g.year)}>
            <h2 className="ac-year">{g.year}</h2>
            <ul className="ac-grid">
              {g.list.map((p) => (
                <li key={p.src}>
                  <button type="button" className="ac-thumb" onClick={() => setViewing(p.index)} aria-label={`${p.caption}, ${p.date}`}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={thumb(p.src)} alt="" loading="lazy" decoding="async" />
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
