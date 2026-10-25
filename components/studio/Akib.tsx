"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { scene as c } from "./palette";

export type AkibPose = "typing" | "wave" | "talk" | "listen" | "nod";

export type AkibProps = {
  reducedMotion: boolean;
  /** typing at the desk by default; "wave" when the visitor looks at him; "talk"/"listen" for the Ask-Akib twin. */
  pose: AkibPose;
  /** 0 to 1 mouth openness while talking, driven by speech. */
  mouth?: number;
  /** turn the head toward the pointer. */
  lookAtPointer?: boolean;
  /** over-ear headphones on the head (nodding to the studio's sound) instead of around the neck. */
  headphonesOn?: boolean;
};

/* ── Face canvas: painted onto a spherical cap at the front of the head ─────────── */

const FACE_W = 512;
const FACE_H = 512;
const PHI_SPAN = 1.9; // radians of the head the cap covers, left to right
const THETA_START = Math.PI / 2 - 0.55;
const THETA_LEN = 1.9;
const EYE_X = [142, 370] as const;
const EYE_Y = 150;
const MOUTH_Y = 262;
/** Stubble was drawn for a mouth at y=293; shift it with the mouth. */
const DY = MOUTH_Y - 293;

function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function ellipse(g: CanvasRenderingContext2D, x: number, y: number, rx: number, ry: number) {
  g.beginPath();
  g.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
}

/** Brows and stubble never change, so they are painted once and copied under each redraw. */
function paintStatic(): HTMLCanvasElement {
  const cv = document.createElement("canvas");
  cv.width = FACE_W;
  cv.height = FACE_H;
  const g = cv.getContext("2d")!;
  const rand = rng(7);

  // stubble: a soft shadow over the upper lip and jaw, then a dense stipple that thins toward the edges
  g.fillStyle = c.akibStubble;
  g.save();
  g.beginPath();
  g.rect(0, 280 + DY, FACE_W, FACE_H);
  g.clip();
  for (let i = 0; i < 4; i++) {
    g.globalAlpha = 0.08;
    ellipse(g, 256, 255 + DY, 225 - i * 24, 235 - i * 28);
    g.fill();
  }
  g.restore();
  g.globalAlpha = 0.16;
  for (let i = 0; i < 2; i++) {
    ellipse(g, 256, 254 + DY, 90 - i * 14, 24 - i * 3);
    g.fill();
  }
  g.globalAlpha = 0.7;
  for (let i = 0; i < 6500; i++) {
    const x = 20 + rand() * 472;
    const y = 225 + DY + rand() * 287;
    const dx = (x - 256) / 225;
    const dy = (y - 255 - DY) / 235;
    const d = dx * dx + dy * dy;
    const upperLip = Math.abs(x - 256) < 90 && y > 230 + DY && y < MOUTH_Y - 14;
    if (Math.abs(x - 256) < 104 && Math.abs(y - MOUTH_Y) < 20) continue; // keep the lips clear so the smile reads
    if (!upperLip && (y < 282 + DY || d > 1)) continue;
    const p = upperLip ? 0.75 : 0.9 - 0.65 * Math.max(0, d - 0.35);
    if (rand() > p) continue;
    g.fillRect(x, y, 3.2, 3.2);
  }
  g.globalAlpha = 1;

  // thick, dark brows, inner ends lower
  g.strokeStyle = c.akibBrow;
  g.lineCap = "round";
  for (const s of [1, -1]) {
    const px = (x: number) => (s === 1 ? x : FACE_W - x);
    for (const [w, off] of [[17, 0], [10, -3]] as const) {
      g.lineWidth = w;
      g.beginPath();
      g.moveTo(px(88), 110 + off);
      g.quadraticCurveTo(px(150), 64 + off, px(216), 94 + off);
      g.stroke();
    }
  }
  return cv;
}

