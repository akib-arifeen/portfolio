"use client";

import { useEffect, useRef, useState } from "react";
import type { LockScreenProps } from "@/lib/os/types";

const UNLOCK_MS = 350;

function clock(d: Date) {
  return `${d.getHours()}:${String(d.getMinutes()).padStart(2, "0")}`;
}

/** Covers the desktop until the visitor logs in; once per session (OsShell remembers it). */
export default function LockScreen({ onUnlock, onExit }: LockScreenProps) {
  const [now, setNow] = useState(() => new Date());
  const [unlocking, setUnlocking] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const busy = useRef(false);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 10_000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => { btnRef.current?.focus(); }, []);

  const unlock = () => {
    if (busy.current) return;
    busy.current = true;
    setUnlocking(true);
    setTimeout(onUnlock, UNLOCK_MS);
  };

  // Tab stays on the lock screen's two controls; Enter or Space logs in wherever focus has drifted,
  // except on Close, which keeps its own Enter.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Tab") {
        e.preventDefault();
        const other = document.activeElement === btnRef.current ? closeRef.current : btnRef.current;
        other?.focus();
      } else if ((e.key === "Enter" || e.key === " ") && document.activeElement !== closeRef.current) {
        e.preventDefault();
        unlock();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const date = now.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });

  return (
    <div className="os-lock" data-unlocking={unlocking || undefined} role="dialog" aria-modal="true" aria-label="Lock screen">
      <button ref={closeRef} type="button" className="os-lock__close" aria-label="Close the laptop" onClick={onExit}>
        Close
      </button>
      <div className="os-lock__top">
        <div className="os-lock__date">{date}</div>
        <div className="os-lock__clock">{clock(now)}</div>
      </div>
      <div className="os-lock__user">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="os-lock__avatar" src="/desk/akib.jpg" alt="" width={84} height={84} />
        <div className="os-lock__name">Akib Arifeen</div>
        <button ref={btnRef} type="button" className="os-lock__btn" onClick={unlock}>Log in</button>
        <div className="os-lock__hint">Press Enter to log in</div>
      </div>
    </div>
  );
}
