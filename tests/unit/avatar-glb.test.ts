import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import * as THREE from "three";
import { entries as twinEntries } from "@/lib/twin";
import {
  AVATAR_FACING,
  AVATAR_ORIGIN,
  AVATAR_POSES,
  AVATAR_SRC,
  AvatarPoseDriver,
  disposeAvatar,
  type AvatarPose,
} from "@/lib/studio/avatar";

const read = (path: string) => readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");
const optionalRead = (path: string) => existsSync(new URL(`../../${path}`, import.meta.url)) ? read(path) : "";
const manifest = JSON.parse(read("package.json")) as { dependencies: Record<string, string> };
const avatar = read("components/studio/Avatar.tsx");
const loader = optionalRead("lib/studio/glb.ts");
const studio = read("components/studio/Studio.tsx");

function clip(name: AvatarPose, degrees: number) {
  const times = [0, 1];
  const values = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), degrees * Math.PI / 180);
  const end = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), (degrees + 45) * Math.PI / 180);
  return new THREE.AnimationClip(name, 1, [
    new THREE.QuaternionKeyframeTrack("Head.quaternion", times, [...values.toArray(), ...end.toArray()]),
  ]);
}

function rig() {
  const root = new THREE.Group();
  const head = new THREE.Bone();
  head.name = "Head";
  const phone = new THREE.Group();
  phone.name = "Phone";
  root.add(head, phone);
  return { root, head, phone, clips: [clip("laptop_idle", 30), clip("phone_idle", 120)] };
}

function glbJson() {
  const bytes = readFileSync(new URL("../../public/studio/avatar/akib.glb", import.meta.url));
  expect(bytes.toString("utf8", 0, 4)).toBe("glTF");
  expect(bytes.readUInt32LE(4)).toBe(2);
  const length = bytes.readUInt32LE(12);
  return JSON.parse(bytes.toString("utf8", 20, 20 + length)) as {
    meshes: { primitives: { indices: number }[] }[];
    accessors: { count: number }[];
    skins: { joints: number[] }[];
    nodes: { name?: string }[];
    animations: { name: string }[];
    materials: { name: string; alphaMode?: string }[];
    images: { mimeType: string }[];
    extensionsRequired?: string[];
  };
}

describe("the GLB slot", () => {
  it("points at the documented GLB and keeps the original scene transform", () => {
    expect(AVATAR_SRC).toBe("/studio/avatar/akib.glb");
    expect(AVATAR_ORIGIN).toEqual([-0.45, 0, -2.85]);
    expect(AVATAR_FACING).toBeCloseTo(0.55);
    expect(read("public/studio/avatar/README.md")).toContain("avatar/akib.glb");
  });

  it("removes the VRM dependency and plugin from the runtime", () => {
    expect(manifest.dependencies["@pixiv/three-vrm"]).toBeUndefined();
    expect(`${avatar}\n${loader}`).not.toContain("@pixiv/three-vrm");
    expect(`${avatar}\n${loader}`).not.toContain("VRMLoaderPlugin");
    expect(`${avatar}\n${loader}`).not.toContain("rotateVRM0");
  });

  it("lazy-loads GLTFLoader and the existing Meshopt decoder", () => {
    expect(loader).toContain('import("three/addons/loaders/GLTFLoader.js")');
    expect(loader).toContain('import("three/addons/libs/meshopt_decoder.module.js")');
    expect(loader).toContain("setMeshoptDecoder");
    expect(avatar).toContain("requestIdleCallback");
    expect(avatar).toContain("loadAvatar");
  });

  it("keeps the empty-stool fallback and disposes the parsed scene", () => {
    expect(avatar).toContain("<EmptyStool />");
    expect(avatar).toContain("disposeAvatar(asset.scene)");
    expect(avatar).toContain("dispose={null}");
    expect(avatar).toContain("driver.reset()");
    expect(avatar).not.toMatch(/SphereGeometry|CapsuleGeometry|hairCap|quiff/);
  });

  it("uses the actual clips for the device layout", () => {
    expect(studio).toContain('<Avatar pose={phone ? "phone_idle" : "laptop_idle"}');
    expect(AVATAR_POSES).toEqual(["laptop_idle", "phone_idle"]);
  });
});

describe("the character copy", () => {
  it("describes the shipped Rocketbox GLB rather than an empty VRM slot", () => {
    const character = twinEntries.find((entry) => entry.id === "character");
    expect(character?.answer).toContain("Rocketbox");
    expect(character?.answer).toContain("GLB");
    expect(character?.answer).not.toMatch(/empty on purpose|VRM/);
  });
});

