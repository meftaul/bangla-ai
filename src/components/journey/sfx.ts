"use client";

// The sounds of a journey's story, made in the browser with Web Audio so there
// are no audio files to ship: a phone ringing, a pencil on paper, a coin on the
// counter, a bicycle bell. A journey plays one where its picture does the same
// thing: `sfx.ring()` as the phone bounces, `sfx.pencil()` as a stroke lands.
//
// A browser plays sound only once the page has had a tap, so the context is
// unlocked on the first one (Safari insists it happens inside the tap). Before
// that, a sound just doesn't play. The reader's sound switch (rail/sound-toggle)
// mutes all of these along with the railway's own.
//
// Everything is quiet on purpose: under the reading, never over it.
//
// Where the sounds live. Shared props play their own, so a new journey gets
// them free: people and Shiku their footsteps (cast.tsx, cast-v2.tsx,
// arrow-journey's Shiku), the chest its lid, the light machine its switch,
// lens and knobs (light-kit's Projector, KnobControl), the remotes their
// buttons (remote-journey's ButtonRemote, lanes-kit's L_Remote), the
// rickshaw its bell and pedals. Every sealed bet gets `stamp()`. A journey
// adds the rest itself: in a tap handler for what the reader does, and in a
// story scene as an effect on the beat where it happens (`if (k === 2) …`).
// Only physical things sound; the dot-product box and the maths stay silent.

const MUTE_KEY = "rail:sound";
let ctx: AudioContext | null = null;
let muted = false;

