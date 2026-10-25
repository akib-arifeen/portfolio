"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import ProjectPortal from "@/components/portal/ProjectPortal";
import { useScrollLock } from "@/lib/use-scroll-lock";
import "@/components/portal/portal.css";

const FOCUSABLE = "a[href], button:not([disabled]), video[controls], iframe, [tabindex]:not([tabindex='-1'])";

export default function Desk({ onClose }: { onClose: () => void }) {
  const [leaving, setLeaving] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useScrollLock();

  const close = useCallback(() => {
    if (closeTimer.current) return;
    setLeaving(true);
    closeTimer.current = setTimeout(onClose, 160);
  }, [onClose]);

  useEffect(() => {
    root.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        close();
        return;
      }
      if (event.key !== "Tab" || !root.current) return;
      const items = Array.from(root.current.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((el) => el.getClientRects().length > 0);
      if (items.length === 0) {
        event.preventDefault();
        root.current.focus();
        return;
      }
      const first = items[0], last = items[items.length - 1];
      const active = document.activeElement;
      if (event.shiftKey && (active === first || active === root.current)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [close]);

  useEffect(() => {
    const els = Array.from(document.querySelectorAll<HTMLElement>("main, header.nav, nav")).filter((el) => !root.current?.contains(el) && !el.inert);
    els.forEach((el) => { el.inert = true; });
    return () => els.forEach((el) => { el.inert = false; });
  }, []);

  useEffect(() => () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
  }, []);

  return createPortal(
    <div className="desk" data-leaving={leaving} ref={root} tabIndex={-1} role="dialog" aria-modal="true" aria-label="Akib’s laptop">
      <ProjectPortal onClose={close} />
    </div>,
    document.body,
  );
}
