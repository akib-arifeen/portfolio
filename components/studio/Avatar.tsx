"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useRef, useState } from "react";
import { AvatarPoseDriver, AVATAR_FACING, AVATAR_ORIGIN, disposeAvatar, type AvatarPose } from "@/lib/studio/avatar";
import { loadAvatar, type AvatarAsset } from "@/lib/studio/glb";
import { Cyl } from "./Room";
import { scene as c } from "./palette";

let pending: Promise<AvatarAsset> | null = null;
const disposalTimers = new Map<AvatarAsset, ReturnType<typeof setTimeout>>();

function loadOnce() {
  pending ??= loadAvatar().catch((error: unknown) => {
    pending = null;
    throw error;
  });
  return pending;
}

function whenIdle(run: () => void) {
  if (typeof window.requestIdleCallback === "function") {
    const id = window.requestIdleCallback(run, { timeout: 2500 });
    return () => window.cancelIdleCallback(id);
  }
  const id = window.setTimeout(run, 400);
  return () => window.clearTimeout(id);
}

export default function Avatar({ pose, reducedMotion }: { pose: AvatarPose; reducedMotion: boolean }) {
  const [asset, setAsset] = useState<AvatarAsset | null>(null);
  const driverRef = useRef<AvatarPoseDriver | null>(null);

  useEffect(() => {
    let live = true;
    const cancel = whenIdle(() => {
      loadOnce()
        .then((loaded) => {
          if (live) setAsset(loaded);
          else {
            disposeAvatar(loaded.scene);
            pending = null;
          }
        })
        .catch(() => { /* The empty stool stays in place for a missing or unreadable asset. */ });
    });
    return () => { live = false; cancel(); };
  }, []);

  useEffect(() => {
    if (!asset) return;
    const scheduled = disposalTimers.get(asset);
    if (scheduled) {
      clearTimeout(scheduled);
      disposalTimers.delete(asset);
    }
    const driver = new AvatarPoseDriver(asset.scene, asset.clips);
    driverRef.current = driver;
    return () => {
      const timer = setTimeout(() => {
        driver.reset();
        disposeAvatar(asset.scene);
        pending = null;
        disposalTimers.delete(asset);
        if (driverRef.current === driver) driverRef.current = null;
      }, 0);
      disposalTimers.set(asset, timer);
    };
  }, [asset]);

  useFrame((state, dt) => {
    if (!asset) return;
    const step = Math.min(dt, 1 / 20);
    driverRef.current?.update(pose, step, { reducedMotion, time: state.clock.elapsedTime });
  });

  return (
    <group position={[...AVATAR_ORIGIN]} rotation={[0, AVATAR_FACING, 0]}>
      {asset ? <primitive object={asset.scene} dispose={null} /> : <EmptyStool />}
    </group>
  );
}

function EmptyStool() {
  return (
    <group>
      <Cyl r={0.3} h={0.055} position={[0, 0.732, 0]} color={c.rug} cast />
      <Cyl r={0.3} h={0.014} position={[0, 0.699, 0]} color={c.stool} />
    </group>
  );
}
