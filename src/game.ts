import * as THREE from "three";
import { CSS2DObject, CSS2DRenderer } from "three/addons/renderers/CSS2DRenderer.js";
import { Sfx } from "./audio";
import { CFG } from "./config";
import { Input } from "./input";
import { clamp, UP, yawToFaceDir } from "./math";
import {
  createArcher,
  createArrow,
  createBrute,
  createCoinMesh,
  createKing,
  createRaider,
  createRangeRing,
} from "./meshes";
import { buildWorld, type Camp } from "./world";

type Mode = "title" | "playing" | "over";

interface Bowman {
  mesh: THREE.Group;
  cd: number;
}

interface Foe {
  mesh: THREE.Group;
  hp: number;
  maxHp: number;
  speed: number;
  melee: number;
  radius: number;
  atkCd: number;
  hpFill: HTMLElement;
  hpObj: CSS2DObject;
}

interface Bolt {
  mesh: THREE.Group;
  vel: THREE.Vector3;
  life: number;
  dmg: number;
}

interface Drop {
  mesh: THREE.Object3D;
  vy: number;
  age: number;
}

interface Floater {
  obj: CSS2DObject;
  age: number;
}

export class Game {
  readonly input: Input;
  private readonly scene = new THREE.Scene();
  private readonly camera: THREE.PerspectiveCamera;
  private readonly renderer: THREE.WebGLRenderer;
  private readonly labels: CSS2DRenderer;
  private readonly sfx = new Sfx();
  private readonly camp: Camp;
  private readonly king: THREE.Group;
  private readonly ring: THREE.Mesh;
  private readonly archers: Bowman[] = [];
  private readonly foes: Foe[] = [];
  private readonly bolts: Bolt[] = [];
  private readonly coins: Drop[] = [];
  private readonly floaters: Floater[] = [];
  private readonly _fwd = new THREE.Vector3();
  private readonly _right = new THREE.Vector3();
  private readonly _move = new THREE.Vector3();
  private readonly _dir = new THREE.Vector3();
  private readonly _look = new THREE.Vector3();
  private readonly camTarget = new THREE.Vector3();
  private readonly shake = new THREE.Vector3();

  private mode: Mode = "title";
  private last = 0;
  private time = 0;
  private kingHp = CFG.kingHp;
  private coinsHeld = 0;
  private kills = 0;
  private wave = 0;
  private damage = CFG.startDamage;
  private recruitCost = CFG.recruitCost;
  private damageCost = CFG.damageCost;
  private spawnLeft = 0;
  private spawnCd = 0;
  private waveBreak = 0;
  private iFrame = 0;
  private bannerTimer = 0;

  private readonly el = {
    hud: document.getElementById("hud") as HTMLElement,
    title: document.getElementById("title") as HTMLElement,
    over: document.getElementById("over") as HTMLElement,
    overStats: document.getElementById("over-stats") as HTMLElement,
    joy: document.getElementById("joy") as HTMLElement,
    shop: document.getElementById("shop") as HTMLElement,
    coins: document.getElementById("coins") as HTMLElement,
    kills: document.getElementById("kills") as HTMLElement,
    wave: document.getElementById("wave-label") as HTMLElement,
    kingHp: document.getElementById("king-hp") as HTMLElement,
    banner: document.getElementById("banner") as HTMLElement,
    buyArcher: document.getElementById("buy-archer") as HTMLButtonElement,
    buyDamage: document.getElementById("buy-damage") as HTMLButtonElement,
    costArcher: document.getElementById("cost-archer") as HTMLElement,
    costDamage: document.getElementById("cost-damage") as HTMLElement,
    play: document.getElementById("play") as HTMLButtonElement,
    restart: document.getElementById("restart") as HTMLButtonElement,
  };

