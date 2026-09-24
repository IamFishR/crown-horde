/** Tiny synthesized SFX — no sample files. */
export class Sfx {
  private ctx: AudioContext | null = null;

  unlock(): void {
    if (!this.ctx) this.ctx = new AudioContext();
    if (this.ctx.state === "suspended") void this.ctx.resume();
  }

  private beep(freq: number, dur: number, type: OscillatorType, gain = 0.045, slide = 0): void {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (slide) osc.frequency.exponentialRampToValueAtTime(Math.max(40, freq + slide), t + dur);
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g).connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  }

  shoot(): void {
    this.beep(880, 0.06, "square", 0.03);
  }
  hit(): void {
    this.beep(220, 0.08, "triangle", 0.05, -80);
  }
  coin(): void {
    this.beep(980, 0.07, "sine", 0.04);
    this.beep(1320, 0.1, "sine", 0.03);
  }
  hurt(): void {
    this.beep(140, 0.18, "sawtooth", 0.05, -60);
  }
  buy(): void {
    this.beep(523, 0.08, "square", 0.04);
    this.beep(784, 0.12, "square", 0.035);
  }
  lose(): void {
    this.beep(220, 0.35, "sawtooth", 0.05, -140);
  }
}
