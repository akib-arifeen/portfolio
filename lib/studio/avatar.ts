import * as THREE from "three";

export const AVATAR_SRC = "/studio/avatar/akib.glb";
export const AVATAR_ORIGIN: readonly [number, number, number] = [-0.45, 0, -2.85];
export const AVATAR_FACING = 0.55;

export type AvatarPose = "laptop_idle" | "phone_idle";
export const AVATAR_POSES = ["laptop_idle", "phone_idle"] as const satisfies readonly AvatarPose[];

export class AvatarPoseDriver {
  private mixer: THREE.AnimationMixer;
  private actions: Partial<Record<AvatarPose, THREE.AnimationAction>> = {};
  private active: AvatarPose | null = null;
  private reduced = false;

  constructor(private root: THREE.Object3D, clips: THREE.AnimationClip[]) {
    this.mixer = new THREE.AnimationMixer(root);
    for (const pose of AVATAR_POSES) {
      const clip = clips.find((candidate) => candidate.name === pose);
      if (clip) {
        const action = this.mixer.clipAction(clip);
        action.setLoop(THREE.LoopRepeat, Infinity);
        this.actions[pose] = action;
      }
    }
  }

  update(
    pose: AvatarPose,
    dt: number,
    { reducedMotion = false }: { reducedMotion?: boolean; time?: number } = {},
  ): number {
    const action = this.actions[pose];
    const phone = this.root.getObjectByName("Phone");
    if (phone) phone.visible = pose === "phone_idle";
    if (!action) return 0;

    if (reducedMotion) {
      if (this.active !== pose || !this.reduced) {
        this.mixer.stopAllAction();
        action.reset().play();
        this.active = pose;
      }
      this.reduced = true;
      action.paused = true;
      this.mixer.setTime(0);
      return 1;
    }

    if (this.active !== pose) {
      const previous = this.active ? this.actions[this.active] : undefined;
      action.reset();
      action.enabled = true;
      action.setEffectiveWeight(1);
      action.paused = false;
      action.play();
      if (previous) previous.crossFadeTo(action, 0.25, false);
      this.active = pose;
    } else if (this.reduced) {
      action.paused = false;
    }
    this.reduced = false;
    this.mixer.update(Math.max(0, dt));
    return 1;
  }

  reset(): number {
    const count = Object.values(this.actions).filter(Boolean).length;
    this.mixer.stopAllAction();
    this.mixer.uncacheRoot(this.root);
    this.active = null;
    this.reduced = false;
    return count;
  }
}

export type DisposalCounts = { geometries: number; materials: number; textures: number };

export function disposeAvatar(root: THREE.Object3D): DisposalCounts {
  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  const textures = new Set<THREE.Texture>();

  root.traverse((object) => {
    const mesh = object as THREE.Mesh;
    if (mesh.geometry) geometries.add(mesh.geometry);
    (object as THREE.SkinnedMesh).skeleton?.dispose?.();
    if (!mesh.material) return;
    const list = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    for (const material of list) {
      materials.add(material);
      for (const value of Object.values(material)) {
        if (value instanceof THREE.Texture) textures.add(value);
      }
    }
  });

  textures.forEach((texture) => texture.dispose());
  materials.forEach((material) => material.dispose());
  geometries.forEach((geometry) => geometry.dispose());
  root.removeFromParent();

  return { geometries: geometries.size, materials: materials.size, textures: textures.size };
}
