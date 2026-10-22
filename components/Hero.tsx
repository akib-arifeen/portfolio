"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import "./studio/studio.css";
import { contact, projects, studioNotes, type StudioSpot } from "@/lib/content";
import { studioSound } from "@/lib/sound";
import { phaseForHour, phases, type Phase } from "./studio/palette";
import BoothScreen from "./booth/BoothScreen";
import { useBooth } from "./booth/useBooth";
import AskAkib, { type AkibState } from "./twin/AskAkib";

const Studio = dynamic(() => import("./studio/Studio"), { ssr: false });
const Desk = dynamic(() => import("./desk/Desk"), { ssr: false });

const lookAt: [StudioSpot, string][] = [
  ["video", "the monitor"],
  ["booth", "the photobooth"],
  ["lessons", "the bookshelf"],
  ["mic", "the mic"],
  ["me", "me"],
  ["laptop", "my laptop"],
];

function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const on = () => setReduced(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return reduced;
}

/** The light follows the visitor's hour. Holds only the phase, so the 30 s tick re-renders Hero (and the whole Studio) only when the phase really changes. */
function useAutoPhase() {
  const [auto, setAuto] = useState<Phase>("evening");
  useEffect(() => {
    const tick = () => setAuto(phaseForHour(new Date().getHours()));
    tick();
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, []);
  return auto;
}

/** The ticking clock owns its own state, so a tick re-renders this button and nothing else. Not a live region: a screen reader would announce every change. */
function ClockButton({ phase, onClick }: { phase: Phase; onClick: () => void }) {
  const [time, setTime] = useState("--:--");
  useEffect(() => {
    const tick = () => setTime(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false }));
    tick();
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, []);
  return (
    <p className="hero__clock">
      <button type="button" onClick={onClick} aria-label={`Light: ${phase}. Change the light`}>
        {time} · {phase} light
      </button>
    </p>
  );
}

