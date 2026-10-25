"use client";

import { Canvas, useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { Instance, Instances, OrbitControls, PerformanceMonitor, PerspectiveCamera } from "@react-three/drei";
import { Component, memo, useCallback, useEffect, useMemo, useRef, useState, type ComponentRef, type ReactNode } from "react";
import * as THREE from "three";
import { Bevel, Box, Cyl, Room } from "./Room";
import Avatar from "./Avatar";
import StudioFallback from "./StudioFallback";
import { lights, scene as c, type Phase } from "./palette";
import { BOOTH_POS, Booth } from "./Photobooth";
import { type StudioSpot } from "@/lib/content";

type V3 = [number, number, number];
/** The OrbitControls instance drei hands back through its ref. */
type OrbitHandle = ComponentRef<typeof OrbitControls>;

/** A press that travels further than this is a drag (orbiting the room), not a pick. */
const CLICK_SLOP = 4;

/** Where the camera looks when a spot is selected. */
export const spotFocus: Partial<Record<StudioSpot, V3>> = {
  booth: [BOOTH_POS.x, 1.05, BOOTH_POS.z],
  lessons: [1.35, 2.15, -2.85],
  zoom: [1.95, 2.15, -2.85],
  workout: [2.55, 2.1, -2.85],
  culinary: [1.65, 1.45, -2.85],
  mic: [0.62, 1.5, -2.0],
  me: [-0.45, 1.22, -2.75],
  laptop: [-0.02, 1.18, -2.15],
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
  /** Narrow-screen composition: the avatar's phone pose, set by the phone layout in Hero. */
  phone?: boolean;
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
        frameloop={running ? (props.reducedMotion ? "demand" : "always") : "never"}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        onCreated={({ gl }) => { gl.toneMappingExposure = 1.08; }}
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

function Scene({ phase, selected, onSelect, onCycleLight, onHover, reducedMotion, explore, phone, active }: Omit<StudioProps, "paused"> & { active: boolean }) {
  const [hovered, setHovered] = useState<StudioSpot | "window" | null>(null);
  const perspective = useRef<THREE.PerspectiveCamera>(null);
  const orbit = useRef<OrbitHandle>(null);
  const orbitTarget = useMemo(() => HOME_TARGET.toArray(), []);
  const light = lights[phase];

  const spot = (id: StudioSpot, label: V3, children: ReactNode) => (
    <Spot id={id} label={label} hovered={hovered} selected={selected} reducedMotion={reducedMotion} disabled={false}
      onHover={(h) => { if (h && h !== hovered) onHover(); setHovered(h); }} onSelect={onSelect}>
      {children}
    </Spot>
  );

  return (
    <>
      <PerspectiveCamera ref={perspective} makeDefault position={[2.4, 2.5, 2.3]} fov={32} near={0.1} far={60} />
      <CameraRig cam={perspective} controls={orbit} selected={selected} reducedMotion={reducedMotion} explore={explore} />
      <OrbitControls
        ref={orbit}
        enabled={explore}
        target={orbitTarget}
        enablePan={false}
        enableZoom={false}
        enableDamping={!reducedMotion}
        dampingFactor={0.08}
        rotateSpeed={0.55}
        minAzimuthAngle={0.35}
        maxAzimuthAngle={1.05}
        minPolarAngle={0.82}
        maxPolarAngle={1.35}
      />
      <TouchScroll explore={explore} />
      <Lights phase={phase} reducedMotion={reducedMotion} />
      <RenderMetrics active={active} />
      <group onClick={(e) => { if (e.delta > CLICK_SLOP) return; e.stopPropagation(); onSelect(null); }}>
        <Room sky={light.sky} />
      </group>

      <mesh
        position={[-3.0, 2.15, 0.9]}
        rotation={[0, Math.PI / 2, 0]}
        onPointerOver={(e) => { e.stopPropagation(); setHovered("window"); document.body.style.cursor = "pointer"; onHover(); }}
        onPointerOut={() => { setHovered((h) => (h === "window" ? null : h)); document.body.style.cursor = ""; }}
        onClick={(e) => { if (e.delta > CLICK_SLOP) return; e.stopPropagation(); onCycleLight(); }}
      >
        <planeGeometry args={[2.0, 1.5]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      {spot("laptop", [0, 0.45, 0.2], <Laptop />)}
      <Lamp phase={phase} />
      {spot("me", [0, 1.25, 0], <Avatar pose={phone ? "phone_idle" : "laptop_idle"} reducedMotion={reducedMotion} />)}

      <Bevel size={[2.1, 0.065, 0.45]} position={[1.95, 2.0, -2.88]} color={c.desk} />
      <Bevel size={[2.1, 0.065, 0.45]} position={[1.95, 1.3, -2.88]} color={c.desk} />
      {spot("lessons", [0, 0.6, 0], <Books />)}
      {spot("zoom", [0, 0.6, 0], <Reel />)}
      {spot("workout", [0, 0.45, 0], <Dumbbell />)}
      {spot("culinary", [0, 0.4, 0], <Pan />)}
      <Cyl r={0.09} h={0.18} position={[2.45, 1.43, -2.85]} color={c.cream} />

      {spot("booth", [0, 0.65, 0], <Booth phase={phase} />)}
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
    </group>
  );
}

/* ── Camera: a close perspective lens with a separate phone composition ── */

const ISO_DIR = new THREE.Vector3(1, 0.66, 1).normalize();
const RIGHT = new THREE.Vector3(1, 0, -1).normalize();
const UP = new THREE.Vector3().crossVectors(RIGHT, ISO_DIR).multiplyScalar(-1).normalize();
const WORKSTATION = new THREE.Vector3(-0.75, 1.6, -1.65);
const HOME_TARGET = new THREE.Vector3(-0.2, 1.25, -2.25);
const DESKTOP_CAMERA = new THREE.Vector3(2.15, 2.15, 2.3);
const PHONE_TARGET = new THREE.Vector3(-0.22, 1.32, -2.3);
const PHONE_CAMERA = new THREE.Vector3(1.55, 1.95, 1.0);

function CameraRig({ cam: camRef, controls: controlsRef, selected, reducedMotion, explore }: { cam: React.RefObject<THREE.PerspectiveCamera | null>; controls: React.RefObject<OrbitHandle | null>; selected: StudioSpot | null; reducedMotion: boolean; explore: boolean }) {
  const { size } = useThree();
  const target = useRef(HOME_TARGET.clone());
  const goal = useMemo(() => new THREE.Vector3(), []);
  const position = useMemo(() => new THREE.Vector3(), []);
  const wasExplore = useRef(explore);

  useFrame((state, dt) => {
    const cam = camRef.current;
    if (!cam) return;
    controlsRef.current?.target.copy(target.current);
    if (wasExplore.current !== explore) wasExplore.current = explore;
    if (explore) return;

    const phone = size.width < 600;
    const focus = selected ? spotFocus[selected] : undefined;
    if (focus) goal.set(...focus);
    else goal.copy(phone ? PHONE_TARGET : HOME_TARGET);

    if (selected === "laptop") {
      position.copy(goal).add(new THREE.Vector3(1.05, 0.82, 1.5));
    } else if (selected) {
      position.copy(goal).addScaledVector(ISO_DIR, selected === "booth" ? 4.1 : selected === "me" ? 3.3 : 3.7);
    } else {
      position.copy(phone ? PHONE_CAMERA : DESKTOP_CAMERA);
      if (!reducedMotion) position.addScaledVector(RIGHT, state.pointer.x * 0.12).addScaledVector(UP, state.pointer.y * 0.08);
    }

    const k = reducedMotion ? 1 : 1 - Math.exp(-dt * 4.5);
    target.current.lerp(goal, k);
    cam.position.lerp(position, k);
    const fov = phone ? 34 : 32;
    if (cam.fov !== fov) { cam.fov = fov; cam.updateProjectionMatrix(); }
    cam.lookAt(target.current);
  });
  return null;
}

function RenderMetrics({ active }: { active: boolean }) {
  const { gl, scene, size } = useThree();
  useEffect(() => {
    if (process.env.NODE_ENV === "production" || !active) return;
    const timer = window.setTimeout(() => {
      const textures = new Set<THREE.Texture>();
      scene.traverse((object) => {
        if (!(object instanceof THREE.Mesh)) return;
        const list = Array.isArray(object.material) ? object.material : [object.material];
        list.forEach((material) => {
          Object.values(material).forEach((value) => { if (value instanceof THREE.Texture) textures.add(value); });
        });
      });
      let bytes = 4 * 1024 * 1024;
      textures.forEach((texture) => {
        const image = texture.image as { width?: number; height?: number } | undefined;
        bytes += (image?.width ?? 0) * (image?.height ?? 0) * 4 * (texture.generateMipmaps ? 4 / 3 : 1);
      });
      console.warn("[studio:metrics]", JSON.stringify({
        viewport: `${size.width}x${size.height}`,
        drawCalls: gl.info.render.calls,
        triangles: gl.info.render.triangles,
        geometries: gl.info.memory.geometries,
        textures: gl.info.memory.textures,
        estimatedTextureMB: Number((bytes / 1024 / 1024).toFixed(1)),
      }));
    }, 900);
    return () => window.clearTimeout(timer);
  }, [active, gl, scene, size.height, size.width]);
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
    if (fill.current) fill.current.intensity += (0.72 * entrance - fill.current.intensity) * k;
    if (spill.current) spill.current.intensity += (1.65 * entrance - spill.current.intensity) * k;
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
      {/* ds-allow-hardcode:start WebGL lights and CanvasTexture paint: CSS custom properties cannot reach a three.js light or a canvas texture, so these colours mirror tokens.css and palette.ts by hand. */}
      <directionalLight ref={fill} position={[-4, 4, 2]} intensity={0.1} color="#bfdcf2" />
      {/* the warm task light sits in front of the person, so a short throw from the visitor's side is what separates
          his head and hands from the back wall; 3 m of reach stops it before the booth */}
      <pointLight ref={spill} position={[-0.15, 2.3, -1.25]} intensity={0} color="#ffd2a1" distance={3} decay={2} />
      <hemisphereLight ref={hemi} intensity={0.2} />
      <directionalLight
        ref={sun}
        position={[3.5, 6, 4]}
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

/** The laptop shows the real video-studio planning interface. */
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

export const LAPTOP_POS: V3 = [-0.02, 1.07, -2.15];
const LAPTOP_SCALE = 1.35;

function Laptop() {
  const screen = useLaptopScreenTexture();
  const deck = useLaptopDeckTexture();
  return (
    <group position={LAPTOP_POS} rotation={[0, -Math.PI / 2 + 0.55, 0]} scale={LAPTOP_SCALE}>
      <Bevel size={[0.64, 0.03, 0.44]} position={[0, 0, 0]} color={c.laptop} cast />
      <mesh position={[0, 0.0162, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.62, 0.42]} />
        <meshStandardMaterial map={deck} roughness={0.48} metalness={0.16} polygonOffset polygonOffsetFactor={-2} polygonOffsetUnits={-2} />
      </mesh>
      <Box size={[0.64, 0.006, 0.012]} position={[0, -0.004, 0.219]} color={c.laptopEdge} />
      <Instances limit={2}>
        <boxGeometry args={[0.008, 0.009, 0.042]} />
        <meshStandardMaterial color={c.laptopPort} roughness={0.62} />
        {[-0.06, -0.13].map((z) => <Instance key={z} position={[0.322, 0.002, z]} />)}
      </Instances>
      <Cyl r={0.013} h={0.575} position={[0, 0.021, -0.222]} rotation={[0, 0, Math.PI / 2]} color={c.laptopPort} segments={18} />
      <group position={[0, 0.2, -0.24]} rotation={[-0.28, 0, 0]}>
        <Bevel size={[0.64, 0.42, 0.02]} position={[0, 0, 0]} color={c.laptop} cast />
        <mesh position={[0, 0.005, 0.0105]}>
          <planeGeometry args={[0.575, 0.36]} />
          <meshBasicMaterial map={screen} color="#c8c2ba" toneMapped={false} />
        </mesh>
        <mesh position={[0, 0.197, 0.0112]}>
          <circleGeometry args={[0.0038, 10]} />
          <meshBasicMaterial color="#2a2724" />
        </mesh>
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
    if (glow.current) glow.current.emissiveIntensity += ((target > 0 ? 1.15 : 0.05) - glow.current.emissiveIntensity) * k;
  });
  return (
    <group position={[0.55, 1.05, -2.25]}>
      <Cyl r={0.13} h={0.04} position={[0, 0.02, 0]} color={c.metal} />
      <Box size={[0.03, 0.6, 0.03]} position={[0, 0.32, 0]} color={c.metal} rotation={[0.25, 0, 0]} />
      <mesh position={[0, 0.66, 0.12]} rotation={[0.5, 0, 0]} castShadow>
        <cylinderGeometry args={[0.07, 0.2, 0.22, 32, 1, true]} />
        <meshStandardMaterial color={c.shade} side={THREE.DoubleSide} roughness={0.62} />
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
      <group position={[0.62, 1.07, -2.0]}>
        <Cyl r={0.1} h={0.03} position={[0, 0.01, 0]} color={c.metal} />
        <Cyl r={0.015} h={0.4} position={[0, 0.22, 0]} color={c.metal} segments={6} />
        <mesh position={[0, 0.48, 0]} castShadow>
          <capsuleGeometry args={[0.07, 0.12, 6, 12]} />
          <meshStandardMaterial color="#56534f" roughness={0.48} metalness={0.18} />
        </mesh>
      </group>
      {/* small mixer */}
      <group position={[-1.6, 1.08, -2.1]}>
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
