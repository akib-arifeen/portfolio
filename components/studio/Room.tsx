"use client";

import { Instance, Instances } from "@react-three/drei";
import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { scene as c } from "./palette";

type V3 = [number, number, number];

const materials = new Map<string, THREE.MeshStandardMaterial>();
const bevelGeometry = new RoundedBoxGeometry(1, 1, 1, 2, 0.055);

export function sharedMaterial(color: string, emissive = "#000000", emissiveIntensity = 0) {
  const key = `${color}|${emissive}|${emissiveIntensity}`;
  let m = materials.get(key);
  if (!m) {
    m = new THREE.MeshStandardMaterial({ color, roughness: 0.78, emissive, emissiveIntensity });
    materials.set(key, m);
  }
  return m;
}

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

export function Bevel({ size, position, color, rotation, cast = false, receive = true }: {
  size: V3; position: V3; color: string; rotation?: V3; cast?: boolean; receive?: boolean;
}) {
  return <mesh geometry={bevelGeometry} position={position} rotation={rotation} scale={size} castShadow={cast} receiveShadow={receive} material={sharedMaterial(color)} />;
}

export function Cyl({ r, h, position, color, segments = 24, rTop, rotation, cast = false }: {
  r: number; h: number; position: V3; color: string; segments?: number; rTop?: number; rotation?: V3; cast?: boolean;
}) {
  return (
    <mesh position={position} rotation={rotation} castShadow={cast} receiveShadow material={sharedMaterial(color)}>
      <cylinderGeometry args={[rTop ?? r, r, h, segments]} />
    </mesh>
  );
}

function random(seed: number) {
  let value = seed;
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 4294967296;
  };
}

