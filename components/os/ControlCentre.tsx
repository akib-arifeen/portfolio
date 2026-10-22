"use client";

import { useEffect, useRef } from "react";
import { playlists } from "@/lib/desk";
import type { ControlCentreProps } from "@/lib/os/types";
import { useOs } from "./OsContext";

function Icon({ d }: { d: React.ReactNode }) {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {d}
    </svg>
  );
}

/** The panel under the menu bar's right side: appearance, sound, brightness, music and the lid. */
export default function ControlCentre({ open, onClose, appearance, onAppearance, soundOn, onToggleSound, brightness, onBrightness }: ControlCentreProps) {
  const os = useOs();
  const panel = useRef<HTMLDivElement>(null);

  // focus goes to the first control on open and back to the menu-bar button on close
  useEffect(() => {
    if (!open) return;
    panel.current?.querySelector<HTMLElement>("button")?.focus();
    return () => { document.querySelector<HTMLElement>('.os-menubar [aria-label="Control Centre"]')?.focus(); };
  }, [open]);

  if (!open) return null;
  return (
    <>
      <div className="os-cc__catcher" onClick={onClose} aria-hidden="true" />
      <div className="os-cc" role="dialog" aria-label="Control Centre" ref={panel}>
        <div className="os-cc__tile os-cc__tile--wide">
          <span className="os-cc__label" id="os-cc-appearance">Appearance</span>
          <div className="os-cc__seg" role="group" aria-labelledby="os-cc-appearance">
            {(["light", "dark"] as const).map((a) => (
              <button key={a} type="button" className="os-cc__segbtn" aria-pressed={appearance === a} onClick={() => onAppearance(a)}>
                {a === "light" ? "Light" : "Dark"}
              </button>
            ))}
          </div>
        </div>

        <button type="button" className="os-cc__tile os-cc__btn" aria-pressed={soundOn} onClick={onToggleSound}>
          <span className="os-cc__ico"><Icon d={<><path d="M4 9.5h3.5L12 6v12l-4.5-3.5H4z" />{soundOn ? <path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11" /> : <path d="m16 9.5 4 5m0-5-4 5" />}</>} /></span>
          <span className="os-cc__text"><span className="os-cc__label">Studio sound</span><span className="os-cc__sub">{soundOn ? "On" : "Off"}</span></span>
        </button>

        <button type="button" className="os-cc__tile os-cc__btn" onClick={() => { os.open("music"); onClose(); }}>
          <span className="os-cc__ico"><Icon d={<><path d="M9 17.5V6l9-2v11.5" /><circle cx="6.5" cy="17.5" r="2.5" /><circle cx="15.5" cy="15.5" r="2.5" /></>} /></span>
          <span className="os-cc__text"><span className="os-cc__label">Music</span><span className="os-cc__sub">{playlists[0]?.name ?? "Open Music"}</span></span>
        </button>

        <div className="os-cc__tile os-cc__tile--wide">
          <label className="os-cc__label" htmlFor="os-cc-brightness">Brightness</label>
          <div className="os-cc__slider">
            <Icon d={<><circle cx="12" cy="12" r="3.5" /><path d="M12 4v2M12 18v2M4 12h2M18 12h2M6.3 6.3l1.4 1.4M16.3 16.3l1.4 1.4M6.3 17.7l1.4-1.4M16.3 7.7l1.4-1.4" /></>} />
            <input id="os-cc-brightness" type="range" min={0.4} max={1} step={0.01} value={brightness} onChange={(e) => onBrightness(Number(e.target.value))} />
          </div>
        </div>

        <button type="button" className="os-cc__tile os-cc__tile--wide os-cc__btn" onClick={() => { onClose(); os.exit(); }}>
          <span className="os-cc__ico"><Icon d={<><rect x="4" y="5" width="16" height="11" rx="1.5" /><path d="M2.5 19h19" /></>} /></span>
          <span className="os-cc__text"><span className="os-cc__label">Close the lid</span><span className="os-cc__sub">Back to the room</span></span>
        </button>
      </div>
    </>
  );
}
