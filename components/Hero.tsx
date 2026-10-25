"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import "./studio/studio.css";
import { projects, spotLabels, studioNotes, type StudioSpot } from "@/lib/content";
import { studioLayerFromHash, STUDIO_OPEN_EVENT, type StudioLayer } from "@/lib/hash-nav";
import { studioSound } from "@/lib/sound";
import { phaseForHour, phases, type Phase } from "./studio/palette";
import BoothExperience from "./booth/BoothExperience";
import AskAkib from "./twin/AskAkib";
import { SiteNav } from "./SiteNav";
import SoundToggle, { SpeakerIcon } from "./SoundToggle";

const Studio = dynamic(() => import("./studio/Studio"), { ssr: false });
const Desk = dynamic(() => import("./desk/Desk"), { ssr: false });

/** The room, minus the laptop and the booth: both have their own primary action. */
const roomLinks: StudioSpot[] = ["lessons", "zoom", "workout", "culinary", "me"];

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

function usePhoneLayout() {
  const [phone, setPhone] = useState<boolean | null>(null);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 47.99rem)");
    const update = () => setPhone(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return phone;
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

/**
 * The ticking clock owns its own state, so a tick re-renders this button and nothing else. Not a live region: a screen reader would announce every change.
 *
 * The time and the light only belong together while the light follows the visitor's hour. Once they
 * pick a light, the clock keeps ticking, so showing the real time next to it would claim that the
 * studio is lit by "21:40 · morning". The chosen light is named on its own instead.
 */
function ClockButton({ phase, overridden, onClick }: { phase: Phase; overridden: boolean; onClick: () => void }) {
  const [time, setTime] = useState("--:--");
  useEffect(() => {
    const tick = () => setTime(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false }));
    tick();
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, []);
  return (
    <button
      type="button"
      className="tool tool--clock"
      onClick={onClick}
      aria-label={overridden ? `Light: ${phase}, chosen by you. Change the light` : `Light: ${phase}, from your local time. Change the light`}
    >
      {overridden ? <>Light: {phase}</> : <>{time} · {phase}</>}
    </button>
  );
}

/** The element the visitor was on when a layer opened, unless that is the page itself. */
function focusedTrigger(): HTMLElement | null {
  const el = document.activeElement;
  return el instanceof HTMLElement && el !== document.body && el !== document.documentElement ? el : null;
}

/** Give focus back to whatever opened the overlay; the chip is only the home for a deep link or a trigger that left the page. */
function restoreFocus(trigger: HTMLElement | null, fallback: HTMLElement | null) {
  const target = trigger && document.contains(trigger) ? trigger : fallback;
  target?.focus({ preventScroll: true });
}

