// PHÄNOMENAUTIK — Generatives Audio (WebAudio, keine Assets)
// Meeresrauschen, Wind, Donner + Chiptune-artige SFX

class AudioEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private noiseGain: GainNode | null = null;
  private windGain: GainNode | null = null;
  private muted = false;
  private ambientStarted = false;

  private ensure(): AudioContext | null {
    if (typeof window === "undefined") return null;
    if (!this.ctx) {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AC) return null;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.muted ? 0 : 0.5;
      this.master.connect(this.ctx.destination);
    }
    if (this.ctx.state === "suspended") void this.ctx.resume();
    return this.ctx;
  }

  setMuted(m: boolean) {
    this.muted = m;
    if (this.master && this.ctx) {
      this.master.gain.linearRampToValueAtTime(m ? 0 : 0.5, this.ctx.currentTime + 0.2);
    }
  }
  get isMuted() { return this.muted; }

  /** Meeres-Ambiente starten: gefiltertes Rauschen + langsamer Swell */
  startSea() {
    const ctx = this.ensure();
    if (!ctx || !this.master || this.ambientStarted) return;
    this.ambientStarted = true;

    const noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const data = noiseBuf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < data.length; i++) {
      // Rauschiges „Braun“ für Wellen
      const white = Math.random() * 2 - 1;
      last = (last + 0.02 * white) / 1.02;
      data[i] = last * 3.5;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuf;
    noise.loop = true;

    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 480;

    this.noiseGain = ctx.createGain();
    this.noiseGain.gain.value = 0.10;

    // Swell-LFO: Wellen kommen und gehen
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.09;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 0.05;
    lfo.connect(lfoGain).connect(this.noiseGain.gain);

    noise.connect(lp).connect(this.noiseGain).connect(this.master);
    noise.start();
    lfo.start();

    // Wind: höheres Rauschen, per setStormIntensity regelbar
    const windSrc = ctx.createBufferSource();
    windSrc.buffer = noiseBuf;
    windSrc.loop = true;
    windSrc.playbackRate.value = 1.7;
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = 900;
    bp.Q.value = 0.6;
    this.windGain = ctx.createGain();
    this.windGain.gain.value = 0;
    windSrc.connect(bp).connect(this.windGain).connect(this.master);
    windSrc.start();
  }

  /** 0 = ruhig, 1 = voller Sturm */
  setStormIntensity(v: number) {
    if (!this.ctx || !this.windGain || !this.noiseGain) return;
    const t = this.ctx.currentTime;
    this.windGain.gain.linearRampToValueAtTime(v * 0.14, t + 0.8);
    this.noiseGain.gain.linearRampToValueAtTime(0.1 + v * 0.12, t + 0.8);
  }

  thunder() {
    const ctx = this.ensure();
    if (!ctx || !this.master) return;
    const dur = 1.6 + Math.random();
    const buf = ctx.createBuffer(1, ctx.sampleRate * dur, ctx.sampleRate);
    const d = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < d.length; i++) {
      const white = Math.random() * 2 - 1;
      last = (last + 0.04 * white) / 1.04;
      const env = Math.exp(-3.2 * (i / d.length));
      d[i] = last * 5 * env;
    }
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const g = ctx.createGain();
    g.gain.value = 0.55;
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 220;
    src.connect(lp).connect(g).connect(this.master);
    src.start();
  }

  private beep(freq: number, dur: number, type: OscillatorType = "square", vol = 0.12, when = 0) {
    const ctx = this.ensure();
    if (!ctx || !this.master) return;
    const t = ctx.currentTime + when;
    const osc = ctx.createOscillator();
    osc.type = type;
    osc.frequency.value = freq;
    const g = ctx.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.connect(g).connect(this.master);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  }

  select() { this.beep(660, 0.07, "square", 0.08); }
  confirm() { this.beep(523, 0.07, "square", 0.1); this.beep(784, 0.1, "square", 0.1, 0.07); }
  cancel() { this.beep(330, 0.09, "square", 0.08); this.beep(247, 0.12, "square", 0.08, 0.08); }
  hit() {
    this.beep(180, 0.14, "sawtooth", 0.16);
    this.beep(90, 0.2, "square", 0.14, 0.02);
  }
  playerHit() {
    this.beep(140, 0.18, "sawtooth", 0.18);
    this.beep(70, 0.26, "triangle", 0.16, 0.03);
  }
  heal() {
    [523, 659, 784].forEach((f, i) => this.beep(f, 0.14, "triangle", 0.1, i * 0.09));
  }
  understand() {
    [392, 494, 587, 784].forEach((f, i) => this.beep(f, 0.16, "sine", 0.1, i * 0.1));
  }
  victory() {
    [523, 659, 784, 1046, 784, 1046].forEach((f, i) => this.beep(f, 0.18, "square", 0.09, i * 0.12));
  }
  defeat() {
    [392, 370, 349, 330].forEach((f, i) => this.beep(f, 0.4, "triangle", 0.1, i * 0.3));
  }
  dock() {
    this.beep(220, 0.2, "triangle", 0.12);
    this.beep(330, 0.3, "triangle", 0.12, 0.15);
  }
}

export const audio = new AudioEngine();
