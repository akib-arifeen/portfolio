"use client";

import { Html, RoundedBox } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import * as THREE from "three";
import { Box, Cyl } from "./Room";
import { scene as c, type Phase } from "./palette";

/* The ARI photobooth: an arched lacquer cabinet, brass inlay, a marquee, a working screen,
   and the mascot on the crown. Built from geometry and canvas art — no image assets. */

const now = () => performance.now() / 1000;

/** A compact booth against the window wall: the desk and its screen own the room, this is scenery. */
export const BOOTH_POS = new THREE.Vector3(-2.7, 0, 0.75);
export const BOOTH_ROT = Math.PI / 2 - 0.4;
export const BOOTH_SCALE = 0.46;
const BOOTH_FWD = new THREE.Vector3(Math.sin(BOOTH_ROT), 0, Math.cos(BOOTH_ROT));
export const BOOTH_FOV = 33;

const SCREEN_W = 0.74;
const SCREEN_H = SCREEN_W * 0.7;
const SCREEN_Y = 1.33;
const SLOT_Y = 0.735;
const ARCH_W = 1.18;
const ARCH_R = ARCH_W / 2;
const ARCH_SPRING = 1.62; // where the arch starts curving
const ARCH_BASE = 0.12;
const VIEW_H = 2.14; // metres of booth in view when you walk up
const VIEW_Y = 1.5; // camera height: the screen sits a little below the axis

const toWorld = (x: number, y: number, z: number) =>
  new THREE.Vector3(x * BOOTH_SCALE, y * BOOTH_SCALE, z * BOOTH_SCALE).applyAxisAngle(new THREE.Vector3(0, 1, 0), BOOTH_ROT).add(BOOTH_POS);
const SCREEN_CENTRE = toWorld(0, SCREEN_Y, 0.512);
const SLOT = toWorld(0, SLOT_Y, 0.47);

/** How far to stand so the whole booth fits, and how wide its screen renders in CSS px. */
function boothView(width: number, height: number) {
  const t = Math.tan(THREE.MathUtils.degToRad(BOOTH_FOV / 2));
  const viewH = VIEW_H * BOOTH_SCALE;
  const d = viewH / (2 * t);
  const visibleW = viewH * (width / height);
  return { d, domW: Math.round(((SCREEN_W * BOOTH_SCALE) / visibleW) * width) };
}

/** Walk up to the booth: start a step back and a little high, settle level with the screen. */
export function BoothRig({ cam, active, reducedMotion }: {
  cam: React.RefObject<THREE.PerspectiveCamera | null>; active: boolean; reducedMotion: boolean;
}) {
  const { size } = useThree();
  const entered = useRef(false);
  const goal = useMemo(() => new THREE.Vector3(), []);
  const look = useMemo(() => SCREEN_CENTRE.clone().setY(VIEW_Y * BOOTH_SCALE), []);
  useFrame((state, dt) => {
    const camera = cam.current;
    if (!camera) return;
    if (!active) { entered.current = false; return; }
    const { d } = boothView(size.width, size.height);
    goal.copy(SCREEN_CENTRE).addScaledVector(BOOTH_FWD, d).setY(VIEW_Y * BOOTH_SCALE);
    if (!reducedMotion) {
      goal.x += state.pointer.x * 0.05;
      goal.y += state.pointer.y * 0.03;
    }
    if (!entered.current) {
      entered.current = true;
      camera.position.copy(goal).addScaledVector(BOOTH_FWD, reducedMotion ? 0 : 1.4 * BOOTH_SCALE).setY(reducedMotion ? goal.y : 2.16 * BOOTH_SCALE);
    }
    camera.position.lerp(goal, reducedMotion ? 1 : 1 - Math.exp(-dt * 2.2));
    camera.lookAt(look);
  });
  return null;
}

/* ── canvas art: the sign, the poster, the resting screen, the print ─── */

const ART = {
  paper: "#f5ecdf",
  paperDeep: "#eee0cc",
  ink: "#20252a",
  coral: "#b8503e",
  brass: "#b58a55",
  cyan: "#7fe3e8",
  blue: "#3aa9e8",
  blueDeep: "#1d63b4",
  gold: "#d9aa58",
};

type Fonts = { display: string; mono: string };

function fonts(): Fonts {
  const css = getComputedStyle(document.documentElement);
  const display = css.getPropertyValue("--font-fraunces").trim();
  const mono = css.getPropertyValue("--font-geist-mono").trim();
  return {
    display: display ? `${display}, Georgia, serif` : "Georgia, serif",
    mono: mono ? `${mono}, ui-monospace, monospace` : "ui-monospace, monospace",
  };
}

