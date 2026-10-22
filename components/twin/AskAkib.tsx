"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import "./twin.css";
import { STARTERS, answer, entries, type TwinAnswer } from "@/lib/twin";
import { studioSound } from "@/lib/sound";
import type { AkibPose } from "../studio/Akib";

export type AkibState = { pose: AkibPose; mouth?: number };

type Props = {
  open: boolean;
  onClose: () => void;
  /** Reports the character's pose and mouth while the panel is open; null once it closes. */
  onAkib: (state: AkibState | null) => void;
  soundOn: boolean;
  /** Turns the site's sound on or off (Hero owns it). */
  onToggleSound: () => Promise<void>;
};

type Turn = { id: number; question: string; reply: TwinAnswer };

/** Private file names never reach the screen; `sources` keeps them for auditing. */
function sourceLabels(sources: string[]): string[] {
  const label = (s: string) => (s.startsWith("WORK_RECORD") ? "Work notes" : s.startsWith("PORTFOLIO_PLAN") ? "Project notes" : s.startsWith("CV") ? "CV" : "Site notes");
  return [...new Set(sources.map(label))];
}

const WAVE_MS = 1500;
const MOUTH_PEAK = 0.8;
const MOUTH_DECAY_MS = 120;

/** Prefer an English male voice when the browser has one; otherwise any English voice; otherwise the default. */
function pickVoice(): SpeechSynthesisVoice | undefined {
  const english = window.speechSynthesis.getVoices().filter((v) => v.lang.toLowerCase().startsWith("en"));
  const female = /female|samantha|karen|moira|tessa|fiona|victoria|zira|susan|hazel|jenny|aria/i;
  const male = /\bmale\b|daniel|alex|fred|david|james|mark|guy|george|oliver|arthur|rishi|aaron/i;
  return english.find((v) => male.test(v.name) && !female.test(v.name)) ?? english.find((v) => !female.test(v.name)) ?? english[0];
}

