/**
 * Generate a loud, recognizable kitchen alarm WAV file.
 * Pattern: 3 short urgent beeps (800Hz) + 1 long beep (1000Hz), ~2 seconds total.
 * Run: node scripts/generate-alarm.mjs
 */
import { writeFileSync } from "fs";

const SAMPLE_RATE = 44100;
const CHANNELS = 1;
const BITS = 16;

function generateTone(freq, durationMs, volume = 0.9) {
  const samples = Math.floor(SAMPLE_RATE * durationMs / 1000);
  const buf = new Float64Array(samples);
  for (let i = 0; i < samples; i++) {
    const t = i / SAMPLE_RATE;
    // Square wave with slight rounding for less harshness
    const raw = Math.sin(2 * Math.PI * freq * t) > 0 ? 1 : -1;
    // Add harmonics for urgency
    const harmonic = Math.sin(2 * Math.PI * freq * 2 * t) * 0.3;
    // Envelope: quick attack, sustain, quick release
    const attackEnd = 0.01;
    const releaseStart = (durationMs / 1000) - 0.01;
    let env = 1;
    if (t < attackEnd) env = t / attackEnd;
    else if (t > releaseStart) env = ((durationMs / 1000) - t) / 0.01;
    buf[i] = (raw + harmonic) * volume * env;
  }
  return buf;
}

function generateSilence(durationMs) {
  return new Float64Array(Math.floor(SAMPLE_RATE * durationMs / 1000));
}

// Build the alarm pattern:
// BIP BIP BIP (short, high) - pause - BIIIP (long, higher)
const parts = [
  generateTone(880, 150, 0.95),
  generateSilence(80),
  generateTone(880, 150, 0.95),
  generateSilence(80),
  generateTone(880, 150, 0.95),
  generateSilence(120),
  generateTone(1100, 500, 0.95),
  generateSilence(300),
];

// Concatenate
const totalSamples = parts.reduce((s, p) => s + p.length, 0);
const combined = new Float64Array(totalSamples);
let offset = 0;
for (const part of parts) {
  combined.set(part, offset);
  offset += part.length;
}

// Convert to 16-bit PCM
const pcm = Buffer.alloc(totalSamples * 2);
for (let i = 0; i < totalSamples; i++) {
  const val = Math.max(-1, Math.min(1, combined[i]));
  const sample = val < 0 ? val * 32768 : val * 32767;
  pcm.writeInt16LE(Math.round(sample), i * 2);
}

// WAV header
const dataSize = pcm.length;
const header = Buffer.alloc(44);
header.write("RIFF", 0);
header.writeUInt32LE(36 + dataSize, 4);
header.write("WAVE", 8);
header.write("fmt ", 12);
header.writeUInt32LE(16, 16);
header.writeUInt16LE(1, 20); // PCM
header.writeUInt16LE(CHANNELS, 22);
header.writeUInt32LE(SAMPLE_RATE, 24);
header.writeUInt32LE(SAMPLE_RATE * CHANNELS * BITS / 8, 28);
header.writeUInt16LE(CHANNELS * BITS / 8, 32);
header.writeUInt16LE(BITS, 34);
header.write("data", 36);
header.writeUInt32LE(dataSize, 40);

const wav = Buffer.concat([header, pcm]);
writeFileSync("public/sounds/kitchen-alarm.wav", wav);
console.log(`Generated kitchen-alarm.wav (${(wav.length / 1024).toFixed(1)} KB, ${(totalSamples / SAMPLE_RATE).toFixed(2)}s)`);
