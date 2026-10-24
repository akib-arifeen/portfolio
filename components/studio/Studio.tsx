"use client";

import { Canvas, useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { Html, OrthographicCamera, PerformanceMonitor, PerspectiveCamera } from "@react-three/drei";
import { Component, memo, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import * as THREE from "three";
import { Box, Cyl, Room } from "./Room";
import Akib, { type AkibPose } from "./Akib";
import StudioFallback from "./StudioFallback";
import { lights, scene as c, type Phase } from "./palette";
import { BOOTH_FOV, BOOTH_POS, Booth, BoothRig, PrintedCard } from "./Photobooth";
import { spotLabels, type StudioSpot } from "@/lib/content";

type V3 = [number, number, number];

/** Where the camera looks when a spot is selected. */
export const spotFocus: Record<StudioSpot, V3> = {
  video: [-0.55, 2.2, -3.0],
  booth: [BOOTH_POS.x, 0.85, BOOTH_POS.z],
  lessons: [1.35, 2.15, -2.85],
  zoom: [1.95, 2.15, -2.85],
  workout: [2.55, 2.1, -2.85],
  culinary: [1.65, 1.45, -2.85],
  mic: [0.62, 1.5, -2.45],
  me: [-0.6, 1.4, -1.88],
  laptop: [-0.39, 1.35, -2.74],
};

export type StudioProps = {
  phase: Phase;
  selected: StudioSpot | null;
  onSelect: (id: StudioSpot | null) => void;
  onCycleLight: () => void;
  onHover: () => void;
  reducedMotion: boolean;
  paused?: boolean;
  /** booth mode: walk up to the photobooth and use its screen */
  boothMode?: boolean;
  boothScreen?: (width: number) => ReactNode;
  cardUrl?: string | null;
  onCardPresented?: () => void;
  flashKey?: number;
  /** Overrides the character's pose (the "Ask Akib" panel drives it); undefined keeps the default. */
  akibPose?: AkibPose;
  /** 0 to 1 mouth openness while the pose is "talk". */
  akibMouth?: number;
};

/** Stamps use the wall clock, not R3F's clock: R3F zeroes its clock whenever frameloop flips, which would turn "age" into a huge negative. */
const now = () => performance.now() / 1000;

/** Can this browser make a WebGL context at all? Locked-down laptops and VDI cannot, and R3F would throw the whole page away. */
function hasWebGL() {
  try {
    const probe = document.createElement("canvas");
    const gl = (probe.getContext("webgl2") || probe.getContext("webgl")) as WebGLRenderingContext | null;
    if (!gl) return false;
    gl.getExtension("WEBGL_lose_context")?.loseContext(); // hand the context back; browsers cap how many can be alive
    return true;
  } catch {
    return false;
  }
}

/** Catches anything the Canvas throws (renderer creation, context loss at start) and swaps in the static room. */
class StudioBoundary extends Component<{ fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? this.props.fallback : this.props.children; }
}

/** Reports whether the canvas is on screen and the tab is visible, so the render loop can sleep when nobody is looking. */
function Gate({ onChange }: { onChange: (awake: boolean) => void }) {
  const el = useThree((st) => st.gl.domElement);
  useEffect(() => {
    let onScreen = true, shown = !document.hidden;
    const push = () => onChange(onScreen && shown);
    const io = new IntersectionObserver(([entry]) => { onScreen = entry.isIntersecting; push(); });
    io.observe(el);
    const vis = () => { shown = !document.hidden; push(); };
    document.addEventListener("visibilitychange", vis);
    push();
    return () => { io.disconnect(); document.removeEventListener("visibilitychange", vis); };
  }, [el, onChange]);
  return null;
}

function Studio(props: StudioProps) {
  const [webgl] = useState(hasWebGL);
  const [awake, setAwake] = useState(true);
  // full pixel density first; PerformanceMonitor steps it down to 1 when frames drop. Phones cap at 1.5.
  const [top] = useState(() => Math.min(window.devicePixelRatio || 1, window.matchMedia("(pointer: coarse)").matches ? 1.5 : 2));
  const [dpr, setDpr] = useState(top);
  const decline = useCallback(() => setDpr(1), []);
  const incline = useCallback(() => setDpr(top), [top]);
  const fallback = <StudioFallback {...props} />;
  if (!webgl) return fallback;
  const running = awake && !props.paused;
  return (
    <StudioBoundary fallback={fallback}>
      <Canvas
        shadows="percentage" /* PCFShadowMap: three r186 removed PCFSoftShadowMap, and R3F's boolean `shadows` still asks for it */
        dpr={dpr}
        frameloop={running ? "always" : "never"}
        gl={{ antialias: true, alpha: true }}
        onPointerMissed={() => { if (!props.boothMode) props.onSelect(null); }}
        role="group"
        aria-label="A 3D studio. Use the buttons beside it to look at each object."
      >
        <Gate onChange={setAwake} />
        <PerformanceMonitor onDecline={decline} onIncline={incline} />
        <Scene {...props} active={running} />
      </Canvas>
    </StudioBoundary>
  );
}

export default memo(Studio);

function Scene({ phase, selected, onSelect, onCycleLight, onHover, reducedMotion, boothMode = false, boothScreen, cardUrl, onCardPresented, flashKey = 0, akibPose, akibMouth, active }: Omit<StudioProps, "paused"> & { active: boolean }) {
  const [hovered, setHovered] = useState<StudioSpot | "window" | null>(null);
  const [cardLifted, setCardLifted] = useState(false);
  const ortho = useRef<THREE.OrthographicCamera>(null);
  const persp = useRef<THREE.PerspectiveCamera>(null);
  const light = lights[phase];
  useEffect(() => { if (!cardUrl) setCardLifted(false); }, [cardUrl]);

  // in booth mode the room is scenery: nothing else is clickable. The wrapper stays mounted either way, so props keep their textures.
  const spot = (id: StudioSpot, label: V3, children: ReactNode) => (
    <Spot id={id} label={label} hovered={hovered} selected={selected} reducedMotion={reducedMotion} disabled={boothMode}
      onHover={(h) => { if (h && h !== hovered) onHover(); setHovered(h); }} onSelect={onSelect}>
      {children}
    </Spot>
  );

  return (
    <>
      <OrthographicCamera ref={ortho} makeDefault={!boothMode} position={[12, 10, 12]} zoom={60} near={0.1} far={200} />
      <PerspectiveCamera ref={persp} makeDefault={boothMode} fov={BOOTH_FOV} near={0.05} far={100} />
      <CameraRig cam={ortho} selected={selected} reducedMotion={reducedMotion} />
      <BoothRig cam={persp} active={boothMode} reducedMotion={reducedMotion} />
      <Lights phase={phase} reducedMotion={reducedMotion} />
      <Room sky={light.sky} />

      {/* window hotspot: click to change the light */}
      <mesh
        position={[-3.0, 2.15, 0.9]}
        rotation={[0, Math.PI / 2, 0]}
        onPointerOver={(e) => { e.stopPropagation(); setHovered("window"); document.body.style.cursor = "pointer"; onHover(); }}
        onPointerOut={() => { setHovered((h) => (h === "window" ? null : h)); document.body.style.cursor = ""; }}
        onClick={(e) => { e.stopPropagation(); onCycleLight(); }}
      >
        <planeGeometry args={[2.0, 1.5]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        {hovered === "window" && (
          <Html position={[0, 1.0, 0]} center zIndexRange={[15, 0]}>
            <span className="tag">Change the light</span>
          </Html>
        )}
      </mesh>

      {spot("video", [0, 0.75, 0], <Monitor phase={phase} playing={active && !reducedMotion && !boothMode} />)}
      {spot("laptop", [0, 0.45, 0.2], <Laptop />)}
      <Lamp phase={phase} />
      {spot("mic", [0, 0.75, 0], <Mic />)}
      {spot("me", [0, 1.25, 0], <Akib reducedMotion={reducedMotion} pose={akibPose ?? (selected === "me" ? "wave" : "typing")} mouth={akibMouth} lookAtPointer headphonesOn={false} />)}

      {/* shelf on the back wall */}
      <Box size={[2.1, 0.07, 0.45]} position={[1.95, 2.0, -2.88]} color={c.desk} />
      <Box size={[2.1, 0.07, 0.45]} position={[1.95, 1.3, -2.88]} color={c.desk} />
      {spot("lessons", [0, 0.6, 0], <Books />)}
      {spot("zoom", [0, 0.6, 0], <Reel />)}
      {spot("workout", [0, 0.45, 0], <Dumbbell />)}
      {spot("culinary", [0, 0.4, 0], <Pan />)}
      <Cyl r={0.09} h={0.18} position={[2.45, 1.43, -2.85]} color={c.cream} />

      {spot("booth", [0, 0.75, 0], (
        <Booth boothMode={boothMode} screen={boothMode && !cardLifted ? boothScreen : undefined} flashKey={flashKey} phase={phase} reducedMotion={reducedMotion} />
      ))}
      {boothMode && cardUrl && (
        <PrintedCard key={cardUrl} url={cardUrl} cam={persp} reducedMotion={reducedMotion}
          onLift={() => setCardLifted(true)} onPresented={() => onCardPresented?.()} />
      )}
    </>
  );
}

/* ── Interaction wrapper ─────────────────────────────────────────── */

function Spot({ id, label, hovered, selected, onHover, onSelect, reducedMotion, disabled, children }: {
  id: StudioSpot; label: V3; hovered: StudioSpot | "window" | null; selected: StudioSpot | null;
  onHover: (h: StudioSpot | null) => void; onSelect: (id: StudioSpot) => void; reducedMotion: boolean; disabled: boolean; children: ReactNode;
}) {
  const ref = useRef<THREE.Group>(null);
  const active = !disabled && (hovered === id || selected === id);
  useEffect(() => { if (disabled) document.body.style.cursor = ""; }, [disabled]);
  useFrame((_, dt) => {
    if (!ref.current) return;
    const k = reducedMotion ? 1 : 1 - Math.exp(-dt * 12);
    ref.current.position.y += ((active ? 0.06 : 0) - ref.current.position.y) * k;
  });
  const over = (e: ThreeEvent<PointerEvent>) => { e.stopPropagation(); onHover(id); document.body.style.cursor = "pointer"; };
  const out = () => { if (hovered === id) onHover(null); document.body.style.cursor = ""; };
  return (
    <group ref={ref} onPointerOver={disabled ? undefined : over} onPointerOut={disabled ? undefined : out} onClick={disabled ? undefined : (e) => { e.stopPropagation(); onSelect(id); }}>
      {children}
      {!disabled && hovered === id && selected !== id && (
        <Html position={[spotFocus[id][0] + label[0], spotFocus[id][1] + label[1], spotFocus[id][2] + label[2]]} center zIndexRange={[15, 0]}>
          <span className="tag">{spotLabels[id]}</span>
        </Html>
      )}
    </group>
  );
}

/* ── Camera: isometric, glides to what you pick, leans with the pointer ── */

const ISO_DIR = new THREE.Vector3(1, 0.85, 1).normalize();
const RIGHT = new THREE.Vector3(1, 0, -1).normalize();
const UP = new THREE.Vector3().crossVectors(RIGHT, ISO_DIR).multiplyScalar(-1).normalize();
const ROOM_CENTRE = new THREE.Vector3(0, 1.2, 0);

function CameraRig({ cam: camRef, selected, reducedMotion }: { cam: React.RefObject<THREE.OrthographicCamera | null>; selected: StudioSpot | null; reducedMotion: boolean }) {
  const { size } = useThree();
  const target = useRef(ROOM_CENTRE.clone());
  const goal = useMemo(() => new THREE.Vector3(), []);
  const tmp = useMemo(() => new THREE.Vector3(), []);

  useFrame((state, dt) => {
    const wide = size.width >= 960;
    // narrow: the plinth is 6.6 m square turned 45 degrees, so it is 9.3 m wide on screen; 10.2 keeps both sides in frame
    const baseZoom = wide ? Math.min(size.width / 15.6, size.height / 9.6) : Math.min(size.width / 10.2, size.height / 7.4);
    const viewWidth = size.width / baseZoom;
    let zoom = baseZoom;

    if (selected === "laptop") {
      zoom = baseZoom * 4.5; // dive toward the screen; the desk overlay crossfades in on top
      goal.set(...spotFocus.laptop);
    } else if (selected) {
      zoom = baseZoom * (wide ? 1.6 : 1.45);
      goal.set(...spotFocus[selected]);
      if (wide) goal.addScaledVector(RIGHT, (size.width / zoom) * 0.2); // object sits left of the panel
      else goal.addScaledVector(UP, -(size.height / zoom) * 0.12);
    } else {
      goal.copy(ROOM_CENTRE);
      if (wide) goal.addScaledVector(RIGHT, -viewWidth * 0.16); // room sits right, headline left
    }

    const cam = camRef.current;
    if (!cam) return;
    const k = reducedMotion ? 1 : 1 - Math.exp(-dt * 3.2);
    target.current.lerp(goal, k);
    cam.zoom += (zoom - cam.zoom) * k;

    tmp.copy(target.current).addScaledVector(ISO_DIR, 24);
    if (!reducedMotion) {
      tmp.addScaledVector(RIGHT, state.pointer.x * 0.5).addScaledVector(UP, state.pointer.y * 0.35);
    }
    cam.position.copy(tmp);
    cam.lookAt(target.current);
    cam.updateProjectionMatrix();
  });
  return null;
}

/* ── Light: follows the visitor's time of day; fades up once on load ── */

function Lights({ phase, reducedMotion }: { phase: Phase; reducedMotion: boolean }) {
  const sun = useRef<THREE.DirectionalLight>(null);
  const amb = useRef<THREE.AmbientLight>(null);
  const hemi = useRef<THREE.HemisphereLight>(null);
  const fill = useRef<THREE.DirectionalLight>(null);
  const born = useRef<number | null>(null);
  const colour = useMemo(() => new THREE.Color(), []);

  useFrame((_, dt) => {
    const L = lights[phase];
    if (born.current === null) born.current = now();
    const age = now() - born.current;
    const entrance = reducedMotion ? 1 : Math.min(1, 0.2 + Math.max(0, age - 0.3) / 1.4);
    const k = reducedMotion ? 1 : 1 - Math.exp(-dt * 2.5);
    if (sun.current) {
      sun.current.intensity += (L.sunIntensity * entrance - sun.current.intensity) * k;
      sun.current.color.lerp(colour.set(L.sun), k);
    }
    if (fill.current) fill.current.intensity += (0.55 * entrance - fill.current.intensity) * k;
    if (amb.current) amb.current.intensity += (L.ambient * entrance - amb.current.intensity) * k;
    if (hemi.current) {
      hemi.current.color.lerp(colour.set(L.hemiSky), k);
      hemi.current.groundColor.lerp(colour.set(L.hemiGround), k);
      hemi.current.intensity += (0.6 * entrance - hemi.current.intensity) * k;
    }
  });

  return (
    <>
      <ambientLight ref={amb} intensity={0.2} />
      {/* soft fill from the visitor's side so the booth's face isn't lost in shadow */}
      {/* ds-allow-hardcode:start WebGL lights and CanvasTexture paint: CSS custom properties cannot reach a three.js light or a canvas texture, so these colours mirror tokens.css and palette.ts by hand. */}
      <directionalLight ref={fill} position={[10, 6, 10]} intensity={0.1} color="#fff1e0" />
      <hemisphereLight ref={hemi} intensity={0.2} />
      <directionalLight
        ref={sun}
        position={[-8, 7.5, 3]}
        intensity={0.4}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0006}
        shadow-camera-left={-6}
        shadow-camera-right={6}
        shadow-camera-top={6}
        shadow-camera-bottom={-6}
      />
    </>
  );
}

/* ── Props ───────────────────────────────────────────────────────── */

/** The monitor's picture: the looping clip while the studio is on screen, the still frame when paused, reduced-motion or before the clip starts. */
function useMonitorTexture(playing: boolean) {
  const poster = useMemo(() => {
    const t = new THREE.TextureLoader().load("/studio/monitor-loop.jpg");
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, []);
  const clip = useRef<{ el: HTMLVideoElement; tex: THREE.VideoTexture } | null>(null);
  const [live, setLive] = useState<THREE.VideoTexture | null>(null);

  useEffect(() => {
    if (!playing) { clip.current?.el.pause(); setLive(null); return; }
    if (!clip.current) {
      const el = document.createElement("video");
      el.muted = true; el.loop = true; el.playsInline = true;
      el.setAttribute("muted", ""); el.setAttribute("playsinline", ""); // Safari reads the attributes, not the properties
      el.preload = "auto";
      el.src = "/studio/monitor-loop.mp4";
      const tex = new THREE.VideoTexture(el);
      tex.colorSpace = THREE.SRGBColorSpace;
      clip.current = { el, tex };
    }
    const { el, tex } = clip.current;
    let gone = false;
    const onPlaying = () => { if (!gone) setLive(tex); };
    el.addEventListener("playing", onPlaying);
    el.play().catch(() => {}); // autoplay refused: the still frame simply stays
    return () => { gone = true; el.removeEventListener("playing", onPlaying); };
  }, [playing]);

  useEffect(() => () => {
    const c = clip.current;
    if (c) { c.el.pause(); c.el.removeAttribute("src"); c.el.load(); c.tex.dispose(); clip.current = null; }
    poster.dispose();
  }, [poster]);

  return playing && live ? live : poster;
}

function Monitor({ phase, playing }: { phase: Phase; playing: boolean }) {
  const tex = useMonitorTexture(playing);
  // the screen is its own light: it brightens a little as the room darkens, but stays a step behind the laptop
  const tint = useMemo(() => new THREE.Color().setScalar(Math.min(0.86, 0.62 + 0.16 * lights[phase].screenGlow)), [phase]);
  return (
    <group position={[-0.55, 2.35, -3.06]}>
      <Box size={[1.72, 1.02, 0.08]} position={[0, 0, 0]} color={c.screenFrame} cast />
      <mesh position={[0, 0.02, 0.045]}>
        <planeGeometry args={[1.53, 0.86]} /> {/* 16:9, the clip's ratio */}
        <meshBasicMaterial map={tex} color={tint} toneMapped={false} />
      </mesh>
    </group>
  );
}

/** The laptop's own desktop in miniature (warm wallpaper, a thin menu bar, a dock of coloured squircles), so the dive into the screen lands on the real thing. */
function paintLaptopScreen(g: CanvasRenderingContext2D, w: number, h: number) {
  const sky = g.createLinearGradient(w * 0.1, 0, w * 0.4, h);
  sky.addColorStop(0, "#f4e6ce"); sky.addColorStop(0.55, "#f3c7a2"); sky.addColorStop(1, "#f2a07c");
  g.fillStyle = sky;
  g.fillRect(0, 0, w, h);
  const glow = g.createRadialGradient(w * 0.72, h * 0.28, 0, w * 0.72, h * 0.28, w * 0.42);
  glow.addColorStop(0, "rgba(255,181,124,0.75)"); glow.addColorStop(1, "rgba(255,181,124,0)");
  g.fillStyle = glow;
  g.fillRect(0, 0, w, h);
  [["#e49f75", 0.6], ["#d67e5b", 0.7], ["#ad6352", 0.8], ["#854b42", 0.9]].forEach(([col, at], i) => {
    const y = h * (at as number);
    g.globalAlpha = 0.55 - i * 0.04;
    g.fillStyle = col as string;
    g.beginPath();
    g.moveTo(0, y);
    g.bezierCurveTo(w * 0.25, y - h * 0.09, w * 0.5, y + h * 0.06, w, y - h * 0.06);
    g.lineTo(w, h);
    g.lineTo(0, h);
    g.fill();
  });
  g.globalAlpha = 1;

  // corners fall away so the windows, not the wallpaper, carry the screen
  const vignette = g.createRadialGradient(w * 0.5, h * 0.45, h * 0.18, w * 0.5, h * 0.45, w * 0.72);
  vignette.addColorStop(0, "rgba(28,20,17,0)");
  vignette.addColorStop(1, "rgba(28,20,17,0.36)");
  g.fillStyle = vignette;
  g.fillRect(0, 0, w, h);

  // menu bar: an "a" monogram, a few menu words as bars, status bits on the right
  g.fillStyle = "rgba(255,250,244,0.55)";
  g.fillRect(0, 0, w, 24);
  g.fillStyle = "#d4614a";
  g.beginPath();
  g.arc(18, 12, 8, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = "#fdfbf9";
  g.font = "700 12px Georgia, serif";
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.fillText("a", 18, 12.5);
  g.fillStyle = "rgba(56,50,45,0.6)";
  [34, 28, 32, 30].reduce((x, bw) => { g.fillRect(x, 9, bw, 6); return x + bw + 12; }, 40);
  [18, 12, 30].reduce((x, bw) => { g.fillRect(x - bw, 9, bw, 6); return x - bw - 10; }, w - 14);

  // two windows of actual work: an editor with a few coloured lines, a terminal mid-build
  const panel = (x: number, y: number, pw: number, ph: number, r: number) => {
    g.beginPath(); g.roundRect(x, y, pw, ph, r); g.fill();
  };
  g.fillStyle = "rgba(30,26,24,0.94)";
  panel(40, 36, 372, 238, 10);
  g.fillStyle = "rgba(255,255,255,0.07)";
  g.fillRect(40, 36, 372, 24);
  ["#e8735c", "#e8b45c", "#86c58a"].forEach((col, i) => {
    g.fillStyle = col;
    g.beginPath(); g.arc(52 + i * 12, 48, 3.4, 0, Math.PI * 2); g.fill();
  });
  g.fillStyle = "rgba(255,255,255,0.42)";
  g.font = "600 11px ui-monospace, monospace";
  g.textAlign = "left";
  g.fillText("studio.tsx", 98, 48.5);
  const code: [number, string][] = [
    [0, "#e2a76f"], [1, "#8fc7d8"], [1, "#b9d18a"], [2, "#d0a3c8"],
    [2, "#e2c07a"], [1, "#8fc7d8"], [1, "#b9d18a"], [2, "#e2c07a"],
    [1, "#d0a3c8"], [0, "#8fc7d8"],
  ];
  code.forEach(([indent, col], i) => {
    const y = 84 + i * 19;
    g.fillStyle = "rgba(255,255,255,0.18)";
    g.fillRect(50, y - 2, 10, 4);
    let x = 72 + indent * 15;
    const widths = [34 + (i % 3) * 13, 18 + (i % 2) * 11, 48 - (i % 4) * 9, 13];
    widths.forEach((bw, j) => {
      g.fillStyle = j === 1 ? "rgba(255,255,255,0.5)" : col;
      g.globalAlpha = j === 3 ? 0.5 : 0.92;
      g.fillRect(x, y - 3, bw, 6);
      x += bw + 8;
    });
    g.globalAlpha = 1;
  });
  g.fillStyle = "rgba(16,19,21,0.94)";
  panel(428, 132, 196, 180, 10);
  g.fillStyle = "rgba(255,255,255,0.32)";
  g.font = "600 10px ui-monospace, monospace";
  g.fillText("~/studio", 442, 150);
  g.fillStyle = "#8fe3b0";
  g.font = "11px ui-monospace, monospace";
  g.fillText("$ npm run build", 442, 176);
  g.fillStyle = "rgba(214,232,220,0.5)";
  g.fillRect(442, 190, 96, 5);
  g.fillRect(442, 205, 140, 5);
  g.fillStyle = "rgba(143,227,176,0.85)";
  g.fillRect(442, 220, 74, 5);
  g.fillStyle = "#8fe3b0";
  g.fillText("$ npm test", 442, 252);
  g.fillStyle = "rgba(214,232,220,0.5)";
  g.fillRect(442, 266, 118, 5);
  g.fillStyle = "#8fe3b0";
  g.fillRect(442, 284, 7, 11);

  // dock: one squircle per app, in dock order
  const icons: [string, string][] = [
    ["#7ac8f5", "#3284d0"], ["#66cfe1", "#0c82bf"], ["#7fbef3", "#4b77cc"], ["#fddb7c", "#efa831"],
    ["#f8edd8", "#e9cca6"], ["#fd7466", "#d33949"], ["#fdfbf9", "#ebe7e2"], ["#a67ad6", "#6744ac"],
    ["#38322d", "#15110d"], ["#82d2a8", "#008f77"], ["#ed835e", "#b94739"],
  ];
  const size = 38, gap = 9, pad = 14;
  const dockW = icons.length * size + (icons.length - 1) * gap + pad * 2;
  const dockX = (w - dockW) / 2, dockY = h - size - pad * 2 - 8;
  g.fillStyle = "rgba(255,250,244,0.42)";
  g.beginPath();
  g.roundRect(dockX, dockY, dockW, size + pad * 2, 22);
  g.fill();
  g.strokeStyle = "rgba(255,255,255,0.55)";
  g.lineWidth = 1.5;
  g.stroke();
  icons.forEach(([a, b], i) => {
    const x = dockX + pad + i * (size + gap), y = dockY + pad;
    const grad = g.createLinearGradient(x, y, x, y + size);
    grad.addColorStop(0, a); grad.addColorStop(1, b);
    g.fillStyle = grad;
    g.beginPath();
    g.roundRect(x, y, size, size, 11);
    g.fill();
  });
}

function useLaptopScreenTexture() {
  const tex = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 640;
    canvas.height = 400;
    paintLaptopScreen(canvas.getContext("2d")!, 640, 400);
    const t = new THREE.CanvasTexture(canvas);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, []);
  useEffect(() => () => tex.dispose(), [tex]);
  return tex;
}

/** The deck seen from above: a keyboard well, real keys, a trackpad. Painted, not modelled — it has to read at 60 px and at 300. */
function paintLaptopDeck(g: CanvasRenderingContext2D, w: number, h: number) {
  g.fillStyle = "#cfc9be";
  g.fillRect(0, 0, w, h);
  const well = { x: w * 0.09, y: h * 0.1, w: w * 0.82, h: h * 0.56 };
  g.fillStyle = "#bdb6aa";
  g.beginPath();
  g.roundRect(well.x, well.y, well.w, well.h, 8);
  g.fill();
  const cols = 14, rows = 5, gap = 3;
  const cw = (well.w - gap * (cols + 1)) / cols;
  const ch = (well.h - gap * (rows + 1)) / rows;
  g.fillStyle = "#4b453d";
  for (let r = 0; r < rows; r++) {
    for (let col = 0; col < cols; col++) {
      g.beginPath();
      g.roundRect(well.x + gap + col * (cw + gap), well.y + gap + r * (ch + gap), cw, ch, 2);
      g.fill();
    }
  }
  // space bar: one wide key on the bottom row
  g.fillStyle = "#cfc9be";
  g.beginPath();
  g.roundRect(well.x + well.w * 0.28, well.y + gap + 4 * (ch + gap), well.w * 0.44, ch, 2);
  g.fill();
  // trackpad
  g.fillStyle = "#c4bdb1";
  g.beginPath();
  g.roundRect(w * 0.33, h * 0.73, w * 0.34, h * 0.21, 4);
  g.fill();
  g.strokeStyle = "rgba(90,84,76,0.35)";
  g.lineWidth = 2;
  g.stroke();
  // speaker grilles either side of the keys
  g.fillStyle = "rgba(90,84,76,0.28)";
  for (const s of [0.035, 0.965]) {
    for (let i = 0; i < 5; i++) {
      g.beginPath();
      g.arc(w * s, h * (0.16 + i * 0.055), 2.2, 0, Math.PI * 2);
      g.fill();
    }
  }
}

function useLaptopDeckTexture() {
  const tex = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 340;
    paintLaptopDeck(canvas.getContext("2d")!, 512, 340);
    const t = new THREE.CanvasTexture(canvas);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 4;
    return t;
  }, []);
  useEffect(() => () => tex.dispose(), [tex]);
  return tex;
}

