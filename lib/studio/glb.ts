import type { AnimationClip, Object3D, SkinnedMesh } from "three";
import { AVATAR_POSES, AVATAR_SRC } from "./avatar";

export type AvatarAsset = { scene: Object3D; clips: AnimationClip[] };

export async function loadAvatar(src: string = AVATAR_SRC): Promise<AvatarAsset> {
  const [{ GLTFLoader }, { MeshoptDecoder }] = await Promise.all([
    import("three/addons/loaders/GLTFLoader.js"),
    import("three/addons/libs/meshopt_decoder.module.js"),
  ]);
  const loader = new GLTFLoader();
  loader.setMeshoptDecoder(MeshoptDecoder);
  const gltf = await loader.loadAsync(src);
  const clips = new Set(gltf.animations.map((clip) => clip.name));
  for (const pose of AVATAR_POSES) {
    if (!clips.has(pose)) throw new Error(`${src} is missing the ${pose} clip`);
  }
  let hasSkin = false;
  gltf.scene.traverse((object) => {
    if ((object as SkinnedMesh).isSkinnedMesh) hasSkin = true;
  });
  if (!hasSkin) throw new Error(`${src} does not contain a skinned character`);
  return { scene: gltf.scene, clips: gltf.animations };
}
