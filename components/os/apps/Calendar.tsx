"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useOs } from "@/components/os/OsContext";
import { calEvents } from "@/lib/os/calendar";
import type { AppProps, CalEvent } from "@/lib/os/types";

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const KIND_LABEL: Record<CalEvent["kind"], string> = { ship: "Shipped", event: "Event", work: "Work", study: "Study", life: "Life" };

const pad = (n: number) => String(n).padStart(2, "0");
const iso = (y: number, m: number, d: number) => `${y}-${pad(m + 1)}-${pad(d)}`;

function fmt(s: string): string {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

const sorted = [...calEvents].sort((a, b) => a.start.localeCompare(b.start) || a.title.localeCompare(b.title));
const eventsOn = (d: string) => sorted.filter((e) => e.start <= d && d <= (e.end ?? e.start));
// A multi-year span (the degree) would put a dot on every day of the year grid and hide the real events.
const isLong = (e: CalEvent) => !!e.end && Date.parse(e.end) - Date.parse(e.start) > 92 * 86400000;

type Cell = { iso: string; day: number; inMonth: boolean };

function monthCells(y: number, m: number): Cell[] {
  const first = new Date(y, m, 1).getDay();
  const cells: Cell[] = [];
  for (let i = 0; i < 42; i++) {
    const dt = new Date(y, m, 1 - first + i);
    cells.push({ iso: iso(dt.getFullYear(), dt.getMonth(), dt.getDate()), day: dt.getDate(), inMonth: dt.getMonth() === m });
  }
  return cells;
}

export default function Calendar({ win }: AppProps) {
  const os = useOs();
  const today = useMemo(() => new Date(), []);
  const todayIso = iso(today.getFullYear(), today.getMonth(), today.getDate());
  const [view, setView] = useState<"year" | "month">("year");
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [picked, setPicked] = useState<CalEvent | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => { if (picked) closeRef.current?.focus(); }, [picked]);

  // Esc closes the popover first, and only while this window is focused.
  useEffect(() => {
    if (!picked || !win.focused) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      // Yield to the shell's layers (search, control centre, open menu) and to text fields.
      const t = e.target as Element | null;
      if (t?.closest?.("input, textarea") || document.querySelector(".os-search, .os-cc, .os-menu__panel")) return;
      e.stopPropagation();
      setPicked(null);
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [picked, win.focused]);

  // Keep Tab inside the modal popover.
  function trapTab(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key !== "Tab") return;
    const f = e.currentTarget.querySelectorAll<HTMLElement>("button:not([disabled])");
    if (f.length === 0) return;
    const first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }

  function step(delta: number) {
    if (view === "year") return setYear((y) => y + delta);
    const dt = new Date(year, month + delta, 1);
    setYear(dt.getFullYear());
    setMonth(dt.getMonth());
  }
  function goToday() {
    setYear(today.getFullYear());
    setMonth(today.getMonth());
  }

  const title = view === "year" ? String(year) : `${MONTHS[month]} ${year}`;

  return (
    <div className="ac ac-cal">
      <div className="ac-cal-bar">
        <h2 className="ac-cal-title">{title}</h2>
        <div className="ac-seg" role="group" aria-label="View">
          <button type="button" aria-pressed={view === "year"} onClick={() => setView("year")}>Year</button>
          <button type="button" aria-pressed={view === "month"} onClick={() => setView("month")}>Month</button>
        </div>
        <div className="ac-cal-nav">
          <button type="button" className="ac-tool ac-tool--icon" aria-label={view === "year" ? "Previous year" : "Previous month"} onClick={() => step(-1)}><span aria-hidden="true">&lsaquo;</span></button>
          <button type="button" className="ac-tool" onClick={goToday}>Today</button>
          <button type="button" className="ac-tool ac-tool--icon" aria-label={view === "year" ? "Next year" : "Next month"} onClick={() => step(1)}><span aria-hidden="true">&rsaquo;</span></button>
        </div>
      </div>

      {view === "year" ? (
        <div className="ac-year-grid">
          {MONTHS.map((name, m) => (
            <section key={name} className="ac-mini" aria-label={`${name} ${year}`}>
              <button type="button" className="ac-mini-h" onClick={() => { setMonth(m); setView("month"); }}>{name}</button>
              <div className="ac-mini-days" aria-hidden="true">
                {DOW.map((d) => <span key={d} className="ac-mini-dow">{d[0]}</span>)}
                {monthCells(year, m).map((c) => {
                  const evs = c.inMonth ? eventsOn(c.iso).filter((e) => !isLong(e)) : [];
                  return (
                    <span key={c.iso} className="ac-mini-day" data-out={c.inMonth ? undefined : "true"} data-today={c.iso === todayIso ? "true" : undefined}>
                      {c.day}
                      {evs.length > 0 && <i className="ac-dot" data-kind={evs[0].kind} />}
                    </span>
                  );
                })}
              </div>
              <ul className="ac-mini-list">
                {sorted.filter((e) => e.start.slice(0, 7) === `${year}-${pad(m + 1)}`).map((e) => (
                  <li key={e.start + e.title}>
                    <button type="button" onClick={() => setPicked(e)}><i className="ac-dot" data-kind={e.kind} />{e.title}</button>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      ) : (
        <div className="ac-month">
          <div className="ac-month-dow">{DOW.map((d) => <span key={d}>{d}</span>)}</div>
          <div className="ac-month-grid">
            {monthCells(year, month).map((c) => {
              const evs = eventsOn(c.iso);
              return (
                <div key={c.iso} className="ac-day" data-out={c.inMonth ? undefined : "true"}>
                  <span className="ac-day-n" data-today={c.iso === todayIso ? "true" : undefined}>{c.day}</span>
                  {evs.slice(0, 3).map((e) => (
                    <button key={e.title} type="button" className="ac-pill" data-kind={e.kind} onClick={() => setPicked(e)}>
                      {e.start === c.iso || new Date(c.iso).getUTCDay() === 0 ? e.title : <span className="ac-sr">{e.title}</span>}
                    </button>
                  ))}
                  {evs.length > 3 && <span className="ac-more">+{evs.length - 3} more</span>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <ul className="ac-legend" aria-label="Legend">
        {(Object.keys(KIND_LABEL) as CalEvent["kind"][]).map((k) => (
          <li key={k}><i className="ac-dot" data-kind={k} />{KIND_LABEL[k]}</li>
        ))}
      </ul>

      {picked && (
        <div className="ac-pop-wrap" onClick={() => setPicked(null)}>
          <div className="ac-pop" onKeyDown={trapTab} role="dialog" aria-modal="true" aria-label={picked.title} onClick={(e) => e.stopPropagation()}>
            <p className="ac-pop-kind"><i className="ac-dot" data-kind={picked.kind} />{KIND_LABEL[picked.kind]}</p>
            <h3>{picked.title}</h3>
            <p className="ac-pop-date">{fmt(picked.start)}{picked.end && picked.end !== picked.start ? ` to ${fmt(picked.end)}` : ""}</p>
            {picked.note && <p>{picked.note}</p>}
            <div className="ac-pop-actions">
              {picked.action && (
                <button type="button" className="ac-tool ac-tool--primary" onClick={() => { const a = picked.action!; setPicked(null); os.run(a); }}>
                  {picked.action.type === "href" ? "Read the case study" : "Open"}
                </button>
              )}
              <button ref={closeRef} type="button" className="ac-tool" onClick={() => setPicked(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
