import * as THREE from "three";

/** World up. Three.js is y-up, right-handed. */
export const UP = new THREE.Vector3(0, 1, 0);

/**
 * Yaw that faces a -z-fronted Object3D along planar direction `d`.
 * Three.js: rotation.y > 0 is CCW from above, local forward is -z.
 * Check: d = (0,0,-1) → atan2(0, 1) = 0.
 */
export function yawToFaceDir(d: THREE.Vector3): number {
  return Math.atan2(-d.x, -d.z);
}

/**
 * Camera-relative move basis, read from the camera every call.
 * forward × up = right. Check: fwd=(0,0,-1) → right=(1,0,0).
 */
export function cameraMoveBasis(
  camera: THREE.Camera,
  fwd: THREE.Vector3,
  right: THREE.Vector3,
): void {
  camera.getWorldDirection(fwd);
  fwd.y = 0;
  if (fwd.lengthSq() < 1e-8) fwd.set(0, 0, -1);
  else fwd.normalize();
  right.crossVectors(fwd, UP);
}

export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function clamp(n: number, a: number, b: number): number {
  return Math.max(a, Math.min(b, n));
}