function canvasTex(w: number, h: number, paint: (g: CanvasRenderingContext2D) => void) {
  const cv = document.createElement("canvas");
  cv.width = w;
  cv.height = h;
  const g = cv.getContext("2d");
  if (g) paint(g);
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

/** Centred text with manual tracking, since canvas letterSpacing is not everywhere. */
function tracked(g: CanvasRenderingContext2D, text: string, x: number, y: number, gap: number) {
  const chars = [...text];
  const widths = chars.map((ch) => g.measureText(ch).width);
  const total = widths.reduce((a, b) => a + b, 0) + gap * Math.max(0, chars.length - 1);
  const align = g.textAlign;
  g.textAlign = "left";
  let cx = x - total / 2;
  chars.forEach((ch, i) => { g.fillText(ch, cx, y); cx += widths[i] + gap; });
  g.textAlign = align;
}

/** The mascot mark: a blue drop, gold headphones, two eyes. */
function ariMark(g: CanvasRenderingContext2D, cx: number, cy: number, h: number) {
  const w = h * 0.66;
  const grad = g.createLinearGradient(cx, cy - h / 2, cx, cy + h / 2);
  grad.addColorStop(0, "#9fecff");
  grad.addColorStop(0.55, ART.blue);
  grad.addColorStop(1, ART.blueDeep);
  g.fillStyle = grad;
  g.beginPath();
  g.moveTo(cx + w * 0.08, cy - h / 2);
  g.bezierCurveTo(cx + w * 0.44, cy - h * 0.16, cx + w * 0.46, cy + h * 0.1, cx, cy + h / 2);
  g.bezierCurveTo(cx - w * 0.46, cy + h * 0.1, cx - w * 0.4, cy - h * 0.2, cx + w * 0.08, cy - h / 2);
  g.closePath();
  g.fill();
  g.fillStyle = "#f8fcff";
  for (const s of [-1, 1]) {
    g.beginPath();
    g.ellipse(cx + s * w * 0.15, cy, w * 0.085, h * 0.095, 0, 0, Math.PI * 2);
    g.fill();
  }
  g.fillStyle = "#14243a";
  for (const s of [-1, 1]) {
    g.beginPath();
    g.ellipse(cx + s * w * 0.16, cy + h * 0.008, w * 0.042, h * 0.05, 0, 0, Math.PI * 2);
    g.fill();
  }
  g.strokeStyle = ART.gold;
  g.lineWidth = Math.max(1.4, h * 0.05);
  g.lineCap = "round";
  g.beginPath();
  g.arc(cx, cy - h * 0.02, w * 0.46, Math.PI * 1.08, Math.PI * 1.92);
  g.stroke();
}

function useBoothArt(fontsReady: boolean) {
  const art = useMemo(() => {
    const f = fonts();

    const crown = canvasTex(1024, 200, (g) => {
      g.scale(2, 2);
      g.fillStyle = ART.paper;
      g.fillRect(0, 0, 512, 100);
      g.strokeStyle = ART.brass;
      g.lineWidth = 3;
      g.strokeRect(7, 7, 498, 86);
      ariMark(g, 60, 50, 54);
      g.fillStyle = ART.coral;
      g.font = `500 30px ${f.display}`;
      g.textAlign = "left";
      g.textBaseline = "alphabetic";
      g.fillText("PHOTO STUDIO", 106, 52);
      g.fillStyle = ART.ink;
      g.font = `400 16px ${f.mono}`;
      g.fillText("SAY CHEESE", 108, 78);
      g.textAlign = "right";
      g.fillStyle = ART.ink;
      g.globalAlpha = 0.7;
      g.font = `400 12px ${f.mono}`;
      tracked(g, "BOOTH 004", 452, 57, 2.6);
      g.globalAlpha = 1;
    });
    // the sign is small on screen: skip mipmaps so the small type stays crisp instead of averaging to cream
    crown.minFilter = THREE.LinearFilter;
    crown.generateMipmaps = false;

    const poster = canvasTex(512, 700, (g) => {
      g.fillStyle = ART.paper;
      g.fillRect(0, 0, 512, 700);
      g.fillStyle = ART.paperDeep;
      for (let i = 0; i < 240; i++) {
        const x = (i * 197) % 512;
        const y = (i * 331) % 700;
        g.globalAlpha = 0.16;
        g.fillRect(x, y, 1.5, 1.5);
      }
      g.globalAlpha = 1;
      g.strokeStyle = ART.brass;
      g.lineWidth = 2;
      g.strokeRect(24, 24, 464, 652);
      g.strokeStyle = "rgba(32,37,42,0.18)";
      g.lineWidth = 1;
      g.strokeRect(32, 32, 448, 636);

      g.fillStyle = ART.ink;
      g.textBaseline = "middle";
      g.font = `400 13px ${f.mono}`;
      tracked(g, "THE PHOTO STUDIO", 256, 78, 3.6);
      g.fillStyle = ART.coral;
      g.fillRect(236, 96, 40, 2);

      ariMark(g, 256, 176, 110);

      g.fillStyle = ART.ink;
      g.font = `500 92px ${f.display}`;
      g.textBaseline = "alphabetic";
      g.textAlign = "center";
      g.fillText("SAY", 256, 322);
      g.fillText("CHEESE", 256, 408);
      g.fillStyle = ART.coral;
      g.fillRect(196, 430, 120, 4);

      g.fillStyle = ART.coral;
      g.font = `400 19px ${f.mono}`;
      g.textBaseline = "middle";
      tracked(g, "MAKE A PRINT", 256, 476, 5);

      g.strokeStyle = "rgba(32,37,42,0.22)";
      g.lineWidth = 1;
      g.beginPath();
      g.moveTo(64, 522);
      g.lineTo(448, 522);
      g.stroke();

      g.fillStyle = ART.ink;
      g.font = `400 15px ${f.mono}`;
      tracked(g, "STEP UP · SMILE · PRINT", 256, 558, 2.2);

      g.fillStyle = ART.blue;
      g.font = `400 13px ${f.mono}`;
      tracked(g, "TOUCH THE SCREEN", 256, 610, 2.6);

      g.fillStyle = "rgba(32,37,42,0.55)";
      g.font = `400 11px ${f.mono}`;
      tracked(g, "PHOTOS WHILE YOU WAIT", 256, 656, 2);
    });

    const rest = canvasTex(512, 358, (g) => {
      const bg = g.createLinearGradient(0, 0, 0, 358);
      bg.addColorStop(0, ART.ink);
      bg.addColorStop(1, "#14243a");
      g.fillStyle = bg;
      g.fillRect(0, 0, 512, 358);
      const glow = g.createRadialGradient(256, 220, 10, 256, 220, 250);
      glow.addColorStop(0, "rgba(127,227,232,0.32)");
      glow.addColorStop(1, "rgba(127,227,232,0)");
      g.fillStyle = glow;
      g.fillRect(0, 0, 512, 358);

      g.strokeStyle = ART.cyan;
      g.lineWidth = 2;
      g.globalAlpha = 0.7;
      const tick = 16;
      for (const [x, y, dx, dy] of [[20, 20, 1, 1], [492, 20, -1, 1], [20, 338, 1, -1], [492, 338, -1, -1]] as const) {
        g.beginPath();
        g.moveTo(x + dx * tick, y);
        g.lineTo(x, y);
        g.lineTo(x, y + dy * tick);
        g.stroke();
      }
      g.globalAlpha = 1;

      ariMark(g, 256, 74, 62);

      g.fillStyle = ART.paper;
      g.textAlign = "center";
      g.textBaseline = "middle";
      g.font = `500 58px ${f.display}`;
      g.fillText("SAY CHEESE", 256, 162);
      g.fillStyle = ART.cyan;
      g.font = `400 14px ${f.mono}`;
      tracked(g, "PHOTO STUDIO", 256, 200, 4);

      g.strokeStyle = "rgba(245,236,223,0.25)";
      g.lineWidth = 1;
      g.beginPath();
      g.moveTo(176, 228);
      g.lineTo(336, 228);
      g.stroke();

      g.fillStyle = "rgba(245,236,223,0.82)";
      g.font = `400 13px ${f.mono}`;
      tracked(g, "TOUCH TO BEGIN", 256, 296, 3.2);
      g.fillStyle = ART.cyan;
      g.beginPath();
      g.moveTo(248, 316);
      g.lineTo(256, 324);
      g.lineTo(264, 316);
      g.strokeStyle = ART.cyan;
      g.lineWidth = 2;
      g.stroke();
    });

    const strip = canvasTex(256, 384, (g) => {
      g.fillStyle = "#f7f1e6";
      g.fillRect(0, 0, 256, 384);
      g.fillStyle = ART.ink;
      g.font = `400 9px ${f.mono}`;
      g.textAlign = "center";
      g.textBaseline = "middle";
      tracked(g, "PHOTO STUDIO", 128, 15, 1.6);
      const tones: [string, string, string][] = [
        ["#2d6f7c", "#16323c", "#0d1c22"],
        ["#c9785c", "#7c3a30", "#2a1512"],
        ["#5b5f96", "#2e3157", "#141527"],
        ["#c9a066", "#8a6132", "#2b1e10"],
      ];
      tones.forEach(([a, b, ink], i) => {
        const x = 24;
        const y = 28 + i * 84;
        const w = 208;
        const h = 74;
        const fill = g.createLinearGradient(x, y, x + w, y + h);
        fill.addColorStop(0, a);
        fill.addColorStop(1, b);
        g.fillStyle = fill;
        g.fillRect(x, y, w, h);
        g.fillStyle = ink;
        g.beginPath();
        g.arc(x + w / 2 + (i % 2 ? 12 : -12), y + h * 0.4, w * 0.12, 0, Math.PI * 2);
        g.fill();
        g.beginPath();
        g.ellipse(x + w / 2, y + h * 1.04, w * 0.28, h * 0.5, 0, Math.PI, Math.PI * 2);
        g.fill();
        g.fillStyle = "rgba(247,241,230,0.5)";
        g.fillRect(x, y + h - 10, w, 1);
      });
      g.fillStyle = "rgba(32,37,42,0.65)";
      g.font = `400 7px ${f.mono}`;
      tracked(g, "BOOTH 004 · SAY CHEESE", 128, 372, 1.2);
    });

    const plate = canvasTex(256, 64, (g) => {
      const grad = g.createLinearGradient(0, 0, 0, 64);
      grad.addColorStop(0, "#d3a967");
      grad.addColorStop(0.5, "#b58a55");
      grad.addColorStop(1, "#8d6535");
      g.fillStyle = grad;
      g.fillRect(0, 0, 256, 64);
      g.strokeStyle = "rgba(32,37,42,0.5)";
      g.lineWidth = 2;
      g.strokeRect(5, 5, 246, 54);
      g.fillStyle = "#241a0f";
      g.font = `400 19px ${f.mono}`;
      g.textAlign = "center";
      g.textBaseline = "middle";
      tracked(g, "BOOTH 004", 128, 34, 4);
      g.fillStyle = "rgba(255,240,215,0.7)";
      g.beginPath();
      g.arc(18, 32, 3, 0, Math.PI * 2);
      g.fill();
      g.beginPath();
      g.arc(238, 32, 3, 0, Math.PI * 2);
      g.fill();
    });

    return { crown, poster, rest, strip, plate };
  }, [fontsReady]);

  useEffect(() => () => {
    Object.values(art).forEach((t) => t.dispose());
  }, [art]);
  return art;
}

/* ── the cabinet ──────────────────────────────────────────────────── */

function archShape(width: number, spring: number, base: number) {
  const r = width / 2;
  const s = new THREE.Shape();
  s.moveTo(-r, base);
  s.lineTo(r, base);
  s.lineTo(r, spring);
  s.absarc(0, spring, r, 0, Math.PI, false);
  s.lineTo(-r, base);
  return s;
}

function useGeometry(width: number, spring: number, base: number, depth: number, bevel: number) {
  const geo = useMemo(() => {
    const g = new THREE.ExtrudeGeometry(archShape(width, spring, base), {
      depth,
      bevelEnabled: bevel > 0,
      bevelThickness: bevel,
      bevelSize: bevel,
      bevelSegments: 2,
      curveSegments: 28,
    });
    g.translate(0, 0, -depth / 2);
    g.computeVertexNormals();
    return g;
  }, [width, spring, base, depth, bevel]);
  useEffect(() => () => geo.dispose(), [geo]);
  return geo;
}

function useMaterials() {
  const lacquer = useMemo(() => new THREE.MeshPhysicalMaterial({
    color: c.coral, roughness: 0.34, metalness: 0.02, clearcoat: 1, clearcoatRoughness: 0.15,
  }), []);
  const cream = useMemo(() => new THREE.MeshStandardMaterial({ color: c.cream, roughness: 0.62 }), []);
  const brass = useMemo(() => new THREE.MeshStandardMaterial({ color: c.boothBrass, roughness: 0.32, metalness: 0.72 }), []);
  const ink = useMemo(() => new THREE.MeshStandardMaterial({ color: c.boothInk, roughness: 0.48 }), []);
  const halo = useMemo(() => new THREE.MeshStandardMaterial({
    color: c.boothHalo, emissive: c.boothHalo, emissiveIntensity: 0.55, roughness: 0.4,
  }), []);
  useEffect(() => () => {
    lacquer.dispose(); cream.dispose(); brass.dispose(); ink.dispose(); halo.dispose();
  }, [lacquer, cream, brass, ink, halo]);
  return { lacquer, cream, brass, ink, halo };
}

function Marquee({ reducedMotion }: { reducedMotion: boolean }) {
  const bulbs = useRef<THREE.InstancedMesh>(null);
  const sockets = useRef<THREE.InstancedMesh>(null);
  const count = 13;
  const spots = useMemo(() => Array.from({ length: count }, (_, i) => {
    const a = THREE.MathUtils.degToRad(26 + (128 * i) / (count - 1));
    return [Math.cos(a) * 0.556, 1.6 + Math.sin(a) * 0.556] as const;
  }), []);
  const tint = useMemo(() => new THREE.Color(), []);

  useEffect(() => {
    const dummy = new THREE.Object3D();
    spots.forEach(([x, y], i) => {
      dummy.position.set(x, y, 0.441);
      dummy.rotation.set(Math.PI / 2, 0, 0);
      dummy.updateMatrix();
      sockets.current?.setMatrixAt(i, dummy.matrix);
      dummy.position.set(x, y, 0.454);
      dummy.rotation.set(0, 0, 0);
      dummy.updateMatrix();
      bulbs.current?.setMatrixAt(i, dummy.matrix);
      bulbs.current?.setColorAt(i, tint.setRGB(1, 0.97, 0.9));
    });
    if (sockets.current) sockets.current.instanceMatrix.needsUpdate = true;
    if (bulbs.current) {
      bulbs.current.instanceMatrix.needsUpdate = true;
      if (bulbs.current.instanceColor) bulbs.current.instanceColor.needsUpdate = true;
    }
  }, [spots, tint]);

  useFrame((state) => {
    const m = bulbs.current;
    if (!m) return;
    const t = state.clock.elapsedTime;
    for (let i = 0; i < count; i++) {
      const k = reducedMotion ? 0.95 : 0.74 + 0.26 * (0.5 + 0.5 * Math.sin(t * 2.3 - i * 0.72));
      m.setColorAt(i, tint.setRGB(k, k * 0.97, k * 0.9));
    }
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
  });

  return (
    <>
      <instancedMesh ref={sockets} args={[undefined, undefined, count]} frustumCulled={false}>
        <cylinderGeometry args={[0.024, 0.03, 0.016, 10]} />
        <meshStandardMaterial color={c.boothBrass} roughness={0.38} metalness={0.6} />
      </instancedMesh>
      <instancedMesh ref={bulbs} args={[undefined, undefined, count]} frustumCulled={false}>
        <sphereGeometry args={[0.021, 16, 12]} />
        <meshBasicMaterial color="#ffffff" toneMapped={false} />
      </instancedMesh>
    </>
  );
}

function Ari({ reducedMotion }: { reducedMotion: boolean }) {
  const bob = useRef<THREE.Group>(null);
  const eyes = useRef<THREE.Group>(null);
  const clock = useRef(0);

  const body = useMemo(() => {
    const profile: [number, number][] = [
      [0.001, 0], [0.072, 0.005], [0.112, 0.03], [0.134, 0.075], [0.14, 0.12],
      [0.135, 0.16], [0.124, 0.192], [0.108, 0.222], [0.086, 0.258], [0.062, 0.288],
      [0.038, 0.313], [0.017, 0.332], [0, 0.345],
    ];
    const g = new THREE.LatheGeometry(profile.map(([x, y]) => new THREE.Vector2(x, y)), 44);
    const pos = g.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const t = THREE.MathUtils.clamp(pos.getY(i) / 0.34, 0, 1);
      pos.setX(i, pos.getX(i) + 0.038 * Math.pow(t, 2.4));
    }
    pos.needsUpdate = true;
    g.computeVertexNormals();
    return g;
  }, []);

  const band = useMemo(() => {
    const bend = (y: number) => 0.038 * Math.pow(THREE.MathUtils.clamp(y / 0.345, 0, 1), 2.4);
    const hull: [number, number][] = [
      [-0.142, 0.184], [-0.138, 0.234], [-0.122, 0.282], [-0.082, 0.322], [-0.04, 0.345], [0, 0.356],
    ];
    const path = [...hull, ...hull.slice(0, -1).reverse().map(([x, y]) => [-x, y] as [number, number])];
    const curve = new THREE.CatmullRomCurve3(path.map(([x, y]) => new THREE.Vector3(x + bend(y), y, 0)));
    return new THREE.TubeGeometry(curve, 48, 0.0095, 8, false);
  }, []);

  const mats = useMemo(() => ({
    blue: new THREE.MeshPhysicalMaterial({
      color: c.ariBlue, roughness: 0.22, clearcoat: 1, clearcoatRoughness: 0.1,
      emissive: c.ariBlueDeep, emissiveIntensity: 0.16,
    }),
    gold: new THREE.MeshStandardMaterial({ color: c.ariGold, roughness: 0.3, metalness: 0.72 }),
    ink: new THREE.MeshStandardMaterial({ color: c.ariInk, roughness: 0.4 }),
    white: new THREE.MeshStandardMaterial({ color: "#fbfdff", roughness: 0.3 }),
    cheek: new THREE.MeshStandardMaterial({ color: c.ariCheek, roughness: 0.6 }),
    glow: new THREE.MeshStandardMaterial({ color: c.ariCyan, emissive: c.ariCyan, emissiveIntensity: 1.3, roughness: 0.3 }),
  }), []);

  useEffect(() => () => {
    body.dispose(); band.dispose();
    Object.values(mats).forEach((m) => m.dispose());
  }, [body, band, mats]);

  useFrame((_, dt) => {
    if (reducedMotion) return;
    clock.current += dt;
    const t = clock.current;
    if (bob.current) {
      bob.current.position.y = 2.21 + Math.sin(t * 1.35) * 0.009;
      bob.current.rotation.z = Math.sin(t * 0.8) * 0.03;
      bob.current.rotation.y = Math.sin(t * 0.55) * 0.055;
    }
    if (eyes.current) {
      const cycle = t % 3.7;
      const closed = cycle > 3.44 && cycle < 3.58;
      eyes.current.scale.y += ((closed ? 0.08 : 1) - eyes.current.scale.y) * Math.min(1, dt * 28);
    }
  });

  return (
    <group ref={bob} position={[0, 2.21, 0.02]}>
      <mesh position={[0, -0.008, 0]} material={mats.gold}>
        <cylinderGeometry args={[0.07, 0.078, 0.016, 20]} />
      </mesh>
      <mesh geometry={body} material={mats.blue} castShadow />
      <group ref={eyes} position={[0.0095, 0.205, 0]}>
        {[-0.043, 0.043].map((x) => (
          <group key={x} position={[x, 0, 0.094]}>
            <mesh material={mats.white} scale={[1, 1, 0.55]}>
              <sphereGeometry args={[0.027, 16, 14]} />
            </mesh>
            <mesh material={mats.ink} position={[0, 0.003, 0.017]} scale={[1, 1, 0.45]}>
              <sphereGeometry args={[0.0135, 12, 12]} />
            </mesh>
            <mesh material={mats.white} position={[0.005, 0.008, 0.024]}>
              <sphereGeometry args={[0.0045, 8, 8]} />
            </mesh>
          </group>
        ))}
        {[-0.078, 0.078].map((x) => (
          <mesh key={x} material={mats.cheek} position={[x, -0.047, 0.1005]} scale={[1, 0.72, 0.45]}>
            <sphereGeometry args={[0.018, 12, 10]} />
          </mesh>
        ))}
        <mesh material={mats.ink} position={[0, -0.037, 0.1325]} rotation={[0, 0, Math.PI]}>
          <torusGeometry args={[0.022, 0.0045, 8, 20, Math.PI]} />
        </mesh>
      </group>

      <mesh geometry={band} material={mats.gold} />
      {[-1, 1].map((s) => (
        <group key={s} position={[s * 0.138, 0.178, 0]}>
          <mesh material={mats.gold} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.046, 0.046, 0.032, 22]} />
          </mesh>
          <mesh material={mats.glow} position={[s * 0.017, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
            <torusGeometry args={[0.026, 0.004, 6, 18]} />
          </mesh>
        </group>
      ))}

      <mesh material={mats.blue} position={[-0.122, 0.078, 0.03]} rotation={[0, 0, -0.85]}>
        <capsuleGeometry args={[0.019, 0.05, 4, 8]} />
      </mesh>
      <mesh material={mats.blue} position={[0.138, 0.088, 0.04]} rotation={[0, 0, 0.7]}>
        <capsuleGeometry args={[0.019, 0.055, 4, 8]} />
      </mesh>

      <group position={[0.166, 0.098, 0.062]} rotation={[0.1, 0, -0.28]}>
        <mesh material={mats.ink}>
          <cylinderGeometry args={[0.011, 0.014, 0.058, 10]} />
        </mesh>
        <mesh material={mats.gold} position={[0, 0.034, 0]}>
          <torusGeometry args={[0.0135, 0.0035, 6, 16]} />
        </mesh>
        <mesh material={mats.ink} position={[0, 0.056, 0]}>
          <sphereGeometry args={[0.019, 12, 10]} />
        </mesh>
      </group>
    </group>
  );
}