function drawEye(g: CanvasRenderingContext2D, cx: number, closed: number) {
  const cy = EYE_Y;
  if (closed >= 0.8) {
    g.fillStyle = c.akibSkin;
    ellipse(g, cx, cy, 56, 36);
    g.fill();
    g.strokeStyle = c.akibBrow;
    g.lineWidth = 6;
    g.lineCap = "round";
    g.beginPath();
    g.moveTo(cx - 42, cy - 2);
    g.quadraticCurveTo(cx, cy + 18, cx + 42, cy - 2);
    g.stroke();
    return;
  }
  g.save();
  ellipse(g, cx, cy, 47, 29);
  g.clip();
  g.fillStyle = c.akibSclera;
  g.fillRect(cx - 50, cy - 34, 100, 68);
  g.fillStyle = c.akibEye;
  g.beginPath();
  g.arc(cx, cy, 24, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = c.akibPupil;
  g.beginPath();
  g.arc(cx, cy, 12, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = c.akibCatch;
  g.beginPath();
  g.arc(cx + 9, cy - 8, 6, 0, Math.PI * 2);
  g.fill();
  // the lid only comes down on a blink
  g.fillStyle = c.akibSkin;
  g.fillRect(cx - 50, cy - 34, 100, closed * 68);
  g.restore();
  // thin upper lash line
  g.strokeStyle = c.akibBrow;
  g.lineCap = "round";
  g.lineWidth = 4.5;
  g.beginPath();
  g.moveTo(cx - 48, cy - 2);
  g.quadraticCurveTo(cx, cy - 44 + closed * 40, cx + 48, cy - 2);
  g.stroke();
}

function drawMouth(g: CanvasRenderingContext2D, open: number, smile: number) {
  const cx = FACE_W / 2;
  const my = MOUTH_Y;
  g.lineCap = "round";
  g.lineJoin = "round";
  const lift = 20 + smile * 8; // how far the corners rise above the middle
  if (open < 0.08) {
    const w = 80 + smile * 8;
    g.strokeStyle = c.akibLip;
    g.globalAlpha = 0.55;
    g.lineWidth = 16;
    g.beginPath();
    g.moveTo(cx - w * 0.6, my + 4 - lift * 0.5);
    g.quadraticCurveTo(cx, my + 30, cx + w * 0.6, my + 4 - lift * 0.5);
    g.stroke();
    g.globalAlpha = 1;
    g.strokeStyle = c.akibMouth;
    g.lineWidth = 10;
    g.beginPath();
    g.moveTo(cx - w, my - lift);
    g.quadraticCurveTo(cx, my + 16 + smile * 8, cx + w, my - lift);
    g.stroke();
    // cheek creases at the corners
    g.lineWidth = 4;
    for (const s of [-1, 1]) {
      g.beginPath();
      g.moveTo(cx + s * (w + 7), my - lift - 9);
      g.quadraticCurveTo(cx + s * (w + 14), my - lift + 2, cx + s * (w + 6), my - lift + 14);
      g.stroke();
    }
    return;
  }
  // open smile: a crescent that deepens with `open`
  const w = 76 - open * 10 + smile * 6;
  const drop = 30 + open * 50;
  g.save();
  g.beginPath();
  g.moveTo(cx - w, my - lift);
  g.quadraticCurveTo(cx, my + 8, cx + w, my - lift);
  g.quadraticCurveTo(cx, my + 8 + drop * 1.6, cx - w, my - lift);
  g.closePath();
  g.fillStyle = c.akibMouthIn;
  g.fill();
  g.clip();
  g.fillStyle = c.akibTeeth;
  g.fillRect(cx - w, my - lift, w * 2, 26 + open * 10);
  g.restore();
  g.strokeStyle = c.akibMouth;
  g.lineWidth = 6;
  g.beginPath();
  g.moveTo(cx - w, my - lift);
  g.quadraticCurveTo(cx, my + 8, cx + w, my - lift);
  g.quadraticCurveTo(cx, my + 8 + drop * 1.6, cx - w, my - lift);
  g.stroke();
}

/* ── Geometry helpers ─────────────────────────────────────────────────────────── */

const hair = new THREE.Color(c.akibHair);
const tip = new THREE.Color(c.akibHairTip);
const tmp = new THREE.Color();

function noise(x: number, y: number, z: number) {
  const s = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453;
  return s - Math.floor(s);
}

/** A tapered, roughened blob with vertex colours running from dark roots to warm brown tips. */
function clump(rx: number, ry: number, rz: number, taper: number, tipFrom = 0.6): THREE.BufferGeometry {
  const g = new THREE.SphereGeometry(1, 14, 10);
  const pos = g.attributes.position;
  const col = new Float32Array(pos.count * 3);
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
    const t = (y + 1) / 2;
    const s = 1 - taper * t * t;
    const j = 1 + (noise(x, y, z) - 0.5) * 0.16;
    pos.setXYZ(i, x * rx * s * j, y * ry, z * rz * s * j);
    const f = THREE.MathUtils.smoothstep(t, tipFrom, tipFrom + 0.35);
    tmp.copy(hair).lerp(tip, f);
    col[i * 3] = tmp.r; col[i * 3 + 1] = tmp.g; col[i * 3 + 2] = tmp.b;
  }
  g.setAttribute("color", new THREE.BufferAttribute(col, 3));
  return g;
}

function domeGeometry(): THREE.BufferGeometry {
  const g = new THREE.SphereGeometry(1, 14, 8, 0, Math.PI * 2, 0, 1.52);
  const pos = g.attributes.position;
  const col = new Float32Array(pos.count * 3);
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
    const j = 1 + (noise(x, y, z) - 0.5) * 0.05;
    pos.setXYZ(i, x * 0.318 * j, y * 0.318 * j, z * 0.325 * j);
    tmp.copy(hair).lerp(tip, 0.12 + THREE.MathUtils.smoothstep(y, 0.6, 1) * 0.4);
    col[i * 3] = tmp.r; col[i * 3 + 1] = tmp.g; col[i * 3 + 2] = tmp.b;
  }
  g.setAttribute("color", new THREE.BufferAttribute(col, 3));
  return g;
}