function surfaceTexture(kind: "wood" | "floor" | "plaster" | "weave") {
  const canvas = document.createElement("canvas");
  canvas.width = kind === "wood" ? 512 : 256;
  canvas.height = 256;
  const g = canvas.getContext("2d")!;
  const rand = random(kind.length * 971);
  const w = canvas.width, h = canvas.height;
  g.fillStyle = kind === "wood" || kind === "floor" ? "#b49a7f" : kind === "weave" ? "#b0a294" : "#c7c1b9";
  g.fillRect(0, 0, w, h);

  if (kind === "wood" || kind === "floor") {
    for (let i = 0; i < 150; i++) {
      const y = rand() * h;
      g.strokeStyle = `rgba(${rand() > 0.45 ? "52,30,17" : "245,218,183"},${0.025 + rand() * 0.1})`;
      g.lineWidth = 0.4 + rand() * 1.2;
      g.beginPath();
      g.moveTo(-10, y);
      for (let x = 0; x <= w + 20; x += 32) g.lineTo(x, y + Math.sin(x * 0.022 + i) * (1 + rand() * 2));
      g.stroke();
    }
    if (kind === "floor") {
      for (let y = 0; y < h; y += 42) {
        g.fillStyle = "rgba(28,17,12,0.38)";
        g.fillRect(0, y, w, 1.5);
        const offset = (y / 42) % 2 ? 96 : 0;
        for (let x = offset; x < w; x += 192) g.fillRect(x, y, 1, 42);
      }
    }
  } else if (kind === "weave") {
    for (let i = 0; i < w; i += 3) {
      g.fillStyle = i % 6 ? "rgba(255,244,224,0.09)" : "rgba(35,25,22,0.12)";
      g.fillRect(i, 0, 1, h);
    }
    for (let i = 0; i < h; i += 3) {
      g.fillStyle = i % 6 ? "rgba(255,244,224,0.055)" : "rgba(35,25,22,0.08)";
      g.fillRect(0, i, w, 1);
    }
  } else {
    for (let i = 0; i < 10500; i++) {
      const light = rand() > 0.48;
      g.fillStyle = light ? `rgba(255,250,240,${rand() * 0.09})` : `rgba(45,37,33,${rand() * 0.065})`;
      const s = 0.4 + rand() * 1.3;
      g.fillRect(rand() * w, rand() * h, s, s);
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.anisotropy = 4;
  return texture;
}

function useSurfaceTextures() {
  const textures = useMemo(() => ({
    wood: surfaceTexture("wood"),
    floor: surfaceTexture("floor"),
    plaster: surfaceTexture("plaster"),
    weave: surfaceTexture("weave"),
  }), []);
  useEffect(() => () => Object.values(textures).forEach((texture) => texture.dispose()), [textures]);
  return textures;
}

export function Room({ sky }: { sky: string }) {
  const tex = useSurfaceTextures();
  const walls = useMemo(() => [
    new THREE.MeshStandardMaterial({ color: c.wall, map: tex.plaster, roughness: 0.96 }),
    new THREE.MeshStandardMaterial({ color: c.wallSide, map: tex.plaster, roughness: 0.98 }),
  ], [tex.plaster]);
  const wood = useMemo(() => new THREE.MeshStandardMaterial({ color: c.desk, map: tex.wood, roughness: 0.58 }), [tex.wood]);
  const rug = useMemo(() => new THREE.MeshStandardMaterial({ color: c.rug, map: tex.weave, roughness: 1 }), [tex.weave]);
  useEffect(() => () => { walls.forEach((m) => m.dispose()); wood.dispose(); rug.dispose(); }, [walls, wood, rug]);
  tex.floor.repeat.set(2.8, 2.8);
  tex.weave.repeat.set(3, 3);

  return (
    <group>
      <mesh position={[0, -0.09, 0]} receiveShadow>
        <boxGeometry args={[6.2, 0.2, 6.2]} />
        <meshStandardMaterial color={c.floor} map={tex.floor} roughness={0.76} />
      </mesh>

      <mesh position={[0, 1.9, -3.2]} receiveShadow material={walls[0]}>
        <boxGeometry args={[6.2, 3.8, 0.16]} />
      </mesh>
      <mesh position={[-3.2, 1.9, -0.1]} receiveShadow material={walls[1]}>
        <boxGeometry args={[0.16, 3.8, 6.4]} />
      </mesh>
      <Bevel size={[6.2, 0.13, 0.07]} position={[0, 0.09, -3.08]} color={c.trim} />
      <Bevel size={[0.07, 0.13, 6.2]} position={[-3.08, 0.09, 0]} color={c.trim} />
      <Box size={[6.2, 0.035, 0.025]} position={[0, 2.94, -3.1]} color={c.trim} />
      <Box size={[0.025, 0.035, 6.2]} position={[-3.1, 2.94, 0]} color={c.trim} />

      <mesh position={[-3.105, 2.15, 0.9]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[2.05, 1.55]} />
        <meshBasicMaterial color={sky} toneMapped={false} />
      </mesh>
      <Instances limit={6} geometry={bevelGeometry} material={sharedMaterial(c.cream)} receiveShadow>
        <Instance scale={[0.12, 0.09, 2.22]} position={[-3.03, 2.96, 0.9]} />
        <Instance scale={[0.12, 0.09, 2.22]} position={[-3.03, 1.34, 0.9]} />
        <Instance scale={[0.12, 1.7, 0.09]} position={[-3.03, 2.15, -0.18]} />
        <Instance scale={[0.12, 1.7, 0.09]} position={[-3.03, 2.15, 1.98]} />
        <Instance scale={[0.1, 1.56, 0.045]} position={[-3.0, 2.15, 0.9]} />
        <Instance scale={[0.38, 0.075, 2.34]} position={[-2.93, 1.29, 0.9]} />
      </Instances>
      <mesh position={[-2.99, 2.15, 1.91]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[0.13, 1.48]} />
        <meshStandardMaterial color="#6b5c50" map={tex.weave} roughness={1} side={THREE.DoubleSide} />
      </mesh>

      <mesh geometry={bevelGeometry} position={[-0.55, 1.0, -2.55]} scale={[2.8, 0.115, 1.05]} castShadow receiveShadow material={wood} />
      <Instances limit={4} geometry={bevelGeometry} material={sharedMaterial(c.deskLeg)} castShadow receiveShadow>
        {([[-1.78, -2.16], [0.68, -2.16], [-1.78, -2.96], [0.68, -2.96]] as const).map(([x, z]) => (
          <Instance key={`${x}${z}`} scale={[0.075, 0.94, 0.075]} position={[x, 0.5, z]} />
        ))}
      </Instances>
      <Box size={[2.48, 0.045, 0.045]} position={[-0.55, 0.34, -2.94]} color={c.deskLeg} />

      <Cyl r={0.32} h={0.09} position={[-0.45, 0.66, -2.5]} color={c.stool} cast />
      <Cyl r={0.045} h={0.61} position={[-0.45, 0.33, -2.5]} color={c.metal} segments={16} />
      <Cyl r={0.28} h={0.035} position={[-0.45, 0.04, -2.5]} color={c.metal} />
      <Bevel size={[0.58, 0.5, 0.09]} position={[-0.45, 1.02, -2.77]} color={c.stool} rotation={[-0.08, 0, 0]} cast />

      <mesh position={[-0.3, 0.025, -0.55]} scale={[1, 1, 0.74]} receiveShadow material={rug}>
        <cylinderGeometry args={[1.6, 1.6, 0.025, 64]} />
      </mesh>
      <mesh position={[-0.3, 0.041, -0.55]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.43, 1.48, 64]} />
        <meshStandardMaterial color={c.rugInner} roughness={1} side={THREE.DoubleSide} />
      </mesh>

      <Cyl r={0.27} h={0.48} rTop={0.34} position={[-2.5, 0.26, 2.25]} color={c.plantPot} cast />
      <Instances limit={4} castShadow>
        <sphereGeometry args={[1, 18, 12]} />
        <meshStandardMaterial roughness={0.82} />
        {([[0, 0.93, 0, 0.42, -0.3], [0.16, 1.25, -0.08, 0.36, 0.5], [-0.18, 1.13, 0.1, 0.34, -0.8], [0.02, 1.48, 0.02, 0.29, 0.15]] as const).map(([x, y, z, r, rz], i) => (
          <Instance key={i} color={i % 2 ? c.leafDark : c.leaf} position={[-2.5 + x, y, 2.25 + z]} rotation={[0.25, i * 1.3, rz]} scale={[r * 0.55, r, r * 0.28]} />
        ))}
      </Instances>
    </group>
  );
}