describe("the mixer driver", () => {
  it("plays both clips and shows the handset only for phone_idle", () => {
    const scene = rig();
    const driver = new AvatarPoseDriver(scene.root, scene.clips);
    driver.update("laptop_idle", 0.25, { reducedMotion: false });
    expect(scene.head.quaternion.angleTo(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), 41.25 * Math.PI / 180))).toBeLessThan(0.01);
    expect(scene.phone.visible).toBe(false);

    driver.update("phone_idle", 0.25, { reducedMotion: false });
    expect(scene.head.quaternion.angleTo(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI * 2 / 3))).toBeLessThan(0.2);
    expect(scene.phone.visible).toBe(true);

    driver.update("laptop_idle", 0.25, { reducedMotion: false });
    expect(scene.phone.visible).toBe(false);
    expect(driver.reset()).toBe(2);
  });

  it("holds the first frame for reduced motion and resumes when allowed", () => {
    const scene = rig();
    const driver = new AvatarPoseDriver(scene.root, scene.clips);
    driver.update("laptop_idle", 0.2, { reducedMotion: true });
    const first = scene.head.quaternion.clone();
    driver.update("laptop_idle", 1, { reducedMotion: true });
    expect(Math.abs(scene.head.quaternion.dot(first))).toBeCloseTo(1, 6);

    driver.update("laptop_idle", 0.5, { reducedMotion: false });
    expect(scene.head.quaternion.angleTo(first)).toBeGreaterThan(0.05);
  });

  it("returns zero when the requested clip is unavailable", () => {
    const scene = rig();
    const driver = new AvatarPoseDriver(scene.root, []);
    expect(driver.update("laptop_idle", 1 / 60)).toBe(0);
  });
});

describe("the shipped asset", () => {
  it("contains the optimized hipoly skin, fingers and both four-second clips", () => {
    const glb = glbJson();
    const triangles = glb.meshes.flatMap((mesh) => mesh.primitives).reduce((sum, primitive) => sum + glb.accessors[primitive.indices].count / 3, 0);
    expect(triangles).toBeLessThanOrEqual(9000);
    expect(glb.skins).toHaveLength(1);
    expect(glb.skins[0].joints).toHaveLength(80);
    const nodes = glb.nodes.map((node) => node.name);
    for (const side of ["L", "R"]) {
      for (const digit of [0, 1, 2, 3, 4]) {
        expect(nodes).toContain(`Bip01 ${side} Finger${digit}`);
        expect(nodes).toContain(`Bip01 ${side} Finger${digit}1`);
        expect(nodes).toContain(`Bip01 ${side} Finger${digit}2`);
      }
    }
    expect(glb.animations.map((animation) => animation.name).sort()).toEqual(["laptop_idle", "phone_idle"]);
    expect(glb.extensionsRequired).toContain("EXT_meshopt_compression");
  });

  it("uses alpha-clipped hair and embedded WebP textures", () => {
    const glb = glbJson();
    const hair = glb.materials.find((material) => material.name === "m020_opacity");
    expect(hair?.alphaMode).toBe("MASK");
    expect(glb.images).toHaveLength(5);
    expect(glb.images.every((image) => image.mimeType === "image/webp")).toBe(true);
  });
});

describe("disposal", () => {
  it("frees geometries, materials, their textures and bone textures once each", () => {
    const root = new THREE.Group();
    const geometry = new THREE.BufferGeometry();
    const texture = new THREE.Texture();
    const material = new THREE.MeshBasicMaterial({ map: texture });
    const shared = new THREE.MeshBasicMaterial();
    root.add(new THREE.Mesh(geometry, material), new THREE.Mesh(geometry, shared));
    const bone = new THREE.Bone();
    const geometry2 = new THREE.BufferGeometry();
    const skinned = new THREE.SkinnedMesh(geometry2, shared);
    skinned.add(bone);
    skinned.bind(new THREE.Skeleton([bone]));
    root.add(skinned);

    let geometryDisposals = 0;
    geometry.addEventListener("dispose", () => { geometryDisposals += 1; });
    let materialDisposals = 0;
    material.addEventListener("dispose", () => { materialDisposals += 1; });
    let textureDisposals = 0;
    texture.addEventListener("dispose", () => { textureDisposals += 1; });

    const counts = disposeAvatar(root);
    expect(counts).toEqual({ geometries: 2, materials: 2, textures: 1 });
    expect(geometryDisposals).toBe(1);
    expect(materialDisposals).toBe(1);
    expect(textureDisposals).toBe(1);
    expect(root.parent).toBeNull();
  });
});