export default function Hero() {
  const reducedMotion = useReducedMotion();
  const [override, setOverride] = useState<Phase | null>(null);
  const [selected, setSelected] = useState<StudioSpot | null>(null);
  const [soundOn, setSoundOn] = useState(false);
  const [deskOpen, setDeskOpen] = useState(false);
  const [boothMode, setBoothMode] = useState(false);
  const [curtain, setCurtain] = useState(false);
  const booth = useBooth(boothMode);
  const panelTitle = useRef<HTMLHeadingElement>(null);
  const [askOpen, setAskOpen] = useState(false);
  const [akib, setAkib] = useState<AkibState | null>(null);
  const askChip = useRef<HTMLButtonElement>(null);
  const laptopChip = useRef<HTMLButtonElement>(null);
  const restoreLaptopFocus = useRef(false);
  const stage = useRef<HTMLDivElement>(null);

  const autoPhase = useAutoPhase();
  const phase = override ?? autoPhase;

  // walking up to the photobooth: a brief paper curtain hides the switch to the eye-level camera
  const setBooth = useCallback((on: boolean) => {
    setCurtain(true);
    setTimeout(() => {
      setBoothMode(on);
      if (on) document.body.dataset.booth = "true"; else delete document.body.dataset.booth;
      if (!on) setSelected(null);
      setTimeout(() => setCurtain(false), 60);
    }, reducedMotion ? 0 : 260);
  }, [reducedMotion]);

  const hoverBlip = useCallback(() => { studioSound.blip("hover"); }, []);
  const deskTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const select = useCallback((id: StudioSpot | null) => {
    if (id === "booth") { studioSound.blip("open"); setSelected("booth"); setBooth(true); return; }
    if (deskTimer.current) { clearTimeout(deskTimer.current); deskTimer.current = null; } // a pending laptop open must not outlive a change of mind
    setSelected(id);
    if (id) studioSound.blip("open");
    // the laptop opens as its own layer once the camera has dived into the screen
    if (id === "laptop") deskTimer.current = setTimeout(() => { deskTimer.current = null; setDeskOpen(true); }, reducedMotion ? 0 : 280);
  }, [reducedMotion, setBooth]);

  // "Ask me": the camera settles on the character and the docked panel opens
  const openAsk = useCallback(() => {
    select("me");
    setAskOpen(true);
    // on narrow screens the room sits above the buttons: bring it back so the character is visible while it talks
    if (window.matchMedia("(max-width: 59.99rem)").matches) {
      stage.current?.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "start" });
    }
  }, [select, reducedMotion]);

  const closeAsk = useCallback(() => {
    setAskOpen(false);
    setAkib(null);
    setSelected((s) => (s === "me" ? null : s));
    requestAnimationFrame(() => askChip.current?.focus({ preventScroll: true }));
  }, []);

  // the booth and the laptop are their own layers: the panel steps aside
  useEffect(() => { if (boothMode || deskOpen) { setAskOpen(false); setAkib(null); } }, [boothMode, deskOpen]);

  const closeDesk = useCallback(() => {
    if (deskTimer.current) { clearTimeout(deskTimer.current); deskTimer.current = null; }
    setDeskOpen(false);
    setSelected(null);
    restoreLaptopFocus.current = true;
  }, []);

  // the page behind the laptop is inert until Desk unmounts, so focus can only return once deskOpen has flipped and committed
  useEffect(() => {
    if (deskOpen || !restoreLaptopFocus.current) return;
    restoreLaptopFocus.current = false;
    requestAnimationFrame(() => laptopChip.current?.focus({ preventScroll: true }));
  }, [deskOpen]);

  const cycleLight = useCallback(() => {
    studioSound.blip("click");
    setOverride((p) => phases[(phases.indexOf(p ?? autoPhase) + 1) % phases.length]);
  }, [autoPhase]);

  const toggleSound = async () => {
    const next = !soundOn;
    await studioSound.setEnabled(next);
    setSoundOn(next);
    if (next) studioSound.blip("click");
  };

  useEffect(() => {
    if (!selected || selected === "laptop") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (boothMode) setBooth(false); else setSelected(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selected, boothMode, setBooth]);

  useEffect(() => () => {
    delete document.body.dataset.booth;
    if (deskTimer.current) clearTimeout(deskTimer.current);
  }, []);

  // deep links: /#booth walks up to the booth, /#laptop opens the laptop; on load and whenever the hash changes
  const selectRef = useRef(select);
  selectRef.current = select;
  useEffect(() => {
    const follow = () => {
      if (location.hash === "#booth") selectRef.current("booth");
      else if (location.hash === "#laptop") selectRef.current("laptop");
    };
    follow();
    window.addEventListener("hashchange", follow);
    return () => window.removeEventListener("hashchange", follow);
  }, []);

  const openFromButton = (id: StudioSpot) => {
    select(id);
    if (id === "laptop" || id === "booth") return;
    // on narrow screens the room sits above the buttons — bring it back so the camera move is visible
    if (window.matchMedia("(max-width: 59.99rem)").matches) {
      stage.current?.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "start" });
    }
    requestAnimationFrame(() => panelTitle.current?.focus({ preventScroll: true }));
  };

  const readMore = (id: StudioSpot) => {
    const row = document.getElementById(`work-${id}`);
    setSelected(null);
    if (!row) return;
    row.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "center" });
    row.dataset.flash = "true";
    setTimeout(() => { row.dataset.flash = "false"; }, 2400);
  };

  const project = projects.find((p) => p.id === selected);
  const note = selected === "mic" || selected === "me" ? studioNotes[selected] : null;

  return (
    <>
      <header className="nav">
        <div className="wrap nav__inner">
          <a className="wordmark" href="#top">Akib Arifeen</a>
          <div className="nav__actions">
            <button className="chip" type="button" aria-pressed={soundOn} onClick={toggleSound}>
              <SpeakerIcon on={soundOn} />
              <span className="chip__label">{soundOn ? "Sound on" : "Sound off"}</span>
            </button>
            <a className="chip" href={contact.cv} download>CV</a>
          </div>
        </div>
      </header>

      <section className="hero" id="top" aria-label="Studio" data-focus={selected ? "true" : "false"}>
        <div className="hero__stage" ref={stage}>
          <Studio
            phase={phase}
            selected={selected}
            onSelect={select}
            onCycleLight={cycleLight}
            onHover={hoverBlip}
            reducedMotion={reducedMotion}
            paused={deskOpen}
            boothMode={boothMode}
            boothScreen={(w) => <BoothScreen booth={booth} width={w} />}
            cardUrl={booth.step === "printing" || booth.step === "done" ? booth.card : null}
            onCardPresented={booth.presented}
            flashKey={booth.flashKey}
            akibPose={akib?.pose}
            akibMouth={akib?.mouth}
          />
          <ClockButton phase={phase} onClick={cycleLight} />
        </div>

        <div className="wrap hero__copy">
          <div className="reveal">
          <h1 className="hero__title">I make AI feel <mark>handmade</mark>.</h1>
          <p className="hero__note">
            Software engineer in Hong Kong. I build AI products end to end, from the GPU server to the last
            sound effect. Click around the studio, or scroll for the work.
          </p>
          <div className="hero__look">
            <button ref={askChip} type="button" className="chip chip--accent" onClick={openAsk} aria-haspopup="dialog" aria-expanded={askOpen}>
              Ask me
            </button>
            <span>Look at</span>
            {lookAt.map(([id, label]) => (
              <button key={id} ref={id === "laptop" ? laptopChip : undefined} type="button" className="chip" onClick={() => openFromButton(id)} aria-pressed={selected === id}>
                {label}
              </button>
            ))}
          </div>
          </div>
        </div>
      </section>

      <AskAkib open={askOpen} onClose={closeAsk} onAkib={setAkib} soundOn={soundOn} onToggleSound={toggleSound} />
      {deskOpen && <Desk onClose={closeDesk} />}
      {boothMode && (
        <div className="bhud">
          <button type="button" className="chip bhud__away" onClick={() => setBooth(false)}>Step away</button>
          {booth.step === "done" && booth.card && (
            <div className="bhud__done">
              <button type="button" className="chip chip--accent" onClick={booth.download}>Download the card</button>
              <button type="button" className="chip" onClick={booth.tryAnother}>Try another look</button>
              <button type="button" className="chip" onClick={booth.retake}>Retake</button>
            </div>
          )}
        </div>
      )}
      <div className="curtain" data-on={curtain} aria-hidden="true" />

      <aside className="panel" data-open={selected && selected !== "laptop" && !askOpen ? "true" : "false"} aria-hidden={!selected || selected === "laptop" || askOpen} aria-label="Studio detail">
        {project && (
          <>
            <p className="panel__kicker">{project.meta}</p>
            <h2 className="panel__title" ref={panelTitle} tabIndex={-1}>{project.title}</h2>
            <p className="panel__body">{project.text}</p>
            <p className="panel__outcome">{project.outcome}<span className="panel__note">{project.outcomeNote}</span></p>
            <div className="panel__actions">
              <button type="button" className="chip" onClick={() => readMore(project.id)}>Read more ↓</button>
              {project.link && <a className="chip" href={project.link.href} target="_blank" rel="noreferrer">{project.link.label} ↗</a>}
              <button type="button" className="chip" onClick={() => setSelected(null)}>Close</button>
            </div>
          </>
        )}
        {note && (
          <>
            <p className="panel__kicker">{note.kicker}</p>
            <h2 className="panel__title" ref={panelTitle} tabIndex={-1}>{note.title}</h2>
            <p className="panel__body">{note.body}</p>
            <p className="panel__outcome">{note.outcome}</p>
            <div className="panel__actions">
              {selected === "mic" && (
                <button type="button" className="chip" aria-pressed={soundOn} onClick={toggleSound}>
                  <SpeakerIcon on={soundOn} /> {soundOn ? "Sound on" : "Turn sound on"}
                </button>
              )}
              {selected === "me" && <button type="button" className="chip chip--accent" onClick={openAsk}>Ask me</button>}
              <a className="chip" href={selected === "mic" ? "#sound" : "#about"} onClick={() => setSelected(null)}>
                {selected === "mic" ? "Listen ↓" : "About me ↓"}
              </a>
              <button type="button" className="chip" onClick={() => setSelected(null)}>Close</button>
            </div>
          </>
        )}
      </aside>
    </>
  );
}

function SpeakerIcon({ on }: { on: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 9h3l5-4v14l-5-4H4z" />
      {on ? <path d="M16 9a4 4 0 0 1 0 6M18.5 6.5a7.5 7.5 0 0 1 0 11" /> : <path d="M17 9l5 6M22 9l-5 6" />}
    </svg>
  );
}