type Clump = { p: [number, number, number]; r: [number, number, number]; rot: [number, number, number]; taper: number; tipFrom?: number };

/** Voluminous swept top with a slight fringe and short sides, built from overlapping clumps. */
const CLUMPS: Clump[] = [
  // top: stretched cones leaning forward about 30 degrees and swept toward his right (-x)
  { p: [-0.02, 0.3, -0.02], r: [0.13, 0.21, 0.16], rot: [0.52, 0, 0.45], taper: 0.8, tipFrom: 0.45 },
  { p: [-0.12, 0.28, 0.03], r: [0.11, 0.19, 0.15], rot: [0.55, 0, 0.5], taper: 0.8, tipFrom: 0.45 },
  { p: [0.08, 0.29, 0.0], r: [0.12, 0.19, 0.15], rot: [0.45, 0, 0.4], taper: 0.8, tipFrom: 0.45 },
  { p: [-0.05, 0.27, -0.13], r: [0.13, 0.18, 0.14], rot: [0.4, 0, 0.5], taper: 0.75, tipFrom: 0.45 },
  { p: [0.11, 0.24, -0.09], r: [0.1, 0.16, 0.13], rot: [0.35, 0, 0.45], taper: 0.75, tipFrom: 0.45 },
  { p: [-0.18, 0.22, -0.07], r: [0.09, 0.16, 0.13], rot: [0.3, 0, 0.62], taper: 0.75, tipFrom: 0.45 },
  { p: [0.0, 0.29, 0.1], r: [0.12, 0.16, 0.13], rot: [0.62, 0, 0.42], taper: 0.8, tipFrom: 0.45 },
  // fringe: falls over the forehead toward his right, leaving most of it clear
  { p: [-0.07, 0.2, 0.2], r: [0.085, 0.14, 0.06], rot: [2.3, 0, 0.5], taper: 0.7, tipFrom: 0.45 },
  { p: [-0.16, 0.19, 0.17], r: [0.08, 0.13, 0.06], rot: [2.2, 0, 0.7], taper: 0.7, tipFrom: 0.45 },
  { p: [0.05, 0.2, 0.2], r: [0.07, 0.11, 0.05], rot: [2.3, 0, 0.3], taper: 0.7, tipFrom: 0.45 },
];

/* ── The kit: every geometry, material and texture, built once ─────────────────── */

