"use client";

import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { scene as c } from "./palette";

type V3 = [number, number, number];

/** One material per look, shared by every Box and Cyl: ~70 meshes, a handful of materials. Never disposed on purpose, they are tiny and live as long as the page. */
const materials = new Map<string, THREE.MeshStandardMaterial>();
export function sharedMaterial(color: string, emissive = "#000000", emissiveIntensity = 0) {
  const key = `${color}|${emissive}|${emissiveIntensity}`;
  let m = materials.get(key);
  if (!m) {
    m = new THREE.MeshStandardMaterial({ color, roughness: 0.85, flatShading: true, emissive, emissiveIntensity });
    materials.set(key, m);
  }
  return m;
}

/** A flat-shaded box, the block-out's only building material besides cylinders. Casts no shadow unless asked: only big props and the booth should. */
export function Box({ size, position, color, rotation, cast = false, receive = true, emissive, emissiveIntensity }: {
  size: V3; position: V3; color: string; rotation?: V3; cast?: boolean; receive?: boolean;
  emissive?: string; emissiveIntensity?: number;
}) {
  return (
    <mesh position={position} rotation={rotation} castShadow={cast} receiveShadow={receive} material={sharedMaterial(color, emissive, emissiveIntensity)}>
      <boxGeometry args={size} />
    </mesh>
  );
}

export function Cyl({ r, h, position, color, segments = 18, rTop, rotation, cast = false }: {
  r: number; h: number; position: V3; color: string; segments?: number; rTop?: number; rotation?: V3; cast?: boolean;
}) {
  return (
    <mesh position={position} rotation={rotation} castShadow={cast} receiveShadow material={sharedMaterial(color)}>
      <cylinderGeometry args={[rTop ?? r, r, h, segments]} />
    </mesh>
  );
}

/** Floorboards as a single striped texture — reads as wood without a texture file. */
function useFloorTexture() {
  const tex = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 256;
    const g = canvas.getContext("2d")!;
    g.fillStyle = c.floor;
    g.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 8; i++) {
      g.fillStyle = i % 2 ? "rgba(90,60,30,0.06)" : "rgba(255,240,220,0.05)";
      g.fillRect(0, i * 32, 256, 32);
      g.fillStyle = "rgba(70,45,25,0.18)";
      g.fillRect(0, i * 32, 256, 1.5);
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(1.5, 1.5);
    return tex;
  }, []);
  useEffect(() => () => tex.dispose(), [tex]); // a texture nobody frees stays on the GPU for good
  return tex;
}

export function Room({ sky }: { sky: string }) {
  const floorTex = useFloorTexture();
  return (
    <group>
      {/* plinth — the room sits on the page like a diorama */}
      <Box size={[6.6, 0.6, 6.6]} position={[0, -0.32, 0]} color={c.base} cast={false} />
      <Box size={[6.62, 0.08, 6.62]} position={[0, -0.6, 0]} color={c.baseEdge} cast={false} />

      {/* floor */}
      <mesh position={[0, 0.0, 0]} receiveShadow>
        <boxGeometry args={[6.2, 0.06, 6.2]} />
        <meshStandardMaterial map={floorTex} roughness={0.9} />
      </mesh>

      {/* walls: back (−z) and left (−x); the open sides face the visitor */}
      <Box size={[6.2, 3.8, 0.2]} position={[0, 1.9, -3.2]} color={c.wall} cast={false} />
      <Box size={[0.2, 3.8, 6.4]} position={[-3.2, 1.9, -0.1]} color={c.wallSide} cast={false} />
      <Box size={[6.2, 0.14, 0.06]} position={[0, 0.1, -3.08]} color={c.trim} cast={false} />
      <Box size={[0.06, 0.14, 6.2]} position={[-3.08, 0.1, 0]} color={c.trim} cast={false} />

      {/* window on the left wall — the sky follows the visitor's local time */}
      <mesh position={[-3.085, 2.15, 0.9]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[2.0, 1.5]} />
        <meshBasicMaterial color={sky} toneMapped={false} />
      </mesh>
      <Box size={[0.1, 0.08, 2.14]} position={[-3.06, 2.94, 0.9]} color={c.cream} />
      <Box size={[0.1, 0.08, 2.14]} position={[-3.06, 1.36, 0.9]} color={c.cream} />
      <Box size={[0.1, 1.6, 0.08]} position={[-3.06, 2.15, -0.16]} color={c.cream} />
      <Box size={[0.1, 1.6, 0.08]} position={[-3.06, 2.15, 1.96]} color={c.cream} />
      <Box size={[0.1, 1.5, 0.05]} position={[-3.06, 2.15, 0.9]} color={c.cream} />
      <Box size={[0.32, 0.06, 2.3]} position={[-2.95, 1.3, 0.9]} color={c.cream} />

      {/* desk against the back wall */}
      <Box size={[2.8, 0.1, 1.05]} position={[-0.55, 1.0, -2.55]} color={c.desk} cast />
      {([[-1.85, -2.15], [0.75, -2.15], [-1.85, -2.98], [0.75, -2.98]] as const).map(([x, z]) => (
        <Box key={`${x}${z}`} size={[0.08, 0.95, 0.08]} position={[x, 0.5, z]} color={c.deskLeg} />
      ))}

      {/* stool — tucked at the desk, where he actually sits */}
      <Cyl r={0.34} h={0.08} position={[-0.6, 0.66, -1.88]} color={c.stool} cast />
      <Cyl r={0.05} h={0.62} position={[-0.6, 0.33, -1.88]} color={c.metal} segments={8} />
      <Cyl r={0.3} h={0.04} position={[-0.6, 0.04, -1.88]} color={c.metal} />

      {/* rug */}
      <Cyl r={1.55} h={0.02} position={[-0.3, 0.04, -0.6]} color={c.rug} segments={40} cast={false} />
      <Cyl r={1.15} h={0.022} position={[-0.3, 0.045, -0.6]} color={c.rugInner} segments={40} cast={false} />

      {/* plant in the front-left corner */}
      <Cyl r={0.32} h={0.55} rTop={0.38} position={[-2.45, 0.3, 2.35]} color={c.plantPot} cast />
      {([[0, 0.95, 0, 0.42], [0.18, 1.3, -0.1, 0.32], [-0.2, 1.22, 0.12, 0.3], [0.05, 1.6, 0.05, 0.24]] as const).map(([x, y, z, r], i) => (
        <mesh key={i} position={[-2.45 + x, y, 2.35 + z]} castShadow>
          <icosahedronGeometry args={[r, 0]} />
          <meshStandardMaterial color={i % 2 ? c.leafDark : c.leaf} roughness={0.9} flatShading />
        </mesh>
      ))}
    </group>
  );
}