export function audio(): AudioContext | null {
  if (typeof window === "undefined" || !("AudioContext" in window)) return null;
  ctx ??= new AudioContext();
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

export const isMuted = () => muted;

export function soundOn(): boolean {
  try {
    return localStorage.getItem(MUTE_KEY) !== "off";
  } catch {
    return true;
  }
}

export function setSoundOn(on: boolean) {
  try {
    localStorage.setItem(MUTE_KEY, on ? "on" : "off");
  } catch {
    // storage blocked: the choice lasts until the page reloads
  }
  muted = !on;
}

if (typeof window !== "undefined") {
  muted = !soundOn();
  const unlock = () => {
    audio();
    window.removeEventListener("pointerdown", unlock, true);
    window.removeEventListener("keydown", unlock, true);
  };
  window.addEventListener("pointerdown", unlock, true);
  window.addEventListener("keydown", unlock, true);
}

/** A burst of white noise, for hiss, scratch and splash. */
export function noise(a: AudioContext, seconds: number) {
  const buf = a.createBuffer(1, Math.ceil(a.sampleRate * seconds), a.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  const src = a.createBufferSource();
  src.buffer = buf;
  return src;
}

/**
 * One pencil stroke, sample by sample. Graphite on paper is not a hiss: it is
 * the lead catching on the paper's tooth thousands of times a second, so the
 * sound is a dense crackle of tiny clicks over a rough, fluttering scratch.
 * The hand sets how hard: a stroke starts slow, speeds up and lifts off, with
 * a small wobble, and the faster it moves the more the lead catches.
 */
function graphite(a: AudioContext, len: number) {
  const sr = a.sampleRate;
  const n = Math.ceil(sr * len);
  const buf = a.createBuffer(1, n, sr);
  const d = buf.getChannelData(0);
  const smooth = 1 - Math.exp((-2 * Math.PI * 180) / sr);
  const wob = 5 + Math.random() * 7;
  const ph = Math.random() * 6.28;
  const lean = 0.3 + Math.random() * 0.4; // where along the stroke the hand is fastest
  let rough = 0.5;
  let click = 0;
  let sign = 1;
  let peak = 0;
  for (let i = 0; i < n; i++) {
    const x = i / n;
    const t = i / sr;
    // the hand: quick touch-down, fastest near `lean`, lifting off at the end
    const touch = Math.min(1, t / 0.008) * Math.min(1, (len - t) / 0.03);
    const speed = touch * (0.45 + 0.55 * Math.exp(-(((x - lean) / 0.45) ** 2))) * (0.8 + 0.2 * Math.sin(2 * Math.PI * wob * t + ph));
    // the scratch: noise whose loudness itself jitters, peaky rather than steady
    const w = Math.random() * 2 - 1;
    rough += smooth * (Math.abs(Math.random() * 2 - 1) - rough);
    const flutter = (rough * 1.9) ** 3;
    // the paper's tooth: sparse sharp clicks, more of them the faster the lead moves
    if (Math.random() < (2200 * speed) / sr) {
      click = 0.4 + Math.random() * 0.9;
      sign = Math.random() < 0.5 ? -1 : 1;
    }
    const c = click * sign;
    click *= 0.72;
    sign = -sign;
    const v = speed * (0.35 * w * flutter + c);
    d[i] = v;
    peak = Math.max(peak, Math.abs(v));
  }
  if (peak > 0) for (let i = 0; i < n; i++) d[i] /= peak;
  return buf;
}

/** The context and start time for a sound, or null when muted or unavailable. */
function start(at = 0): [AudioContext, number] | null {
  if (muted) return null;
  const a = audio();
  return a ? [a, a.currentTime + at] : null;
}

/** A gain that rises in `attack` and falls away over `len`, into the speakers. */
function env(a: AudioContext, t: number, peak: number, len: number, attack = 0.005) {
  const g = a.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(peak, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + len);
  g.connect(a.destination);
  return g;
}

function tone(a: AudioContext, t: number, f: number, len: number, peak: number, type: OscillatorType = "sine", attack?: number) {
  const o = a.createOscillator();
  o.type = type;
  o.frequency.value = f;
  o.connect(env(a, t, peak, len, attack));
  o.start(t);
  o.stop(t + len + 0.02);
  return o;
}

/** Noise through one filter, shaped by an envelope. */
function hiss(a: AudioContext, t: number, len: number, peak: number, type: BiquadFilterType, f: number, q = 1, attack?: number) {
  const n = noise(a, len + 0.05);
  const fl = a.createBiquadFilter();
  fl.type = type;
  fl.frequency.value = f;
  fl.Q.value = q;
  n.connect(fl).connect(env(a, t, peak, len, attack));
  n.start(t);
  return { n, fl };
}

/** A level for one sound into the speakers, so its parts mix under one volume. */
function bus(a: AudioContext, gain: number) {
  const g = a.createGain();
  g.gain.value = gain;
  g.connect(a.destination);
  return g;
}

function filt(a: AudioContext, type: BiquadFilterType, f: number, q = 0.7, gain = 0) {
  const b = a.createBiquadFilter();
  b.type = type;
  b.frequency.value = f;
  b.Q.value = q;
  b.gain.value = gain;
  return b;
}

const jit = (x: number, by: number) => x * (1 + (Math.random() * 2 - 1) * by);

/** frequency (Hz), how long it rings (s), how loud */
type Mode = [f: number, decay: number, gain: number];

/**
 * A struck body ringing in its own modes. Metal, glass and wood don't ring in
 * neat harmonics: each partial sits at its own odd ratio and dies at its own
 * rate, and that is what the ear hears as "coin" or "glass" rather than "beep".
 */
function modes(a: AudioContext, t: number, list: Mode[], out: AudioNode, detune = 0.015) {
  for (const [f, decay, gain] of list) {
    const o = a.createOscillator();
    o.frequency.value = jit(f, detune);
    const g = a.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + 0.0015);
    g.gain.exponentialRampToValueAtTime(0.0001, t + decay);
    o.connect(g).connect(out);
    o.start(t);
    o.stop(t + decay + 0.02);
  }
}

/** A short noise burst through one filter: the contact of a strike, a snap, a slap. */
function burst(a: AudioContext, t: number, len: number, type: BiquadFilterType, f: number, q: number, peak: number, out: AudioNode) {
  const n = noise(a, len + 0.02);
  const fl = filt(a, type, f, q);
  const g = a.createGain();
  g.gain.setValueAtTime(peak, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + len);
  n.connect(fl).connect(g).connect(out);
  n.start(t);
  n.stop(t + len + 0.02);
  return fl;
}

/** A buffer played once through a chain of filters into `out`. */
function play(a: AudioContext, t: number, buf: AudioBuffer, out: AudioNode, ...chain: AudioNode[]) {
  const src = a.createBufferSource();
  src.buffer = buf;
  let at: AudioNode = src;
  for (const c of chain) at = at.connect(c);
  at.connect(out);
  src.start(t);
  return src;
}

/**
 * A bubble in water: a sine whose pitch rises as the bubble closes, gone in a
 * few hundredths of a second. Splashes, oars, pouring and mud are swarms of these.
 */
function bubble(a: AudioContext, t: number, f: number, dur: number, gain: number, out: AudioNode) {
  const o = a.createOscillator();
  o.frequency.setValueAtTime(f, t);
  o.frequency.exponentialRampToValueAtTime(f * (1.4 + Math.random() * 0.6), t + dur);
  const g = a.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(gain, t + 0.002);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(out);
  o.start(t);
  o.stop(t + dur + 0.02);
}

/**
 * Friction as a buffer, the pencil's recipe made tunable: a crackle of clicks
 * (`rate` a second at full loudness, each dying by `decay` a sample) over a
 * fluttering scratch (`rough`). `shape(x)`, x from 0 to 1, is how hard the
 * thing presses along the sound. Chalk, paper, rubber and rice are all this.
 */
function grain(a: AudioContext, len: number, rate: number, decay: number, rough: number, shape: (x: number) => number) {
  const sr = a.sampleRate;
  const n = Math.ceil(sr * len);
  const buf = a.createBuffer(1, n, sr);
  const d = buf.getChannelData(0);
  const smooth = 1 - Math.exp((-2 * Math.PI * 180) / sr);
  let r = 0.5;
  let click = 0;
  let sign = 1;
  let peak = 0;
  for (let i = 0; i < n; i++) {
    const s = shape(i / n);
    r += smooth * (Math.abs(Math.random() * 2 - 1) - r);
    if (Math.random() < (rate * s) / sr) {
      click = 0.3 + Math.random();
      sign = Math.random() < 0.5 ? -1 : 1;
    }
    const v = s * (rough * (Math.random() * 2 - 1) * (r * 1.9) ** 3 + click * sign);
    click *= decay;
    sign = -sign;
    d[i] = v;
    peak = Math.max(peak, Math.abs(v));
  }
  if (peak > 0) for (let i = 0; i < n; i++) d[i] /= peak;
  return buf;
}

/** A hand's stroke over `len` seconds: touch down, fastest early on, lift off. */
const stroke = (len: number) => (x: number) =>
  Math.min(1, (x * len) / 0.01) * Math.min(1, ((1 - x) * len) / 0.03) * (0.5 + 0.5 * Math.exp(-(((x - 0.4) / 0.45) ** 2)));

/** A loop that fades out when stopped. */
export type Stop = () => void;
const quiet: Stop = () => {};
function fadeOut(a: AudioContext, g: GainNode, src: AudioScheduledSourceNode[]): Stop {
  return () => {
    const now = a.currentTime;
    g.gain.cancelScheduledValues(now);
    g.gain.setValueAtTime(g.gain.value, now);
    g.gain.linearRampToValueAtTime(0, now + 0.3);
    for (const x of src) x.stop(now + 0.35);
  };
}

/** When a person's footstep now sounding ends: a crowd walking is not a drum roll either. */
let footUntil = 0;

/** When the rickshaw's pedalling now sounding ends. */
let pedalUntil = 0;

/** When the rope's creak now sounding ends. */
let ropeUntil = 0;

/** When the tape pull now sounding ends. */
let tapeUntil = 0;

/** When the step now sounding ends: a fast slide over many squares is not a drum roll. */
let stepUntil = 0;

/** When the chalk now sounding ends, like the pencil's. */
let chalkUntil = 0;

/** When the pencil now sounding ends, so a quick run of strokes reads as one. */
let pencilUntil = 0;

export const sfx = {
  /**
   * A phone ringing: the old double trill, `times` rings 1.2 s apart. Returns a
   * stop, for when someone picks up before the rings run out.
   */
  ring(times = 3): () => void {
    const s = start();
    if (!s) return () => {};
    const [a, t0] = s;
    const out = a.createGain();
    out.connect(a.destination);
    for (let r = 0; r < times; r++) {
      for (const burst of [0, 0.45]) {
        const t = t0 + r * 1.2 + burst;
        const g = a.createGain();
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(0.07, t + 0.02);
        g.gain.setValueAtTime(0.07, t + 0.33);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.38);
        g.connect(out);
        // the bell's warble: the two tones switched on and off 20 times a second
        const trill = a.createGain();
        const lfo = a.createOscillator();
        lfo.type = "square";
        lfo.frequency.value = 20;
        const depth = a.createGain();
        depth.gain.value = 0.5;
        trill.gain.value = 0.5;
        lfo.connect(depth).connect(trill.gain);
        trill.connect(g);
        for (const f of [400, 450]) {
          const o = a.createOscillator();
          o.frequency.value = f;
          o.connect(trill);
          o.start(t);
          o.stop(t + 0.4);
        }
        lfo.start(t);
        lfo.stop(t + 0.4);
      }
    }
    return () => {
      const now = a.currentTime;
      out.gain.setValueAtTime(out.gain.value, now);
      out.gain.linearRampToValueAtTime(0, now + 0.05);
    };
  },

  /**
   * Typing on a keyboard, about `len` seconds: keys at a human, uneven pace,
   * each a plastic tick with the thock of the key bottoming out, the space bar
   * now and then a little deeper.
   */
  typing(len = 0.8) {
    const s = start();
    if (!s) return;
    const [a, t0] = s;
    const out = bus(a, 0.35);
    for (let at = 0; at < len; at += 0.06 + Math.random() * 0.09) {
      const t = t0 + at;
      const space = Math.random() < 0.15;
      burst(a, t, 0.004, "bandpass", space ? 1800 : 3200, 1, 0.12, out);
      modes(a, t + 0.003, [[jit(space ? 380 : 620, 0.1), 0.03, 0.06], [jit(1500, 0.1), 0.015, 0.03]], out);
    }
  },

  /** A button phone's key beep; `n` (0–9) picks its pitch, like the keypad's tones. */
  key(n = 5) {
    const s = start();
    if (!s) return;
    const [a, t] = s;
    const row = [697, 770, 852, 941][Math.floor(((n + 9) % 10) / 3) % 4];
    const col = [1209, 1336, 1477][((n + 9) % 10) % 3];
    tone(a, t, row, 0.12, 0.03);
    tone(a, t, col, 0.12, 0.03);
  },

  /**
   * A pencil stroke on paper, about `len` seconds of dry scratching, `at`
   * seconds from now. Called again while a stroke is still sounding (a drag
   * across cells, cells shaded one after another) it lets that stroke carry on
   * instead of piling up.
   */
  pencil(len = 0.25, at = 0) {
    const s = start(at);
    if (!s) return;
    const [a, t] = s;
    if (t < pencilUntil) return;
    pencilUntil = t + len * 0.8;
    const src = a.createBufferSource();
    src.buffer = graphite(a, len);
    // paper's body: nothing below the scratch, a lift where graphite bites, no fizz on top
    const low = a.createBiquadFilter();
    low.type = "highpass";
    low.frequency.value = 900;
    const bite = a.createBiquadFilter();
    bite.type = "peaking";
    bite.frequency.value = 2800 + Math.random() * 1600;
    bite.Q.value = 0.9;
    bite.gain.value = 7;
    const top = a.createBiquadFilter();
    top.type = "lowpass";
    top.frequency.value = 8000;
    const g = a.createGain();
    g.gain.value = 0.16;
    src.connect(low).connect(bite).connect(top).connect(g).connect(a.destination);
    src.start(t);
  },

  /**
   * A watercolour brush stroke: soft bristles dragging wet paint, a gentle swish
   * with little grit. Shares the pencil's "one at a time" so a run of cells
   * painted quickly reads as one stroke.
   */
  brush(len = 0.3, at = 0) {
    const s = start(at);
    if (!s) return;
    const [a, t] = s;
    if (t < pencilUntil) return;
    pencilUntil = t + len * 0.8;
    play(a, t, grain(a, len, 350, 0.9, 1, stroke(len)), bus(a, 0.1), filt(a, "highpass", 700), filt(a, "peaking", jit(2200, 0.2), 0.7, 5), filt(a, "lowpass", 5000));
  },

  /** A run of `count` pencil strokes, `gap` seconds apart: ruling a grid, shading a row. */
  scribble(count: number, gap = 0.12, len = 0.1) {
    for (let i = 0; i < count; i++) sfx.pencil(len, i * gap);
  },

  /** A rubber eraser rubbed on paper: soft, low, with a dull drag. */
  erase(len = 0.2) {
    const s = start();
    if (!s) return;
    const [a, t] = s;
    if (t < pencilUntil) return;
    pencilUntil = t + len * 0.8;
    play(a, t, grain(a, len, 900, 0.9, 0.9, stroke(len)), bus(a, 0.14), filt(a, "highpass", 200), filt(a, "peaking", 700, 0.8, 6), filt(a, "lowpass", 1800));
  },

  /**
   * A stroke of chalk on a floor, road or wall, `at` seconds from now: chunkier
   * grit than a pencil, lower, with the odd squeak where the stick bites. Like
   * the pencil, quick repeats carry one stroke on.
   */
  chalk(len = 0.3, at = 0) {
    const s = start(at);
    if (!s) return;
    const [a, t] = s;
    if (t < chalkUntil) return;
    chalkUntil = t + len * 0.8;
    const out = bus(a, 0.2);
    burst(a, t, 0.006, "highpass", 2000, 0.7, 0.35, out);
    play(a, t, grain(a, len, 1400, 0.82, 0.55, stroke(len)), out, filt(a, "highpass", 500), filt(a, "peaking", jit(1600, 0.2), 0.8, 6), filt(a, "lowpass", 5000));
    if (Math.random() < 0.35) {
      const at2 = t + len * (0.2 + Math.random() * 0.5);
      const o = a.createOscillator();
      o.frequency.value = 1800 + Math.random() * 800;
      const lfo = a.createOscillator();
      lfo.frequency.value = 25;
      const dep = a.createGain();
      dep.gain.value = 40;
      lfo.connect(dep).connect(o.frequency);
      const g = a.createGain();
      const dur = 0.05 + Math.random() * 0.06;
      g.gain.setValueAtTime(0.0001, at2);
      g.gain.exponentialRampToValueAtTime(0.05, at2 + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, at2 + dur);
      o.connect(g).connect(out);
      o.start(at2);
      lfo.start(at2);
      o.stop(at2 + dur + 0.02);
      lfo.stop(at2 + dur + 0.02);
    }
  },

  /** A run of `count` chalk strokes, `gap` seconds apart: a grid chalked on the road. */
  chalkLines(count: number, gap = 0.14, len = 0.12) {
    for (let i = 0; i < count; i++) sfx.chalk(len, i * gap);
  },

  /** A page turned or a sheet picked up: a crinkle that swells and settles, with a puff of air. */
  paper() {
    const s = start();
    if (!s) return;
    const [a, t] = s;
    const out = bus(a, 0.18);
    const len = 0.4 + Math.random() * 0.15;
    play(a, t, grain(a, len, 3000, 0.6, 0.6, (x) => Math.sin(Math.PI * x) ** 0.7), out, filt(a, "highpass", 1000), filt(a, "lowpass", 9000));
    burst(a, t + len * 0.5, 0.15, "lowpass", 300, 0.7, 0.5, out);
  },

  /** A slip of paper slid across a table and set down. */
  slip() {
    const s = start();
    if (!s) return;
    const [a, t] = s;
    const out = bus(a, 0.12);
    play(a, t, grain(a, 0.28, 600, 0.7, 0.9, stroke(0.28)), out, filt(a, "highpass", 1500), filt(a, "lowpass", 6000));
    burst(a, t + 0.27, 0.01, "lowpass", 1800, 0.7, 0.6, out);
  },

  /** A fingertip on a table or a card: a soft, woody thock. */
  tap() {
    const s = start();
    if (!s) return;
    const [a, t] = s;
    const out = bus(a, 0.4);
    burst(a, t, 0.008, "lowpass", 1800, 0.7, 0.3, out);
    modes(a, t, [[jit(260, 0.1), 0.05, 0.15], [jit(610, 0.1), 0.03, 0.05]], out);
  },

  /** A soft pop, for something appearing: a dot on the grid, a card turning up. */
  pop() {
    const s = start();
    if (!s) return;
    const [a, t] = s;
    bubble(a, t, jit(450, 0.1), 0.08, 0.09, bus(a, 0.7));
  },

  /** A wall switch: the snap of the rocker and the plastic body behind it. */
  click() {
    const s = start();
    if (!s) return;
    const [a, t] = s;
    const out = bus(a, 0.35);
    burst(a, t, 0.003, "highpass", 3000, 0.7, 0.5, out);
    modes(a, t, [[1900, 0.012, 0.2], [3400, 0.008, 0.12], [900, 0.02, 0.1]], out, 0.05);
  },

  /** A rubber button pressed on a remote: a dull press and, a moment later, its release. */
  press() {
    const s = start();
    if (!s) return;
    const [a, t] = s;
    const out = bus(a, 0.3);
    burst(a, t, 0.006, "lowpass", 2500, 0.7, 0.25, out);
    modes(a, t, [[jit(1200, 0.05), 0.015, 0.08]], out);
    burst(a, t + 0.08, 0.004, "lowpass", 2000, 0.7, 0.1, out);
  },

  /** A glass lens set into the machine's metal slot: a clink of glass, a click of the catch. */
  lens() {
    const s = start();
    if (!s) return;
    const [a, t] = s;
    const out = bus(a, 0.5);
    burst(a, t, 0.005, "bandpass", 2500, 2, 0.2, out);
    modes(a, t, [[1400, 0.04, 0.06]], out);
    modes(a, t + 0.012, [[3100, 0.25, 0.05], [5200, 0.15, 0.03], [7400, 0.1, 0.015]], out);
  },

  /**
   * A rubber stamp brought down on paper on a wooden table: the thud of the
   * table, the knock of the handle, the slap of the paper, then the peel as
   * it lifts. For sealing a bet.
   */
  stamp() {
    const s = start();
    if (!s) return;
    const [a, t] = s;
    const out = bus(a, 0.6);
    modes(a, t, [[jit(110, 0.05), 0.18, 0.35], [jit(190, 0.05), 0.1, 0.15]], out);
    modes(a, t, [[jit(720, 0.05), 0.05, 0.12], [jit(1350, 0.05), 0.03, 0.05]], out);
    burst(a, t, 0.025, "bandpass", 1500, 0.8, 0.25, out);
    burst(a, t + 0.22, 0.015, "highpass", 2500, 0.7, 0.05, out);
  },

  /**
   * Coins put down on a counter: each a thin metal disc ringing in its own
   * uneven partials, with a smaller second hit as it bounces.
   */
  coin(count = 2) {
    const s = start();
    if (!s) return;
    const [a, t0] = s;
    const out = bus(a, 0.5);
    let t = t0;
    for (let i = 0; i < count; i++) {
      const f = 1900 + Math.random() * 1300;
      const ring = (at: number, k: number) =>
        modes(a, at, [
          [f, 0.6, 0.05 * k],
          [f * 1.72, 0.45, 0.04 * k],
          [f * 2.34, 0.35, 0.03 * k],
          [f * 3.1, 0.25, 0.02 * k],
          [f * 4.03, 0.2, 0.015 * k],
        ], out);
      burst(a, t, 0.003, "highpass", 3000, 0.7, 0.15, out);
      burst(a, t, 0.02, "lowpass", 400, 0.7, 0.2, out);
      ring(t, 1);
      ring(t + 0.06 + Math.random() * 0.03, 0.4);
      t += 0.07 + Math.random() * 0.08;
    }
  },

  /**
   * A coin tossed: the thumb's flick sets it ringing as it spins up, and it
   * lands on the table a moment later. `count` coins tossed at once land
   * together.
   */
  flip(count = 1) {
    const s = start();
    if (!s) return;
    const [a, t] = s;
    const out = bus(a, 0.4);
    const f = 2600 + Math.random() * 600;
    burst(a, t, 0.003, "highpass", 3000, 0.7, 0.15, out);
    modes(a, t, [[f, 0.35, 0.03], [f * 2.3, 0.2, 0.015]], out);
    const land = sfx.coin;
    setTimeout(() => land(count), 380);
  },

  /**
   * A rickshaw pedalled one block: the chain ticking over the sprocket and the
   * frame creaking under the load. Quick repeats carry one ride on.
   */
  pedal() {
    const s = start();
    if (!s) return;
    const [a, t0] = s;
    if (t0 < pedalUntil) return;
    pedalUntil = t0 + 0.22;
    const out = bus(a, 0.35);
    for (let i = 0; i < 4; i++) {
      const t = t0 + i * 0.06 + Math.random() * 0.01;
      burst(a, t, 0.002, "highpass", 3500, 0.7, 0.08, out);
      modes(a, t, [[jit(2800, 0.1), 0.015, 0.03]], out);
    }
    modes(a, t0 + 0.05, [[jit(420, 0.15), 0.12, 0.03], [jit(980, 0.15), 0.08, 0.015]], out);
  },

  /**
   * The school bell: a heavy brass bell struck three times, ঢং ঢং ঢং, each
   * stroke ringing long and low under the next.
   */
  schoolBell() {
    const s = start();
    if (!s) return;
    const [a, t0] = s;
    const out = bus(a, 0.5);
    const f = jit(520, 0.05);
    for (let i = 0; i < 3; i++) {
      const t = t0 + i * 0.55;
      burst(a, t, 0.004, "bandpass", 2500, 1, 0.2, out);
      modes(a, t, [
        [f, 1.8, 0.08],
        [f * 2.0, 1.2, 0.05],
        [f * 2.4, 0.9, 0.04],
        [f * 3.0, 0.6, 0.03],
        [f * 0.5, 2.2, 0.05],
      ], out, 0.003);
    }
  },

  /**
   * A rickshaw bell, kring-kring: a thumb bell whose striker spins against the
   * dome, so each ring is a quick run of strikes, twice.
   */
  bell() {
    const s = start();
    if (!s) return;
    const [a, t0] = s;
    const out = bus(a, 0.6);
    const f = 2300 + Math.random() * 300;
    for (const r of [0, 0.4]) {
      for (let k = 0; k < 6; k++) {
        const t = t0 + r + k * 0.045 + Math.random() * 0.008;
        const g = 0.02 * (0.7 + Math.random() * 0.6);
        burst(a, t, 0.002, "highpass", 4000, 0.7, 0.05, out);
        modes(a, t, [
          [f, 0.5, g],
          [f * 1.53, 0.35, g * 0.7],
          [f * 2.46, 0.25, g * 0.5],
          [f * 3.2, 0.18, g * 0.3],
        ], out, 0.004);
      }
    }
  },

  /** The PT sir's whistle: the pea rattling the note, breath under it, `len` seconds. */
  whistle(len = 0.6) {
    const s = start();
    if (!s) return;
    const [a, t] = s;
    const out = bus(a, 1);
    const o = a.createOscillator();
    o.frequency.value = jit(2900, 0.03);
    const lfo = a.createOscillator();
    lfo.frequency.setValueAtTime(26, t);
    lfo.frequency.linearRampToValueAtTime(32, t + len);
    const fm = a.createGain();
    fm.gain.value = 150;
    lfo.connect(fm).connect(o.frequency);
    const am = a.createGain();
    am.gain.value = 0.7;
    const amDepth = a.createGain();
    amDepth.gain.value = 0.3;
    lfo.connect(amDepth).connect(am.gain);
    const g = a.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.03, t + 0.03);
    g.gain.setValueAtTime(0.03, t + len - 0.06);
    g.gain.exponentialRampToValueAtTime(0.0001, t + len);
    o.connect(am).connect(g).connect(out);
    const breath = noise(a, len + 0.05);
    const bg = a.createGain();
    bg.gain.value = 0.15;
    breath.connect(filt(a, "bandpass", 2900, 3)).connect(bg).connect(g);
    o.start(t);
    lfo.start(t);
    breath.start(t);
    o.stop(t + len);
    lfo.stop(t + len);
    breath.stop(t + len);
  },

  /**
   * Wind over open water, `len` seconds: a low rush that swells and dips in
   * gusts, never steady. `fill` adds the sail catching it: a few hard
   * flaps of cloth, then taut.
   */
  wind(len = 1.4, fill = false) {
    const s = start();
    if (!s) return;
    const [a, t] = s;
    const out = bus(a, 0.5);
    const n = noise(a, len + 0.1);
    const fl = filt(a, "bandpass", 380, 0.9);
    const g = a.createGain();
    g.gain.setValueAtTime(0.0001, t);
    // gusts: the level and the pitch of the rush wander together
    const steps = Math.ceil(len / 0.25);
    for (let i = 1; i <= steps; i++) {
      const at = t + (i / steps) * len;
      const k = Math.sin((Math.PI * i) / steps);
      const gust = k * (0.55 + Math.random() * 0.45);
      g.gain.linearRampToValueAtTime(0.0001 + 0.12 * gust, at);
      fl.frequency.linearRampToValueAtTime(260 + 500 * gust, at);
    }
    n.connect(fl).connect(g).connect(out);
    n.start(t);
    n.stop(t + len + 0.05);
    if (fill)
      for (let i = 0; i < 3; i++) {
        const at = t + len * 0.35 + i * 0.09;
        burst(a, at, 0.05, "lowpass", 900, 0.8, 0.5 - i * 0.12, out);
        modes(a, at, [[jit(95, 0.1), 0.06, 0.1]], out);
      }
  },

  /**
   * A heavy wooden table dragged over a floor, `len` seconds: the legs judder
   * as they catch and slip. `stuck` is two pushes cancelling: the table only
   * shudders in place, a few hard catches and no slide.
   */
  scrape(len = 0.6, stuck = false) {
    const s = start();
    if (!s) return;
    const [a, t] = s;
    const out = bus(a, 0.5);
    const rate = stuck ? 14 : 38;
    const dur = stuck ? 0.35 : len;
    for (let at = 0; at < dur; at += (1 / rate) * (0.7 + Math.random() * 0.6)) {
      const k = stuck ? 1 - at / dur : Math.sin((Math.PI * at) / dur);
      burst(a, t + at, 0.02, "bandpass", jit(stuck ? 220 : 420, 0.2), 1.5, 0.25 * k + 0.02, out);
      modes(a, t + at, [[jit(stuck ? 140 : 260, 0.15), 0.04, 0.08 * k + 0.01]], out);
    }
  },

  /** A quick movement through the air: an arrow sliding, a card swept aside. */
  whoosh(len = 0.3) {
    const s = start();
    if (!s) return;
    const [a, t] = s;
    const { fl } = hiss(a, t, len, 0.04, "bandpass", 400, 1.2, len * 0.4);
    fl.frequency.exponentialRampToValueAtTime(2400, t + len);
  },

  /** One drop of water landing: a small plip. */
  drip() {
    const s = start();
    if (!s) return;
    const [a, t] = s;
    const out = bus(a, 0.6);
    burst(a, t, 0.004, "highpass", 3000, 0.7, 0.08, out);
    bubble(a, t + 0.004, jit(1100, 0.2), 0.06, 0.08, out);
  },

  /**
   * River water lapping against a boat's hull, `len` seconds: soft slaps
   * every so often, each with a few low bubbles, over a faint wash.
   */
  lap(len = 2.5) {
    const s = start();
    if (!s) return;
    const [a, t0] = s;
    const out = bus(a, 0.5);
    const wash = burst(a, t0, len, "lowpass", 500, 0.5, 0.05, out);
    wash.frequency.setValueAtTime(500, t0);
    for (let at = 0.1; at < len - 0.2; at += 0.35 + Math.random() * 0.4) {
      const t = t0 + at;
      burst(a, t, 0.12, "lowpass", jit(900, 0.3), 0.7, 0.12, out);
      for (let i = 0; i < 3; i++) bubble(a, t + Math.random() * 0.12, 180 + Math.random() * 350, 0.05 + Math.random() * 0.05, 0.02, out);
    }
  },

  /** Something dropped in the river: the slap of the surface, then a burst of bubbles. */
  splash() {
    const s = start();
    if (!s) return;
    const [a, t] = s;
    const out = bus(a, 0.6);
    const fl = burst(a, t, 0.25, "lowpass", 1800, 0.5, 0.2, out);
    fl.frequency.exponentialRampToValueAtTime(400, t + 0.25);
    for (let i = 0; i < 18; i++) bubble(a, t + Math.random() * 0.35, 300 + Math.random() * 1300, 0.03 + Math.random() * 0.06, 0.01 + Math.random() * 0.03, out);
  },

  /** An oar stroke: the blade swishing in, the water turning over it, a drip as it lifts. */
  oar() {
    const s = start();
    if (!s) return;
    const [a, t] = s;
    const out = bus(a, 0.6);
    const n = noise(a, 0.4);
    const fl = filt(a, "bandpass", 500, 1);
    fl.frequency.exponentialRampToValueAtTime(1200, t + 0.3);
    const g = a.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.1, t + 0.15);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.38);
    n.connect(fl).connect(g).connect(out);
    n.start(t);
    for (let i = 0; i < 10; i++) bubble(a, t + 0.1 + Math.random() * 0.35, 250 + Math.random() * 700, 0.04 + Math.random() * 0.06, 0.01 + Math.random() * 0.02, out);
    for (let i = 0; i < 3; i++) bubble(a, t + 0.5 + Math.random() * 0.3, 1500 + Math.random() * 1000, 0.03, 0.015, out);
  },

  /** Rain on the roof and the yard, until stopped. */
  rain(): Stop {
    const s = start();
    if (!s) return quiet;
    const [a, t] = s;
    const sr = a.sampleRate;
    const n = sr * 4;
    const buf = a.createBuffer(1, n, sr);
    const d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * 0.04;
    // drops: each a tiny ringing tick, most faint, a few close by
    for (let k = 0; k < 4 * 70; k++) {
      const at = Math.floor(Math.random() * n);
      const f = 1500 + Math.random() * 3500;
      const amp = Math.random() ** 2 * 0.6;
      const len = Math.floor(sr * 0.006);
      for (let j = 0; j < len && at + j < n; j++) d[at + j] += amp * Math.sin((2 * Math.PI * f * j) / sr) * Math.exp(-j / (len / 4));
    }
    const src = a.createBufferSource();
    src.buffer = buf;
    src.loop = true;
    const g = a.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.25, t + 0.8);
    src.connect(filt(a, "highpass", 400)).connect(filt(a, "lowpass", 7000)).connect(g).connect(a.destination);
    src.start(t);
    return fadeOut(a, g, [src]);
  },

  /** Water or sherbet poured into a glass: the stream, and bubbles climbing as the glass fills. */
  pour(len = 0.8) {
    const s = start();
    if (!s) return;
    const [a, t] = s;
    const out = bus(a, 0.6);
    const { fl } = hiss(a, t, len, 0.03, "bandpass", 700, 3, 0.08);
    fl.frequency.exponentialRampToValueAtTime(1800, t + len);
    const count = Math.floor(len * 40);
    for (let i = 0; i < count; i++) {
      const x = i / count;
      bubble(a, t + x * len + Math.random() * 0.02, (500 + 1000 * x) * (0.8 + Math.random() * 0.4), 0.02 + Math.random() * 0.03, 0.008 + Math.random() * 0.012, out);
    }
  },

  /** Rice poured into a drum or a sack: a dense rain of grains. */
  rice(len = 0.8) {
    const s = start();
    if (!s) return;
    const [a, t] = s;
    const shape = (x: number) => Math.min(1, x / 0.1) * Math.min(1, (1 - x) / 0.25);
    play(a, t, grain(a, len, 6000, 0.55, 0.15, shape), bus(a, 0.2), filt(a, "highpass", 1500), filt(a, "peaking", 4000, 0.8, 5), filt(a, "lowpass", 10000));
  },

  /** A wooden door knocked, `count` raps. */
  knock(count = 2) {
    const s = start();
    if (!s) return;
    const [a, t0] = s;
    const out = bus(a, 0.6);
    for (let i = 0; i < count; i++) {
      const t = t0 + i * 0.18;
      burst(a, t, 0.006, "lowpass", 2500, 0.7, 0.25, out);
      modes(a, t, [[160, 0.12, 0.3], [410, 0.08, 0.15], [870, 0.04, 0.06]], out, 0.05);
    }
  },

  /** A sack or a heavy box set down: a deep thud and the rustle of the sacking. */
  thump() {
    const s = start();
    if (!s) return;
    const [a, t] = s;
    const out = bus(a, 0.6);
    modes(a, t, [[jit(85, 0.1), 0.25, 0.4], [jit(140, 0.1), 0.15, 0.2]], out);
    play(a, t, grain(a, 0.15, 2000, 0.7, 0.8, (x) => 1 - x), bus(a, 0.08), filt(a, "lowpass", 2500));
  },

  /** A phone on silent buzzing on a hard surface: two short rattling pulses. */
  vibrate() {
    const s = start();
    if (!s) return;
    const [a, t0] = s;
    const out = bus(a, 0.5);
    for (const d of [0, 0.45]) {
      const t = t0 + d;
      const o = a.createOscillator();
      o.type = "square";
      o.frequency.value = jit(150, 0.05);
      const g = a.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.06, t + 0.02);
      g.gain.setValueAtTime(0.06, t + 0.28);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.32);
      o.connect(filt(a, "lowpass", 900)).connect(g).connect(out);
      o.start(t);
      o.stop(t + 0.34);
    }
  },

  /**
   * A cow lowing: a deep voiced call through the throat's two resonances,
   * rising into the "moo" and sinking away, with a slow waver.
   */
  moo() {
    const s = start();
    if (!s) return;
    const [a, t] = s;
    const len = 1.1 + Math.random() * 0.3;
    const out = bus(a, 0.8);
    const o = a.createOscillator();
    o.type = "sawtooth";
    const f = jit(115, 0.08);
    o.frequency.setValueAtTime(f * 0.85, t);
    o.frequency.linearRampToValueAtTime(f * 1.15, t + len * 0.3);
    o.frequency.linearRampToValueAtTime(f * 0.8, t + len);
    const vib = a.createOscillator();
    vib.frequency.value = 4.5;
    const vd = a.createGain();
    vd.gain.value = 3;
    vib.connect(vd).connect(o.frequency);
    const g = a.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.09, t + 0.15);
    g.gain.setValueAtTime(0.09, t + len * 0.6);
    g.gain.exponentialRampToValueAtTime(0.0001, t + len);
    // the mouth opens from "mm" into "oo": the upper formant rises with it
    const f1 = filt(a, "bandpass", 450, 3);
    const f2 = filt(a, "bandpass", 700, 4);
    f2.frequency.setValueAtTime(600, t);
    f2.frequency.linearRampToValueAtTime(1000, t + len * 0.35);
    f2.frequency.linearRampToValueAtTime(700, t + len);
    const low = filt(a, "lowpass", 300);
    o.connect(f1).connect(g);
    o.connect(f2).connect(g);
    o.connect(low).connect(g);
    g.connect(out);
    o.start(t);
    vib.start(t);
    o.stop(t + len + 0.02);
    vib.stop(t + len + 0.02);
  },

  /** A teacup set down on its saucer: a small bright china clink. */
  cup() {
    const s = start();
    if (!s) return;
    const [a, t] = s;
    const out = bus(a, 0.4);
    burst(a, t, 0.003, "highpass", 3000, 0.7, 0.2, out);
    modes(a, t, [[jit(2300, 0.1), 0.25, 0.05], [jit(3900, 0.1), 0.15, 0.03], [jit(5600, 0.1), 0.1, 0.015]], out);
    modes(a, t + 0.05, [[jit(2400, 0.1), 0.15, 0.02]], out);
  },

  /**
   * A book slid off a shelf or pushed back onto it: the scrape of its cover
   * against its neighbours, a soft thud, and the pages settling.
   */
  book() {
    const s = start();
    if (!s) return;
    const [a, t] = s;
    const out = bus(a, 0.4);
    play(a, t, grain(a, 0.18, 900, 0.8, 0.9, stroke(0.18)), bus(a, 0.08), filt(a, "bandpass", 1600, 0.8));
    modes(a, t + 0.18, [[jit(140, 0.1), 0.1, 0.25], [jit(320, 0.1), 0.05, 0.08]], out);
    burst(a, t + 0.18, 0.04, "lowpass", 1200, 0.7, 0.15, out);
    play(a, t + 0.2, grain(a, 0.12, 2500, 0.6, 0.5, (x) => 1 - x), bus(a, 0.05), filt(a, "highpass", 1500));
  },

  /**
   * A bus's diesel idling and pulling off, `len` seconds: a low uneven
   * rumble of the engine's firing, rising as it moves away.
   */
  rumble(len = 1.6) {
    const s = start();
    if (!s) return;
    const [a, t] = s;
    const out = bus(a, 0.8);
    const o = a.createOscillator();
    o.type = "sawtooth";
    o.frequency.setValueAtTime(jit(38, 0.05), t);
    o.frequency.linearRampToValueAtTime(jit(55, 0.05), t + len);
    const am = a.createGain();
    am.gain.value = 0.6;
    const lfo = a.createOscillator();
    lfo.type = "square";
    lfo.frequency.setValueAtTime(11, t);
    lfo.frequency.linearRampToValueAtTime(16, t + len);
    const d = a.createGain();
    d.gain.value = 0.4;
    lfo.connect(d).connect(am.gain);
    const g = a.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.12, t + 0.3);
    g.gain.setValueAtTime(0.12, t + len - 0.5);
    g.gain.exponentialRampToValueAtTime(0.0001, t + len);
    o.connect(filt(a, "lowpass", 260)).connect(am).connect(g).connect(out);
    o.start(t);
    lfo.start(t);
    o.stop(t + len + 0.02);
    lfo.stop(t + len + 0.02);
  },

  /** A car's horn: two short blasts of its two buzzing notes. */
  horn2() {
    const s = start();
    if (!s) return;
    const [a, t0] = s;
    const out = bus(a, 0.5);
    for (const [d, len] of [[0, 0.18], [0.26, 0.4]]) {
      const t = t0 + d;
      const g = a.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.05, t + 0.015);
      g.gain.setValueAtTime(0.05, t + len - 0.03);
      g.gain.exponentialRampToValueAtTime(0.0001, t + len);
      const band = filt(a, "bandpass", 900, 0.8);
      band.connect(g).connect(out);
      for (const f of [415, 495]) {
        const o = a.createOscillator();
        o.type = "square";
        o.frequency.value = f;
        o.connect(band);
        o.start(t);
        o.stop(t + len + 0.02);
      }
    }
  },

  /** A goat's bleat: a nasal "meh-eh-eh", the voice trembling fast. */
  bleat() {
    const s = start();
    if (!s) return;
    const [a, t] = s;
    const len = 0.7;
    const out = bus(a, 0.8);
    const o = a.createOscillator();
    o.type = "sawtooth";
    const f = jit(330, 0.08);
    o.frequency.setValueAtTime(f, t);
    o.frequency.linearRampToValueAtTime(f * 1.1, t + 0.15);
    o.frequency.linearRampToValueAtTime(f * 0.9, t + len);
    const trem = a.createOscillator();
    trem.frequency.value = 18;
    const td = a.createGain();
    td.gain.value = 0.45;
    const am = a.createGain();
    am.gain.value = 0.55;
    trem.connect(td).connect(am.gain);
    const g = a.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.07, t + 0.05);
    g.gain.exponentialRampToValueAtTime(0.0001, t + len);
    o.connect(filt(a, "bandpass", 1100, 2)).connect(am);
    o.connect(filt(a, "bandpass", 2400, 3)).connect(am);
    am.connect(g).connect(out);
    o.start(t);
    trem.start(t);
    o.stop(t + len + 0.02);
    trem.stop(t + len + 0.02);
  },

  /** A cat's meow: "mi" opening to "a" and closing to "ow", the pitch rising then falling. */
  meow() {
    const s = start();
    if (!s) return;
    const [a, t] = s;
    const len = 0.75;
    const out = bus(a, 0.8);
    const o = a.createOscillator();
    o.type = "sawtooth";
    const f = jit(560, 0.08);
    o.frequency.setValueAtTime(f * 0.9, t);
    o.frequency.linearRampToValueAtTime(f * 1.35, t + len * 0.35);
    o.frequency.linearRampToValueAtTime(f * 0.75, t + len);
    const g = a.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.05, t + 0.08);
    g.gain.setValueAtTime(0.05, t + len * 0.6);
    g.gain.exponentialRampToValueAtTime(0.0001, t + len);
    // the mouth: "i" (high second resonance) → "a" (both open) → "ow" (closing, low)
    const f1 = filt(a, "bandpass", 700, 4);
    const f2 = filt(a, "bandpass", 2200, 5);
    f1.frequency.setValueAtTime(500, t);
    f1.frequency.linearRampToValueAtTime(1000, t + len * 0.4);
    f1.frequency.linearRampToValueAtTime(550, t + len);
    f2.frequency.setValueAtTime(2600, t);
    f2.frequency.linearRampToValueAtTime(1600, t + len * 0.45);
    f2.frequency.linearRampToValueAtTime(900, t + len);
    o.connect(f1).connect(g);
    o.connect(f2).connect(g);
    g.connect(out);
    o.start(t);
    o.stop(t + len + 0.02);
  },

  /** A new message on the phone: two soft notes. */
  chime() {
    const s = start();
    if (!s) return;
    const [a, t] = s;
    tone(a, t, 880, 0.35, 0.04);
    tone(a, t + 0.12, 1320, 0.45, 0.04);
  },

  /** A camera's shutter: the release, the curtain's run, the mirror coming back. */
  shutter() {
    const s = start();
    if (!s) return;
    const [a, t] = s;
    const out = bus(a, 0.5);
    burst(a, t, 0.003, "highpass", 2500, 0.7, 0.3, out);
    modes(a, t, [[2700, 0.02, 0.08]], out);
    burst(a, t + 0.01, 0.04, "bandpass", 1200, 2, 0.12, out);
    burst(a, t + 0.08, 0.004, "highpass", 2000, 0.7, 0.25, out);
    modes(a, t + 0.08, [[1500, 0.03, 0.08]], out);
  },

  /** Radio static between stations, `len` seconds; `level` (0…1) for how loud the hiss is. */
  staticNoise(len = 0.5, level = 1) {
    const s = start();
    if (!s) return;
    const [a, t] = s;
    play(a, t, grain(a, len, 800, 0.5, 1, () => 1), bus(a, 0.01 + 0.08 * level), filt(a, "bandpass", 3000, 0.4));
  },

  /** A radio's tuning knob turned a notch: the small ratchet of its detent. */
  knob() {
    const s = start();
    if (!s) return;
    const [a, t] = s;
    const out = bus(a, 0.3);
    burst(a, t, 0.002, "highpass", 3500, 0.7, 0.15, out);
    modes(a, t, [[jit(2400, 0.08), 0.012, 0.05], [jit(900, 0.08), 0.02, 0.03]], out);
  },

  /**
   * Tiles poured out and settling: a clatter of hard ceramic pieces knocking
   * each other, thick at first and thinning out, about half a second.
   */
  tiles(count = 14) {
    const s = start();
    if (!s) return;
    const [a, t0] = s;
    const out = bus(a, 0.4);
    for (let i = 0; i < count; i++) {
      const at = 0.5 * (i / count) ** 1.6 + Math.random() * 0.03;
      const g = 0.06 * (1 - (0.6 * i) / count);
      burst(a, t0 + at, 0.003, "highpass", 2500, 0.7, g * 1.5, out);
      modes(a, t0 + at, [[jit(2900, 0.2), 0.04, g], [jit(4700, 0.2), 0.025, g * 0.5], [jit(1300, 0.2), 0.03, g * 0.4]], out);
    }
  },

  /**
   * A housefly taking off and buzzing away, `len` seconds: a low rough drone
   * of its wings, loud as it lifts and fading as it goes.
   */
  fly(len = 1) {
    const s = start();
    if (!s) return;
    const [a, t] = s;
    const out = bus(a, 1);
    const o = a.createOscillator();
    o.type = "sawtooth";
    o.frequency.setValueAtTime(jit(190, 0.05), t);
    o.frequency.linearRampToValueAtTime(jit(230, 0.05), t + len * 0.3);
    o.frequency.linearRampToValueAtTime(jit(200, 0.05), t + len);
    const wob = a.createOscillator();
    wob.frequency.value = 9 + Math.random() * 4;
    const wd = a.createGain();
    wd.gain.value = 18;
    wob.connect(wd).connect(o.frequency);
    const g = a.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.035, t + 0.06);
    g.gain.exponentialRampToValueAtTime(0.0001, t + len);
    o.connect(filt(a, "bandpass", 700, 0.9)).connect(g).connect(out);
    o.start(t);
    wob.start(t);
    o.stop(t + len + 0.02);
    wob.stop(t + len + 0.02);
  },

  /**
   * A mosquito somewhere near: the thin whine of its wings, wavering in pitch
   * and loudness as it hovers and drifts, `len` seconds.
   */
  mosquito(len = 1.4) {
    const s = start();
    if (!s) return;
    const [a, t] = s;
    const out = bus(a, 1);
    const o = a.createOscillator();
    o.type = "sawtooth";
    o.frequency.value = jit(600, 0.05);
    const wob = a.createOscillator();
    wob.frequency.value = 5 + Math.random() * 3;
    const wd = a.createGain();
    wd.gain.value = 25;
    wob.connect(wd).connect(o.frequency);
    const g = a.createGain();
    g.gain.setValueAtTime(0.0001, t);
    // it comes near and drifts off again
    g.gain.exponentialRampToValueAtTime(0.012, t + len * 0.3);
    g.gain.linearRampToValueAtTime(0.02, t + len * 0.55);
    g.gain.exponentialRampToValueAtTime(0.0001, t + len);
    o.connect(filt(a, "bandpass", 1300, 1.2)).connect(g).connect(out);
    o.start(t);
    wob.start(t);
    o.stop(t + len + 0.02);
    wob.stop(t + len + 0.02);
  },

  /** A rope taking the strain: the creak of fibres slipping and catching. */
  rope(len = 0.6) {
    const s = start();
    if (!s) return;
    const [a, t] = s;
    // a drag calls this every move: one creak at a time
    if (t < ropeUntil) return;
    ropeUntil = t + len * 0.8;
    const out = bus(a, 1);
    const o = a.createOscillator();
    o.type = "sawtooth";
    o.frequency.setValueAtTime(jit(50, 0.1), t);
    o.frequency.linearRampToValueAtTime(jit(85, 0.1), t + len);
    const g = a.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.06, t + 0.08);
    g.gain.exponentialRampToValueAtTime(0.0001, t + len);
    const f1 = filt(a, "bandpass", jit(650, 0.1), 6);
    const f2 = filt(a, "bandpass", jit(1400, 0.1), 5);
    o.connect(f1).connect(g);
    o.connect(f2).connect(g);
    g.connect(out);
    o.start(t);
    o.stop(t + len + 0.02);
  },

  /** A taut string plucked: a low twang. */
  twang() {
    const s = start();
    if (!s) return;
    const [a, t] = s;
    const o = tone(a, t, 110, 0.5, 0.06, "sawtooth", 0.003);
    o.frequency.exponentialRampToValueAtTime(98, t + 0.4);
  },

  /** A pair of scissors: the blades scraping shut, then the click of the snip. */
  snip() {
    const s = start();
    if (!s) return;
    const [a, t] = s;
    const out = bus(a, 0.4);
    play(a, t, grain(a, 0.07, 5000, 0.5, 0.8, (x) => x), out, filt(a, "bandpass", 6000, 1));
    modes(a, t + 0.07, [[4200, 0.03, 0.08], [2600, 0.04, 0.06]], out, 0.05);
    burst(a, t + 0.07, 0.003, "highpass", 3000, 0.7, 0.3, out);
  },

  /** A tape measure pulled out: the case's ratchet clicking under the sliding blade. */
  tape(len = 0.5) {
    const s = start();
    if (!s) return;
    const [a, t] = s;
    // a drag calls this every move: let the pull already sounding carry on
    if (t < tapeUntil) return;
    tapeUntil = t + len * 0.8;
    const out = bus(a, 0.4);
    play(a, t, grain(a, len, 500, 0.8, 0.3, stroke(len)), bus(a, 0.05), filt(a, "bandpass", 5000, 1));
    for (let at = 0.01; at < len; at += 0.022 + Math.random() * 0.012) {
      burst(a, t + at, 0.002, "highpass", 3000, 0.7, 0.12, out);
      modes(a, t + at, [[jit(3500, 0.05), 0.01, 0.04]], out);
    }
  },

  /** A tape measure let go: the blade whirring home, faster and faster, and the clack of the hook. */
  tapeBack() {
    const s = start();
    if (!s) return;
    const [a, t] = s;
    const out = bus(a, 0.4);
    let at = 0;
    for (let gap = 0.018; at < 0.32; gap = Math.max(0.005, gap * 0.93)) {
      burst(a, t + at, 0.0015, "highpass", 3500, 0.7, 0.08, out);
      at += gap;
    }
    modes(a, t + at, [[900, 0.05, 0.2], [2100, 0.03, 0.1]], out, 0.05);
    burst(a, t + at, 0.01, "lowpass", 1500, 0.7, 0.3, out);
  },

  /** A die rolled on a table: a run of knocks, quicker and softer, then still. */
  dice(count = 1) {
    const s = start();
    if (!s) return;
    const [a, t0] = s;
    const out = bus(a, 0.5);
    for (let d = 0; d < count; d++) {
      let t = t0 + d * 0.03;
      let gap = 0.09 + Math.random() * 0.03;
      let g = 0.12;
      for (let k = 0; k < 5 + Math.floor(Math.random() * 2); k++) {
        burst(a, t, 0.004, "bandpass", 2500, 1, g, out);
        modes(a, t, [[jit(1900, 0.15), 0.02, g], [jit(3300, 0.15), 0.015, g * 0.6], [jit(180, 0.1), 0.05, g * 0.6]], out);
        t += gap;
        gap *= 0.72;
        g *= 0.7;
      }
    }
  },

  /** Shiku stepping one square: a small servo whirring, then its foot set down. */
  step() {
    const s = start();
    if (!s) return;
    const [a, t] = s;
    if (t < stepUntil) return;
    stepUntil = t + 0.09;
    const out = bus(a, 0.5);
    const o = a.createOscillator();
    o.type = "sawtooth";
    o.frequency.setValueAtTime(jit(160, 0.05), t);
    o.frequency.exponentialRampToValueAtTime(jit(240, 0.05), t + 0.11);
    const g = a.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.03, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
    o.connect(filt(a, "bandpass", 900, 2)).connect(g).connect(out);
    o.start(t);
    o.stop(t + 0.13);
    burst(a, t + 0.12, 0.005, "lowpass", 2000, 0.7, 0.2, out);
    modes(a, t + 0.12, [[jit(520, 0.08), 0.04, 0.08]], out);
  },

  /**
   * A person's footstep: a sandal set down on the ground, a soft heel thud and a
   * scuff of grit. Quiet: a scene's walking is background, like in a room.
   */
  footstep() {
    const s = start();
    if (!s) return;
    const [a, t] = s;
    if (t < footUntil) return;
    footUntil = t + 0.12;
    const out = bus(a, 0.35);
    burst(a, t, 0.03, "lowpass", jit(600, 0.2), 0.7, 0.3, out);
    modes(a, t, [[jit(120, 0.15), 0.06, 0.12]], out);
    play(a, t + 0.01, grain(a, 0.07, 1500, 0.7, 0.8, (x) => 1 - x), bus(a, 0.05), filt(a, "bandpass", jit(2500, 0.2), 0.8));
  },

  /**
   * An old machine switched on: the clack of its switch, then its little fan
   * spinning up into a steady whir with the bulb's faint hum, `len` seconds.
   */
  hum(len = 1.2) {
    const s = start();
    if (!s) return;
    const [a, t] = s;
    const out = bus(a, 0.6);
    burst(a, t, 0.004, "highpass", 2500, 0.7, 0.25, out);
    modes(a, t, [[jit(1500, 0.1), 0.02, 0.08], [jit(600, 0.1), 0.03, 0.06]], out);
    const fan = noise(a, len + 0.1);
    const band = filt(a, "bandpass", 300, 1.5);
    band.frequency.setValueAtTime(150, t + 0.05);
    band.frequency.exponentialRampToValueAtTime(420, t + 0.6);
    const g = a.createGain();
    g.gain.setValueAtTime(0.0001, t + 0.05);
    g.gain.exponentialRampToValueAtTime(0.05, t + 0.5);
    g.gain.setValueAtTime(0.05, t + len - 0.3);
    g.gain.exponentialRampToValueAtTime(0.0001, t + len);
    fan.connect(band).connect(g).connect(out);
    fan.start(t + 0.05);
    const o = a.createOscillator();
    o.frequency.value = 100;
    const og = a.createGain();
    og.gain.setValueAtTime(0.0001, t + 0.05);
    og.gain.exponentialRampToValueAtTime(0.012, t + 0.4);
    og.gain.exponentialRampToValueAtTime(0.0001, t + len);
    o.connect(og).connect(out);
    o.start(t + 0.05);
    o.stop(t + len + 0.02);
  },

  /** A small drone hovering, until stopped: the buzz of four props, slightly out of step. */
  drone(): Stop {
    const s = start();
    if (!s) return quiet;
    const [a, t] = s;
    const g = a.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.025, t + 0.4);
    const lp = filt(a, "lowpass", 1800);
    lp.connect(g).connect(a.destination);
    const src: AudioScheduledSourceNode[] = [];
    for (const f of [190, 193, 197, 201]) {
      const o = a.createOscillator();
      o.type = "sawtooth";
      o.frequency.value = f;
      o.connect(lp);
      o.start(t);
      src.push(o);
    }
    return fadeOut(a, g, src);
  },

  /** A wheel or a foot pulled out of mud: a wet smack and a few fat bubbles. */
  squelch() {
    const s = start();
    if (!s) return;
    const [a, t] = s;
    const out = bus(a, 0.5);
    burst(a, t, 0.3, "lowpass", 600, 0.7, 0.2, out);
    burst(a, t, 0.02, "bandpass", 900, 1, 0.3, out);
    for (let i = 0; i < 4; i++) bubble(a, t + Math.random() * 0.2, 90 + Math.random() * 160, 0.08 + Math.random() * 0.07, 0.08, out);
  },

  /** Nana's loom: the shuttle thrown through, and the beater knocking the thread home. */
  loom() {
    const s = start();
    if (!s) return;
    const [a, t] = s;
    const out = bus(a, 0.5);
    const { fl } = hiss(a, t, 0.12, 0.03, "bandpass", 800, 1.2, 0.05);
    fl.frequency.exponentialRampToValueAtTime(2000, t + 0.12);
    burst(a, t + 0.15, 0.006, "lowpass", 3000, 0.7, 0.3, out);
    modes(a, t + 0.15, [[420, 0.06, 0.25], [1150, 0.04, 0.12], [2300, 0.02, 0.06]], out, 0.05);
  },

  /**
   * A surveyor's chain dragged out and pulled taut, `len` seconds: steel
   * links clinking against each other, quick and uneven, then a snap as it
   * straightens.
   */
  chain(len = 0.8) {
    const s = start();
    if (!s) return;
    const [a, t0] = s;
    const out = bus(a, 0.35);
    for (let at = 0; at < len; at += 0.025 + Math.random() * 0.05) {
      const f = 3000 + Math.random() * 2500;
      modes(a, t0 + at, [[f, 0.05, 0.02 + Math.random() * 0.02], [f * 1.6, 0.03, 0.01]], out);
    }
    burst(a, t0 + len, 0.01, "bandpass", 2500, 1, 0.2, out);
    modes(a, t0 + len, [[jit(1900, 0.1), 0.12, 0.05], [jit(3300, 0.1), 0.08, 0.03]], out);
  },

  /** A bulb fusing: a small pop and a dying fizz. */
  fuse() {
    const s = start();
    if (!s) return;
    const [a, t] = s;
    const out = bus(a, 0.4);
    burst(a, t, 0.01, "bandpass", 1800, 1, 0.3, out);
    play(a, t + 0.01, grain(a, 0.3, 2500, 0.5, 0.8, (x) => (1 - x) ** 2), bus(a, 0.06), filt(a, "highpass", 2000));
  },

  /** Glass cracking: a sharp snap, a spray of tiny ticks, a thin ring. */
  crack() {
    const s = start();
    if (!s) return;
    const [a, t] = s;
    const out = bus(a, 0.4);
    burst(a, t, 0.006, "highpass", 3000, 0.7, 0.4, out);
    for (let i = 0; i < 12; i++) burst(a, t + 0.005 + Math.random() * 0.12, 0.002, "highpass", 4000 + Math.random() * 3000, 0.7, 0.05 + Math.random() * 0.1, out);
    modes(a, t, [[jit(4200, 0.1), 0.2, 0.03], [jit(6100, 0.1), 0.12, 0.015]], out);
  },

  /**
   * A wooden chest opened: the hinges creak as the lid swings up, it knocks
   * back against its stop, and whatever is inside chinks.
   */
  chest() {
    const s = start();
    if (!s) return;
    const [a, t] = s;
    const out = bus(a, 0.6);
    const o = a.createOscillator();
    o.type = "sawtooth";
    o.frequency.setValueAtTime(jit(35, 0.1), t);
    o.frequency.linearRampToValueAtTime(jit(60, 0.1), t + 0.5);
    const g = a.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.05, t + 0.1);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.55);
    o.connect(filt(a, "bandpass", jit(900, 0.1), 7)).connect(g).connect(out);
    o.start(t);
    o.stop(t + 0.56);
    modes(a, t + 0.55, [[jit(180, 0.1), 0.12, 0.25], [jit(430, 0.1), 0.06, 0.1]], out);
    burst(a, t + 0.55, 0.01, "lowpass", 2000, 0.7, 0.25, out);
    const chink = sfx.coin;
    setTimeout(() => chink(2), 700);
  },

  /** A wooden door opened: the latch clicks, the hinges creak as it swings. */
  door() {
    const s = start();
    if (!s) return;
    const [a, t] = s;
    const out = bus(a, 0.5);
    burst(a, t, 0.004, "highpass", 2500, 0.7, 0.2, out);
    modes(a, t, [[jit(1800, 0.1), 0.02, 0.08], [jit(700, 0.1), 0.04, 0.06]], out);
    const o = a.createOscillator();
    o.type = "sawtooth";
    o.frequency.setValueAtTime(jit(28, 0.1), t + 0.1);
    o.frequency.linearRampToValueAtTime(jit(48, 0.1), t + 0.8);
    const g = a.createGain();
    g.gain.setValueAtTime(0.0001, t + 0.1);
    g.gain.exponentialRampToValueAtTime(0.04, t + 0.25);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.85);
    o.connect(filt(a, "bandpass", jit(1100, 0.1), 8)).connect(g).connect(out);
    o.start(t + 0.1);
    o.stop(t + 0.9);
  },

  /** A big aluminium ডেকচি set down: a hollow metal clank that rings on a moment. */
  pot() {
    const s = start();
    if (!s) return;
    const [a, t] = s;
    const out = bus(a, 0.5);
    burst(a, t, 0.01, "lowpass", 2000, 0.7, 0.3, out);
    modes(a, t, [
      [jit(310, 0.08), 0.5, 0.1],
      [jit(740, 0.08), 0.35, 0.06],
      [jit(1270, 0.08), 0.25, 0.04],
      [jit(1900, 0.08), 0.15, 0.02],
      [jit(95, 0.1), 0.15, 0.2],
    ], out, 0.01);
  },

  /**
   * A fire lit under the pot, `len` seconds: a match struck and flaring, then
   * the wood catching, a bed of soft roar with pops and crackles.
   */
  fire(len = 2) {
    const s = start();
    if (!s) return;
    const [a, t] = s;
    const out = bus(a, 0.5);
    play(a, t, grain(a, 0.12, 3000, 0.6, 0.7, stroke(0.12)), bus(a, 0.12), filt(a, "bandpass", 3500, 1));
    const { fl } = hiss(a, t + 0.12, 0.4, 0.06, "bandpass", 900, 0.7, 0.03);
    fl.frequency.exponentialRampToValueAtTime(2200, t + 0.4);
    const roar = noise(a, len);
    const g = a.createGain();
    g.gain.setValueAtTime(0.0001, t + 0.3);
    g.gain.exponentialRampToValueAtTime(0.06, t + 0.9);
    g.gain.setValueAtTime(0.06, t + len - 0.4);
    g.gain.exponentialRampToValueAtTime(0.0001, t + len);
    roar.connect(filt(a, "lowpass", 600)).connect(g).connect(out);
    roar.start(t + 0.3);
    for (let at = 0.5; at < len - 0.1; at += 0.04 + Math.random() * 0.2) {
      burst(a, t + at, 0.004 + Math.random() * 0.006, "highpass", 1500 + Math.random() * 2500, 0.7, 0.05 + Math.random() * 0.15, out);
    }
  },

  /** A padlock snapped shut: the shackle's click and the body's small clack. */
  lock() {
    const s = start();
    if (!s) return;
    const [a, t] = s;
    const out = bus(a, 0.4);
    burst(a, t, 0.003, "highpass", 3000, 0.7, 0.3, out);
    modes(a, t, [[jit(2600, 0.1), 0.05, 0.08], [jit(4100, 0.1), 0.03, 0.04]], out);
    burst(a, t + 0.06, 0.004, "bandpass", 1800, 1, 0.2, out);
    modes(a, t + 0.06, [[jit(1200, 0.1), 0.06, 0.06]], out);
  },

  /** A paint tin's lid prised off: a metal pop and a hollow thunk. */
  lid() {
    const s = start();
    if (!s) return;
    const [a, t] = s;
    const out = bus(a, 0.5);
    burst(a, t, 0.005, "highpass", 2000, 0.7, 0.2, out);
    modes(a, t, [[1300, 0.12, 0.1], [2900, 0.08, 0.05], [4700, 0.05, 0.03]], out);
    modes(a, t, [[220, 0.08, 0.12]], out);
  },
};
