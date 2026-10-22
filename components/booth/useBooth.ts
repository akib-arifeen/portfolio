"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { facts, styles, type StyleId } from "@/lib/booth";
import { studioSound } from "@/lib/sound";

export type BoothStep = "intro" | "pose" | "countdown" | "developing" | "printing" | "done" | "error";
export type BoothProblem = "camera" | "not-configured" | "limit" | "failed" | null;

const SAMPLE = "/desk/akib.jpg";
const W = 768, H = 1024; // 3:4, matches the model's output ratio

/** Crop any image/video frame to 3:4 cover and return a JPEG data URL. */
function toJpeg(source: CanvasImageSource, sw: number, sh: number, mirror: boolean) {
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const g = canvas.getContext("2d")!;
  const scale = Math.max(W / sw, H / sh);
  const dw = sw * scale, dh = sh * scale;
  if (mirror) { g.translate(W, 0); g.scale(-1, 1); }
  g.drawImage(source, (W - dw) / 2, (H - dh) / 2, dw, dh);
  return canvas.toDataURL("image/jpeg", 0.85);
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/** The printed card: photo, cream border, a small studio stamp. Colours come from the page tokens. */
async function printCard(photo: string, styleName: string) {
  const css = getComputedStyle(document.documentElement);
  const tok = (n: string) => css.getPropertyValue(n).trim();
  const img = await loadImage(photo);
  const cw = 900, ch = 1330, pad = 50, pw = cw - pad * 2, ph = Math.round(pw * 4 / 3);
  const canvas = document.createElement("canvas");
  canvas.width = cw;
  canvas.height = ch;
  const g = canvas.getContext("2d")!;
  g.fillStyle = tok("--color-paper");
  g.fillRect(0, 0, cw, ch);
  const s = Math.max(pw / img.width, ph / img.height);
  g.save();
  g.beginPath();
  g.rect(pad, pad, pw, ph);
  g.clip();
  g.drawImage(img, pad + (pw - img.width * s) / 2, pad + (ph - img.height * s) / 2, img.width * s, img.height * s);
  g.restore();
  const display = tok("--font-fraunces") || "Georgia";
  const body = tok("--font-geist") || "sans-serif";
  const y = pad + ph + 92;
  g.fillStyle = tok("--color-ink");
  g.font = `600 56px ${display}, Georgia, serif`;
  g.fillText("Akib’s Studio", pad, y);
  g.fillStyle = tok("--color-muted");
  g.font = `400 26px ${body}, sans-serif`;
  const date = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  g.fillText(`${styleName} · ${date}`, pad, y + 46);
  g.fillStyle = tok("--color-accent");
  g.beginPath();
  g.arc(cw - pad - 22, y - 18, 22, 0, Math.PI * 2);
  g.fill();
  return canvas.toDataURL("image/png");
}

/** Everything the booth does, independent of how it's drawn (the 3D screen and the HUD both read this). */
export function useBooth(active: boolean) {
  const [step, setStep] = useState<BoothStep>("intro");
  const [problem, setProblem] = useState<BoothProblem>(null);
  const [style, setStyle] = useState<StyleId>("anime");
  const [capture, setCapture] = useState<string | null>(null);
  const [card, setCard] = useState<string | null>(null);
  const [count, setCount] = useState(3);
  const [fact, setFact] = useState(0);
  const [flashKey, setFlashKey] = useState(0);
  const [live, setLive] = useState(false);
  const stream = useRef<MediaStream | null>(null);
  const videoEl = useRef<HTMLVideoElement | null>(null);
  const alive = useRef(true);
  // One token per booth session. Anything async (countdown, upload, polling, camera prompt) captures the token it started under and
  // gives up the moment it no longer matches, so stepping away cannot leave work running that lands in a closed booth.
  const session = useRef(0);
  const countdown = useRef<ReturnType<typeof setInterval> | null>(null);
  const abort = useRef<AbortController | null>(null);
  const starting = useRef(false);

  /** End whatever the last session had in flight and open a new one. */
  const newSession = useCallback(() => {
    session.current += 1;
    if (countdown.current) { clearInterval(countdown.current); countdown.current = null; }
    abort.current?.abort();
    abort.current = new AbortController();
    return session.current;
  }, []);
  const isLive = (sid: number) => alive.current && sid === session.current;

  const stopCamera = useCallback(() => {
    stream.current?.getTracks().forEach((t) => t.stop());
    stream.current = null;
    setLive(false);
  }, []);

  // attach the stream whenever the <video> on the booth screen (re)mounts
  const videoRef = useCallback((el: HTMLVideoElement | null) => {
    videoEl.current = el;
    if (el && stream.current && el.srcObject !== stream.current) {
      el.srcObject = stream.current;
      el.play().catch(() => {});
    }
  }, []);

  const reset = useCallback(() => {
    newSession();
    stopCamera();
    setStep("intro"); setProblem(null); setCapture(null); setCard(null);
  }, [newSession, stopCamera]);

  useEffect(() => {
    alive.current = true; // reset on every mount: React's dev double-mount runs the cleanup once first
    return () => { alive.current = false; newSession(); stopCamera(); };
  }, [newSession, stopCamera]);

  useEffect(() => { if (!active) reset(); }, [active, reset]);

  useEffect(() => {
    if (step !== "developing") return;
    const id = setInterval(() => setFact((f) => (f + 1) % facts.length), 3500);
    return () => clearInterval(id);
  }, [step]);

  const startCamera = async () => {
    if (starting.current) return; // a second click while the permission prompt is open must not open a second stream
    starting.current = true;
    const sid = session.current;
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 960 } }, audio: false });
      if (!isLive(sid)) { s.getTracks().forEach((t) => t.stop()); return; } // the visitor left while the prompt was up
      stream.current = s;
      setLive(true);
      setCapture(null);
      setProblem(null);
      setStep("pose");
      if (videoEl.current) { videoEl.current.srcObject = s; videoEl.current.play().catch(() => {}); }
    } catch {
      if (!isLive(sid)) return;
      setProblem("camera");
      setStep("error");
    } finally {
      starting.current = false;
    }
  };

  const useSample = async () => {
    stopCamera();
    const sid = session.current;
    try {
      const img = await loadImage(SAMPLE);
      if (!isLive(sid)) return;
      setCapture(toJpeg(img, img.width, img.height, false));
      setProblem(null);
      setStep("pose");
    } catch {
      if (!isLive(sid)) return;
      setProblem("failed");
      setStep("error");
    }
  };

  const develop = async (photo: string, styleId: StyleId, sid: number) => {
    const styleName = styles.find((s) => s.id === styleId)!.name;
    const signal = abort.current?.signal;
    setStep("developing");
    const fallback = async (p: Exclude<BoothProblem, null>) => {
      if (!isLive(sid)) return;
      setProblem(p);
      if (p === "limit") return setStep("error");
      // even when the AI can't run, the guest still gets a print of their own photo
      const printed = await printCard(photo, "Unstyled");
      if (!isLive(sid)) return;
      setCard(printed);
      studioSound.blip("print");
      setStep("printing");
    };
    try {
      const res = await fetch("/api/booth", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ image: photo, style: styleId }), signal });
      if (!isLive(sid)) return;
      const data = await res.json().catch(() => ({}));
      if (res.status === 503) return fallback("not-configured");
      if (res.status === 429) return fallback("limit");
      if (!res.ok || !data.taskId) return fallback("failed");
      const started = Date.now();
      while (isLive(sid) && Date.now() - started < 150_000) {
        await new Promise((r) => setTimeout(r, 2500));
        if (!isLive(sid)) return; // stepped away during the wait: no more polls
        const st = await fetch(`/api/booth?taskId=${encodeURIComponent(data.taskId)}`, { signal }).then((r) => r.json()).catch(() => ({ state: "waiting" }));
        if (!isLive(sid)) return;
        if (st.state === "success" && st.image) {
          const printed = await printCard(st.image, styleName);
          if (!isLive(sid)) return;
          setCard(printed);
          studioSound.blip("print");
          return setStep("printing");
        }
        if (st.state === "fail") return fallback("failed");
      }
      fallback("failed");
    } catch {
      fallback("failed");
    }
  };

  const shoot = () => {
    if (step === "countdown") return;
    if (capture && !stream.current) return develop(capture, style, newSession()); // a still photo (sample, or restyling)
    const sid = newSession();
    let n = 3;
    setCount(n);
    setStep("countdown");
    studioSound.blip("hover");
    countdown.current = setInterval(() => {
      if (!isLive(sid)) { if (countdown.current) clearInterval(countdown.current); countdown.current = null; return; }
      n -= 1;
      if (n > 0) { setCount(n); studioSound.blip("hover"); return; }
      if (countdown.current) clearInterval(countdown.current);
      countdown.current = null;
      const v = videoEl.current;
      if (!v || !v.videoWidth) { setProblem("camera"); setStep("error"); return; }
      setFlashKey((k) => k + 1);
      studioSound.blip("click");
      const shot = toJpeg(v, v.videoWidth, v.videoHeight, true);
      stopCamera();
      setCapture(shot);
      develop(shot, style, sid);
    }, 900);
  };

  const download = () => {
    if (!card) return;
    const a = document.createElement("a");
    a.href = card;
    a.download = `akibs-studio-${style}.png`;
    a.click();
  };

  const tryAnother = () => { newSession(); setCard(null); setProblem(null); setStep("pose"); };
  const retake = () => { newSession(); setCard(null); setProblem(null); startCamera(); };
  const presented = () => setStep("done");

  return {
    step, problem, style, setStyle, capture, card, count, fact, flashKey, live,
    videoRef, startCamera, useSample, shoot, download, tryAnother, retake, presented, reset,
  };
}

export type Booth = ReturnType<typeof useBooth>;