function buildKit() {
  const faceCanvas = document.createElement("canvas");
  faceCanvas.width = FACE_W;
  faceCanvas.height = FACE_H;
  const faceTex = new THREE.CanvasTexture(faceCanvas);
  faceTex.colorSpace = THREE.SRGBColorSpace;
  faceTex.anisotropy = 4;
  const statics = paintStatic();

  const flat = (color: string, extra: THREE.MeshStandardMaterialParameters = {}) =>
    new THREE.MeshStandardMaterial({ color, roughness: 0.85, ...extra });

  const dome = domeGeometry();
  dome.rotateX(-0.2);
  dome.translate(0, 0.05, -0.02);
  const hairParts = [dome, ...CLUMPS.map((k) => {
    const geometry = clump(k.r[0], k.r[1], k.r[2], k.taper, k.tipFrom);
    geometry.applyMatrix4(new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(...k.rot)).setPosition(...k.p));
    return geometry;
  })];
  const hairGeometry = mergeGeometries(hairParts)!;
  hairParts.forEach((part) => part.dispose());

  const handParts: THREE.BufferGeometry[] = [];
  const palm = new THREE.SphereGeometry(1, 16, 12);
  palm.scale(0.064, 0.038, 0.072);
  palm.translate(0, -0.035, 0.015);
  handParts.push(palm);
  [-0.042, -0.014, 0.014, 0.042].forEach((x, i) => {
    const finger = new THREE.CapsuleGeometry(0.011, 0.038 + (i === 1 || i === 2 ? 0.012 : 0), 4, 8);
    finger.rotateX(Math.PI / 2);
    finger.translate(x, -0.04, 0.088 - Math.abs(x) * 0.25);
    handParts.push(finger);
  });
  const thumb = new THREE.CapsuleGeometry(0.014, 0.035, 4, 8);
  thumb.rotateZ(-0.75);
  thumb.translate(0.066, -0.035, 0.02);
  handParts.push(thumb);
  const handGeometry = mergeGeometries(handParts)!;
  handParts.forEach((part) => part.dispose());

  const eyeLat = THETA_START + (EYE_Y / FACE_H) * THETA_LEN - Math.PI / 2;
  const eyeY = -0.3 * Math.sin(eyeLat);
  const eyeX = 0.3 * Math.sin(0.42);
  const eyeZ = 0.3 * Math.cos(0.42) * Math.cos(eyeLat) + 0.022;
  const glassesParts: THREE.BufferGeometry[] = [];
  [1, -1].forEach((side) => {
    const lens = new THREE.TorusGeometry(0.074, 0.0062, 8, 32);
    lens.rotateY(side * 0.42);
    lens.translate(side * eyeX, eyeY, eyeZ);
    glassesParts.push(lens);
    const temple = new THREE.CylinderGeometry(0.005, 0.005, 0.285, 8);
    temple.rotateX(Math.PI / 2);
    temple.translate(side * 0.255, eyeY, 0.14);
    glassesParts.push(temple);
  });
  const bridge = new THREE.CylinderGeometry(0.005, 0.005, 0.075, 8);
  bridge.rotateZ(Math.PI / 2);
  bridge.translate(0, eyeY + 0.012, 0.305);
  glassesParts.push(bridge);
  const glassesGeometry = mergeGeometries(glassesParts)!;
  glassesParts.forEach((part) => part.dispose());

  const shoulder = new THREE.SphereGeometry(1, 20, 14);
  shoulder.scale(0.09, 0.09, 0.09);
  const sleeve = new THREE.CapsuleGeometry(0.075, 0.05, 6, 14);
  sleeve.translate(0, -0.07, 0);
  const armGeometry = mergeGeometries([shoulder, sleeve])!;
  shoulder.dispose(); sleeve.dispose();

  const headCups: THREE.BufferGeometry[] = [], headPads: THREE.BufferGeometry[] = [];
  const neckCups: THREE.BufferGeometry[] = [], neckPads: THREE.BufferGeometry[] = [];
  [1, -1].forEach((side) => {
    const headMatrix = new THREE.Matrix4().makeRotationZ(Math.PI / 2).setPosition(side * 0.335, 0, -0.01);
    headCups.push(new THREE.CylinderGeometry(0.1, 0.1, 0.07, 20).applyMatrix4(headMatrix));
    headPads.push(new THREE.CylinderGeometry(0.085, 0.085, 0.03, 18).applyMatrix4(headMatrix.clone().multiply(new THREE.Matrix4().makeTranslation(0, -side * 0.04, 0))));
    const neckMatrix = new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(Math.PI / 2 - 0.25, 0, side * 0.2)).setPosition(side * 0.15, -0.05, 0.13);
    neckCups.push(new THREE.CylinderGeometry(0.1, 0.1, 0.07, 20).applyMatrix4(neckMatrix));
    neckPads.push(new THREE.CylinderGeometry(0.085, 0.085, 0.03, 18).applyMatrix4(neckMatrix.clone().multiply(new THREE.Matrix4().makeTranslation(0, 0.045, 0))));
  });
  const headCupGeometry = mergeGeometries(headCups)!, headPadGeometry = mergeGeometries(headPads)!;
  const neckCupGeometry = mergeGeometries(neckCups)!, neckPadGeometry = mergeGeometries(neckPads)!;
  [...headCups, ...headPads, ...neckCups, ...neckPads].forEach((part) => part.dispose());

  const skinParts = [new THREE.SphereGeometry(0.3, 32, 24)];
  const nose = new THREE.SphereGeometry(0.03, 16, 12);
  nose.scale(1, 0.9, 0.95);
  nose.translate(0, -0.058, 0.296);
  skinParts.push(nose);
  [1, -1].forEach((side) => {
    const ear = new THREE.SphereGeometry(0.05, 14, 10);
    ear.scale(0.6, 1.1, 0.9);
    ear.translate(side * 0.292, -0.01, -0.01);
    skinParts.push(ear);
  });
  const skinGeometry = mergeGeometries(skinParts)!;
  skinParts.forEach((part) => part.dispose());

  const g = {
    skin: skinGeometry,
    face: new THREE.SphereGeometry(0.3 * 1.006, 36, 24, Math.PI / 2 - PHI_SPAN / 2, PHI_SPAN, THETA_START, THETA_LEN),
    neck: new THREE.CylinderGeometry(0.07, 0.08, 0.14, 18),
    collar: new THREE.TorusGeometry(0.1, 0.017, 8, 24),
    unit: new THREE.SphereGeometry(1, 20, 14),
    arm: armGeometry,
    fore: new THREE.CapsuleGeometry(0.055, 0.19, 6, 12),
    hand: handGeometry,
    thigh: new THREE.CapsuleGeometry(0.1, 0.14, 6, 14),
    shin: new THREE.CapsuleGeometry(0.075, 0.2, 6, 12),
    sole: new THREE.BoxGeometry(0.13, 0.03, 0.26),
    glasses: glassesGeometry,
    band: new THREE.TorusGeometry(0.335, 0.02, 8, 28, Math.PI),
    neckBand: new THREE.TorusGeometry(0.18, 0.018, 8, 28, Math.PI * 2 - 1.3),
    headCups: headCupGeometry,
    headPads: headPadGeometry,
    neckCups: neckCupGeometry,
    neckPads: neckPadGeometry,
    hair: hairGeometry,
  };
  const m = {
    skinS: new THREE.MeshStandardMaterial({ color: c.akibSkin, roughness: 0.8 }),
    skinF: flat(c.akibSkin, { roughness: 0.8 }),
    face: new THREE.MeshStandardMaterial({
      map: faceTex, transparent: true, roughness: 0.8, depthWrite: false,
      polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2,
    }),
    hair: flat(c.akibHair, { vertexColors: true, roughness: 0.95, emissive: c.akibCatch, emissiveIntensity: 0.3 }),
    tee: flat(c.akibTee, { roughness: 0.95 }),
    trim: flat(c.akibTeeTrim, { roughness: 0.95 }),
    pants: flat(c.akibPants, { roughness: 0.95 }),
    shoe: flat(c.akibShoe, { roughness: 0.7 }),
    sole: flat(c.akibSole, { roughness: 0.8 }),
    silver: new THREE.MeshStandardMaterial({ color: c.akibSilver, roughness: 0.3, metalness: 0.7 }),
    phone: flat(c.akibPhone, { roughness: 0.5 }),
    pad: flat(c.akibPhonePad, { roughness: 0.9 }),
  };
  // glow follows the vertex colours, so only the warm tips lift out of the shade (a flat emissive would wash the roots)
  m.hair.onBeforeCompile = (sh) => {
    sh.fragmentShader = sh.fragmentShader.replace("vec3 totalEmissiveRadiance = emissive;", "vec3 totalEmissiveRadiance = emissive * vColor.rgb;");
  };
  const face = { canvas: faceCanvas, ctx: faceCanvas.getContext("2d")!, tex: faceTex, statics, key: "" };
  const dispose = () => {
    Object.values(g).forEach((v) => (Array.isArray(v) ? v.forEach((x) => x.dispose()) : v.dispose()));
    Object.values(m).forEach((v) => v.dispose());
    faceTex.dispose();
  };
  return { g, m, face, dispose };
}