export function Booth({ boothMode, screen, flashKey, phase, reducedMotion }: {
  boothMode: boolean; screen?: (width: number) => ReactNode; flashKey: number; phase: Phase; reducedMotion: boolean;
}) {
  const [fontsReady, setFontsReady] = useState(false);
  useEffect(() => {
    let live = true;
    document.fonts.ready.then(() => { if (live) setFontsReady(true); });
    return () => { live = false; };
  }, []);

  // drei's <Html> binds to the canvas parent and moves when R3F connects its events, a moment after the canvas's
  // first commit. Mounted in that same commit, it is briefly re-targeted, and the old root's unmount lands on the
  // new one: the screen goes blank. A frame later the target has settled, whether we arrived by click or by a link.
  const [screenReady, setScreenReady] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setScreenReady(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const art = useBoothArt(fontsReady);
  const mats = useMaterials();
  const body = useGeometry(ARCH_W, ARCH_SPRING, ARCH_BASE, 0.84, 0.014);
  const inlay = useGeometry(1.04, 1.56, 0.16, 0.012, 0);
  const { size } = useThree();
  const { domW } = boothView(size.width, size.height);

  const warm = useRef<THREE.PointLight>(null);
  const flash = useRef<THREE.PointLight>(null);
  const strip = useRef<THREE.MeshStandardMaterial>(null);
  const firedAt = useRef<number | null>(null);
  const lastKey = useRef(flashKey);

  useFrame((_, dt) => {
    if (flashKey !== lastKey.current) { lastKey.current = flashKey; firedAt.current = now(); }
    const age = firedAt.current === null ? 99 : now() - firedAt.current;
    const burst = Math.exp(-age * 11);
    if (flash.current) flash.current.intensity = 70 * burst;
    if (strip.current) strip.current.emissiveIntensity = 0.18 + 7 * burst;
    if (warm.current) {
      const target = phase === "night" ? 4.6 : phase === "evening" ? 3.0 : phase === "morning" ? 1.5 : 1.0;
      warm.current.intensity += (target - warm.current.intensity) * (1 - Math.exp(-dt * 2));
    }
  });

  return (
    <group position={BOOTH_POS.toArray()} rotation={[0, BOOTH_ROT, 0]} scale={BOOTH_SCALE}>
      {/* floor halo */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.004, 0]}>
        <ringGeometry args={[0.74, 0.82, 64]} />
        <meshBasicMaterial color={c.boothHalo} transparent opacity={0.12} depthWrite={false} />
      </mesh>

      {/* plinth, brass reveal and feet */}
      <Box size={[1.34, 0.1, 0.98]} position={[0, 0.08, 0]} color={c.cream} cast />
      <Box size={[1.35, 0.012, 0.99]} position={[0, 0.125, 0]} color={c.boothBrass} />
      {([[-0.58, -0.39], [0.58, -0.39], [-0.58, 0.39], [0.58, 0.39]] as const).map(([x, z]) => (
        <Cyl key={`${x}${z}`} r={0.036} h={0.03} position={[x, 0.015, z]} color={c.boothBrass} segments={14} cast />
      ))}

      {/* lacquer body, cream inlay, brass piping */}
      <mesh geometry={body} material={mats.lacquer} castShadow receiveShadow />
      <mesh geometry={inlay} material={mats.cream} position={[0, 0, 0.442]} />
      {[-0.52, 0.52].map((x) => (
        <Cyl key={x} r={0.006} h={1.4} position={[x, 0.86, 0.451]} color={c.boothBrass} segments={10} />
      ))}
      <mesh position={[0, 1.56, 0.451]} material={mats.brass}>
        <torusGeometry args={[0.52, 0.006, 8, 56, Math.PI]} />
      </mesh>

      {/* pilasters with brass capitals */}
      {[-0.555, 0.555].map((x) => (
        <group key={x}>
          <Box size={[0.07, 1.62, 0.05]} position={[x, 0.95, 0.459]} color={c.cream} />
          <Box size={[0.086, 0.022, 0.058]} position={[x, 1.766, 0.462]} color={c.boothBrass} />
          <Box size={[0.086, 0.022, 0.058]} position={[x, 0.148, 0.462]} color={c.boothBrass} />
          <Cyl r={0.011} h={0.006} position={[x, 0.088, 0.494]} color={c.boothBrass} segments={10} />
        </group>
      ))}

      {/* screen: brass frame, cream trim, cyan halo, dark bezel */}
      <RoundedBox args={[0.99, 0.75, 0.012]} radius={0.018} smoothness={3} position={[0, SCREEN_Y, 0.452]} material={mats.brass} />
      <RoundedBox args={[0.96, 0.72, 0.014]} radius={0.02} smoothness={3} position={[0, SCREEN_Y, 0.465]} material={mats.cream} />
      <RoundedBox args={[0.9, 0.66, 0.01]} radius={0.014} smoothness={3} position={[0, SCREEN_Y, 0.479]} material={mats.halo} />
      <RoundedBox args={[0.86, 0.62, 0.026]} radius={0.012} smoothness={3} position={[0, SCREEN_Y, 0.497]} material={mats.ink} />
      <mesh position={[0, SCREEN_Y, 0.512]}>
        <planeGeometry args={[SCREEN_W, SCREEN_H]} />
        <meshStandardMaterial color={c.boothInk} roughness={0.5} />
      </mesh>
      {screen && screenReady ? (
        <Html transform distanceFactor={(SCREEN_W * 400) / domW} position={[0, SCREEN_Y, 0.513]} zIndexRange={[20, 0]}>
          <div style={{ position: "absolute", top: 0, left: 0, width: domW, height: Math.round(domW * 0.7), transform: "translate(-50%, -50%)" }}>
            {screen(domW)}
          </div>
        </Html>
      ) : (
        <mesh position={[0, SCREEN_Y, 0.513]}>
          <planeGeometry args={[SCREEN_W, SCREEN_H]} />
          <meshStandardMaterial map={art.rest} emissive="#ffffff" emissiveMap={art.rest} emissiveIntensity={0.8} roughness={0.45} />
        </mesh>
      )}

      {/* camera bar, lens, flash diffuser */}
      <RoundedBox args={[0.54, 0.18, 0.07]} radius={0.03} smoothness={3} position={[0, 1.82, 0.483]} material={mats.cream} />
      <group position={[-0.09, 1.82, 0]}>
        <Cyl r={0.088} h={0.014} position={[0, 0, 0.524]} rotation={[Math.PI / 2, 0, 0]} color={c.cream} segments={36} />
        <Cyl r={0.076} h={0.012} position={[0, 0, 0.533]} rotation={[Math.PI / 2, 0, 0]} color={c.boothBrass} segments={36} />
        <Cyl r={0.066} h={0.03} position={[0, 0, 0.548]} rotation={[Math.PI / 2, 0, 0]} color="#151c23" segments={36} />
        <mesh position={[0, 0, 0.554]} material={mats.brass}>
          <torusGeometry args={[0.0665, 0.0035, 8, 40]} />
        </mesh>
        <Cyl r={0.052} h={0.008} position={[0, 0, 0.565]} rotation={[Math.PI / 2, 0, 0]} color="#24425a" segments={32} />
        <Cyl r={0.03} h={0.006} position={[0, 0, 0.569]} rotation={[Math.PI / 2, 0, 0]} color="#0d1c26" segments={24} />
        <mesh position={[0.026, 0.026, 0.5735]}>
          <circleGeometry args={[0.006, 12]} />
          <meshBasicMaterial color="#eef6ff" />
        </mesh>
      </group>
      <Box size={[0.21, 0.105, 0.012]} position={[0.12, 1.82, 0.522]} color="#2a2119" />
      <mesh position={[0.12, 1.82, 0.531]}>
        <boxGeometry args={[0.19, 0.088, 0.01]} />
        <meshStandardMaterial ref={strip} color="#f6cd95" emissive="#ffd7a2" emissiveIntensity={0.22} roughness={0.42} />
      </mesh>
      {[-0.064, -0.021, 0.021, 0.064].map((dx) => (
        <Box key={dx} size={[0.004, 0.084, 0.006]} position={[0.12 + dx, 1.82, 0.5375]} color="#6d4a28" />
      ))}
      <mesh position={[0, 1.79, 0.5195]}>
        <circleGeometry args={[0.0065, 12]} />
        <meshBasicMaterial color={c.boothHalo} toneMapped={false} />
      </mesh>
      <pointLight ref={flash} position={[0, 1.95, 1.05]} color="#fff6e8" intensity={0} distance={6 * BOOTH_SCALE} decay={1.5} />

      {/* crown sign */}
      <Box size={[0.64, 0.14, 0.016]} position={[0, 2.005, 0.456]} color={c.boothBrass} />
      <mesh position={[0, 2.005, 0.465]}>
        <planeGeometry args={[0.62, 0.12]} />
        <meshStandardMaterial map={art.crown} roughness={0.6} />
      </mesh>

      <Marquee reducedMotion={reducedMotion} />

      {/* the print waiting in the slot, and its little brass caption */}
      <Box size={[0.46, 0.07, 0.02]} position={[0, SLOT_Y, 0.444]} color={c.boothInk} />
      <Box size={[0.5, 0.012, 0.028]} position={[0, SLOT_Y + 0.045, 0.456]} color={c.boothBrass} />
      <mesh position={[0, 0.585, 0.468]} rotation={[-0.045, 0, 0]}>
        <planeGeometry args={[0.175, 0.26]} />
        <meshStandardMaterial map={art.strip} roughness={0.85} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, 0.9, 0.466]}>
        <planeGeometry args={[0.17, 0.0425]} />
        <meshStandardMaterial map={art.plate} roughness={0.4} metalness={0.35} />
      </mesh>

      {/* poster on the visible side */}
      <group position={[0.603, 1.52, 0]} rotation={[0, Math.PI / 2, 0]}>
        <Box size={[0.56, 0.7, 0.012]} position={[0, 0, 0]} color={c.cream} />
        <mesh position={[0, 0, 0.007]}>
          <planeGeometry args={[0.5, 0.68]} />
          <meshStandardMaterial map={art.poster} roughness={0.85} />
        </mesh>
        {[-0.345, 0.345].map((y) => (
          <Box key={y} size={[0.54, 0.012, 0.018]} position={[0, y, 0.014]} color={c.boothBrass} />
        ))}
      </group>

      <Ari reducedMotion={reducedMotion} />
      <pointLight ref={warm} position={[0, 2.05, 0.95]} color="#ffcf9e" intensity={1} distance={3.6 * BOOTH_SCALE} decay={1.7} />
      <pointLight position={[0, SCREEN_Y, 1.05]} color={c.boothHalo} intensity={0.55} distance={1.5 * BOOTH_SCALE} decay={2} />
    </group>
  );
}

