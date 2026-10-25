"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import "./studio/studio.css";
import { projects, spotLabels, studioNotes, type StudioSpot } from "@/lib/content";
import { studioSound } from "@/lib/sound";
import { phaseForHour, phases, type Phase } from "./studio/palette";
import BoothExperience from "./booth/BoothExperience";
import AskAkib, { type AkibState } from "./twin/AskAkib";
import { SiteNav } from "./SiteNav";

const Studio = dynamic(() => import("./studio/Studio"), { ssr: false });
const Desk = dynamic(() => import("./desk/Desk"), { ssr: false });

/** The room, minus the laptop and the booth: both have their own primary action. */
const roomLinks: StudioSpot[] = ["video", "lessons", "zoom", "workout", "culinary", "mic", "me"];

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
    <button type="button" className="tool tool--clock" onClick={onClick} aria-label={`Light: ${phase}. Change the light`}>
      {time} · {phase}
    </button>
  );
}

export default function Hero() {
  const reducedMotion = useReducedMotion();
  const [override, setOverride] = useState<Phase | null>(null);
  const [selected, setSelected] = useState<StudioSpot | null>(null);
  const [soundOn, setSoundOn] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [explore, setExplore] = useState(false);
  const [deskOpen, setDeskOpen] = useState(false);
  const [boothOpen, setBoothOpen] = useState(false);
  const [askOpen, setAskOpen] = useState(false);
  const [akib, setAkib] = useState<AkibState | null>(null);

  const panelTitle = useRef<HTMLHeadingElement>(null);
  const askChip = useRef<HTMLButtonElement>(null);
  const laptopChip = useRef<HTMLButtonElement>(null);
  const boothChip = useRef<HTMLButtonElement>(null);
  const restoreLaptopFocus = useRef(false);
  const restoreBoothFocus = useRef(false);
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
    setSelected("laptop");
    setExplore(false);
    setBoothOpen(false); // the desk and the booth never stack
    studioSound.blip("open");
    // the laptop opens as its own layer once the camera has settled on it
    deskTimer.current = setTimeout(() => { deskTimer.current = null; setDeskOpen(true); }, reducedMotion ? 0 : 280);
  }, [cancelDeskOpen, reducedMotion]);

  const openBooth = useCallback(() => {
    cancelDeskOpen(); // a pending laptop open must not land behind the booth
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
    // on narrow screens the stage sits above the detail: bring it back so the character is visible while it talks
    if (window.matchMedia("(max-width: 59.99rem)").matches) {
      stage.current?.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "start" });
    }
  }, [cancelDeskOpen, reducedMotion]);

  const closeAsk = useCallback(() => {
    setAskOpen(false);
    setAkib(null);
    requestAnimationFrame(() => askChip.current?.focus({ preventScroll: true }));
  }, []);

  const closeDesk = useCallback(() => {
    cancelDeskOpen();
    setDeskOpen(false);
    setSelected(null);
    restoreLaptopFocus.current = true;
  }, [cancelDeskOpen]);

  const closeBooth = useCallback(() => {
    setBoothOpen(false);
    restoreBoothFocus.current = true;
  }, []);

  // the page behind the laptop is inert until Desk unmounts, so focus can only return once deskOpen has flipped and committed;
  // Desk's cleanup has lifted inert by the time this effect runs, so focus it here rather than on a frame that a hidden tab may never paint
  useEffect(() => {
    if (deskOpen || !restoreLaptopFocus.current) return;
    restoreLaptopFocus.current = false;
    laptopChip.current?.focus({ preventScroll: true });
  }, [deskOpen]);

  // same for the booth dialog: it is gone once boothOpen flips, so focus comes back to the button that opened it
  useEffect(() => {
    if (boothOpen || !restoreBoothFocus.current) return;
    restoreBoothFocus.current = false;
    requestAnimationFrame(() => boothChip.current?.focus({ preventScroll: true }));
  }, [boothOpen]);

  const cycleLight = useCallback(() => {
    studioSound.blip("click");
    setOverride((p) => phases[(phases.indexOf(p ?? autoPhaseRef.current) + 1) % phases.length]);
  }, []);

  const toggleSound = async () => {
    const next = !soundOn;
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
      if (location.hash === "#booth") linkRef.current.booth();
      else if (location.hash === "#laptop") linkRef.current.laptop();
    };
    follow();
    window.addEventListener("hashchange", follow);
    return () => window.removeEventListener("hashchange", follow);
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
        <button className="chip chip--icon" type="button" aria-pressed={soundOn} onClick={toggleSound}>
          <SpeakerIcon on={soundOn} />
          <span className="chip__label">{soundOn ? "Sound on" : "Sound off"}</span>
        </button>
      </SiteNav>

      <section className="hero" id="top" aria-label="Studio">
        <div className="wrap hero__grid">
          <div className="hero__copy">
            <p className="hero__eyebrow">Hong Kong <span aria-hidden="true">·</span> software engineer</p>
            <h1 className="hero__title">I make AI feel <mark>handmade</mark>.</h1>
            <p className="hero__note">
              I build AI products end to end, from the GPU server to the last sound effect. Open the laptop for
              the work, or step into the booth.
            </p>
            <div className="hero__actions">
              <button ref={laptopChip} type="button" className="action action--primary" onClick={openLaptop}>
                Open my laptop
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
              <Studio
                phase={phase}
                selected={selected}
                onSelect={select}
                onCycleLight={cycleLight}
                onHover={hoverBlip}
                reducedMotion={reducedMotion}
                paused={deskOpen || boothOpen}
                explore={explore}
                akibPose={akib?.pose}
                akibMouth={akib?.mouth}
              />
            </div>

            <section className="detail" aria-label="Studio detail">
              <div className="detail__head">
                <p className="detail__kicker" id="detail-kicker" tabIndex={-1}>{kicker}</p>
                <div className="detail__tools">
                  <ClockButton phase={phase} onClick={cycleLight} />
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
                ) : (
                  <div className="detail__default">
                    <p className="detail__hint">
                      Everything here is something I made: the room, the booth, the sounds. Choose an object in the
                      scene, or one from the list.
                    </p>
                    <div className="detail__actions">
                      <Link className="chip" href="/blog">All work</Link>
                      <Link className="chip" href="/projects">Projects</Link>
                    </div>
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>
      </section>

      <AskAkib open={askOpen} onClose={closeAsk} onAkib={setAkib} soundOn={soundOn} onToggleSound={toggleSound} />
      {deskOpen && <Desk onClose={closeDesk} />}
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

function SpeakerIcon({ on }: { on: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 9h3l5-4v14l-5-4H4z" />
      {on ? <path d="M16 9a4 4 0 0 1 0 6M18.5 6.5a7.5 7.5 0 0 1 0 11" /> : <path d="M17 9l5 6M22 9l-5 6" />}
    </svg>
  );
}