function redrawFace(face: ReturnType<typeof buildKit>["face"], closed: number, open: number, smile: number) {
  const { ctx: g } = face;
  g.clearRect(0, 0, FACE_W, FACE_H);
  g.drawImage(face.statics, 0, 0);
  EYE_X.forEach((x) => drawEye(g, x, closed));
  drawMouth(g, open, smile);
  face.tex.needsUpdate = true;
}

/* ── Pose targets ─────────────────────────────────────────────────────────────── */

// Channel indices. Yaw angles are "phi": radians turned from facing the desk toward the visitor.
const HIPS = 0, SPINE = 1, HEAD = 2, LEAN = 3, PITCH = 4, ROLL = 5;
const R_X = 6, R_Y = 7, R_Z = 8, R_EL = 9, R_ELZ = 10, R_WR = 11;
const L_X = 12, L_Y = 13, L_Z = 14, L_EL = 15, L_WR = 16;
const SMILE = 17, MOUTH = 18, BOB = 19, KNEE = 20, SWAY = 21;
const N = 22;

// how fast each channel follows its target (per second); oscillating channels need to be quick
const RATE = new Float32Array(N).fill(5);
[R_ELZ, R_WR, L_WR, MOUTH, PITCH, BOB, KNEE, SWAY].forEach((i) => (RATE[i] = 22));
[R_EL, L_EL].forEach((i) => (RATE[i] = 14));

