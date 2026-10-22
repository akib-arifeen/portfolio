// The studio's sound kit — synthesised with Web Audio, no files. Off until the visitor turns it on.

type Blip = "hover" | "click" | "open" | "print";

class StudioSound {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private room: GainNode | null = null;
  private sleepTimer: ReturnType<typeof setTimeout> | null = null;
  enabled = false;

  private ensure() {
    if (this.ctx) return this.ctx;
    const ctx = new AudioContext();
    const master = ctx.createGain();
    master.gain.value = 0.9;
    master.connect(ctx.destination);

    // Room tone: brown noise through a low-pass, very quiet.
    const len = ctx.sampleRate * 4;
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i++) {
      const white = Math.random() * 2 - 1;
      last = (last + 0.02 * white) / 1.02;
      data[i] = last * 3.2;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buf;
    noise.loop = true;
    const lowpass = ctx.createBiquadFilter();
    lowpass.type = "lowpass";
    lowpass.frequency.value = 420;
    const room = ctx.createGain();
    room.gain.value = 0;
    noise.connect(lowpass).connect(room).connect(master);
    noise.start();

    // Lamp hum: a faint 120 Hz sine under the room tone.
    const hum = ctx.createOscillator();
    hum.frequency.value = 120;
    const humGain = ctx.createGain();
    humGain.gain.value = 0.05;
    hum.connect(humGain).connect(room);
    hum.start();

    this.ctx = ctx;
    this.master = master;
    this.room = room;
    // a hidden tab makes no sound: suspend, and come back only if the visitor had sound on
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) void ctx.suspend();
      else if (this.enabled) void ctx.resume();
    });
    return ctx;
  }

  /** Suspend the context (stops the noise loop and hum doing audio-thread work) once nothing is audible and sound is off. */
  private sleep() {
    if (this.sleepTimer) clearTimeout(this.sleepTimer);
    this.sleepTimer = setTimeout(() => {
      this.sleepTimer = null;
      if (!this.enabled && this.ctx && this.ctx.state === "running") void this.ctx.suspend();
    }, 2200);
  }

  async setEnabled(on: boolean) {
    this.enabled = on;
    if (!on && !this.ctx) return; // never build an AudioContext just to say "off"
    const ctx = this.ensure();
    if (on && ctx.state === "suspended") await ctx.resume();
    const t = ctx.currentTime;
    this.room!.gain.cancelScheduledValues(t);
    this.room!.gain.setTargetAtTime(on ? 0.05 : 0, t, on ? 0.6 : 0.15);
    if (!on) this.sleep();
  }

  /** Play one interface sound. `force` plays it even with sound off (an explicit "play the kit" click). */
  async blip(kind: Blip, force = false) {
    if (!this.enabled && !force) return;
    const ctx = this.ensure();
    if (ctx.state === "suspended") await ctx.resume();
    if (!this.enabled) this.sleep(); // a forced one-shot with sound off: let the context nap again afterwards
    const t = ctx.currentTime;
    const out = ctx.createGain();
    out.connect(this.master!);

    const tone = (freq: number, endFreq: number, start: number, dur: number, peak: number, type: OscillatorType) => {
      const osc = ctx.createOscillator();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, t + start);
      osc.frequency.exponentialRampToValueAtTime(endFreq, t + start + dur);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t + start);
      g.gain.exponentialRampToValueAtTime(peak, t + start + 0.006);
      g.gain.exponentialRampToValueAtTime(0.0001, t + start + dur);
      osc.connect(g).connect(out);
      osc.start(t + start);
      osc.stop(t + start + dur + 0.02);
    };

    if (kind === "hover") tone(1500, 1350, 0, 0.035, 0.025, "triangle");
    if (kind === "click") tone(560, 380, 0, 0.08, 0.06, "sine");
    if (kind === "print") {
      // printer motor: band-passed noise, pulsed like a feed roller, ~1.6 s
      const len = Math.floor(ctx.sampleRate * 1.6);
      const buf = ctx.createBuffer(1, len, ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) {
        const tt = i / ctx.sampleRate;
        const pulse = 0.55 + 0.45 * Math.sin(tt * Math.PI * 2 * 14);
        const env = Math.min(1, tt / 0.08) * Math.min(1, (1.6 - tt) / 0.2);
        d[i] = (Math.random() * 2 - 1) * pulse * env;
      }
      const src = ctx.createBufferSource();
      src.buffer = buf;
      const band = ctx.createBiquadFilter();
      band.type = "bandpass";
      band.frequency.value = 900;
      band.Q.value = 1.2;
      const g = ctx.createGain();
      g.gain.value = 0.05;
      src.connect(band).connect(g).connect(out);
      src.start(t);
    }
    if (kind === "open") {
      tone(660, 655, 0, 0.45, 0.035, "sine");
      tone(990, 985, 0.07, 0.5, 0.025, "sine");
    }
  }

  /** Demo the whole kit in sequence, regardless of the sound toggle. */
  async playKit() {
    await this.blip("hover", true);
    setTimeout(() => this.blip("hover", true), 160);
    setTimeout(() => this.blip("click", true), 420);
    setTimeout(() => this.blip("open", true), 820);
  }
}

export const studioSound = new StudioSound();
