"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import OsShell from "@/components/os/OsShell";
import PhoneShell from "@/components/os/PhoneShell";
import { useScrollLock } from "@/lib/use-scroll-lock";

function useWide() {
  const [wide, setWide] = useState<boolean | null>(null);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 60rem)");
    setWide(mq.matches);
    const on = () => setWide(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return wide;
}

/** The laptop: akibOS on wide screens, a phone home screen on narrow ones. Same apps either way. */
export default function Desk({ onClose }: { onClose: () => void }) {
  const wide = useWide();
  const [leaving, setLeaving] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  // the page behind the laptop must not scroll while it is open
  useScrollLock();

  const close = useCallback(() => {
    setLeaving(true);
    setTimeout(onClose, 220);
  }, [onClose]);

  // focus moves into the dialog once the shell is known (the first render returns null)
  useEffect(() => { if (wide !== null) root.current?.focus(); }, [wide]);

  // the page behind the laptop must not take focus or be read by a screen reader while it is open
  useEffect(() => {
    const els = Array.from(document.querySelectorAll<HTMLElement>("main, header.nav, nav")).filter((el) => !el.inert);
    els.forEach((el) => { el.inert = true; });
    return () => els.forEach((el) => { el.inert = false; });
  }, []);

  if (wide === null) return null;
  return createPortal(
    <div className="desk" data-leaving={leaving} ref={root} tabIndex={-1} role="dialog" aria-modal="true" aria-label="Akib’s laptop">
      {wide ? <OsShell onExit={close} /> : <PhoneShell onExit={close} />}
    </div>,
    document.body,
  );
}