function target(pose: AkibPose, t: number, tw: number, glance: number, mot: number, mouthProp: number | undefined, o: Float32Array) {
  o.fill(0);
  const s = Math.sin;
  o[KNEE] = mot * s(t * 1.1) * 0.07;
  // resting arms-at-the-keys values, reused by typing, nod
  const keys = (speed: number, amp: number) => {
    o[R_X] = -1.15; o[L_X] = -1.15;
    o[R_Y] = 0.45; o[L_Y] = 0.75;
    o[R_Z] = -0.05; o[L_Z] = 0.05;
    o[R_EL] = -0.7 + mot * amp * 0.06 * s(t * speed);
    o[L_EL] = -0.7 + mot * amp * 0.06 * s(t * speed + Math.PI);
    o[R_WR] = mot * amp * 0.14 * s(t * speed + 0.6);
    o[L_WR] = mot * amp * 0.14 * s(t * speed + Math.PI + 0.6);
  };
  const lap = () => {
    o[R_X] = -0.35; o[L_X] = -0.35;
    o[R_Y] = 0.25; o[L_Y] = 0.3;
    o[R_Z] = -0.06; o[L_Z] = 0.06;
    o[R_EL] = -1.15; o[L_EL] = -1.15;
  };
  switch (pose) {
    case "typing": {
      const amp = 0.7 + 0.3 * s(t * 0.8);
      o[HIPS] = 0.2; o[SPINE] = -0.05; o[HEAD] = 0.8 + glance * 0.35;
      o[LEAN] = 0.16; o[PITCH] = 0.1 + mot * 0.02 * s(t * 0.8);
      o[SMILE] = 0.9;
      o[MOUTH] = 0.15;
      keys(13, amp);
      break;
    }
    case "wave": {
      const raised = tw < 2.7 ? 1 : 0;
      o[HIPS] = 0.45; o[SPINE] = 0.15; o[HEAD] = 0.65;
      o[LEAN] = 0.02; o[PITCH] = -0.02; o[ROLL] = 0.05;
      o[SMILE] = 1;
      o[MOUTH] = 0.3;
      lap();
      o[R_X] = raised ? -0.2 : -0.35;
      o[R_Y] = raised ? 0 : 0.25;
      o[R_Z] = raised ? -2.5 : -0.06;
      o[R_EL] = raised ? -0.2 : -1.15;
      if (raised) {
        const ramp = Math.min(1, Math.max(0, (tw - 0.35) * 4));
        o[R_ELZ] = mot * s(tw * 9.5) * 0.55 * ramp;
        o[R_WR] = mot * s(tw * 9.5 + 0.8) * 0.25 * ramp;
      }
      break;
    }
    case "talk": {
      o[HIPS] = 0.45; o[SPINE] = 0.15; o[HEAD] = 0.65;
      o[LEAN] = 0.06; o[PITCH] = mot * 0.04 * s(t * 2.1);
      o[SMILE] = 0.5;
      o[MOUTH] = mouthProp ?? Math.min(1, Math.abs(s(t * 9)) * Math.abs(s(t * 5.3 + 1)) * 1.3) * mot;
      lap();
      o[R_X] = -0.7 + mot * 0.22 * s(t * 1.6);
      o[R_EL] = -1.3 + mot * 0.3 * s(t * 2.3 + 1);
      o[R_Y] = 0.2; o[R_Z] = -0.12;
      o[L_EL] = -1.1 + mot * 0.15 * s(t * 1.9);
      break;
    }
    case "listen": {
      o[HIPS] = 0.45; o[SPINE] = 0.15; o[HEAD] = 0.65;
      o[LEAN] = 0.04; o[ROLL] = 0.12; o[PITCH] = 0.03 + mot * 0.06 * s(t * 1.2);
      o[SMILE] = 0.8;
      o[MOUTH] = 0.15;
      lap();
      break;
    }
    case "nod": {
      const beat = s(t * 2 * Math.PI * (100 / 60));
      o[HIPS] = 0.3; o[SPINE] = -0.05; o[HEAD] = 0.75;
      o[LEAN] = 0.1; o[PITCH] = 0.08 + mot * 0.1 * beat;
      o[BOB] = mot * 0.012 * beat;
      o[SWAY] = mot * 0.05 * s(t * Math.PI * (100 / 60));
      o[SMILE] = 0.8;
      o[MOUTH] = 0.2;
      keys(5, 0.6);
      break;
    }
  }
  if (mouthProp !== undefined && pose === "talk") o[MOUTH] = mouthProp;
}

/* ── The character ────────────────────────────────────────────────────────────── */

type Joint = THREE.Group | null;

