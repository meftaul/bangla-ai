"use client";

// The railway's sounds, made in the browser with Web Audio, so there are no
// audio files to ship: a two-tone horn, the brakes' hiss and squeal, and the
// ticket checker's punch.
//
// A browser plays sound only after a tap, so every sound here is started from
// one (the Continue that ends a ride, the check the reader just answered, the
// horn button). The reader can turn the automatic ones off; the horn button
// always sounds, since pressing it is asking for it. The switch also mutes the
// story's own sounds (journey/sfx.ts).

import { audio, isMuted, noise } from "@/components/journey/sfx";

// The switch is shared with the journeys' story sounds (journey/sfx.ts).
export { setSoundOn, soundOn } from "@/components/journey/sfx";

/** The diesel's two-tone horn: two reedy notes a minor third apart, swelling and cut. */
export function horn(len = 0.9, at = 0) {
  const a = audio();
  if (!a) return;
  const t = a.currentTime + at;
  const out = a.createGain();
  out.gain.setValueAtTime(0, t);
  out.gain.linearRampToValueAtTime(0.16, t + 0.06);
  out.gain.setValueAtTime(0.16, t + len - 0.12);
  out.gain.linearRampToValueAtTime(0, t + len);
  const tone = a.createBiquadFilter();
  tone.type = "lowpass";
  tone.frequency.value = 1400;
  tone.connect(out).connect(a.destination);
  for (const f of [311, 370]) {
    const o = a.createOscillator();
    o.type = "sawtooth";
    o.frequency.setValueAtTime(f * 0.97, t);
    o.frequency.linearRampToValueAtTime(f, t + 0.08);
    o.connect(tone);
    o.start(t);
    o.stop(t + len);
  }
}

/** Brakes: a hiss of air that dies away, with a thin squeal of steel on steel. */
function brakes(at = 0) {
  const a = audio();
  if (!a) return;
  const t = a.currentTime + at;
  const hiss = noise(a, 1.3);
  const band = a.createBiquadFilter();
  band.type = "bandpass";
  band.frequency.value = 2600;
  band.Q.value = 0.8;
  const g = a.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.09, t + 0.05);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 1.3);
  hiss.connect(band).connect(g).connect(a.destination);
  hiss.start(t);
  const squeal = a.createOscillator();
  squeal.frequency.setValueAtTime(1900, t);
  squeal.frequency.linearRampToValueAtTime(1500, t + 0.7);
  const sg = a.createGain();
  sg.gain.setValueAtTime(0.0001, t);
  sg.gain.exponentialRampToValueAtTime(0.025, t + 0.1);
  sg.gain.exponentialRampToValueAtTime(0.0001, t + 0.8);
  squeal.connect(sg).connect(a.destination);
  squeal.start(t);
  squeal.stop(t + 0.8);
}

/** Pulling into the platform: brakes, then two short blasts. */
export function arriveSound() {
  if (isMuted()) return;
  brakes();
  horn(0.35, 0.9);
  horn(0.55, 1.35);
}

/** The ticket checker's punch: one dry click. */
export function punchSound() {
  if (isMuted()) return;
  const a = audio();
  if (!a) return;
  const t = a.currentTime;
  const click = noise(a, 0.05);
  const hi = a.createBiquadFilter();
  hi.type = "highpass";
  hi.frequency.value = 1800;
  const g = a.createGain();
  g.gain.setValueAtTime(0.25, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
  click.connect(hi).connect(g).connect(a.destination);
  click.start(t);
}