const LAPTOP_POS: V3 = [-0.3, 1.07, -2.44];
const LAPTOP_SCALE = 1.35;

function Laptop() {
  const screen = useLaptopScreenTexture();
  const deck = useLaptopDeckTexture();
  return (
    <group position={LAPTOP_POS} rotation={[0, 0.28, 0]} scale={LAPTOP_SCALE}>
      {/* base: a milled slab with a painted keyboard deck on top */}
      <Box size={[0.64, 0.03, 0.44]} position={[0, 0, 0]} color={c.laptop} />
      <mesh position={[0, 0.0162, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.62, 0.42]} />
        <meshStandardMaterial map={deck} roughness={0.62} metalness={0.05} polygonOffset polygonOffsetFactor={-2} polygonOffsetUnits={-2} />
      </mesh>
      {/* front lip and side ports */}
      <Box size={[0.64, 0.006, 0.012]} position={[0, -0.004, 0.219]} color={c.laptopEdge} />
      {[-0.06, -0.13].map((z) => (
        <Box key={z} size={[0.008, 0.009, 0.042]} position={[0.322, 0.002, z]} color={c.laptopPort} />
      ))}
      {/* hinge */}
      <Cyl r={0.013} h={0.575} position={[0, 0.021, -0.222]} rotation={[0, 0, Math.PI / 2]} color={c.laptopPort} segments={14} />
      {/* lid */}
      <group position={[0, 0.2, -0.24]} rotation={[-0.28, 0, 0]}>
        <Box size={[0.64, 0.42, 0.02]} position={[0, 0, 0]} color={c.laptop} />
        <mesh position={[0, 0.005, 0.0105]}>
          <planeGeometry args={[0.575, 0.36]} />
          <meshBasicMaterial map={screen} toneMapped={false} />
        </mesh>
        {/* camera pinhole */}
        <mesh position={[0, 0.197, 0.0112]}>
          <circleGeometry args={[0.0038, 10]} />
          <meshBasicMaterial color="#2a2724" />
        </mesh>
        {/* screen spill on the keys and his hands */}
        <pointLight position={[0, -0.03, 0.3]} color="#ffd7ad" intensity={0.12} distance={1} decay={2} />
      </group>
    </group>
  );
}

