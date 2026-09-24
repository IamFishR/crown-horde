import * as THREE from "three";

const mats = {
  skin: new THREE.MeshLambertMaterial({ color: 0xe0b089 }),
  hair: new THREE.MeshLambertMaterial({ color: 0x2a211c }),
  purple: new THREE.MeshLambertMaterial({ color: 0x5b2d8e }),
  gold: new THREE.MeshLambertMaterial({ color: 0xe8c547 }),
  teal: new THREE.MeshLambertMaterial({ color: 0x2a6f6f }),
  cream: new THREE.MeshLambertMaterial({ color: 0xd9c7a3 }),
  wood: new THREE.MeshLambertMaterial({ color: 0x7a5130 }),
  iron: new THREE.MeshLambertMaterial({ color: 0x4c515c }),
  rust: new THREE.MeshLambertMaterial({ color: 0xc24a3c }),
  bronze: new THREE.MeshLambertMaterial({ color: 0x8a6a32 }),
  grass: new THREE.MeshLambertMaterial({ color: 0x6db356 }),
  dirt: new THREE.MeshLambertMaterial({ color: 0xc4a574 }),
  bark: new THREE.MeshLambertMaterial({ color: 0x5a3a22 }),
  leaf: new THREE.MeshLambertMaterial({ color: 0x3f8a3a }),
  leafDark: new THREE.MeshLambertMaterial({ color: 0x2f6a2c }),
  stone: new THREE.MeshLambertMaterial({ color: 0x8a8a82 }),
  stoneDark: new THREE.MeshLambertMaterial({ color: 0x6a6a64 }),
  blob: new THREE.MeshBasicMaterial({
    color: 0x000000,
    transparent: true,
    opacity: 0.28,
    depthWrite: false,
  }),
  arrow: new THREE.MeshLambertMaterial({ color: 0xf4e2a8 }),
  coin: new THREE.MeshLambertMaterial({ color: 0xf0c430 }),
  ring: new THREE.MeshBasicMaterial({
    color: 0xf4efe4,
    transparent: true,
    opacity: 0.55,
    side: THREE.DoubleSide,
    depthWrite: false,
  }),
  jewel: new THREE.MeshLambertMaterial({ color: 0xc23b4a }),
};

function blob(r: number): THREE.Mesh {
  const m = new THREE.Mesh(new THREE.CircleGeometry(r, 16), mats.blob);
  m.rotation.x = -Math.PI / 2;
  m.position.y = 0.02;
  m.renderOrder = 1;
  return m;
}

/** Small marker on local -z so facing can be measured independently of yaw. */
function nose(y: number, z: number): THREE.Mesh {
  const n = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 0.08), mats.hair);
  n.name = "nose";
  n.position.set(0, y, z);
  return n;
}

export function createKing(): THREE.Group {
  const g = new THREE.Group();
  g.add(blob(0.42));
  const legs = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.28, 0.22), mats.purple);
  legs.position.set(0, 0.18, 0);
  g.add(legs);
  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.24, 0.42, 8), mats.purple);
  torso.position.y = 0.48;
  g.add(torso);
  const cloak = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.4, 0.08), mats.purple);
  cloak.position.set(0, 0.42, 0.16); // behind a -z-fronted king
  g.add(cloak);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 8), mats.skin);
  head.position.y = 0.78;
  g.add(head);
  const beard = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 6), mats.hair);
  beard.position.set(0, 0.68, -0.1);
  g.add(beard);
  const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.07, 10), mats.gold);
  rim.position.y = 0.92;
  g.add(rim);
  const cap = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 6), mats.purple);
  cap.position.y = 0.98;
  g.add(cap);
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    const spike = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.12, 5), mats.gold);
    spike.position.set(Math.sin(a) * 0.14, 1.04, Math.cos(a) * 0.14);
    g.add(spike);
  }
  const jewel = new THREE.Mesh(new THREE.SphereGeometry(0.035, 6, 6), mats.jewel);
  jewel.position.set(0, 0.93, -0.18);
  g.add(jewel);
  g.add(nose(0.78, -0.2));
  g.userData.kind = "king";
  g.scale.setScalar(1.7);
  return g;
}

export function createArcher(): THREE.Group {
  const g = new THREE.Group();
  g.add(blob(0.32));
  const legs = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.24, 0.18), mats.teal);
  legs.position.y = 0.14;
  g.add(legs);
  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.16, 0.32, 8), mats.teal);
  torso.position.y = 0.38;
  g.add(torso);
  const sash = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.06, 0.18), mats.cream);
  sash.position.y = 0.32;
  g.add(sash);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.13, 8, 7), mats.skin);
  head.position.y = 0.62;
  g.add(head);
  const hair = new THREE.Mesh(new THREE.SphereGeometry(0.13, 8, 6), mats.hair);
  hair.scale.set(1, 0.55, 1);
  hair.position.set(0, 0.7, 0.02);
  g.add(hair);
  const bow = new THREE.Mesh(
    new THREE.TorusGeometry(0.16, 0.018, 5, 10, Math.PI),
    mats.wood,
  );
  bow.rotation.y = Math.PI / 2;
  bow.rotation.z = Math.PI / 2;
  bow.position.set(-0.2, 0.42, -0.08);
  g.add(bow);
  const string = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.28, 0.01), mats.hair);
  string.position.set(-0.2, 0.42, 0.06);
  g.add(string);
  g.add(nose(0.62, -0.16));
  g.userData.kind = "archer";
  g.scale.setScalar(1.55);
  return g;
}