  constructor(canvas: HTMLCanvasElement) {
    this.camera = new THREE.PerspectiveCamera(42, 1, 0.1, 140);
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
    this.renderer.setClearColor(0x87c5e8, 1);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.labels = new CSS2DRenderer({ element: document.getElementById("labels") as HTMLElement });
    this.labels.domElement.style.pointerEvents = "none";

    this.camp = buildWorld(this.scene);
    this.tagPad(this.camp.archerPad, "Recruit");
    this.tagPad(this.camp.damagePad, "Sharpen");

    this.king = createKing();
    this.scene.add(this.king);
    this.ring = createRangeRing(CFG.range);
    this.scene.add(this.ring);

    for (let i = 0; i < CFG.startArchers; i++) this.addArcher();

    this.input = new Input(this.el.joy, document.getElementById("joy-knob") as HTMLElement);
    this.el.play.addEventListener("click", () => {
      this.sfx.unlock();
      this.startRun();
    });
    this.el.restart.addEventListener("click", () => {
      this.sfx.unlock();
      this.startRun();
    });
    this.el.buyArcher.addEventListener("click", () => this.tryRecruit(false));
    this.el.buyDamage.addEventListener("click", () => this.trySharpen(false));

    window.addEventListener("resize", () => this.resize());
    window.addEventListener("pointerdown", () => this.sfx.unlock(), { once: true });
    this.resize();
    this.placeCamera(true);
    this.syncHud();

    (window as unknown as { __selfTestControls: () => Promise<string[]> }).__selfTestControls =
      () => this.selfTestControls();
    if (new URLSearchParams(location.search).has("test")) {
      window.setTimeout(() => void this.selfTestControls(), 400);
    }
  }

  start(): void {
    this.last = performance.now();
    const loop = (now: number) => {
      requestAnimationFrame(loop);
      const dt = Math.min(0.05, (now - this.last) / 1000);
      this.last = now;
      this.tick(dt);
      this.renderer.render(this.scene, this.camera);
      this.labels.render(this.scene, this.camera);
    };
    requestAnimationFrame(loop);
  }

  resize(): void {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.camera.aspect = w / Math.max(1, h);
    this.camera.updateProjectionMatrix();
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    this.renderer.setSize(w, h, false);
    this.labels.setSize(w, h);
  }

  startRun(): void {
    this.clearCombat();
    this.king.position.set(0, 0, 0);
    this.king.rotation.y = 0;
    this.kingHp = CFG.kingHp;
    this.coinsHeld = 0;
    this.kills = 0;
    this.wave = 0;
    this.damage = CFG.startDamage;
    this.recruitCost = CFG.recruitCost;
    this.damageCost = CFG.damageCost;
    this.iFrame = 0;
    this.spawnLeft = 0;
    while (this.archers.length > CFG.startArchers) this.removeArcher();
    while (this.archers.length < CFG.startArchers) this.addArcher();
    this.mode = "playing";
    this.el.title.hidden = true;
    this.el.over.hidden = true;
    this.el.hud.hidden = false;
    this.el.joy.hidden = false;
    this.el.shop.hidden = false;
    this.syncHud();
    this.beginWave();
  }

  tick(dt: number): void {
    this.time += dt;
    this.iFrame = Math.max(0, this.iFrame - dt);
    this.spinPads(dt);

    if (this.mode === "title") {
      this.idleSquad(dt);
      this.placeCamera(false, dt);
      return;
    }

    if (this.mode === "playing") {
      this.moveKing(dt);
      this.formSquad(dt);
      this.updateWaves(dt);
      this.updateFoes(dt);
      this.archersShoot(dt);
      this.updateBolts(dt);
      this.updateCoins(dt);
      this.updateFloaters(dt);
      this.tryPads();
      if (this.kingHp <= 0) this.gameOver();
    } else {
      this.updateFloaters(dt);
    }

    this.ring.position.set(this.king.position.x, 0.05, this.king.position.z);
    this.ring.scale.setScalar(1 + Math.sin(this.time * 3) * 0.012);
    this.placeCamera(false, dt);
    this.syncHud();
  }

  private tagPad(pad: THREE.Group, text: string): void {
    const el = document.createElement("div");
    el.className = "pad-tag";
    el.textContent = text;
    const obj = new CSS2DObject(el);
    obj.position.set(0, 1.15, 0);
    pad.add(obj);
  }

  private addArcher(): void {
    const mesh = createArcher();
    this.scene.add(mesh);
    this.archers.push({ mesh, cd: Math.random() * 0.4 });
  }

  private removeArcher(): void {
    const a = this.archers.pop();
    if (a) this.scene.remove(a.mesh);
  }

  private idleSquad(dt: number): void {
    this.formSquad(dt);
    this.king.position.y = Math.abs(Math.sin(this.time * 2)) * 0.03;
  }