export default function Akib(props: AkibProps) {
  const { reducedMotion, pose, headphonesOn = false } = props;
  const kit = useMemo(buildKit, []);
  useEffect(() => () => kit.dispose(), [kit]);

  const live = useRef(props);
  live.current = props;

  const hips = useRef<Joint>(null), spine = useRef<Joint>(null), chest = useRef<Joint>(null);
  const neck = useRef<Joint>(null), head = useRef<Joint>(null);
  const rSh = useRef<Joint>(null), rEl = useRef<Joint>(null), rHand = useRef<Joint>(null);
  const lSh = useRef<Joint>(null), lEl = useRef<Joint>(null), lHand = useRef<Joint>(null);
  const rKnee = useRef<Joint>(null), lKnee = useRef<Joint>(null);

  const cur = useMemo(() => new Float32Array(N), []);
  const goal = useMemo(() => new Float32Array(N), []);
  const sim = useRef({ init: false, pose: pose as AkibPose, waveStart: 0, ptrX: 0, ptrY: 0, nextBlink: 2.5, blinkAt: -10, lastDraw: -1, rand: rng(2025) });

  useFrame((state, dt) => {
    const s = sim.current;
    const p = live.current;
    const t = state.clock.elapsedTime;
    const mot = p.reducedMotion ? 0 : 1;
    const expressive = p.pose === "wave" || p.pose === "talk" || p.pose === "nod" ? mot : 0;
    if (p.pose !== s.pose || !s.init) {
      if (p.pose === "wave") s.waveStart = t;
      s.pose = p.pose;
    }
    const tw = p.reducedMotion ? 1 : t - s.waveStart;
    const glance = expressive * Math.min(1, Math.max(0, (Math.sin(t * 0.31 + 1) - 0.8) * 8));
    target(p.pose, expressive ? t : 0, tw, glance, expressive, p.mouth, goal);

    const step = Math.min(dt, 0.05);
    for (let i = 0; i < N; i++) {
      const k = !s.init || p.reducedMotion ? 1 : 1 - Math.exp(-step * RATE[i]);
      cur[i] += (goal[i] - cur[i]) * k;
    }
    s.init = true;

    // pointer: head follows within +/- 35 deg yaw and 15 deg pitch
    const follow = p.lookAtPointer && !p.reducedMotion;
    const kp = 1 - Math.exp(-step * 4);
    s.ptrX += ((follow ? state.pointer.x : 0) - s.ptrX) * kp;
    s.ptrY += ((follow ? state.pointer.y : 0) - s.ptrY) * kp;
    const yawAdd = THREE.MathUtils.clamp(s.ptrX * 0.61, -0.61, 0.61);
    const pitchAdd = THREE.MathUtils.clamp(-s.ptrY * 0.26, -0.26, 0.26);

    const breath = expressive * Math.sin(t * 1.7);
    if (hips.current) {
      hips.current.rotation.y = -cur[HIPS];
      hips.current.position.y = 0.12 + cur[BOB] + breath * 0.003;
      hips.current.rotation.z = cur[SWAY];
    }
    if (spine.current) spine.current.rotation.set(cur[LEAN], -cur[SPINE], -cur[SWAY] * 0.6);
    if (chest.current) chest.current.scale.set(1, 1 + breath * 0.015, 1 + breath * 0.02);
    if (neck.current) neck.current.rotation.x = (cur[PITCH] + pitchAdd) * 0.4;
    if (head.current) head.current.rotation.set((cur[PITCH] + pitchAdd) * 0.6, -cur[HEAD] + yawAdd, cur[ROLL]);

    rSh.current?.rotation.set(cur[R_X], cur[R_Y], cur[R_Z], "YXZ");
    lSh.current?.rotation.set(cur[L_X], cur[L_Y], cur[L_Z], "YXZ");
    rEl.current?.rotation.set(cur[R_EL], 0, cur[R_ELZ]);
    lEl.current?.rotation.set(cur[L_EL], 0, 0);
    rHand.current?.rotation.set(cur[R_WR], 0, 0);
    lHand.current?.rotation.set(cur[L_WR], 0, 0);
    if (rKnee.current) rKnee.current.rotation.x = 1.5 + cur[KNEE];
    if (lKnee.current) lKnee.current.rotation.x = 1.5 - cur[KNEE];

    // blinks every 3 to 6 s from a seeded sequence
    if (t >= s.nextBlink) {
      s.blinkAt = t;
      s.nextBlink = t + 3 + s.rand() * 3;
    }
    const bp = (t - s.blinkAt) / 0.16;
    const closedLevel = bp >= 0 && bp <= 1 ? Math.round(Math.sin(bp * Math.PI) * 2) / 2 : 0;
    const openLevel = Math.round(Math.min(1, Math.max(0, cur[MOUTH])) * 8) / 8;
    const smileLevel = Math.round(cur[SMILE] * 4) / 4;
    const key = `${closedLevel}|${openLevel}|${smileLevel}`;
    if (key !== kit.face.key && t - s.lastDraw >= 1 / 15) {
      kit.face.key = key;
      s.lastDraw = t;
      redrawFace(kit.face, closedLevel, openLevel, smileLevel);
    }
  });

  const { g, m } = kit;
  const headphones = (onHead: boolean) =>
    onHead ? (
      <group>
        <mesh geometry={g.band} material={m.phone} scale={[1, 1.4, 1.05]} rotation={[-0.15, 0, 0]} position={[0, 0, -0.01]} castShadow />
        <mesh geometry={g.headCups} material={m.phone} castShadow />
        <mesh geometry={g.headPads} material={m.pad} />
      </group>
    ) : (
      <group position={[0, 0.27, -0.02]}>
        <mesh geometry={g.neckBand} material={m.phone} rotation={[Math.PI / 2, 0, Math.PI / 2 + 0.65]} castShadow />
        <mesh geometry={g.neckCups} material={m.phone} castShadow />
        <mesh geometry={g.neckPads} material={m.pad} />
      </group>
    );

  const arm = (side: 1 | -1, sh: React.RefObject<Joint>, el: React.RefObject<Joint>, hand: React.RefObject<Joint>) => (
    <group ref={sh} position={[side * 0.27, 0.2, 0]}>
      <mesh geometry={g.arm} material={m.tee} castShadow />
      <group ref={el} position={[0, -0.26, 0]}>
        <mesh geometry={g.fore} material={m.skinF} position={[0, -0.06, 0]} castShadow />
        <group ref={hand} position={[0, -0.22, 0]}>
          <mesh geometry={g.hand} material={m.skinF} castShadow />
        </group>
      </group>
    </group>
  );

  const leg = (side: 1 | -1, knee: React.RefObject<Joint>) => (
    <group position={[side * 0.11, 0, 0]} rotation={[-Math.PI / 2 + 0.12, 0, 0]}>
      <mesh geometry={g.thigh} material={m.pants} position={[0, -0.15, 0]} castShadow />
      <group ref={knee} position={[0, -0.3, 0]}>
        <mesh geometry={g.shin} material={m.pants} position={[0, -0.17, 0]} castShadow />
        <group position={[0, -0.34, 0]} rotation={[-0.2, 0, 0]}>
          <mesh geometry={g.unit} material={m.shoe} position={[0, -0.03, 0.05]} scale={[0.08, 0.06, 0.14]} castShadow />
          <mesh geometry={g.sole} material={m.sole} position={[0, -0.08, 0.05]} />
        </group>
      </group>
    </group>
  );

  return (
    <group position={[-0.45, 0.7, -2.5]} rotation={[0, 1.62, 0]} dispose={null}>
      <group scale={0.98}>
        <group ref={hips} position={[0, 0.12, 0]}>
          <mesh geometry={g.unit} material={m.pants} scale={[0.25, 0.14, 0.2]} castShadow />
          {leg(1, lKnee)}
          {leg(-1, rKnee)}
          <group ref={spine} position={[0, 0.08, 0]}>
            <mesh geometry={g.unit} material={m.tee} position={[0, 0.1, 0]} scale={[0.23, 0.17, 0.18]} castShadow />
            <group ref={chest} position={[0, 0.22, 0]}>
              <mesh geometry={g.unit} material={m.tee} position={[0, 0.1, 0]} scale={[0.26, 0.17, 0.2]} castShadow />
              {arm(-1, rSh, rEl, rHand)}
              {arm(1, lSh, lEl, lHand)}
              {!headphonesOn && headphones(false)}
              <group ref={neck} position={[0, 0.26, 0]}>
                <mesh geometry={g.neck} material={m.skinF} position={[0, 0.03, 0]} castShadow />
                <mesh geometry={g.collar} material={m.trim} rotation={[Math.PI / 2, 0, 0]} position={[0, -0.01, 0.005]} scale={[1, 1.05, 1]} />
                <group ref={head} position={[0, 0.1, 0]}>
                  <group position={[0, 0.32, 0]} scale={1.1}>
                    <mesh geometry={g.skin} material={m.skinS} castShadow />
                    <mesh geometry={g.face} material={m.face} />

                    <mesh geometry={g.glasses} material={m.silver} />
                    <mesh geometry={g.hair} material={m.hair} castShadow />
                    {headphonesOn && headphones(true)}
                  </group>
                </group>
              </group>
            </group>
          </group>
        </group>
      </group>
    </group>
  );
}
