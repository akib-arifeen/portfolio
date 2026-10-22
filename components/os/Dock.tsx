"use client";

import { motion, useMotionValue, useReducedMotion, useSpring, useTransform, type MotionValue } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { apps } from "@/lib/os/apps";
import type { AppId, DockProps } from "@/lib/os/types";
import AppIcon from "./AppIcon";

const BASE = 52;
const PEAK = 0.6;
const SIGMA = 90;

/** Tooltip state: shows 150 ms after hover or focus, hides at once. */
function useTip() {
  const [show, setShow] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const on = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setShow(true), 150);
  };
  const off = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    setShow(false);
  };
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  return { show, handlers: { onPointerEnter: on, onPointerLeave: off, onFocus: on, onBlur: off } };
}

function DockApp({ id, name, mouseX, running, onOpen }: { id: AppId; name: string; mouseX: MotionValue<number>; running: boolean; onOpen(): void }) {
  const reduce = useReducedMotion();
  const slot = useRef<HTMLDivElement>(null);
  const tip = useTip();
  const distance = useTransform(mouseX, (x) => {
    const b = slot.current?.getBoundingClientRect();
    return b ? x - (b.x + b.width / 2) : Infinity;
  });
  const target = useTransform(distance, (d) => (reduce ? 1 : 1 + PEAK * Math.exp(-(d * d) / (2 * SIGMA * SIGMA))));
  const scale = useSpring(target, { mass: 0.1, stiffness: 170, damping: 13 });
  const width = useTransform(scale, (s) => BASE * s);

  // launch bounce: only when a window first appears after mount
  const [bounce, setBounce] = useState(false);
  const was = useRef(running);
  useEffect(() => {
    if (running && !was.current && !reduce) {
      setBounce(true);
      const t = setTimeout(() => setBounce(false), 620);
      was.current = running;
      return () => clearTimeout(t);
    }
    was.current = running;
  }, [running, reduce]);

  return (
    <motion.div ref={slot} className="os-dock__slot" style={{ width, height: BASE }}>
      <button
        type="button"
        className={`os-dock__btn${bounce ? " os-dock__bounce" : ""}`}
        aria-label={name}
        onClick={onOpen}
        {...tip.handlers}
      >
        <motion.div style={{ scale, transformOrigin: "50% 100%", width: BASE, height: BASE }}>
          <AppIcon id={id} size={BASE} />
        </motion.div>
        {running && <span className="os-dock__dot" aria-hidden="true" />}
      </button>
      {tip.show && <span className="os-dock__tip" role="tooltip" style={reduce ? undefined : { bottom: "calc(100% + 38px)" }}>{name}</span>}
    </motion.div>
  );
}

function MinimizedItem({ id, app, title, onRestore }: { id: string; app: AppId; title: string; onRestore(id: string): void }) {
  const tip = useTip();
  return (
    <div className="os-dock__slot" style={{ width: 44, height: BASE }}>
      <button type="button" className="os-dock__btn os-dock__btn--min" aria-label={`Restore ${title}`} onClick={() => onRestore(id)} {...tip.handlers}>
        <AppIcon id={app} size={40} />
      </button>
      {tip.show && <span className="os-dock__tip" role="tooltip">{title}</span>}
    </div>
  );
}

function TrashButton({ onTrash }: { onTrash(): void }) {
  const tip = useTip();
  return (
    <div className="os-dock__slot" style={{ width: 48, height: BASE }}>
      <button type="button" className="os-dock__btn" aria-label="Trash" onClick={onTrash} {...tip.handlers}>
        <svg width="44" height="48" viewBox="0 0 44 48" fill="none" aria-hidden="true" focusable="false" style={{ display: "block" }}>
          <path d="M9 14 H35 L33 42 a3 3 0 0 1 -3 3 H14 a3 3 0 0 1 -3 -3 Z" fill="var(--os-glass-strong)" stroke="var(--os-text-2)" strokeWidth="1.8" strokeLinejoin="round" />
          <path d="M6 14 H38" stroke="var(--os-text-2)" strokeWidth="2.4" strokeLinecap="round" />
          <path d="M17 14 V10.5 a2.5 2.5 0 0 1 2.5 -2.5 h5 a2.5 2.5 0 0 1 2.5 2.5 V14" stroke="var(--os-text-2)" strokeWidth="1.8" strokeLinejoin="round" />
          <path d="M17 21 V38 M22 21 V38 M27 21 V38" stroke="var(--os-text-2)" strokeOpacity="0.55" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      </button>
      {tip.show && <span className="os-dock__tip" role="tooltip">Trash</span>}
    </div>
  );
}

export default function Dock({ wins, onOpen, onRestore, onTrash }: DockProps) {
  const mouseX = useMotionValue(Infinity);
  const minimized = wins.filter((w) => w.minimized);
  return (
    <div
      className="os-dock"
      role="toolbar"
      aria-label="Dock"
      onPointerMove={(e) => { if (e.pointerType === "mouse") mouseX.set(e.clientX); }}
      onPointerLeave={() => mouseX.set(Infinity)}
    >
      {apps.filter((a) => a.dock).map((a) => (
        <DockApp key={a.id} id={a.id} name={a.name} mouseX={mouseX} running={wins.some((w) => w.app === a.id)} onOpen={() => onOpen(a.id)} />
      ))}
      <div className="os-dock__div" aria-hidden="true" />
      {minimized.map((w) => <MinimizedItem key={w.id} id={w.id} app={w.app} title={w.title} onRestore={onRestore} />)}
      <TrashButton onTrash={onTrash} />
    </div>
  );
}
