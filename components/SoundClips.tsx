"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { playItems } from "@/lib/os/playground";
import ariPeaks from "@/public/sound/ari-lets-go.peaks.json";
import { studioSound } from "@/lib/sound";

type Playing = "kit" | "ari" | null;

const KIT_MS = 1400; // the kit's last blip starts at 820 ms and rings for about half a second
const ARI_SRC = "/sound/ari-lets-go.m4a";
const ARI_SECONDS = 10; // measured: 10.005 s

const loopcraft = playItems.find((i) => i.slug === "loopcraft");

// Real peaks for the ARI clip: 48 buckets of its decoded audio, computed with ffmpeg (public/sound/ari-lets-go.peaks.json).
const ARI_PEAKS: number[] = ariPeaks;

// Peaks for the synthesised kit, derived from the blip schedule in lib/sound.ts: [start s, length s, peak gain].
// Each blip rises over 6 ms and decays exponentially to silence, as in studioSound.blip.
const KIT_BLIPS: [number, number, number][] = [
  [0, 0.035, 0.025], [0.16, 0.035, 0.025], [0.42, 0.08, 0.06], [0.82, 0.45, 0.035], [0.89, 0.5, 0.025],
];
const KIT_PEAKS: number[] = (() => {
  const level = (t: number) =>
    KIT_BLIPS.reduce((sum, [t0, d, g]) => {
      const x = t - t0;
      if (x < 0 || x > d) return sum;
      return sum + (x < 0.006 ? g * (x / 0.006) : g * Math.pow(0.0001 / g, (x - 0.006) / (d - 0.006)));
    }, 0);
  const raw = Array.from({ length: 48 }, (_, i) => {
    let m = 0;
    for (let k = 0; k < 8; k++) m = Math.max(m, level(((i + k / 8) * KIT_MS) / 48 / 1000));
    return m;
  });
  const top = Math.max(...raw);
  return raw.map((v) => Math.round((0.12 + 0.88 * (v / top)) * 100) / 100); // rounded so server and browser render identical markup
})();

/** A waveform of real peaks, filled in as the clip plays. */
function Wave({ peaks, progress }: { peaks: number[]; progress: number }) {
  const bars = peaks;
  const draw = (cls: string) => (
    <svg className={cls} viewBox="0 0 96 32" preserveAspectRatio="none" aria-hidden="true">
      {bars.map((h, i) => (
        <rect key={i} x={i * 2} y={(16 - h * 14).toFixed(2)} width="1.1" height={(h * 28).toFixed(2)} rx="0.5" fill="currentColor" />
      ))}
    </svg>
  );
  return (
    <div className="wave">
      {draw("wave__base")}
      <div className="wave__done" style={{ clipPath: `inset(0 ${(100 - progress * 100).toFixed(1)}% 0 0)` }}>{draw("wave__fill")}</div>
    </div>
  );
}

const mmss = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

const PlayIcon = () => <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z" /></svg>;
const PauseIcon = () => <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 5h4v14H7zM13 5h4v14h-4z" /></svg>;

export default function SoundClips() {
  const audio = useRef<HTMLAudioElement>(null);
  const raf = useRef(0);
  const [playing, setPlaying] = useState<Playing>(null);
  const [kitT, setKitT] = useState(0);
  const [ariT, setAriT] = useState(0);
  const [ariLen, setAriLen] = useState(ARI_SECONDS);

  useEffect(() => () => cancelAnimationFrame(raf.current), []);

  const stopKit = () => { cancelAnimationFrame(raf.current); setKitT(0); };

  const toggleKit = () => {
    if (playing === "kit") return; // the kit is a 1.4 s demo; it plays through
    audio.current?.pause();
    setAriT(0);
    setPlaying("kit");
    void studioSound.playKit();
    const t0 = performance.now();
    const tick = (now: number) => {
      const k = Math.min(1, (now - t0) / KIT_MS);
      setKitT(k);
      if (k < 1) raf.current = requestAnimationFrame(tick);
      else { setPlaying(null); setKitT(0); }
    };
    raf.current = requestAnimationFrame(tick);
  };

  const toggleAri = () => {
    const a = audio.current;
    if (!a) return;
    if (playing === "ari") { a.pause(); setPlaying(null); return; }
    if (playing === "kit") { stopKit(); setPlaying(null); }
    a.play().then(() => setPlaying("ari"), () => setPlaying(null));
  };

  return (
    <ul className="clips">
      <li className="clip" data-playing={playing === "kit"}>
        <button type="button" className="clip__play" onClick={toggleKit} aria-label="Play the interface sound kit" aria-pressed={playing === "kit"}>
          <PlayIcon />
        </button>
        <div className="clip__text">
          <p className="clip__name">Interface sound kit</p>
          <p className="clip__desc">Hover, click and open sounds for this site, synthesised with no samples. Plays even with sound off.</p>
        </div>
        <div className="clip__track" role="progressbar" aria-label="Interface sound kit progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(kitT * 100)}>
          <Wave peaks={KIT_PEAKS} progress={kitT} />
          <p className="clip__time" aria-hidden="true">1.4 s</p>
        </div>
      </li>

      <li className="clip" data-playing={playing === "ari"}>
        <button type="button" className="clip__play" onClick={toggleAri} aria-label={playing === "ari" ? "Pause ARI, the Thinking Lab mascot" : "Play ARI, the Thinking Lab mascot"}>
          {playing === "ari" ? <PauseIcon /> : <PlayIcon />}
        </button>
        <div className="clip__text">
          <p className="clip__name">ARI, the Thinking Lab mascot</p>
          <p className="clip__desc">
            A lesson opener made in the AI video studio I built. ARI’s voice is generated. Music: “Glitter Blast” by Kevin
            MacLeod, <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noreferrer">CC BY 4.0</a>.
          </p>
        </div>
        <div className="clip__track" role="progressbar" aria-label="ARI clip progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round((ariT / ariLen) * 100)}>
          <Wave peaks={ARI_PEAKS} progress={ariT / ariLen} />
          <p className="clip__time" aria-hidden="true">{mmss(ariT)} / {mmss(ariLen)}</p>
        </div>
        <audio
          ref={audio}
          src={ARI_SRC}
          preload="metadata"
          onLoadedMetadata={(e) => { if (Number.isFinite(e.currentTarget.duration)) setAriLen(e.currentTarget.duration); }}
          onTimeUpdate={(e) => setAriT(e.currentTarget.currentTime)}
          onEnded={() => { setPlaying(null); setAriT(0); }}
        />
      </li>

      <li className="clip clip--link">
        <Link className="clip__play" href="/play/loopcraft" aria-label="Open LoopCraft">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
        </Link>
        <div className="clip__text">
          <p className="clip__name">LoopCraft</p>
          <p className="clip__desc">A looper that makes sound in seconds, no microphone needed.</p>
        </div>
        {loopcraft ? <span className="hbadge clip__status" data-status={loopcraft.status}>{loopcraft.status}</span> : null}
      </li>
    </ul>
  );
}