function Lamp({ phase }: { phase: Phase }) {
  const bulb = useRef<THREE.PointLight>(null);
  const glow = useRef<THREE.MeshStandardMaterial>(null);
  useFrame((_, dt) => {
    const target = lights[phase].lamp;
    const k = 1 - Math.exp(-dt * 2);
    if (bulb.current) bulb.current.intensity += (target - bulb.current.intensity) * k;
    if (glow.current) glow.current.emissiveIntensity += ((target > 0 ? 2.2 : 0.05) - glow.current.emissiveIntensity) * k;
  });
  return (
    <group position={[0.55, 1.05, -2.8]}>
      <Cyl r={0.13} h={0.04} position={[0, 0.02, 0]} color={c.metal} />
      <Box size={[0.03, 0.6, 0.03]} position={[0, 0.32, 0]} color={c.metal} rotation={[0.25, 0, 0]} />
      <mesh position={[0, 0.66, 0.12]} rotation={[0.5, 0, 0]} castShadow>
        <cylinderGeometry args={[0.07, 0.2, 0.22, 18, 1, true]} />
        <meshStandardMaterial color={c.shade} side={THREE.DoubleSide} flatShading />
      </mesh>
      <mesh position={[0, 0.6, 0.16]}>
        <sphereGeometry args={[0.05, 12, 12]} />
        <meshStandardMaterial ref={glow} color="#fff3d6" emissive="#ffc77a" emissiveIntensity={0} />
      </mesh>
      <pointLight ref={bulb} position={[0, 0.5, 0.3]} color="#ffb766" intensity={0} distance={7} decay={1.6} />
    </group>
  );
}

