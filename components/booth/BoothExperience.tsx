"use client";

import { useEffect, useRef } from "react";
import BoothScreen from "./BoothScreen";
import { useBooth } from "./useBooth";
import { useScrollLock } from "@/lib/use-scroll-lock";

/**
 * The booth as a native modal dialog: the page behind is inert, Escape closes it, focus stays inside.
 * It mounts only when opened, so the camera is never requested on page load and unmounting always
 * ends the media tracks and any in-flight request.
 */
export default function BoothExperience({ onClose, reducedMotion }: { onClose: () => void; reducedMotion: boolean }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const booth = useBooth(true);
  const leaving = useRef(false);
  // a modal dialog stops the pointer, but the document behind it still scrolls on the wheel and the keys
  useScrollLock();

  const close = () => {
    if (leaving.current) return;
    leaving.current = true;
    onClose();
  };

  useEffect(() => {
    const el = dialog.current;
    if (!el) return;
    if (!el.open) el.showModal();
    document.body.dataset.booth = "true";
    el.querySelector<HTMLElement>("[data-booth-heading]")?.focus({ preventScroll: true });
    return () => {
      delete document.body.dataset.booth;
      if (el.open) el.close();
    };
  }, []);

  // each step's controls replace the last, so move focus to the new heading rather than losing it
  const shownStep = useRef(booth.step);
  useEffect(() => {
    if (shownStep.current === booth.step) return;
    shownStep.current = booth.step;
    dialog.current?.querySelector<HTMLElement>("[data-booth-heading]")?.focus({ preventScroll: true });
  }, [booth.step]);

  // printing → done, scheduled once per print; leaving printing arms the next one
  const presentedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const printing = useRef(false);
  useEffect(() => {
    if (booth.step !== "printing") {
      printing.current = false;
      if (presentedTimer.current) {
        clearTimeout(presentedTimer.current);
        presentedTimer.current = null;
      }
      return;
    }
    if (printing.current) return;
    printing.current = true;
    presentedTimer.current = setTimeout(() => {
      presentedTimer.current = null;
      booth.presented();
    }, reducedMotion ? 120 : 700);
  }, [booth.step, booth.presented, reducedMotion]);

  useEffect(() => () => {
    if (presentedTimer.current) clearTimeout(presentedTimer.current);
  }, []);

  return (
    <dialog
      ref={dialog}
      className="booth-dialog"
      aria-labelledby="booth-heading"
      onCancel={(e) => { e.preventDefault(); close(); }}
      onClick={(e) => { if (e.target === dialog.current) close(); }}
    >
      <BoothScreen booth={booth} onStepAway={close} />
    </dialog>
  );
}