  private moveKing(dt: number): void {
    this.input.worldMove(this.camera, this._fwd, this._right, this._move);
    const moving = this._move.lengthSq() > 1e-4;
    if (moving) {
      this.king.position.x += this._move.x * CFG.playerSpeed * dt;
      this.king.position.z += this._move.z * CFG.playerSpeed * dt;
      this.king.rotation.y = yawToFaceDir(this._move);
      this.king.position.y = Math.abs(Math.sin(this.time * 10)) * 0.05;
    } else {
      this.king.position.y = 0;
    }
    const r = Math.hypot(this.king.position.x, this.king.position.z);
    if (r > CFG.mapRadius) {
      const s = CFG.mapRadius / r;
      this.king.position.x *= s;
      this.king.position.z *= s;
    }
  }

  private formSquad(dt: number): void {
    const n = this.archers.length;
    const radius = 1.45 + n * 0.1;
    const k = 1 - Math.exp(-14 * dt);
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + this.time * 0.18;
      const tx = this.king.position.x + Math.sin(a) * radius;
      const tz = this.king.position.z + Math.cos(a) * radius;
      const m = this.archers[i].mesh;
      m.position.x += (tx - m.position.x) * k;
      m.position.z += (tz - m.position.z) * k;
      m.position.y = Math.abs(Math.sin(this.time * 9 + i)) * 0.04;
    }
  }

  private beginWave(): void {
    this.wave += 1;
    const extra = this.wave % 3 === 0 ? 1 : 0;
    this.spawnLeft = 4 + this.wave * 3 + extra;
    this.spawnCd = 0.15;
    this.waveBreak = 2.2;
    this.showBanner(`Wave ${this.wave}`);
  }

  private updateWaves(dt: number): void {
    if (this.spawnLeft > 0) {
      this.spawnCd -= dt;
      if (this.spawnCd <= 0) {
        this.spawnCd = Math.max(0.18, 0.55 - this.wave * 0.03);
        this.spawnFoe(this.spawnLeft === 1 && this.wave % 3 === 0);
        this.spawnLeft -= 1;
      }
      return;
    }
    if (this.foes.length === 0) {
      this.waveBreak -= dt;
      if (this.waveBreak <= 0) {
        this.waveBreak = 2.2;
        this.beginWave();
      }
    }
  }

  private spawnFoe(brute: boolean): void {
    const mesh = brute ? createBrute() : createRaider();
    const ang = Math.random() * Math.PI * 2;
    const r = CFG.mapRadius - 0.4;
    mesh.position.set(Math.cos(ang) * r, 0, Math.sin(ang) * r);
    const hp = brute ? CFG.bruteHp + this.wave * 6 : CFG.enemyHp + this.wave * 3;
    const bar = document.createElement("div");
    bar.className = "hp-world";
    bar.innerHTML = "<i></i>";
    const hpObj = new CSS2DObject(bar);
    hpObj.position.set(0, brute ? 1.7 : 1.2, 0);
    mesh.add(hpObj);
    this.scene.add(mesh);
    this.foes.push({
      mesh,
      hp,
      maxHp: hp,
      speed: (brute ? CFG.bruteSpeed : CFG.enemySpeed) * (1 + this.wave * 0.035),
      melee: brute ? CFG.bruteMelee : CFG.enemyMelee,
      radius: brute ? 0.7 : 0.45,
      atkCd: 0,
      hpFill: bar.querySelector("i") as HTMLElement,
      hpObj,
    });
  }

  private updateFoes(dt: number): void {
    const kx = this.king.position.x;
    const kz = this.king.position.z;
    for (const f of this.foes) {
      this._dir.set(kx - f.mesh.position.x, 0, kz - f.mesh.position.z);
      const dist = this._dir.length();
      if (dist > 0.0001) this._dir.multiplyScalar(1 / dist);
      f.mesh.rotation.y = yawToFaceDir(this._dir);
      f.atkCd = Math.max(0, f.atkCd - dt);
      if (dist > CFG.meleeRange + f.radius) {
        f.mesh.position.x += this._dir.x * f.speed * dt;
        f.mesh.position.z += this._dir.z * f.speed * dt;
        f.mesh.position.y = Math.abs(Math.sin(this.time * 8 + f.mesh.id)) * 0.05;
      } else {
        f.mesh.position.y = 0;
        if (f.atkCd <= 0 && this.iFrame <= 0) {
          f.atkCd = 0.85;
          this.kingHp -= f.melee;
          this.iFrame = 0.35;
          this.shake.set(0.18, 0, 0.18);
          this.sfx.hurt();
          this.floatDmg(this.king.position, f.melee, true);
        }
      }
    }
  }

  private archersShoot(dt: number): void {
    if (this.foes.length === 0) return;
    for (const a of this.archers) {
      a.cd -= dt;
      const origin = a.mesh.position;
      let best: Foe | null = null;
      let bestD: number = CFG.range;
      for (const f of this.foes) {
        const d = origin.distanceTo(f.mesh.position);
        if (d < bestD) {
          bestD = d;
          best = f;
        }
      }
      if (!best) continue;
      this._dir.set(best.mesh.position.x - origin.x, 0, best.mesh.position.z - origin.z);
      if (this._dir.lengthSq() > 1e-6) {
        this._dir.normalize();
        a.mesh.rotation.y = yawToFaceDir(this._dir);
      }
      if (a.cd > 0) continue;
      a.cd = CFG.fireCooldown * (0.85 + Math.random() * 0.3);
      this.spawnBolt(origin, this._dir, this.damage);
      this.sfx.shoot();
    }
  }

  private spawnBolt(from: THREE.Vector3, dir: THREE.Vector3, dmg: number): void {
    const mesh = createArrow();
    mesh.position.set(from.x, 0.9, from.z);
    this._look.copy(from).add(dir);
    this._look.y = 0.9;
    mesh.lookAt(this._look); // +z toward velocity (arrow tip)
    const vel = dir.clone().multiplyScalar(CFG.arrowSpeed);
    this.scene.add(mesh);
    this.bolts.push({ mesh, vel, life: 1.15, dmg });
  }

  private updateBolts(dt: number): void {
    for (let i = this.bolts.length - 1; i >= 0; i--) {
      const b = this.bolts[i];
      b.life -= dt;
      b.mesh.position.x += b.vel.x * dt;
      b.mesh.position.z += b.vel.z * dt;
      let hit: Foe | null = null;
      for (const f of this.foes) {
        const dx = f.mesh.position.x - b.mesh.position.x;
        const dz = f.mesh.position.z - b.mesh.position.z;
        if (dx * dx + dz * dz < (f.radius + 0.2) * (f.radius + 0.2)) {
          hit = f;
          break;
        }
      }
      if (hit) {
        this.hurtFoe(hit, b.dmg);
        this.scene.remove(b.mesh);
        this.bolts.splice(i, 1);
        continue;
      }
      if (b.life <= 0) {
        this.scene.remove(b.mesh);
        this.bolts.splice(i, 1);
      }
    }
  }

  private hurtFoe(f: Foe, dmg: number): void {
    f.hp -= dmg;
    f.hpFill.style.width = `${clamp((f.hp / f.maxHp) * 100, 0, 100)}%`;
    this.floatDmg(f.mesh.position, dmg, false);
    this.sfx.hit();
    if (f.hp <= 0) this.killFoe(f);
  }

  private killFoe(f: Foe): void {
    const idx = this.foes.indexOf(f);
    if (idx < 0) return;
    this.foes.splice(idx, 1);
    this.scene.remove(f.mesh);
    f.hpObj.element.remove();
    this.kills += 1;
    const n = CFG.coinsPerKill[0] + Math.floor(Math.random() * (CFG.coinsPerKill[1] - CFG.coinsPerKill[0] + 1));
    for (let i = 0; i < n; i++) this.dropCoin(f.mesh.position);
  }

  private dropCoin(at: THREE.Vector3): void {
    const mesh = createCoinMesh();
    mesh.position.set(at.x + (Math.random() - 0.5) * 0.6, 0.6, at.z + (Math.random() - 0.5) * 0.6);
    this.scene.add(mesh);
    this.coins.push({ mesh, vy: 3.2 + Math.random() * 1.4, age: 0 });
  }

  private updateCoins(dt: number): void {
    const kx = this.king.position.x;
    const kz = this.king.position.z;
    for (let i = this.coins.length - 1; i >= 0; i--) {
      const c = this.coins[i];
      c.age += dt;
      c.vy -= 12 * dt;
      c.mesh.position.y += c.vy * dt;
      if (c.mesh.position.y < 0.12) {
        c.mesh.position.y = 0.12;
        c.vy *= -0.35;
        if (Math.abs(c.vy) < 0.6) c.vy = 0;
      }
      c.mesh.rotation.z += dt * 4;
      const dx = kx - c.mesh.position.x;
      const dz = kz - c.mesh.position.z;
      const d2 = dx * dx + dz * dz;
      if (d2 < 10) {
        const d = Math.sqrt(d2) || 0.001;
        c.mesh.position.x += (dx / d) * 10 * dt;
        c.mesh.position.z += (dz / d) * 10 * dt;
      }
      if (d2 < 0.55) {
        this.coinsHeld += CFG.coinValue;
        this.sfx.coin();
        this.scene.remove(c.mesh);
        this.coins.splice(i, 1);
      }
    }
  }

  private floatDmg(at: THREE.Vector3, n: number, self: boolean): void {
    const el = document.createElement("div");
    el.className = "dmg";
    el.textContent = `-${n}`;
    if (self) el.style.color = "#ff8a8a";
    const obj = new CSS2DObject(el);
    obj.position.set(at.x, 1.3, at.z);
    this.scene.add(obj);
    this.floaters.push({ obj, age: 0 });
  }

  private updateFloaters(dt: number): void {
    for (let i = this.floaters.length - 1; i >= 0; i--) {
      const f = this.floaters[i];
      f.age += dt;
      f.obj.position.y += dt * 1.2;
      const el = f.obj.element as HTMLElement;
      el.style.opacity = String(clamp(1 - f.age / 0.7, 0, 1));
      if (f.age > 0.7) {
        this.scene.remove(f.obj);
        el.remove();
        this.floaters.splice(i, 1);
      }
    }
  }

  private tryPads(): void {
    const k = this.king.position;
    if (k.distanceTo(this.camp.archerPad.position) < 1.45) this.tryRecruit(true);
    if (k.distanceTo(this.camp.damagePad.position) < 1.45) this.trySharpen(true);
  }

  private padLock = 0;

  private tryRecruit(fromPad: boolean): void {
    if (this.mode !== "playing") return;
    if (this.archers.length >= CFG.maxArchers) return;
    if (this.coinsHeld < this.recruitCost) return;
    if (fromPad && this.time < this.padLock) return;
    this.coinsHeld -= this.recruitCost;
    this.recruitCost += CFG.recruitCostStep;
    this.addArcher();
    if (fromPad) this.padLock = this.time + 0.9;
    this.sfx.buy();
    this.showBanner("Bowman joined");
  }

  private trySharpen(fromPad: boolean): void {
    if (this.mode !== "playing") return;
    if (this.coinsHeld < this.damageCost) return;
    if (fromPad && this.time < this.padLock) return;
    this.coinsHeld -= this.damageCost;
    this.damageCost += CFG.damageCostStep;
    this.damage += CFG.damageStep;
    if (fromPad) this.padLock = this.time + 0.9;
    this.sfx.buy();
    this.showBanner(`Arrows +${CFG.damageStep}`);
  }

  private spinPads(dt: number): void {
    const g1 = this.camp.archerPad.getObjectByName("gem");
    const g2 = this.camp.damagePad.getObjectByName("gem");
    if (g1) g1.rotation.y += dt * 1.8;
    if (g2) g2.rotation.y += dt * 1.8;
  }

  private placeCamera(snap: boolean, dt = 0.016): void {
    const o = CFG.camOffset;
    this.camTarget.set(
      this.king.position.x + o.x,
      o.y,
      this.king.position.z + o.z,
    );
    if (snap) this.camera.position.copy(this.camTarget);
    else {
      const k = 1 - Math.exp(-CFG.camLerp * dt);
      this.camera.position.lerp(this.camTarget, k);
    }
    this.shake.multiplyScalar(Math.max(0, 1 - dt * 8));
    this.camera.position.add(this.shake);
    this.camera.up.copy(UP);
    this.camera.lookAt(this.king.position.x, 0.55, this.king.position.z);
  }

  private showBanner(text: string): void {
    const el = this.el.banner;
    el.hidden = false;
    el.textContent = text;
    el.style.animation = "none";
    void el.offsetWidth;
    el.style.animation = "";
    window.clearTimeout(this.bannerTimer);
    this.bannerTimer = window.setTimeout(() => {
      el.hidden = true;
    }, 1400);
  }

  private syncHud(): void {
    this.el.coins.textContent = String(this.coinsHeld);
    this.el.kills.textContent = String(this.kills);
    this.el.wave.textContent = this.wave ? `Wave ${this.wave}` : "Ready";
    this.el.kingHp.style.width = `${clamp((this.kingHp / CFG.kingHp) * 100, 0, 100)}%`;
    this.el.costArcher.textContent = String(this.recruitCost);
    this.el.costDamage.textContent = String(this.damageCost);
    this.el.buyArcher.disabled = this.coinsHeld < this.recruitCost || this.archers.length >= CFG.maxArchers;
    this.el.buyDamage.disabled = this.coinsHeld < this.damageCost;
  }

  private gameOver(): void {
    this.mode = "over";
    this.sfx.lose();
    this.el.over.hidden = false;
    this.el.overStats.textContent = `Wave ${this.wave} · ${this.kills} kills`;
    this.showBanner("Fallen");
  }

  private clearCombat(): void {
    for (const f of this.foes) {
      this.scene.remove(f.mesh);
      f.hpObj.element.remove();
    }
    this.foes.length = 0;
    for (const b of this.bolts) this.scene.remove(b.mesh);
    this.bolts.length = 0;
    for (const c of this.coins) this.scene.remove(c.mesh);
    this.coins.length = 0;
    for (const f of this.floaters) {
      this.scene.remove(f.obj);
      f.obj.element.remove();
    }
    this.floaters.length = 0;
  }

  snapshot(): {
    mode: Mode;
    king: { x: number; z: number; yaw: number };
    archers: number;
    foes: number;
    coins: number;
    hp: number;
    wave: number;
    kills: number;
  } {
    return {
      mode: this.mode,
      king: { x: this.king.position.x, z: this.king.position.z, yaw: this.king.rotation.y },
      archers: this.archers.length,
      foes: this.foes.length,
      coins: this.coinsHeld,
      hp: this.kingHp,
      wave: this.wave,
      kills: this.kills,
    };
  }

  /**
   * Control self-test (Rule 4): camera basis vs WASD vs -z facing vs nose marker.
   * Oracle for the mesh is the `nose` child, not the yaw used to mount it.
   */
  async selfTestControls(): Promise<string[]> {
    const fails: string[] = [];
    if (this.mode !== "playing") this.startRun();
    const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
    const press = async (code: string, ms: number) => {
      this.input.keys.add(code);
      await sleep(ms);
      this.input.keys.delete(code);
    };
    const facing = () => new THREE.Vector3(0, 0, -1).applyQuaternion(this.king.quaternion);
    const nose = this.king.getObjectByName("nose");
    const noseFront = () => {
      if (!nose) return facing();
      const a = new THREE.Vector3();
      const b = new THREE.Vector3();
      this.king.getWorldPosition(a);
      nose.getWorldPosition(b);
      return b.sub(a).setY(0).normalize();
    };
    const basis = () => {
      const f = new THREE.Vector3();
      const r = new THREE.Vector3();
      this.camera.getWorldDirection(f);
      f.y = 0;
      f.normalize();
      r.crossVectors(f, UP);
      return { f, r };
    };
    for (const [code, axis, sign] of [
      ["KeyD", "r", 1],
      ["KeyA", "r", -1],
      ["KeyW", "f", 1],
      ["KeyS", "f", -1],
      ["ArrowRight", "r", 1],
      ["ArrowUp", "f", 1],
    ] as const) {
      const b = basis();
      const p0 = this.king.position.clone();
      await press(code, 280);
      const d = this.king.position.clone().sub(p0);
      d.y = 0;
      if (d.length() < 0.05) {
        fails.push(`${code}: no move`);
        continue;
      }
      const along = d.clone().normalize().dot(b[axis]) * sign;
      if (along < 0.85) fails.push(`${code}: move cos=${along.toFixed(2)}`);
      const face = facing().dot(d.clone().normalize());
      if (face < 0.85) fails.push(`${code}: face ${face.toFixed(2)}`);
      const nf = noseFront().dot(facing());
      if (nf < 0.75) fails.push(`${code}: nose ${nf.toFixed(2)}`);
    }
    console.info(fails.length ? `self-test FAIL ${fails.join("; ")}` : "self-test PASS");
    (window as unknown as { __selfTestResult: string[] }).__selfTestResult = fails;
    return fails;
  }
}