/** The print: feeds down out of the slot, then lifts up to eye level and turns to face you. */
export function PrintedCard({ url, cam, reducedMotion, onLift, onPresented }: {
  url: string; cam: React.RefObject<THREE.PerspectiveCamera | null>; reducedMotion: boolean; onLift: () => void; onPresented: () => void;
}) {
  const CW = 0.26;
  const CH = CW * (1330 / 900);
  const tex = useMemo(() => { const t = new THREE.TextureLoader().load(url); t.colorSpace = THREE.SRGBColorSpace; return t; }, [url]);
  const geo = useMemo(() => new THREE.PlaneGeometry(CW, CH).translate(0, -CH / 2, 0), [CH]);
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
    const m = ref.current;
    const camera = cam.current;
    if (!m || !camera) return;
    if (born.current === null) born.current = now();
    const age = now() - born.current;
    const FEED = reducedMotion ? 0 : 1.7;
    const PAUSE = reducedMotion ? 0 : 0.35;
    const LIFT = reducedMotion ? 0 : 1.1;

    const t = Math.tan(THREE.MathUtils.degToRad(BOOTH_FOV / 2));
    const dist = 0.95;
    const visH = 2 * dist * t;
    const visW = visH * (size.width / size.height);
    const scale = Math.min((0.62 * visH) / CH, (0.8 * visW) / CW);
    camera.getWorldDirection(to);
    to.multiplyScalar(dist).add(camera.position);
    const up = new THREE.Vector3(0, 1, 0).applyQuaternion(camera.quaternion);
    to.addScaledVector(up, (CH * scale) / 2 + visH * 0.04);
    camQuat.copy(camera.quaternion);

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
      m.position.y += Math.sin(p * Math.PI) * 0.12;
      m.quaternion.slerpQuaternions(slotQuat, camQuat, e);
      const sc = 1 + (scale - 1) * e;
      m.scale.set(sc, sc, sc);
      if (p >= 1 && !shown.current) { shown.current = true; onPresented(); }
      if (p >= 1 && !reducedMotion) m.position.addScaledVector(up, Math.sin(state.clock.elapsedTime * 1.4) * 0.004);
    }
  });

  return (
    <mesh ref={ref} geometry={geo} renderOrder={10}>
      <meshStandardMaterial map={tex} emissive="#ffffff" emissiveMap={tex} emissiveIntensity={0.55} roughness={0.45} side={THREE.DoubleSide} />
    </mesh>
  );
}