export default function Hero() {
  const reducedMotion = useReducedMotion();
  const phoneLayout = usePhoneLayout();
  const [override, setOverride] = useState<Phase | null>(null);
  const [selected, setSelected] = useState<StudioSpot | null>(null);
  const [soundOn, setSoundOn] = useState(true);
  const [moreOpen, setMoreOpen] = useState(false);
  const [explore, setExplore] = useState(false);
  const [deskOpen, setDeskOpen] = useState(false);
  const [boothOpen, setBoothOpen] = useState(false);
  const [askOpen, setAskOpen] = useState(false);

  const panelTitle = useRef<HTMLHeadingElement>(null);
  const askChip = useRef<HTMLButtonElement>(null);
  const laptopChip = useRef<HTMLButtonElement>(null);
  const boothChip = useRef<HTMLButtonElement>(null);
  const restoreLaptopFocus = useRef(false);
  const restoreBoothFocus = useRef(false);
  const deskTrigger = useRef<HTMLElement | null>(null);
  const boothTrigger = useRef<HTMLElement | null>(null);
  const stage = useRef<HTMLDivElement>(null);
  const deskTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const autoPhase = useAutoPhase();
  const phase = override ?? autoPhase;

  const autoPhaseRef = useRef(autoPhase);
  autoPhaseRef.current = autoPhase;

  const hoverBlip = useCallback(() => { studioSound.blip("hover"); }, []);

  /** One owner for the pending laptop open: a change of mind, or another layer, cancels it so it cannot land late. */
  const cancelDeskOpen = useCallback(() => {
    if (!deskTimer.current) return;
    clearTimeout(deskTimer.current);
    deskTimer.current = null;
  }, []);

  const openLaptop = useCallback(() => {
    cancelDeskOpen();
    deskTrigger.current = focusedTrigger() ?? laptopChip.current;
    setSelected(null);
    setExplore(false);
    setBoothOpen(false);
    studioSound.blip("open");
    setDeskOpen(true);
  }, [cancelDeskOpen]);

  const openBooth = useCallback(() => {
    cancelDeskOpen(); // a pending laptop open must not land behind the booth
    boothTrigger.current = focusedTrigger() ?? boothChip.current;
    setDeskOpen(false);
    studioSound.blip("open");
    setSelected(null);
    setExplore(false);
    setMoreOpen(false);
    setBoothOpen(true);
  }, [cancelDeskOpen]);

  const select = useCallback((id: StudioSpot | null) => {
    cancelDeskOpen(); // a pending laptop open must not outlive a change of mind
    if (id === "laptop") { openLaptop(); return; }
    if (id === "booth") { openBooth(); return; }
    setSelected(id);
    if (id) { studioSound.blip("open"); setExplore(false); }
  }, [cancelDeskOpen, openBooth, openLaptop]);

  const toggleExplore = useCallback(() => {
    if (!explore) cancelDeskOpen();
    setExplore((on) => {
      if (on) return false;
      setSelected(null);
      studioSound.blip("click");
      return true;
    });
  }, [explore, cancelDeskOpen]);

  const roomView = useCallback(() => {
    cancelDeskOpen();
    setExplore(false);
    setSelected(null);
    studioSound.blip("click");
    requestAnimationFrame(() => document.getElementById("detail-kicker")?.focus({ preventScroll: true }));
  }, [cancelDeskOpen]);

  const openAsk = useCallback(() => {
    cancelDeskOpen();
    setExplore(false);
    setSelected("me");
    setAskOpen(true);
    // on narrow screens the stage sits above the detail: bring it back so the room stays in view
    if (window.matchMedia("(max-width: 59.99rem)").matches) {
      stage.current?.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "start" });
    }
  }, [cancelDeskOpen, reducedMotion]);

  const closeAsk = useCallback(() => {
    setAskOpen(false);
    requestAnimationFrame(() => askChip.current?.focus({ preventScroll: true }));
  }, []);

  /** Drop the hash a layer put in the address bar: no new history entry, and replaceState does not scroll. */
  const clearLayerHash = useCallback((layer: StudioLayer) => {
    if (studioLayerFromHash(window.location.hash) !== layer) return;
    history.replaceState(history.state, "", window.location.pathname + window.location.search);
  }, []);

  const closeDesk = useCallback(() => {
    cancelDeskOpen();
    setDeskOpen(false);
    setSelected(null);
    clearLayerHash("laptop");
    restoreLaptopFocus.current = true;
  }, [cancelDeskOpen, clearLayerHash]);

  const closeBooth = useCallback(() => {
    setBoothOpen(false);
    clearLayerHash("booth");
    restoreBoothFocus.current = true;
  }, [clearLayerHash]);

  /** The layer a Back (or an edited address) just closed. Only one layer can be open. */
  const closeOpenLayer = useCallback(() => {
    if (deskOpen) closeDesk();
    else if (boothOpen) closeBooth();
  }, [deskOpen, boothOpen, closeDesk, closeBooth]);
  const closeLayerRef = useRef(closeOpenLayer);
  closeLayerRef.current = closeOpenLayer;

  // the page behind the laptop is inert until Desk unmounts, so focus can only return once deskOpen has flipped and committed;
  // Desk's cleanup has lifted inert by the time this effect runs, so focus it here rather than on a frame that a hidden tab may never paint
  useEffect(() => {
    if (deskOpen || !restoreLaptopFocus.current) return;
    restoreLaptopFocus.current = false;
    restoreFocus(deskTrigger.current, laptopChip.current);
  }, [deskOpen]);

  // same for the booth dialog: it is gone once boothOpen flips, so focus comes back to the button that opened it
  useEffect(() => {
    if (boothOpen || !restoreBoothFocus.current) return;
    restoreBoothFocus.current = false;
    requestAnimationFrame(() => restoreFocus(boothTrigger.current, boothChip.current));
  }, [boothOpen]);

  const cycleLight = useCallback(() => {
    studioSound.blip("click");
    setOverride((p) => phases[(phases.indexOf(p ?? autoPhaseRef.current) + 1) % phases.length]);
  }, []);

  // the room tone is a module singleton: after a client-side navigation back here the switch must show its real state,
  // and after hydration rather than in the initial state, so the server and the client agree
  useEffect(() => { setSoundOn(studioSound.loadPreference()); }, []);

  const toggleSound = async () => {
    // the singleton is the truth; local state can be one remount behind
    const next = !studioSound.enabled;
    await studioSound.setEnabled(next);
    setSoundOn(next);
    if (next) studioSound.blip("click");
  };

  // Escape leaves whatever the room is showing. The booth dialog and the desk are their own layers and handle it themselves.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || boothOpen || deskOpen || askOpen) return;
      if (selected) { cancelDeskOpen(); setSelected(null); return; }
      if (explore) setExplore(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [cancelDeskOpen, selected, explore, boothOpen, deskOpen, askOpen]);

  useEffect(() => () => {
    if (deskTimer.current) clearTimeout(deskTimer.current);
  }, []);

  // deep links: /#booth opens the booth, /#laptop opens the laptop; on load and whenever the hash changes
  const linkRef = useRef({ booth: openBooth, laptop: openLaptop });
  linkRef.current = { booth: openBooth, laptop: openLaptop };
  useEffect(() => {
    const follow = () => {
      const layer = studioLayerFromHash(location.hash);
      if (layer) { linkRef.current[layer](); return; }
      // Back (or an edited address) took the layer out of the hash: that is a close, not a reason to reopen on reload
      closeLayerRef.current();
    };
    follow();
    window.addEventListener("hashchange", follow);
    // a tile whose hash is already in the address bar cannot fire hashchange; it asks us directly
    const reopen = (e: Event) => {
      const layer = (e as CustomEvent<StudioLayer>).detail;
      if (layer === "booth" || layer === "laptop") linkRef.current[layer]();
    };
    window.addEventListener(STUDIO_OPEN_EVENT, reopen);
    return () => {
      window.removeEventListener("hashchange", follow);
      window.removeEventListener(STUDIO_OPEN_EVENT, reopen);
    };
  }, []);

  const openFromButton = (id: StudioSpot) => {
    select(id);
    // on narrow screens the stage sits above the detail — bring it back so the camera move is visible
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
  // the laptop joins the room default: its layer opens on top and the detail never flickers under it
  const detailKey = selected === "laptop" ? "room" : selected ?? "room";
  const kicker = selected && selected !== "laptop" ? `Looking at · ${spotLabels[selected]}` : "The studio";

  return (
    <>
      <SiteNav wordmarkHref="#top">
        <SoundToggle on={soundOn} onToggle={toggleSound} />
      </SiteNav>

      <section className="hero" id="top" aria-label="Studio">
        <div className="wrap hero__grid">
          <div className="hero__copy">
            <p className="hero__eyebrow">Software / web engineer <span aria-hidden="true">·</span> Hong Kong</p>
            <h1 className="hero__title">I design and build <mark>strong systems</mark>, end to end.</h1>
            <p className="hero__note">Architecture, reliable infrastructure, and interfaces people can use.</p>
            <div className="hero__actions">
              <button ref={laptopChip} type="button" className="action action--primary" onClick={openLaptop}>
                {phoneLayout === null ? "Open my workspace" : phoneLayout ? "Open my phone" : "Open my laptop"}
                <span className="action__go" aria-hidden="true">↗</span>
              </button>
              <button ref={boothChip} type="button" className="action" onClick={openBooth} aria-haspopup="dialog">
                Try the photo booth
              </button>
            </div>

            <div className="hero__more">
              <button
                type="button"
                className="more-toggle"
                aria-expanded={moreOpen}
                aria-controls="room-tools"
                onClick={() => setMoreOpen((o) => !o)}
              >
                More in the room
                <ChevronIcon />
              </button>
              <div className="hero__tools" id="room-tools" hidden={!moreOpen}>
                {roomLinks.map((id) => (
                  <button
                    key={id}
                    type="button"
                    className="room-link"
                    aria-pressed={selected === id}
                    onClick={() => openFromButton(id)}
                  >
                    {spotLabels[id]}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="hero__stage-col">
            <div className="hero__stage" data-explore={explore ? "true" : "false"} ref={stage}>
              {phoneLayout === null ? null : (
                <Studio
                  phase={phase}
                  selected={selected}
                  onSelect={select}
                  onCycleLight={cycleLight}
                  onHover={hoverBlip}
                  reducedMotion={reducedMotion}
                  paused={deskOpen || boothOpen}
                  explore={explore}
                  phone={phoneLayout}
                />
              )}
            </div>

            <section className="detail" aria-label="Studio detail">
              <div className="detail__head">
                <p className="detail__kicker" id="detail-kicker" tabIndex={-1}>{kicker}</p>
                <div className="detail__tools">
                  <ClockButton phase={phase} overridden={override !== null} onClick={cycleLight} />
                  <button
                    type="button"
                    className="tool"
                    aria-pressed={explore}
                    onClick={toggleExplore}
                    aria-label={explore ? "Stop exploring the room" : "Explore the room by dragging"}
                  >
                    <OrbitIcon />
                    {explore ? "Done" : "Explore"}
                  </button>
                  {(selected || explore) && (
                    <button type="button" className="tool" onClick={roomView}>
                      <HomeIcon />
                      Room view
                    </button>
                  )}
                </div>
              </div>

              <div className="detail__body" key={detailKey}>
                {project ? (
                  <>
                    <h2 className="detail__title" ref={panelTitle} tabIndex={-1}>{project.title}</h2>
                    <p className="detail__meta">{project.meta}</p>
                    <p className="detail__text">{project.text}</p>
                    <p className="detail__outcome">
                      {project.outcome}
                      <span className="detail__note">{project.outcomeNote}</span>
                    </p>
                    <div className="detail__actions">
                      <button type="button" className="chip" onClick={() => readMore(project.id)}>Read the work ↓</button>
                      {project.link && (
                        <a className="chip" href={project.link.href} target="_blank" rel="noreferrer">{project.link.label} ↗</a>
                      )}
                      <button type="button" className="chip" onClick={() => setSelected(null)}>Back to the room</button>
                    </div>
                  </>
                ) : note ? (
                  <>
                    <h2 className="detail__title" ref={panelTitle} tabIndex={-1}>{note.title}</h2>
                    <p className="detail__meta">{note.kicker}</p>
                    <p className="detail__text">{note.body}</p>
                    <p className="detail__outcome">{note.outcome}</p>
                    <div className="detail__actions">
                      {selected === "mic" && (
                        <button type="button" className="chip" aria-pressed={soundOn} onClick={toggleSound}>
                          <SpeakerIcon on={soundOn} /> {soundOn ? "Sound on" : "Turn sound on"}
                        </button>
                      )}
                      {selected === "me" && (
                        <button ref={askChip} type="button" className="chip chip--accent" onClick={openAsk} aria-haspopup="dialog">
                          Ask me
                        </button>
                      )}
                      <a
                        className="chip"
                        href={selected === "mic" ? "#sound" : "#about"}
                        onClick={() => setSelected(null)}
                      >
                        {selected === "mic" ? "Listen ↓" : "About me ↓"}
                      </a>
                      <button type="button" className="chip" onClick={() => setSelected(null)}>Back to the room</button>
                    </div>
                  </>
                ) : null}
              </div>
            </section>
          </div>
        </div>
      </section>

      <AskAkib open={askOpen} onClose={closeAsk} soundOn={soundOn} onToggleSound={toggleSound} />
      {deskOpen && <Desk onClose={closeDesk} phone={phoneLayout === true} />}
      {boothOpen && <BoothExperience onClose={closeBooth} reducedMotion={reducedMotion} />}
    </>
  );
}

function ChevronIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function OrbitIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="3.2" />
      <path d="M3.2 12c0 2.4 3.9 4.3 8.8 4.3s8.8-1.9 8.8-4.3S16.9 7.7 12 7.7 3.2 9.6 3.2 12Z" />
      <path d="M12 3.2c2.4 0 4.3 3.9 4.3 8.8s-1.9 8.8-4.3 8.8S7.7 16.9 7.7 12 9.6 3.2 12 3.2Z" />
    </svg>
  );
}

function HomeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m4 11 8-6.5 8 6.5" />
      <path d="M6.5 9.6V19h11V9.6" />
    </svg>
  );
}
