"use client";

import { Canvas, useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { Html, OrthographicCamera, PerformanceMonitor, PerspectiveCamera } from "@react-three/drei";
import { Component, memo, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import * as THREE from "three";
import { Box, Cyl, Room } from "./Room";
import Akib, { type AkibPose } from "./Akib";
import StudioFallback from "./StudioFallback";
import { lights, scene as c, type Phase } from "./palette";
import { spotLabels, type StudioSpot } from "@/lib/content";

type V3 = [number, number, number];

/** Where the camera looks when a spot is selected. */
export const spotFocus: Record<StudioSpot, V3> = {
  video: [-0.55, 2.2, -3.0],
  booth: [-0.5, 1.3, 2.35],
  lessons: [1.35, 2.15, -2.85],
  zoom: [1.95, 2.15, -2.85],
  workout: [2.55, 2.1, -2.85],
  culinary: [1.65, 1.45, -2.85],
  mic: [-0.6, 1.25, -2.4],
  me: [-0.6, 1.4, -1.55],
  laptop: [-0.95, 1.3, -2.72],
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
      {spot("laptop", [0, 0.55, 0.2], <Laptop />)}
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

      {spot("booth", [0, 1.55, 0], (
        <Booth boothMode={boothMode} screen={boothMode && !cardLifted ? boothScreen : undefined} flashKey={flashKey} />
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
    const baseZoom = wide ? Math.min(size.width / 17, size.height / 9.6) : Math.min(size.width / 10.2, size.height / 7.4);
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
  // the screen is its own light: it brightens a little as the room darkens, but keeps the clip's true colours
  const tint = useMemo(() => new THREE.Color().setScalar(Math.min(1, 0.7 + 0.2 * lights[phase].screenGlow)), [phase]);
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

function Laptop() {
  const screen = useLaptopScreenTexture();
  return (
    <group position={[-0.95, 1.07, -2.5]}>
      <Box size={[0.64, 0.03, 0.44]} position={[0, 0, 0]} color={c.laptop} />
      <group position={[0, 0.2, -0.24]} rotation={[-0.25, 0, 0]}>
        <Box size={[0.64, 0.42, 0.02]} position={[0, 0, 0]} color={c.laptop} />
        <mesh position={[0, 0.005, 0.0105]}>
          <planeGeometry args={[0.58, 0.36]} />
          <meshStandardMaterial map={screen} emissive="#ffffff" emissiveMap={screen} emissiveIntensity={0.55} roughness={0.5} />
        </mesh>
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
      <group position={[0.05, 1.07, -2.3]}>
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

/** Text painted onto a canvas, so the booth can carry words without a font download. */
function useLabelTexture(text: string, bg: string, fg: string, w = 512, h = 256, size = 120) {
  const tex = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const g = canvas.getContext("2d")!;
    g.fillStyle = bg;
    g.fillRect(0, 0, w, h);
    g.fillStyle = fg;
    g.textAlign = "center";
    g.textBaseline = "middle";
    const family = getComputedStyle(document.documentElement).getPropertyValue("--font-fraunces").trim() || "Georgia";
    g.font = `500 ${size}px ${family}, Georgia, serif`;
    g.fillText(text, w / 2, h / 2 + size * 0.05);
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }, [text, bg, fg, w, h, size]);
  useEffect(() => () => tex.dispose(), [tex]); // every booth round trip remounts these; without this the GPU keeps each copy
  return tex;
}

/* ── The photobooth: a working screen, a flash, a printer ───────────── */

const BOOTH_POS = new THREE.Vector3(-0.5, 0, 2.35);
const BOOTH_ROT = Math.PI / 4;
const BOOTH_FWD = new THREE.Vector3(Math.sin(BOOTH_ROT), 0, Math.cos(BOOTH_ROT));
const BOOTH_FOV = 35;
const SCREEN_W = 0.8, SCREEN_H = 0.56, SCREEN_Y = 1.45, SLOT_Y = 0.82;
const toWorld = (x: number, y: number, z: number) =>
  new THREE.Vector3(x, y, z).applyAxisAngle(new THREE.Vector3(0, 1, 0), BOOTH_ROT).add(BOOTH_POS);
const SCREEN_CENTRE = toWorld(0, SCREEN_Y, 0.46);
const SLOT = toWorld(0, SLOT_Y, 0.5);

/** How far to stand from the booth so its screen and printer slot both fit, and how wide the screen renders in CSS px. */
function boothView(width: number, height: number) {
  const t = Math.tan(THREE.MathUtils.degToRad(BOOTH_FOV / 2));
  const aspect = width / height;
  const narrow = width < 640;
  const fill = narrow ? 0.94 : 0.82;
  const d = Math.max(1.75 / (2 * t), SCREEN_W / fill / (2 * t * aspect)); // 1.75 m of booth in view: sign to slot
  const visibleW = 2 * d * t * aspect;
  return { d, domW: Math.round((SCREEN_W / visibleW) * width) };
}

/** Walk up to the booth: start a step back and a little high, settle at eye level in front of the screen. */
function BoothRig({ cam: camRef, active, reducedMotion }: { cam: React.RefObject<THREE.PerspectiveCamera | null>; active: boolean; reducedMotion: boolean }) {
  const { size } = useThree();
  const entered = useRef(false);
  const goal = useMemo(() => new THREE.Vector3(), []);
  const look = useMemo(() => new THREE.Vector3(), []);
  useFrame((state, dt) => {
    const cam = camRef.current;
    if (!cam) return;
    if (!active) { entered.current = false; return; }
    const { d } = boothView(size.width, size.height);
    look.copy(SCREEN_CENTRE).setY(1.45);
    goal.copy(look).addScaledVector(BOOTH_FWD, d).setY(1.55);
    if (!reducedMotion) goal.x += state.pointer.x * 0.04, goal.y += state.pointer.y * 0.03;
    if (!entered.current) {
      entered.current = true;
      cam.position.copy(goal).addScaledVector(BOOTH_FWD, reducedMotion ? 0 : 1.6).setY(reducedMotion ? goal.y : 2.3);
    }
    const k = reducedMotion ? 1 : 1 - Math.exp(-dt * 2.4);
    cam.position.lerp(goal, k);
    cam.lookAt(look);
  });
  return null;
}

function Booth({ boothMode, screen, flashKey }: { boothMode: boolean; screen?: (width: number) => ReactNode; flashKey: number }) {
  const [fontsReady, setFontsReady] = useState(false);
  useEffect(() => { document.fonts.ready.then(() => setFontsReady(true)); }, []);
  const { size } = useThree();
  const { domW } = boothView(size.width, size.height);
  const flash = useRef<THREE.PointLight>(null);
  const strip = useRef<THREE.MeshStandardMaterial>(null);
  const firedAt = useRef<number | null>(null);
  const lastKey = useRef(flashKey);

  useFrame(() => {
    if (flashKey !== lastKey.current) { lastKey.current = flashKey; firedAt.current = now(); }
    const age = firedAt.current === null ? 99 : now() - firedAt.current;
    const burst = Math.exp(-age * 12);
    if (flash.current) flash.current.intensity = 90 * burst;
    if (strip.current) strip.current.emissiveIntensity = 0.15 + 6 * burst;
  });

  return (
    <group position={BOOTH_POS.toArray()} rotation={[0, BOOTH_ROT, 0]}>
      <Box size={[1.16, 0.12, 0.96]} position={[0, 0.06, 0]} color={c.coralDark} cast />
      <Box size={[1.1, 2.2, 0.9]} position={[0, 1.2, 0]} color={c.coral} cast />
      <Box size={[1.24, 0.34, 0.98]} position={[0, 2.46, 0]} color={c.cream} cast />
      <BoothSign key={fontsReady ? "ready" : "loading"} />
      {/* flash strip and lens above the screen */}
      <mesh position={[0, 2.08, 0.455]}>
        <boxGeometry args={[0.56, 0.06, 0.02]} />
        <meshStandardMaterial ref={strip} color="#fff7ea" emissive="#fff7ea" emissiveIntensity={0.15} />
      </mesh>
      {/* camera lens: a cream ring, dark glass, one highlight */}
      <Cyl r={0.085} h={0.05} position={[0, 1.88, 0.46]} rotation={[Math.PI / 2, 0, 0]} color={c.cream} segments={24} />
      <Cyl r={0.06} h={0.06} position={[0, 1.88, 0.47]} rotation={[Math.PI / 2, 0, 0]} color="#1d2733" segments={24} />
      <mesh position={[0.022, 1.9, 0.502]}>
        <circleGeometry args={[0.012, 12]} />
        <meshBasicMaterial color="#e9eef5" />
      </mesh>
      <pointLight ref={flash} position={[0, 2.0, 1.1]} color="#fff6e8" intensity={0} distance={6} decay={1.4} />
      {/* screen: a bezel, and either the live interface (booth mode) or a resting picture */}
      <Box size={[SCREEN_W + 0.08, SCREEN_H + 0.08, 0.03]} position={[0, SCREEN_Y, 0.45]} color={c.screenFrame} />
      {screen ? (
        <Html transform distanceFactor={(SCREEN_W * 400) / domW} position={[0, SCREEN_Y, 0.468]} zIndexRange={[20, 0]}>
          {screen(domW)}
        </Html>
      ) : (
        <BoothRestScreen key={fontsReady ? "r" : "l"} text={boothMode ? "Enjoy!" : "Step up"} />
      )}
      {/* printer slot; in the room a card rests half out, in booth mode the real one prints */}
      <Box size={[0.52, 0.05, 0.05]} position={[0, SLOT_Y, 0.46]} color={c.screenFrame} />
      {!boothMode && <Box size={[0.34, 0.02, 0.22]} position={[0, 0.8, 0.56]} rotation={[0.25, 0, 0]} color={c.cream} />}
    </group>
  );
}

function BoothSign() {
  const sign = useLabelTexture("PHOTOS", "#f5ecdf", "#b8503e", 512, 128, 84);
  return (
    <mesh position={[0, 2.46, 0.495]}>
      <planeGeometry args={[1.1, 0.28]} />
      <meshStandardMaterial map={sign} roughness={0.8} />
    </mesh>
  );
}

function BoothRestScreen({ text }: { text: string }) {
  const tex = useLabelTexture(text, "#2b2927", "#f5ecdf", 512, 358, 92);
  return (
    <mesh position={[0, SCREEN_Y, 0.467]}>
      <planeGeometry args={[SCREEN_W, SCREEN_H]} />
      <meshStandardMaterial map={tex} emissive="#ffffff" emissiveMap={tex} emissiveIntensity={0.6} roughness={0.4} />
    </mesh>
  );
}

/** The print: feeds down out of the slot, then lifts up to eye level and turns to face you. */
function PrintedCard({ url, cam, reducedMotion, onLift, onPresented }: {
  url: string; cam: React.RefObject<THREE.PerspectiveCamera | null>; reducedMotion: boolean; onLift: () => void; onPresented: () => void;
}) {
  const CW = 0.3, CH = 0.3 * (1330 / 900);
  const tex = useMemo(() => { const t = new THREE.TextureLoader().load(url); t.colorSpace = THREE.SRGBColorSpace; return t; }, [url]);
  const geo = useMemo(() => new THREE.PlaneGeometry(CW, CH).translate(0, -CH / 2, 0), [CH]); // origin on the top edge
  const ref = useRef<THREE.Mesh>(null);
  const born = useRef<number | null>(null);
  const lifted = useRef(false);
  const shown = useRef(false);
  const { size } = useThree();
  const slotQuat = useMemo(() => new THREE.Quaternion().setFromEuler(new THREE.Euler(0.1, BOOTH_ROT, 0, "YXZ")), []);
  const from = useMemo(() => new THREE.Vector3(), []);
  const to = useMemo(() => new THREE.Vector3(), []);
  const camQuat = useMemo(() => new THREE.Quaternion(), []);
  const ease = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);

  useEffect(() => () => { tex.dispose(); geo.dispose(); }, [tex, geo]);

  useFrame((state) => {
    const m = ref.current, c0 = cam.current;
    if (!m || !c0) return;
    if (born.current === null) born.current = now();
    const age = now() - born.current;
    const FEED = reducedMotion ? 0 : 1.7, PAUSE = reducedMotion ? 0 : 0.35, LIFT = reducedMotion ? 0 : 1.1;

    // where it ends: in front of the camera, a touch low, sized to fit the view
    const t = Math.tan(THREE.MathUtils.degToRad(BOOTH_FOV / 2));
    const dist = 0.95;
    const visH = 2 * dist * t, visW = visH * (size.width / size.height);
    const scale = Math.min(0.62 * visH / CH, 0.8 * visW / CW);
    c0.getWorldDirection(to);
    to.multiplyScalar(dist).add(c0.position);
    const up = new THREE.Vector3(0, 1, 0).applyQuaternion(c0.quaternion);
    to.addScaledVector(up, (CH * scale) / 2 + visH * 0.04);
    camQuat.copy(c0.quaternion);

    if (age < FEED) {
      m.position.copy(SLOT);
      m.quaternion.copy(slotQuat);
      m.scale.set(1, Math.max(0.001, age / FEED), 1);
    } else if (age < FEED + PAUSE) {
      m.scale.set(1, 1, 1);
    } else {
      if (!lifted.current) { lifted.current = true; from.copy(m.position); onLift(); }
      const p = LIFT === 0 ? 1 : Math.min(1, (age - FEED - PAUSE) / LIFT);
      const e = ease(p);
      m.position.lerpVectors(from, to, e);
      m.position.y += Math.sin(p * Math.PI) * 0.12; // a little arc, like being picked up
      m.quaternion.slerpQuaternions(slotQuat, camQuat, e);
      const sc = 1 + (scale - 1) * e;
      m.scale.set(sc, sc, sc);
      if (p >= 1 && !shown.current) { shown.current = true; onPresented(); }
      if (p >= 1 && !reducedMotion) m.position.addScaledVector(up, Math.sin(state.clock.elapsedTime * 1.4) * 0.004);
    }
  });

  return (
    <mesh ref={ref} geometry={geo} renderOrder={10}>
      {/* photo paper reads bright under any room light */}
      <meshStandardMaterial map={tex} emissive="#ffffff" emissiveMap={tex} emissiveIntensity={0.55} roughness={0.45} side={THREE.DoubleSide} />
      {/* ds-allow-hardcode:end */}
    </mesh>
  );
}
