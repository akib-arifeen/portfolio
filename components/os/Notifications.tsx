"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Notice, NotificationsProps } from "@/lib/os/types";
import AppIcon from "./AppIcon";

const DEFAULT_TTL = 6000;
const LEAVE_MS = 200;

function Banner({ notice, onDismiss, onAct }: { notice: Notice & { id: string }; onDismiss(id: string): void; onAct(id: string): void }) {
  const { id, ttlMs = DEFAULT_TTL } = notice;
  const [leaving, setLeaving] = useState(false);
  const [held, setHeld] = useState(false);          // hover or focus pauses the timer
  const left = useRef(ttlMs);
  const startedAt = useRef(0);
  const dismissRef = useRef<() => void>(() => {});

  dismissRef.current = () => {
    setLeaving(true);
    setTimeout(() => onDismiss(id), LEAVE_MS);
  };

  useEffect(() => {
    if (ttlMs === 0 || held || leaving) return;
    startedAt.current = Date.now();
    const t = setTimeout(() => dismissRef.current(), left.current);
    return () => {
      clearTimeout(t);
      left.current = Math.max(0, left.current - (Date.now() - startedAt.current));
    };
  }, [held, leaving, ttlMs]);

  const hold = useCallback(() => setHeld(true), []);
  const release = useCallback(() => setHeld(false), []);

  return (
    <div
      className="os-notice"
      data-leaving={leaving || undefined}
      onMouseEnter={hold}
      onMouseLeave={release}
      onFocus={hold}
      onBlur={release}
    >
      <button type="button" className="os-notice__main" onClick={() => onAct(id)}>
        <AppIcon id={notice.app ?? "about"} size={34} />
        <span className="os-notice__text">
          <span className="os-notice__title">{notice.title}</span>
          <span className="os-notice__body">{notice.body}</span>
        </span>
      </button>
      <span className="os-notice__time" aria-hidden="true">now</span>
      <button type="button" className="os-notice__x" aria-label="Dismiss" onClick={() => dismissRef.current()}>
        <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" /></svg>
      </button>
    </div>
  );
}

/** Banners stacked under the menu bar, top right. */
export default function Notifications({ notices, onDismiss, onAct }: NotificationsProps) {
  return (
    <div className="os-notices" aria-live="polite">
      {notices.map((n) => <Banner key={n.id} notice={n} onDismiss={onDismiss} onAct={onAct} />)}
    </div>
  );
}