function Mic() {
  return (
    <group>
      {/* microphone */}
      <group position={[0.62, 1.07, -2.45]}>
        <Cyl r={0.1} h={0.03} position={[0, 0.01, 0]} color={c.metal} />
        <Cyl r={0.015} h={0.4} position={[0, 0.22, 0]} color={c.metal} segments={6} />
        <mesh position={[0, 0.48, 0]} castShadow>
          <capsuleGeometry args={[0.07, 0.12, 6, 12]} />
          <meshStandardMaterial color="#56534f" roughness={0.6} flatShading />
        </mesh>
      </group>
      {/* small mixer */}
      <group position={[-1.6, 1.08, -2.42]}>
        <Box size={[0.5, 0.07, 0.34]} position={[0, 0, 0]} color={c.metal} />
        {[-0.15, 0, 0.15].map((x, i) => (
          <Box key={x} size={[0.04, 0.03, 0.07]} position={[x, 0.05, -0.04 + i * 0.05]} color={c.cream} />
        ))}
      </group>
    </group>
  );
}

function Books() {
  return (
    <group position={[1.32, 2.03, -2.85]}>
      <Box size={[0.12, 0.5, 0.34]} position={[-0.14, 0.25, 0]} color={c.book1} />
      <Box size={[0.1, 0.44, 0.32]} position={[-0.02, 0.22, 0]} color={c.book2} />
      <Box size={[0.13, 0.48, 0.34]} position={[0.12, 0.23, 0]} rotation={[0, 0, -0.22]} color={c.book3} />
    </group>
  );
}

