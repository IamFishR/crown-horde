import * as THREE from "three";
import { mulberry32 } from "./math";
import {
  createBanner,
  createFenceSegment,
  createPad,
  createRock,
  createTree,
  palette,
} from "./meshes";

export interface Camp {
  archerPad: THREE.Group;
  damagePad: THREE.Group;
}

export function buildWorld(scene: THREE.Scene): Camp {
  const sky = 0x87c5e8;
  scene.background = new THREE.Color(sky);
  scene.fog = new THREE.Fog(sky, 38, 80);

  const hemi = new THREE.HemisphereLight(0xd8eeff, 0x6a8a48, 1.15);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xfff5dc, 1.05);
  sun.position.set(18, 28, 10);
  scene.add(sun);
  scene.add(new THREE.AmbientLight(0xffffff, 0.18));

  const ground = new THREE.Mesh(new THREE.PlaneGeometry(90, 90, 1, 1), palette.grass);
  ground.rotation.x = -Math.PI / 2;
  // PlaneGeometry is XY with +z normal; -90° around X lays it on XZ with +y up.
  scene.add(ground);

  const pathPts: Array<[number, number]> = [
    [-24, -10],
    [-14, -6],
    [-6, -2],
    [0, 0],
    [8, 3],
    [16, 7],
    [26, 11],
  ];
  for (let i = 0; i < pathPts.length - 1; i++) {
    const a = pathPts[i];
    const b = pathPts[i + 1];
    const dx = b[0] - a[0];
    const dz = b[1] - a[1];
    const len = Math.hypot(dx, dz);
    const strip = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.05, len + 0.6), palette.dirt);
    strip.position.set((a[0] + b[0]) / 2, 0.03, (a[1] + b[1]) / 2);
    // Box local +z along the segment: rotation.y = atan2(dx, dz)
    strip.rotation.y = Math.atan2(dx, dz);
    scene.add(strip);
  }

  const rng = mulberry32(0xc20a1);
  for (let i = 0; i < 34; i++) {
    const ang = rng() * Math.PI * 2;
    const rad = 8 + rng() * 18;
    const x = Math.cos(ang) * rad;
    const z = Math.sin(ang) * rad;
    if (Math.abs(z - x * 0.4) < 3.2) continue; // keep the dirt path clear
    const tree = createTree(rng);
    tree.position.set(x, 0, z);
    tree.rotation.y = rng() * Math.PI * 2;
    scene.add(tree);
  }
  for (let i = 0; i < 18; i++) {
    const rock = createRock(rng);
    const ang = rng() * Math.PI * 2;
    const rad = 6 + rng() * 16;
    rock.position.set(Math.cos(ang) * rad, 0.16, Math.sin(ang) * rad);
    scene.add(rock);
  }

  // Fence runs along one path shoulder
  for (let i = 0; i < 8; i++) {
    const t = i / 7;
    const x = -10 + t * 18;
    const z = -5 + t * 8;
    const fence = createFenceSegment();
    fence.position.set(x + 2.1, 0, z - 2.0);
    fence.rotation.y = Math.atan2(18, 8);
    scene.add(fence);
  }

  const banner = createBanner();
  banner.position.set(-1.6, 0, 1.8);
  scene.add(banner);

  const archerPad = createPad("archer");
  archerPad.position.set(3.4, 0, -1.6);
  scene.add(archerPad);
  const damagePad = createPad("damage");
  damagePad.position.set(-3.4, 0, -1.6);
  scene.add(damagePad);

  return { archerPad, damagePad };
}