export function createRaider(): THREE.Group {
  const g = new THREE.Group();
  g.add(blob(0.34));
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.55, 0.32), mats.iron);
  body.position.y = 0.34;
  g.add(body);
  const sash = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.1, 0.12), mats.rust);
  sash.position.set(0, 0.42, 0.12);
  g.add(sash);
  const helm = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.22, 0.28), mats.bronze);
  helm.position.y = 0.72;
  g.add(helm);
  const visor = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.05, 0.06), mats.hair);
  visor.position.set(0, 0.72, -0.14);
  g.add(visor);
  const blade = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 0.42), mats.stone);
  blade.position.set(0.28, 0.4, -0.18);
  g.add(blade);
  g.add(nose(0.7, -0.18));
  g.userData.kind = "raider";
  g.scale.setScalar(1.65);
  return g;
}

export function createBrute(): THREE.Group {
  const g = new THREE.Group();
  g.add(blob(0.55));
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.85, 0.5), mats.iron);
  body.position.y = 0.5;
  g.add(body);
  const pauldron = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.22, 0.36), mats.bronze);
  pauldron.position.y = 0.88;
  g.add(pauldron);
  const helm = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.32, 0.4), mats.rust);
  helm.position.y = 1.12;
  g.add(helm);
  const hornL = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.28, 5), mats.bronze);
  hornL.position.set(-0.22, 1.32, 0);
  hornL.rotation.z = 0.4;
  g.add(hornL);
  const hornR = hornL.clone();
  hornR.position.x = 0.22;
  hornR.rotation.z = -0.4;
  g.add(hornR);
  const maul = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.22, 0.55), mats.stoneDark);
  maul.position.set(0.48, 0.55, -0.22);
  g.add(maul);
  g.add(nose(1.1, -0.24));
  g.userData.kind = "brute";
  g.scale.setScalar(1.85);
  return g;
}

/** Arrow shaft: local +z is the tip. Use lookAt so +z follows velocity. */
export function createArrow(): THREE.Group {
  const g = new THREE.Group();
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.55, 5), mats.arrow);
  shaft.rotation.x = Math.PI / 2; // cylinder y → z
  g.add(shaft);
  const tip = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.14, 5), mats.iron);
  tip.rotation.x = Math.PI / 2;
  tip.position.z = 0.32;
  g.add(tip);
  return g;
}

export function createCoinMesh(): THREE.Mesh {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.06, 12), mats.coin);
  m.rotation.x = Math.PI / 2;
  return m;
}

export function createTree(rng: () => number): THREE.Group {
  const g = new THREE.Group();
  const h = 1.1 + rng() * 0.7;
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, h, 6), mats.bark);
  trunk.position.y = h / 2;
  g.add(trunk);
  const leafMat = rng() > 0.5 ? mats.leaf : mats.leafDark;
  const top = new THREE.Mesh(new THREE.ConeGeometry(0.7 + rng() * 0.25, 1.5 + rng() * 0.5, 7), leafMat);
  top.position.y = h + 0.55;
  g.add(top);
  const mid = new THREE.Mesh(new THREE.ConeGeometry(0.55, 1.1, 7), leafMat);
  mid.position.y = h + 1.05;
  g.add(mid);
  g.add(blob(0.45));
  return g;
}

export function createRock(rng: () => number): THREE.Mesh {
  const m = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.28 + rng() * 0.25, 0),
    rng() > 0.5 ? mats.stone : mats.stoneDark,
  );
  m.position.y = 0.18;
  m.rotation.set(rng() * 1, rng() * 2, rng() * 1);
  m.scale.set(1 + rng() * 0.4, 0.6 + rng() * 0.4, 1 + rng() * 0.3);
  return m;
}

export function createFenceSegment(): THREE.Group {
  const g = new THREE.Group();
  const rail = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.08, 0.08), mats.wood);
  rail.position.y = 0.42;
  g.add(rail);
  const rail2 = rail.clone();
  rail2.position.y = 0.22;
  g.add(rail2);
  for (const x of [-0.55, 0.55]) {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.55, 0.08), mats.wood);
    post.position.set(x, 0.28, 0);
    g.add(post);
  }
  return g;
}

export function createBanner(): THREE.Group {
  const g = new THREE.Group();
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 2.2, 6), mats.wood);
  pole.position.y = 1.1;
  g.add(pole);
  const clothMat = mats.purple.clone();
  clothMat.side = THREE.DoubleSide;
  const cloth = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.55), clothMat);
  cloth.position.set(0.36, 1.7, 0);
  g.add(cloth);
  const trim = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.06, 0.02), mats.gold);
  trim.position.set(0.36, 1.96, 0);
  g.add(trim);
  return g;
}

export function createPad(kind: "archer" | "damage"): THREE.Group {
  const g = new THREE.Group();
  g.userData.kind = kind;
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.95, 0.12, 8), mats.stone);
  base.position.y = 0.06;
  g.add(base);
  const gem = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.22),
    kind === "archer" ? mats.teal : mats.gold,
  );
  gem.position.y = 0.42;
  gem.name = "gem";
  g.add(gem);
  return g;
}

export function createRangeRing(radius: number): THREE.Mesh {
  const ring = new THREE.Mesh(new THREE.RingGeometry(radius - 0.07, radius + 0.07, 64), mats.ring);
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.05;
  return ring;
}

export const palette = mats;
