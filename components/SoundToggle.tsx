"use client";

import { useEffect, useState } from "react";
import { studioSound } from "@/lib/sound";

type Props = {
  /** Controlled mode: the caller owns the state (the studio's hero does). Omit both for a standalone switch. */
  on?: boolean;
  onToggle?: () => void;
};

/**
 * The site's sound switch: one control, one behaviour, on the studio and on every page after it.
 *
 * The room tone is a module singleton, so an uncontrolled switch can follow it without any wiring.
 * It is read after hydration rather than during render — the server cannot know it, and a value
 * that differs between the server and the client would break hydration on a client-side visit.
 */
export default function SoundToggle({ on, onToggle }: Props) {
  const [localOn, setLocalOn] = useState(true);
  useEffect(() => {
    if (on === undefined) setLocalOn(studioSound.loadPreference());
  }, [on]);

  const isOn = on ?? localOn;

  const toggle = () => {
    if (onToggle) {
      onToggle();
      return;
    }
    const next = !localOn;
    setLocalOn(next);
    void studioSound.setEnabled(next);
  };

  return (
    <button className="chip chip--icon" type="button" aria-pressed={isOn} onClick={toggle}>
      <SpeakerIcon on={isOn} />
      <span className="chip__label">{isOn ? "Sound on" : "Sound off"}</span>
    </button>
  );
}

export function SpeakerIcon({ on }: { on: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 9h3l5-4v14l-5-4H4z" />
      {on ? <path d="M16 9a4 4 0 0 1 0 6M18.5 6.5a7.5 7.5 0 0 1 0 11" /> : <path d="M17 9l5 6M22 9l-5 6" />}
    </svg>
  );
}
