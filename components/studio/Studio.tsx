"use client";

import { Canvas, useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { Html, OrbitControls, OrthographicCamera, PerformanceMonitor } from "@react-three/drei";
import { Component, memo, useCallback, useEffect, useMemo, useRef, useState, type ComponentRef, type ReactNode } from "react";
import * as THREE from "three";
import { Box, Cyl, Room } from "./Room";
import Akib, { type AkibPose } from "./Akib";
import StudioFallback from "./StudioFallback";
import { lights, scene as c, type Phase } from "./palette";
import { BOOTH_POS, Booth } from "./Photobooth";
import { spotLabels, type StudioSpot } from "@/lib/content";

type V3 = [number, number, number];
/** The OrbitControls instance drei hands back through its ref. */
type OrbitHandle = ComponentRef<typeof OrbitControls>;

/** A press that travels further than this is a drag (orbiting the room), not a pick. */
const CLICK_SLOP = 4;

/** Where the camera looks when a spot is selected. */
export const spotFocus: Record<StudioSpot, V3> = {
  video: [-0.55, 2.2, -3.0],
  booth: [BOOTH_POS.x, 1.05, BOOTH_POS.z],
  lessons: [1.35, 2.15, -2.85],
  zoom: [1.95, 2.15, -2.85],
  workout: [2.55, 2.1, -2.85],
  culinary: [1.65, 1.45, -2.85],
  mic: [0.62, 1.5, -2.45],
  me: [-0.45, 1.55, -2.45],
  laptop: [-0.02, 1.18, -2.52],
};

export type StudioProps = {
  phase: Phase;
  selected: StudioSpot | null;
  onSelect: (id: StudioSpot | null) => void;
  onCycleLight: () => void;
  onHover: () => void;
  reducedMotion: boolean;
  paused?: boolean;
  /** Direct manipulation: drag to orbit the room within its front arc. */
  explore: boolean;
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

/** OrbitControls stamps touch-action:none on the event container when it connects and never clears it, so a drag over the room would swallow the page scroll. Keep it in step with explore. */
function TouchScroll({ explore }: { explore: boolean }) {
  const el = useThree((st) => st.events.connected as HTMLElement | undefined);
  useEffect(() => {
    if (el) el.style.touchAction = explore ? "none" : "pan-y";
  }, [el, explore]);
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
        style={{ touchAction: props.explore ? "none" : "pan-y" }}
        onPointerMissed={() => props.onSelect(null)}
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

function Scene({ phase, selected, onSelect, onCycleLight, onHover, reducedMotion, explore, akibPose, akibMouth, active }: Omit<StudioProps, "paused"> & { active: boolean }) {
  const [hovered, setHovered] = useState<StudioSpot | "window" | null>(null);
  const ortho = useRef<THREE.OrthographicCamera>(null);
  const orbit = useRef<OrbitHandle>(null);
  // one stable array: a fresh one each render would make R3F re-aim the pivot mid-orbit
  const orbitTarget = useMemo(() => WORKSTATION.toArray(), []);
  const light = lights[phase];

  const spot = (id: StudioSpot, label: V3, children: ReactNode) => (
    <Spot id={id} label={label} hovered={hovered} selected={selected} reducedMotion={reducedMotion} disabled={false}
      onHover={(h) => { if (h && h !== hovered) onHover(); setHovered(h); }} onSelect={onSelect}>
      {children}
    </Spot>
  );

  return (
    <>
      <OrthographicCamera ref={ortho} makeDefault position={[12, 10, 12]} zoom={60} near={0.1} far={200} />
      <CameraRig cam={ortho} controls={orbit} selected={selected} reducedMotion={reducedMotion} explore={explore} />
      <OrbitControls
        ref={orbit}
        enabled={explore}
        target={orbitTarget}
        enablePan={false}
        enableZoom={false}
        enableDamping={!reducedMotion}
        dampingFactor={0.08}
        rotateSpeed={0.55}
        minAzimuthAngle={0.45}
        maxAzimuthAngle={1.15}
        minPolarAngle={0.82}
        maxPolarAngle={1.22}
      />
      <TouchScroll explore={explore} />
      <Lights phase={phase} reducedMotion={reducedMotion} />
      {/* bare walls and floor are the way back out of a selection: props stop the click before it reaches here */}
      <group onClick={(e) => { if (e.delta > CLICK_SLOP) return; e.stopPropagation(); onSelect(null); }}>
        <Room sky={light.sky} />
      </group>

      {/* window hotspot: click to change the light */}
      <mesh
        position={[-3.0, 2.15, 0.9]}
        rotation={[0, Math.PI / 2, 0]}
        onPointerOver={(e) => { e.stopPropagation(); setHovered("window"); document.body.style.cursor = "pointer"; onHover(); }}
        onPointerOut={() => { setHovered((h) => (h === "window" ? null : h)); document.body.style.cursor = ""; }}
        onClick={(e) => { if (e.delta > CLICK_SLOP) return; e.stopPropagation(); onCycleLight(); }}
      >
        <planeGeometry args={[2.0, 1.5]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        {hovered === "window" && (
          <Html position={[0, 1.0, 0]} center zIndexRange={[15, 0]}>
            <span className="tag">Change the light</span>
          </Html>
        )}
      </mesh>

      {spot("video", [0, 0.75, 0], <Monitor phase={phase} playing={active && !reducedMotion} />)}
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

      {spot("booth", [0, 0.75, 0], <Booth phase={phase} />)}
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
    <group ref={ref} onPointerOver={disabled ? undefined : over} onPointerOut={disabled ? undefined : out} onClick={disabled ? undefined : (e) => { if (e.delta > CLICK_SLOP) return; e.stopPropagation(); onSelect(id); }}>
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

/** A slightly lower lens than a full isometric: the visitor looks across the desk at the person, not down on the room. */
const ISO_DIR = new THREE.Vector3(1, 0.66, 1).normalize();
const RIGHT = new THREE.Vector3(1, 0, -1).normalize();
const UP = new THREE.Vector3().crossVectors(RIGHT, ISO_DIR).multiplyScalar(-1).normalize();
/** The person and the laptop are what the card centres on; the window stays at the edge so the light has a source. */
const WORKSTATION = new THREE.Vector3(-0.75, 1.6, -1.65);

function CameraRig({ cam: camRef, controls: controlsRef, selected, reducedMotion, explore }: { cam: React.RefObject<THREE.OrthographicCamera | null>; controls: React.RefObject<OrbitHandle | null>; selected: StudioSpot | null; reducedMotion: boolean; explore: boolean }) {
  const { size } = useThree();
  const target = useRef(WORKSTATION.clone());
  const goal = useMemo(() => new THREE.Vector3(), []);
  const tmp = useMemo(() => new THREE.Vector3(), []);
  const recovering = useRef(false);
  const wasExplore = useRef(explore);

  useFrame((state, dt) => {
    const cam = camRef.current;
    if (!cam) return;
    // handover: the orbit pivot follows this rig every frame, so explore on or off never re-aims the camera
    controlsRef.current?.target.copy(target.current);
    if (wasExplore.current !== explore) { recovering.current = !explore; wasExplore.current = explore; }
    // while the visitor is dragging, OrbitControls owns the camera
    if (explore) return;

    // person-first: a close, low frame on the face and hands. The phone crops the empty right side
    // of the room rather than shrinking the workstation to fit it.
    const phone = size.width < 600;
    const baseZoom = Math.min(size.width / (phone ? 5.9 : 6.0), size.height / (phone ? 4.8 : 3.4));
    let zoom = baseZoom;

    if (selected === "laptop") {
      zoom = baseZoom * 3.4; // dive toward the screen; the laptop layer crossfades in on top
      goal.set(...spotFocus.laptop);
    } else if (selected) {
      zoom = baseZoom * 1.5;
      goal.set(...spotFocus[selected]);
    } else {
      goal.copy(WORKSTATION);
    }

    const k = reducedMotion ? 1 : 1 - Math.exp(-dt * 4.5);
    target.current.lerp(goal, k);
    cam.zoom += (zoom - cam.zoom) * k;

    tmp.copy(target.current).addScaledVector(ISO_DIR, 24);
    if (!reducedMotion) {
      tmp.addScaledVector(RIGHT, state.pointer.x * 0.5).addScaledVector(UP, state.pointer.y * 0.35);
    }
    if (recovering.current) {
      // back from an orbit: glide home, then hand the camera straight back to the exact path above
      cam.position.lerp(tmp, k);
      if (cam.position.distanceToSquared(tmp) < 1e-5) { cam.position.copy(tmp); recovering.current = false; }
    } else {
      cam.position.copy(tmp);
    }
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
  const spill = useRef<THREE.PointLight>(null);
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
    if (spill.current) spill.current.intensity += (2.0 * entrance - spill.current.intensity) * k;
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
      {/* soft fill from the visitor's side so the booth's front panel isn't lost in shadow */}
      {/* ds-allow-hardcode:start WebGL lights and CanvasTexture paint: CSS custom properties cannot reach a three.js light or a canvas texture, so these colours mirror tokens.css and palette.ts by hand. */}
      <directionalLight ref={fill} position={[10, 6, 10]} intensity={0.1} color="#fff1e0" />
      {/* the warm task light sits in front of the person, so a short throw from the visitor's side is what separates
          his head and hands from the back wall; 3 m of reach stops it before the booth */}
      <pointLight ref={spill} position={[-0.15, 2.3, -1.25]} intensity={0} color="#ffd2a1" distance={3} decay={2} />
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

/** The laptop shows a real screen from the video-studio project. If it cannot load, the screen stays dark — no invented desktop. */
function useLaptopScreenTexture() {
  const tex = useMemo(() => {
    const t = new THREE.TextureLoader().load("/work/video-studio/create-screen.png");
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 4;
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

const LAPTOP_POS: V3 = [-0.02, 1.07, -2.52];
const LAPTOP_SCALE = 1.35;

function Laptop() {
  const screen = useLaptopScreenTexture();
  const deck = useLaptopDeckTexture();
  return (
    <group position={LAPTOP_POS} rotation={[0, -Math.PI / 2 + 0.55, 0]} scale={LAPTOP_SCALE}>
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
