import * as THREE from "three";
import { cameraMoveBasis } from "./math";

/**
 * Keyboard + virtual stick. World move is derived from the camera basis
 * every query — never from a stored yaw.
 */
export class Input {
  readonly keys = new Set<string>();
  /** Stick: +x is screen-right, +y is screen-up (already inverted from pointer). */
  joyX = 0;
  joyY = 0;
  private joyActive = false;
  private joyPointer = -1;
  private readonly knob: HTMLElement;
  private readonly root: HTMLElement;
  private readonly radius = 52;

  constructor(joy: HTMLElement, knob: HTMLElement) {
    this.root = joy;
    this.knob = knob;

    window.addEventListener("keydown", (e) => {
      this.keys.add(e.code);
      if (
        e.code.startsWith("Arrow") ||
        e.code === "Space" ||
        e.code === "KeyW" ||
        e.code === "KeyA" ||
        e.code === "KeyS" ||
        e.code === "KeyD"
      ) {
        e.preventDefault();
      }
    });
    window.addEventListener("keyup", (e) => this.keys.delete(e.code));

    const onDown = (e: PointerEvent) => {
      if (this.joyActive) return;
      this.joyActive = true;
      this.joyPointer = e.pointerId;
      joy.setPointerCapture(e.pointerId);
      this.nudge(e);
    };
    const onMove = (e: PointerEvent) => {
      if (!this.joyActive || e.pointerId !== this.joyPointer) return;
      this.nudge(e);
    };
    const onUp = (e: PointerEvent) => {
      if (e.pointerId !== this.joyPointer) return;
      this.joyActive = false;
      this.joyPointer = -1;
      this.joyX = 0;
      this.joyY = 0;
      this.knob.style.transform = "";
    };
    joy.addEventListener("pointerdown", onDown);
    joy.addEventListener("pointermove", onMove);
    joy.addEventListener("pointerup", onUp);
    joy.addEventListener("pointercancel", onUp);
  }

  private nudge(e: PointerEvent): void {
    const r = this.root.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    let dx = e.clientX - cx;
    let dy = e.clientY - cy;
    const m = Math.hypot(dx, dy);
    const max = this.radius;
    if (m > max) {
      dx = (dx / m) * max;
      dy = (dy / m) * max;
    }
    this.joyX = dx / max;
    this.joyY = -dy / max; // screen-up → +forward
    this.knob.style.transform = `translate(${dx}px, ${dy}px)`;
  }

  /**
   * Writes a planar world-space move vector of length ≤ 1 into `out`.
   * `fwd` / `right` are scratch owned by the caller.
   */
  worldMove(
    camera: THREE.Camera,
    fwd: THREE.Vector3,
    right: THREE.Vector3,
    out: THREE.Vector3,
  ): THREE.Vector3 {
    let ix = 0;
    let iz = 0;
    if (this.keys.has("KeyW") || this.keys.has("ArrowUp")) iz += 1;
    if (this.keys.has("KeyS") || this.keys.has("ArrowDown")) iz -= 1;
    if (this.keys.has("KeyD") || this.keys.has("ArrowRight")) ix += 1;
    if (this.keys.has("KeyA") || this.keys.has("ArrowLeft")) ix -= 1;
    ix += this.joyX;
    iz += this.joyY;
    const mag = Math.hypot(ix, iz);
    if (mag > 1) {
      ix /= mag;
      iz /= mag;
    }
    cameraMoveBasis(camera, fwd, right);
    out.set(0, 0, 0);
    if (mag > 0.02) {
      out.addScaledVector(fwd, iz).addScaledVector(right, ix);
    }
    return out;
  }
}
