// A warm, romantic looping arrangement of Pachelbel's Canon in D — the classic
// wedding piece — synthesized with the Web Audio API. Used as a fallback so music
// always plays even without a public/music.mp3 file.
// Must be created/started from a user gesture (a click) per browser policy.

const F = {
  "F#2": 92.5, "A2": 110.0, "B2": 123.47, "D3": 146.83, "E3": 164.81,
  "F#3": 185.0, "G3": 196.0, "A3": 220.0, "B3": 246.94, "D4": 293.66,
  "E4": 329.63, "F#4": 369.99, "G4": 392.0, "A4": 440.0, "B4": 493.88,
  "C#5": 554.37, "D5": 587.33, "E5": 659.25, "F#5": 739.99,
};

// Canon in D progression: D  A  Bm  F#m  G  D  G  A
// Each entry: { bass, chord arpeggio notes }. We arpeggiate the chord as gentle
// eighth notes over a sustained bass + pad.
const PROGRESSION = [
  { bass: "D3", arp: ["F#4", "A4", "D5", "A4"] },
  { bass: "A2", arp: ["E4", "A4", "C#5", "A4"] },
  { bass: "B2", arp: ["F#4", "B4", "D5", "B4"] },
  { bass: "F#2", arp: ["F#4", "A4", "C#5", "A4"] },
  { bass: "G3", arp: ["G4", "B4", "D5", "B4"] },
  { bass: "D3", arp: ["F#4", "A4", "D5", "A4"] },
  { bass: "G3", arp: ["B4", "D5", "G4", "D5"] },
  { bass: "A2", arp: ["C#5", "E5", "A4", "E5"] },
];

export function createSynthMusic() {
  let ctx = null;
  let master = null;
  let timer = null;
  let chordIndex = 0;
  let muted = false;
  const CHORD_MS = 1900; // slow, romantic
  const ARP_NOTES = 4;

  function makeReverb() {
    // Short impulse-response reverb for warmth.
    const len = ctx.sampleRate * 2.2;
    const buf = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let c = 0; c < 2; c++) {
      const data = buf.getChannelData(c);
      for (let i = 0; i < len; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.4);
      }
    }
    const conv = ctx.createConvolver();
    conv.buffer = buf;
    return conv;
  }

  function tone(freq, when, dur, type, peak, target) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, when);
    gain.gain.exponentialRampToValueAtTime(peak, when + 0.12); // soft attack
    gain.gain.exponentialRampToValueAtTime(0.0001, when + dur);
    osc.connect(gain).connect(target);
    osc.start(when);
    osc.stop(when + dur + 0.1);
  }

  function playChord() {
    if (!ctx) return;
    const { bass, arp } = PROGRESSION[chordIndex % PROGRESSION.length];
    const t0 = ctx.currentTime;
    const chordDur = CHORD_MS / 1000;
    const step = chordDur / ARP_NOTES;

    // Sustained bass + a soft pad (root + fifth-ish via two detuned sines).
    tone(F[bass], t0, chordDur * 1.05, "sine", 0.22, master);
    tone(F[bass] * 2.002, t0, chordDur * 1.05, "sine", 0.08, master);

    // Gentle arpeggio melody on top, each note overlapping for a flowing legato.
    arp.forEach((n, i) => {
      const when = t0 + i * step;
      tone(F[n], when, step * 2.4, "triangle", 0.16, master);
      tone(F[n] * 2, when, step * 1.6, "sine", 0.03, master); // airy shimmer
    });

    chordIndex += 1;
  }

  return {
    start() {
      if (ctx) return;
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      ctx = new AC();

      master = ctx.createGain();
      master.gain.value = muted ? 0 : 0.42;

      // Warmth: low-pass filter -> a touch of reverb -> output.
      const lp = ctx.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.value = 2600;
      lp.Q.value = 0.4;

      const reverb = makeReverb();
      const wet = ctx.createGain();
      wet.gain.value = 0.35;
      const dry = ctx.createGain();
      dry.gain.value = 0.85;

      master.connect(lp);
      lp.connect(dry).connect(ctx.destination);
      lp.connect(reverb).connect(wet).connect(ctx.destination);

      chordIndex = 0;
      playChord();
      timer = setInterval(playChord, CHORD_MS);
    },
    setMuted(value) {
      muted = value;
      if (master) {
        master.gain.setTargetAtTime(value ? 0 : 0.42, ctx.currentTime, 0.06);
      }
    },
    isMuted() {
      return muted;
    },
    stop() {
      if (timer) clearInterval(timer);
      timer = null;
      if (ctx) ctx.close();
      ctx = null;
    },
  };
}
