"use client";

import { RoundedBox } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { Box, Cyl } from "./Room";
import { scene as c, type Phase } from "./palette";

/* The booth on the left wall: a quiet charcoal-and-cream kiosk. A standing-height lens, a screen,
   a printer slot and English signage carry the function; no arch, no brass, no mascot. */

/** Set back along the left wall, behind the workstation and beside the window. */
export const BOOTH_POS = new THREE.Vector3(-2.72, 0, -1.35);
export const BOOTH_ROT = Math.PI / 2 - 0.15;
/** Full-size equipment: the cabinet is 1.9 m and the lens sits at about 1.55 m. */
export const BOOTH_SCALE = 0.95;

const CAB_W = 0.9;
const CAB_D = 0.5;
const BODY_H = 1.92;
const BODY_Y = 1.02;
const FRONT_Z = CAB_D / 2 + 0.006;

const SCREEN_Y = 1.2;
const SCREEN_W = 0.58;
const SCREEN_H = 0.4;
const LENS_Y = 1.62;
const SLOT_Y = 0.9;

/* ── canvas art: sign, standing screen, side instructions, print ─── */

const ART = {
  ink: "#20262c",
  paper: "#e8dfd1",
  paperDeep: "#d8ccb9",
  charcoal: "#363b41",
  warm: "#b96a45",
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

function useBoothArt(fontsReady: boolean) {
  const art = useMemo(() => {
    const f = fonts();

    // The one sign that must read from across the room: the booth's name, plus one functional line.
    const sign = canvasTex(1024, 256, (g) => {
      g.fillStyle = ART.paper;
      g.fillRect(0, 0, 1024, 256);
      g.fillStyle = ART.warm;
      g.fillRect(0, 232, 1024, 10);
      g.fillStyle = ART.ink;
      g.textBaseline = "alphabetic";
      g.textAlign = "center";
      g.font = `500 106px ${f.display}`;
      g.fillText("PHOTO BOOTH", 512, 122);
      g.fillStyle = "rgba(32,38,44,0.72)";
      g.font = `400 30px ${f.mono}`;
      tracked(g, "STEP IN · SMILE · TAKE A PRINT", 512, 184, 2.4);
    });
    // the sign is small on screen: no mipmaps keeps the small type crisp instead of averaging to cream
    sign.minFilter = THREE.LinearFilter;
    sign.generateMipmaps = false;

    // Standing screen: a calm, honest stand-by state. No face, no character.
    const screen = canvasTex(768, 512, (g) => {
      g.fillStyle = ART.charcoal;
      g.fillRect(0, 0, 768, 512);
      const glow = g.createRadialGradient(384, 300, 20, 384, 300, 380);
      glow.addColorStop(0, "rgba(255,227,191,0.2)");
      glow.addColorStop(1, "rgba(255,227,191,0)");
      g.fillStyle = glow;
      g.fillRect(0, 0, 768, 512);

      g.strokeStyle = "rgba(232,223,209,0.2)";
      g.lineWidth = 2;
      const tick = 24;
      for (const [x, y, dx, dy] of [[28, 28, 1, 1], [740, 28, -1, 1], [28, 484, 1, -1], [740, 484, -1, -1]] as const) {
        g.beginPath();
        g.moveTo(x + dx * tick, y);
        g.lineTo(x, y);
        g.lineTo(x, y + dy * tick);
        g.stroke();
      }

      g.fillStyle = ART.paper;
      g.textAlign = "center";
      g.textBaseline = "middle";
      g.font = `500 34px ${f.mono}`;
      tracked(g, "PHOTO BOOTH", 384, 96, 4);

      g.fillStyle = ART.paper;
      g.font = `500 132px ${f.display}`;
      g.fillText("READY", 384, 246);

      g.fillStyle = ART.warm;
      g.fillRect(334, 326, 100, 5);

      g.fillStyle = "rgba(232,223,209,0.88)";
      g.font = `400 30px ${f.mono}`;
      tracked(g, "LOOK AT THE LENS", 384, 382, 3);
      g.fillStyle = "rgba(232,223,209,0.6)";
      g.font = `400 22px ${f.mono}`;
      tracked(g, "SMILE WHEN IT COUNTS", 384, 432, 2.2);
    });

    // Side instructions, in the same ink and paper, so the cabinet reads as one object.
    const poster = canvasTex(420, 560, (g) => {
      g.fillStyle = ART.paper;
      g.fillRect(0, 0, 420, 560);
      g.strokeStyle = ART.paperDeep;
      g.lineWidth = 3;
      g.strokeRect(20, 20, 380, 520);

      g.fillStyle = ART.warm;
      g.fillRect(44, 52, 44, 4);
      g.fillStyle = ART.ink;
      g.textAlign = "left";
      g.textBaseline = "alphabetic";
      g.font = `500 46px ${f.display}`;
      g.fillText("MAKE A", 44, 118);
      g.fillText("PRINT", 44, 168);

      const steps = [
        ["1", "STAND IN FRONT"],
        ["2", "LOOK AT THE LENS"],
        ["3", "COLLECT YOUR PRINT"],
      ] as const;
      steps.forEach(([n, line], i) => {
        const y = 248 + i * 92;
        g.fillStyle = ART.warm;
        g.font = `500 30px ${f.mono}`;
        g.fillText(n, 44, y);
        g.fillStyle = ART.ink;
        g.font = `400 19px ${f.mono}`;
        g.fillText(line, 82, y);
        g.strokeStyle = "rgba(32,38,44,0.16)";
        g.lineWidth = 1;
        g.beginPath();
        g.moveTo(44, y + 24);
        g.lineTo(376, y + 24);
        g.stroke();
      });

      g.fillStyle = "rgba(32,38,44,0.55)";
      g.font = `400 15px ${f.mono}`;
      tracked(g, "THE PHOTO BOOTH", 210, 522, 2);
    });

    const plate = canvasTex(320, 80, (g) => {
      g.fillStyle = ART.charcoal;
      g.fillRect(0, 0, 320, 80);
      g.fillStyle = ART.paper;
      g.textAlign = "center";
      g.textBaseline = "middle";
      g.font = `400 26px ${f.mono}`;
      tracked(g, "PRINTS", 160, 42, 5);
    });
    plate.minFilter = THREE.LinearFilter;
    plate.generateMipmaps = false;

    // A print waiting in the slot: colour fields, no figures that could read as a mascot.
    const strip = canvasTex(320, 220, (g) => {
      g.fillStyle = "#f4eee3";
      g.fillRect(0, 0, 320, 220);
      const tones: [string, string][] = [
        ["#6f7f89", "#39444c"],
        ["#a9715a", "#5f3e33"],
        ["#7b7f9a", "#43475f"],
      ];
      tones.forEach(([a, b], i) => {
        const x = 28 + i * 90;
        const fill = g.createLinearGradient(x, 34, x + 72, 158);
        fill.addColorStop(0, a);
        fill.addColorStop(1, b);
        g.fillStyle = fill;
        g.fillRect(x, 34, 72, 124);
        g.fillStyle = "rgba(244,238,227,0.45)";
        g.fillRect(x, 148, 72, 2);
      });
      g.fillStyle = ART.ink;
      g.textAlign = "center";
      g.textBaseline = "middle";
      g.font = `400 14px ${f.mono}`;
      tracked(g, "PHOTO BOOTH · YOUR PRINT", 160, 192, 1.4);
    });

    return { sign, screen, poster, plate, strip };
  }, [fontsReady]);

  useEffect(() => () => {
    Object.values(art).forEach((t) => t.dispose());
  }, [art]);
  return art;
}

/* ── the cabinet ──────────────────────────────────────────────────── */

function useMaterials() {
  const cabinet = useMemo(() => new THREE.MeshStandardMaterial({ color: c.boothCabinet, roughness: 0.58, metalness: 0.08 }), []);
  const panel = useMemo(() => new THREE.MeshStandardMaterial({ color: c.boothPanel, roughness: 0.72 }), []);
  const ink = useMemo(() => new THREE.MeshStandardMaterial({ color: c.boothInk, roughness: 0.44, metalness: 0.2 }), []);
  const accent = useMemo(() => new THREE.MeshStandardMaterial({ color: c.coral, roughness: 0.5 }), []);
  useEffect(() => () => {
    cabinet.dispose(); panel.dispose(); ink.dispose(); accent.dispose();
  }, [cabinet, panel, ink, accent]);
  return { cabinet, panel, ink, accent };
}

export function Booth({ phase }: { phase: Phase }) {
  const [fontsReady, setFontsReady] = useState(false);
  useEffect(() => {
    let live = true;
    document.fonts.ready.then(() => { if (live) setFontsReady(true); });
    return () => { live = false; };
  }, []);

  const art = useBoothArt(fontsReady);
  const mats = useMaterials();
  const warm = useRef<THREE.PointLight>(null);
  const screenLit = useRef<THREE.MeshStandardMaterial>(null);

  useFrame((_, dt) => {
    const k = 1 - Math.exp(-dt * 2);
    const target = phase === "night" ? 1.5 : phase === "evening" ? 1.1 : phase === "morning" ? 0.55 : 0.4;
    if (warm.current) warm.current.intensity += (target - warm.current.intensity) * k;
    // the screen is the cabinet's second light: it reads brighter as the room darkens
    const glow = 0.44 + target * 0.19;
    if (screenLit.current) screenLit.current.emissiveIntensity += (glow - screenLit.current.emissiveIntensity) * k;
  });

  return (
    <group position={BOOTH_POS.toArray()} rotation={[0, BOOTH_ROT, 0]} scale={BOOTH_SCALE}>
      {/* plinth and feet: a piece of furniture, not a set piece */}
      <Box size={[CAB_W - 0.04, 0.06, CAB_D - 0.04]} position={[0, 0.03, 0]} color={c.boothCabinetEdge} cast />
      {([[-0.36, -0.19], [0.36, -0.19], [-0.36, 0.19], [0.36, 0.19]] as const).map(([x, z]) => (
        <Cyl key={`${x}${z}`} r={0.028} h={0.02} position={[x, 0.01, z]} color={c.boothInk} segments={12} cast />
      ))}

      {/* cabinet: charcoal body, cream face, dark cap */}
      <RoundedBox args={[CAB_W, BODY_H, CAB_D]} radius={0.02} smoothness={3} position={[0, BODY_Y, 0]} material={mats.cabinet} castShadow receiveShadow />
      <Box size={[CAB_W + 0.02, 0.05, CAB_D + 0.02]} position={[0, BODY_Y + BODY_H / 2, 0]} color={c.boothCabinetEdge} />
      {/* cream is trim, not a lit face: a framed screen, a base line, the sign */}
      <RoundedBox args={[0.7, 0.5, 0.012]} radius={0.008} smoothness={2} position={[0, SCREEN_Y, FRONT_Z + 0.005]} material={mats.panel} />
      <Box size={[0.022, 1.6, 0.008]} position={[-CAB_W / 2 + 0.045, 1.0, FRONT_Z + 0.005]} color={c.boothPanel} />
      <Box size={[CAB_W - 0.14, 0.008, 0.006]} position={[0, 1.74, FRONT_Z + 0.009]} color={c.coral} />
      <Box size={[CAB_W - 0.14, 0.012, 0.006]} position={[0, 0.23, FRONT_Z + 0.009]} color={c.boothPanelEdge} />

      {/* sign band */}
      <Box size={[CAB_W - 0.04, 0.22, 0.016]} position={[0, 1.85, FRONT_Z + 0.006]} color={c.boothCabinetEdge} />
      <mesh position={[0, 1.852, FRONT_Z + 0.017]}>
        <planeGeometry args={[CAB_W - 0.08, 0.18]} />
        <meshStandardMaterial map={art.sign} roughness={0.6} />
      </mesh>

      {/* standing screen */}
      <RoundedBox args={[SCREEN_W + 0.06, SCREEN_H + 0.06, 0.024]} radius={0.012} smoothness={3} position={[0, SCREEN_Y, FRONT_Z + 0.012]} material={mats.ink} />
      <mesh position={[0, SCREEN_Y, FRONT_Z + 0.026]}>
        <planeGeometry args={[SCREEN_W, SCREEN_H]} />
        <meshStandardMaterial ref={screenLit} map={art.screen} emissive="#ffffff" emissiveMap={art.screen} emissiveIntensity={0.52} roughness={0.4} />
      </mesh>

      {/* lens at standing eye height, with a small warm ring */}
      <RoundedBox args={[0.26, 0.16, 0.06]} radius={0.02} smoothness={3} position={[0, LENS_Y, FRONT_Z + 0.02]} material={mats.ink} />
      <group position={[0, LENS_Y, FRONT_Z + 0.052]}>
        <Cyl r={0.062} h={0.018} position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]} color={c.boothCabinetEdge} segments={28} />
        <Cyl r={0.05} h={0.014} position={[0, 0, 0.012]} rotation={[Math.PI / 2, 0, 0]} color={c.boothInk} segments={28} />
        <Cyl r={0.034} h={0.008} position={[0, 0, 0.022]} rotation={[Math.PI / 2, 0, 0]} color="#0d1419" segments={24} />
        <mesh position={[0.012, 0.012, 0.0275]}>
          <circleGeometry args={[0.006, 10]} />
          <meshBasicMaterial color={c.boothGlow} />
        </mesh>
        <mesh material={mats.accent} position={[0, 0, 0.016]}>
          <torusGeometry args={[0.074, 0.004, 8, 32]} />
        </mesh>
      </group>

      {/* printer slot and the print waiting in it */}
      <Box size={[0.4, 0.055, 0.03]} position={[0, SLOT_Y, FRONT_Z + 0.012]} color={c.boothInk} />
      <Box size={[0.44, 0.014, 0.02]} position={[0, SLOT_Y + 0.04, FRONT_Z + 0.018]} color={c.boothPanelEdge} />
      <mesh position={[0.148, SLOT_Y + 0.01, FRONT_Z + 0.033]}>
        <circleGeometry args={[0.008, 12]} />
        <meshBasicMaterial color={c.boothGlow} toneMapped={false} />
      </mesh>
      <mesh position={[0, SLOT_Y - 0.088, FRONT_Z + 0.032]} rotation={[-0.05, 0, 0]}>
        <planeGeometry args={[0.22, 0.15]} />
        <meshStandardMaterial map={art.strip} roughness={0.85} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, SLOT_Y - 0.185, FRONT_Z + 0.014]}>
        <planeGeometry args={[0.2, 0.05]} />
        <meshStandardMaterial map={art.plate} roughness={0.6} />
      </mesh>

      {/* instructions hang on the side the camera sees: BOOTH_ROT turns local -x into the room and
          local +x into the back wall, so the +x side would be read by nobody */}
      <group position={[-CAB_W / 2 - 0.008, 1.26, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <Box size={[0.48, 0.62, 0.012]} position={[0, 0, 0]} color={c.boothPanelEdge} />
        <mesh position={[0, 0, 0.007]}>
          <planeGeometry args={[0.44, 0.56]} />
          <meshStandardMaterial map={art.poster} roughness={0.8} />
        </mesh>
      </group>

      {/* the only light on the cabinet: warm, low, and steady */}
      <pointLight ref={warm} position={[0, 1.25, 0.72]} color={c.boothGlow} intensity={0.4} distance={1.7} decay={2} />
    </group>
  );
}
