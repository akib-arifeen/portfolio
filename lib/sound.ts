type Blip = "hover" | "click" | "open" | "print";

const PREFERENCE_KEY = "akib-studio-sound";

class StudioSound {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private room: GainNode | null = null;
  private sleepTimer: ReturnType<typeof setTimeout> | null = null;
  private loaded = false;
  enabled = true;

  loadPreference() {
    if (this.loaded) return this.enabled;
    this.loaded = true;
    try {
      const saved = window.localStorage.getItem(PREFERENCE_KEY);
      this.enabled = saved ? saved === "on" : true;
    } catch {
      this.enabled = true;
    }
    return this.enabled;
  }

  private gesture() {
    return typeof navigator !== "undefined" && navigator.userActivation?.isActive === true;
  }

  private ensure() {
    if (this.ctx) return this.ctx;
    if (typeof AudioContext === "undefined") return null;
    const ctx = new AudioContext();
    const master = ctx.createGain();
    master.gain.value = 0.65;
    master.connect(ctx.destination);

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

    const hum = ctx.createOscillator();
    hum.frequency.value = 120;
    const humGain = ctx.createGain();
    humGain.gain.value = 0.025;
    hum.connect(humGain).connect(room);
    hum.start();

    this.ctx = ctx;
    this.master = master;
    this.room = room;
    room.gain.setTargetAtTime(this.enabled ? 0.035 : 0, ctx.currentTime, 0.6);
    const onVisibility = () => {
      if (document.hidden) void ctx.suspend().catch(() => {});
      else if (this.enabled && this.gesture()) void ctx.resume().catch(() => {});
    };
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", () => {
      document.removeEventListener("visibilitychange", onVisibility);
      if (this.sleepTimer) clearTimeout(this.sleepTimer);
      void ctx.close().catch(() => {});
      this.ctx = null;
      this.master = null;
      this.room = null;
    }, { once: true });
    return ctx;
  }

  private sleep() {
    if (this.sleepTimer) clearTimeout(this.sleepTimer);
    this.sleepTimer = setTimeout(() => {
      this.sleepTimer = null;
      if (!this.enabled && this.ctx && this.ctx.state === "running") void this.ctx.suspend().catch(() => {});
    }, 2200);
  }

  async setEnabled(on: boolean) {
    this.loadPreference();
    this.enabled = on;
    try { window.localStorage.setItem(PREFERENCE_KEY, on ? "on" : "off"); } catch {}
    if (!on && !this.ctx) return;
    if (on && !this.ctx && !this.gesture()) return;
    const ctx = this.ensure();
    if (!ctx) return;
    if (on && ctx.state === "suspended") await ctx.resume().catch(() => {});
    const t = ctx.currentTime;
    this.room!.gain.cancelScheduledValues(t);
    this.room!.gain.setTargetAtTime(on ? 0.035 : 0, t, on ? 0.6 : 0.15);
    if (!on) this.sleep();
  }

  async blip(kind: Blip, force = false) {
    this.loadPreference();
    if (!this.enabled && !force) return;
    if (!this.ctx && !this.gesture()) return;
    const ctx = this.ensure();
    if (!ctx) return;
    if (ctx.state === "suspended") {
      if (!this.gesture()) return;
      await ctx.resume().catch(() => {});
    }
    if (!this.enabled && !force) this.sleep();
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

    if (kind === "hover") tone(1500, 1350, 0, 0.035, 0.018, "triangle");
    if (kind === "click") tone(560, 380, 0, 0.08, 0.045, "sine");
    if (kind === "print") {
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
      g.gain.value = 0.035;
      src.connect(band).connect(g).connect(out);
      src.start(t);
    }
    if (kind === "open") {
      tone(660, 655, 0, 0.32, 0.03, "sine");
      tone(990, 985, 0.06, 0.36, 0.02, "sine");
    }
  }

  async playKit() {
    await this.blip("hover", true);
    setTimeout(() => this.blip("hover", true), 160);
    setTimeout(() => this.blip("click", true), 420);
    setTimeout(() => this.blip("open", true), 820);
  }
}

export const studioSound = new StudioSound();