export default function AskAkib({ open, onClose, onAkib, soundOn, onToggleSound }: Props) {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [text, setText] = useState("");
  const [focused, setFocused] = useState(false);
  const [waving, setWaving] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [mouth, setMouth] = useState<number | undefined>(undefined);
  const [canSpeak, setCanSpeak] = useState(false);

  const input = useRef<HTMLInputElement>(null);
  const log = useRef<HTMLDivElement>(null);
  const nextId = useRef(1);
  const utter = useRef<SpeechSynthesisUtterance | null>(null);
  const decay = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastSpoken = useRef<string | null>(null);

  useEffect(() => { setCanSpeak(typeof window !== "undefined" && "speechSynthesis" in window); }, []);

  const stopDecay = () => { if (decay.current) { clearInterval(decay.current); decay.current = null; } };

  /** Mouth opens to its peak on each word boundary and decays to shut over 120 ms. */
  const pulse = useCallback(() => {
    stopDecay();
    const t0 = performance.now();
    setMouth(MOUTH_PEAK);
    decay.current = setInterval(() => {
      const v = MOUTH_PEAK * (1 - (performance.now() - t0) / MOUTH_DECAY_MS);
      if (v <= 0.02) { setMouth(0); stopDecay(); } else setMouth(v);
    }, 40);
  }, []);

  const silence = useCallback(() => {
    stopDecay();
    utter.current = null;
    lastSpoken.current = null;
    if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
    setSpeaking(false);
    setMouth(undefined);
  }, []);

  const speak = useCallback((line: string) => {
    lastSpoken.current = line;
    if (!studioSound.enabled || typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    stopDecay();
    const u = new SpeechSynthesisUtterance(line);
    const voice = pickVoice();
    if (voice) u.voice = voice;
    u.lang = voice?.lang ?? "en-US";
    u.rate = 1;
    utter.current = u;
    const mine = () => utter.current === u;   // a cancelled utterance reports late; ignore it once a newer one exists
    u.onstart = () => { if (mine()) { setSpeaking(true); setMouth(undefined); } };   // until a boundary arrives the character flaps on its own
    u.onboundary = () => { if (mine()) pulse(); };
    const done = () => { if (mine()) { utter.current = null; stopDecay(); setSpeaking(false); setMouth(0); } };
    u.onend = done;
    u.onerror = done;
    window.speechSynthesis.speak(u);
  }, [pulse]);

  const ask = useCallback((question: string) => {
    const q = question.trim();
    if (!q) return;
    const reply = answer(q);
    setTurns((t) => [...t.slice(-7), { id: nextId.current++, question: q, reply }]);
    setText("");
    speak(reply.answer);
  }, [speak]);

  // opening: wave for 1.5 s, focus the input. closing: stop talking.
  useEffect(() => {
    if (!open) { silence(); setWaving(false); return; }
    setWaving(true);
    const t = setTimeout(() => setWaving(false), WAVE_MS);
    input.current?.focus({ preventScroll: true });
    return () => clearTimeout(t);
  }, [open, silence]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => () => silence(), [silence]);

  const pose: AkibPose = speaking ? "talk" : waving ? "wave" : focused || text.length > 0 ? "listen" : "typing";
  useEffect(() => {
    onAkib(open ? { pose, mouth: speaking ? mouth : undefined } : null);
  }, [open, pose, mouth, speaking, onAkib]);

  useEffect(() => { log.current?.scrollTo({ top: log.current.scrollHeight }); }, [turns]);

  const toggleSound = async () => {
    await onToggleSound();
    if (studioSound.enabled && lastSpoken.current) speak(lastSpoken.current);
    else silence();
  };

  if (!open) return null;

  const latest = turns[turns.length - 1];
  const chips: { id: string; question: string }[] = latest
    ? latest.reply.followUps
    : STARTERS.flatMap((id) => { const e = entries.find((x) => x.id === id); return e ? [{ id, question: e.questions[0] }] : []; });

  return (
    <section className="twin" role="dialog" aria-label="Ask Akib">
      <header className="twin__head">
        <h2 className="twin__title">Ask Akib</h2>
        <button type="button" className="twin__close" onClick={onClose} aria-label="Close">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
        </button>
      </header>

      <div className="twin__log" ref={log} aria-live="polite" aria-relevant="additions">
        {turns.length === 0 && <p className="twin__hint">Ask me about my work, my stack or how to reach me. I wrote every answer myself.</p>}
        {turns.map((t) => (
          <div className="twin__turn" key={t.id}>
            <p className="twin__q"><span className="twin__sr">You asked: </span>{t.question}</p>
            <p className="twin__a"><span className="twin__sr">Akib: </span>{t.reply.answer}</p>
            {t.reply.sources.length > 0 && <p className="twin__src">From: {sourceLabels(t.reply.sources).join(" · ")}</p>}
            {t.reply.action?.run.type === "href" && (t.reply.action.run.newTab
              ? <a className="chip twin__action" href={t.reply.action.run.href} target="_blank" rel="noopener noreferrer">{t.reply.action.label}</a>
              : <Link className="chip twin__action" href={t.reply.action.run.href}>{t.reply.action.label}</Link>)}
          </div>
        ))}
      </div>

      {chips.length > 0 && (
        <ul className="twin__chips" aria-label={latest ? "Follow-up questions" : "Suggested questions"}>
          {chips.map((c) => (
            <li key={c.id}><button type="button" className="chip" onClick={() => ask(c.question)}>{c.question}</button></li>
          ))}
        </ul>
      )}

      <form className="twin__form" onSubmit={(e: FormEvent) => { e.preventDefault(); ask(text); }}>
        <input
          ref={input}
          className="twin__input"
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="Ask me anything about my work"
          aria-label="Your question"
          autoComplete="off"
          maxLength={200}
        />
        <button type="submit" className="chip chip--accent twin__send" disabled={!text.trim()}>Send</button>
      </form>

      {canSpeak && (
        <button type="button" className="twin__sound" aria-pressed={soundOn} onClick={toggleSound}>
          {soundOn ? "Sound on: I speak my answers" : "Turn on sound to hear me"}
        </button>
      )}
    </section>
  );
}
