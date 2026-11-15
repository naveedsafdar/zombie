// Tiny synthesized sound effects (no audio files needed for the MVP).
let ctx = null;
let noiseBuffer = null;

export function unlockAudio() {
  try {
    if (!ctx) {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 0.3, ctx.sampleRate);
      const data = noiseBuffer.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    }
    if (ctx.state === 'suspended') ctx.resume();
  } catch (e) {
    ctx = null;
  }
}

function envGain(start, volume, duration) {
  const g = ctx.createGain();
  g.gain.setValueAtTime(volume, start);
  g.gain.exponentialRampToValueAtTime(0.001, start + duration);
  g.connect(ctx.destination);
  return g;
}

function tone(type, fromHz, toHz, volume, duration, delay = 0) {
  if (!ctx) return;
  const t = ctx.currentTime + delay;
  const osc = ctx.createOscillator();
  osc.type = type;
  osc.frequency.setValueAtTime(fromHz, t);
  osc.frequency.exponentialRampToValueAtTime(toHz, t + duration);
  osc.connect(envGain(t, volume, duration));
  osc.start(t);
  osc.stop(t + duration);
}

export function playShot() {
  if (!ctx) return;
  const t = ctx.currentTime;
  const src = ctx.createBufferSource();
  src.buffer = noiseBuffer;
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(2200, t);
  filter.frequency.exponentialRampToValueAtTime(300, t + 0.15);
  src.connect(filter);
  filter.connect(envGain(t, 0.5, 0.16));
  src.start(t);
  src.stop(t + 0.18);
  tone('sine', 140, 40, 0.4, 0.12);
}

export function playHit() {
  tone('triangle', 220, 60, 0.25, 0.08);
}

export function playHeadshot() {
  tone('square', 900, 300, 0.12, 0.1);
  tone('triangle', 220, 50, 0.3, 0.12);
}

export function playHurt() {
  tone('sawtooth', 120, 50, 0.25, 0.25);
}

export function playReload() {
  tone('square', 700, 500, 0.08, 0.03);
  tone('square', 900, 700, 0.08, 0.03, 0.9);
}

function noiseBurst(volume, duration, fromHz, toHz, delay = 0) {
  if (!ctx) return;
  const t = ctx.currentTime + delay;
  const src = ctx.createBufferSource();
  src.buffer = noiseBuffer;
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(fromHz, t);
  filter.frequency.exponentialRampToValueAtTime(toHz, t + duration);
  src.connect(filter);
  filter.connect(envGain(t, volume, duration));
  src.start(t);
  src.stop(t + Math.min(duration, 0.29));
}

export function playUpgrade() {
  // Rising power chord + whoosh
  [262, 330, 392, 523].forEach((hz, i) => tone('square', hz, hz * 1.01, 0.08, 0.5, i * 0.07));
  tone('sawtooth', 80, 400, 0.15, 0.6);
  noiseBurst(0.35, 0.28, 4000, 200);
}

export function playGrowl() {
  tone('sawtooth', 70, 45, 0.3, 0.9);
  tone('sawtooth', 93, 60, 0.18, 0.8, 0.05);
  noiseBurst(0.15, 0.28, 600, 100);
}

export function playDoor() {
  noiseBurst(0.35, 0.2, 1500, 120);
  tone('triangle', 160, 50, 0.25, 0.15);
}

export function playExplosion() {
  noiseBurst(0.5, 0.29, 1200, 60);
  tone('sine', 90, 30, 0.45, 0.35);
}

export function playEmpty() {
  tone('square', 1200, 1100, 0.05, 0.02);
}