function Reel() {
  return (
    <group position={[1.95, 2.03, -2.85]}>
      <Cyl r={0.25} h={0.06} position={[0, 0.25, 0]} rotation={[Math.PI / 2, 0, 0]} color={c.reel} segments={20} />
      <Cyl r={0.06} h={0.08} position={[0, 0.25, 0]} rotation={[Math.PI / 2, 0, 0]} color={c.cream} segments={12} />
    </group>
  );
}

function Dumbbell() {
  return (
    <group position={[2.55, 2.12, -2.85]}>
      <Cyl r={0.025} h={0.42} position={[0, 0, 0]} rotation={[0, 0, Math.PI / 2]} color={c.metal} segments={8} />
      <Cyl r={0.09} h={0.09} position={[-0.18, 0, 0]} rotation={[0, 0, Math.PI / 2]} color={c.coralDark} segments={10} />
      <Cyl r={0.09} h={0.09} position={[0.18, 0, 0]} rotation={[0, 0, Math.PI / 2]} color={c.coralDark} segments={10} />
    </group>
  );
}

function Pan() {
  return (
    <group position={[1.62, 1.37, -2.82]}>
      <Cyl r={0.2} h={0.06} position={[0, 0, 0]} color={c.metal} segments={20} />
      <Box size={[0.3, 0.03, 0.05]} position={[0.32, 0.01, 0.06]} rotation={[0, -0.4, 0]} color={c.desk} />
    </group>
  );
}
