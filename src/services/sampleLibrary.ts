import { Track } from "../types/music";

/**
 * Generate a rich, polyphonic synth audio buffer as a playable WAV/audio blob
 * Creates authentic musical tracks with chord progressions, basslines, and beats
 */
export function generateSyntheticAudioTrack(
  style: "synthwave" | "ambient" | "lofi" | "cyber" | "piano",
  durationSec: number = 45
): Blob {
  const sampleRate = 44100;
  const numSamples = sampleRate * durationSec;
  const numChannels = 2; // Stereo
  const bytesPerSample = 2; // 16-bit PCM

  const buffer = new ArrayBuffer(44 + numSamples * numChannels * bytesPerSample);
  const view = new DataView(buffer);

  // WAV RIFF header
  writeString(view, 0, "RIFF");
  view.setUint32(4, 36 + numSamples * numChannels * bytesPerSample, true);
  writeString(view, 8, "WAVE");
  writeString(view, 12, "fmt ");
  view.setUint32(16, 16, true); // SubChunk1Size (16 for PCM)
  view.setUint16(20, 1, true); // AudioFormat (1 = PCM)
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numChannels * bytesPerSample, true); // ByteRate
  view.setUint16(32, numChannels * bytesPerSample, true); // BlockAlign
  view.setUint16(34, 16, true); // BitsPerSample
  writeString(view, 36, "data");
  view.setUint32(40, numSamples * numChannels * bytesPerSample, true);

  // Chord notes (frequencies in Hz)
  let chords: number[][] = [];
  let bpm = 110;

  if (style === "synthwave") {
    // Synthwave in D minor: Dm - F - C - G
    chords = [
      [146.83, 220.0, 293.66, 349.23, 440.0], // D3, A3, D4, F4, A4
      [174.61, 261.63, 349.23, 440.0, 523.25], // F3, C4, F4, A4, C5
      [130.81, 196.0, 261.63, 329.63, 392.0], // C3, G3, C4, E4, G4
      [196.0, 246.94, 293.66, 392.0, 493.88], // G3, B3, D4, G4, B4
    ];
    bpm = 118;
  } else if (style === "lofi") {
    // Lo-Fi Jazz: Cmaj7 - Am7 - Dm7 - G7
    chords = [
      [130.81, 261.63, 329.63, 392.0, 493.88], // Cmaj7
      [110.0, 220.0, 261.63, 329.63, 392.0], // Am7
      [146.83, 293.66, 349.23, 440.0, 523.25], // Dm7
      [98.0, 196.0, 246.94, 293.66, 349.23], // G7
    ];
    bpm = 82;
  } else if (style === "piano") {
    // Classical piano in A minor
    chords = [
      [110.0, 220.0, 261.63, 329.63, 440.0, 523.25],
      [130.81, 261.63, 329.63, 392.0, 523.25, 659.25],
      [146.83, 293.66, 349.23, 440.0, 587.33, 698.46],
      [164.81, 246.94, 329.63, 392.0, 493.88, 659.25],
    ];
    bpm = 95;
  } else if (style === "cyber") {
    // Cyberpunk E minor bass drive
    chords = [
      [82.41, 164.81, 246.94, 329.63, 392.0],
      [98.0, 196.0, 293.66, 392.0, 493.88],
      [73.42, 146.83, 220.0, 293.66, 440.0],
      [82.41, 123.47, 164.81, 246.94, 329.63],
    ];
    bpm = 126;
  } else {
    // Ambient Float in F major
    chords = [
      [174.61, 261.63, 349.23, 440.0, 523.25, 659.25],
      [146.83, 220.0, 293.66, 349.23, 440.0, 523.25],
      [130.81, 196.0, 261.63, 329.63, 392.0, 493.88],
      [164.81, 246.94, 329.63, 392.0, 493.88, 587.33],
    ];
    bpm = 70;
  }

  const beatLengthSec = 60 / bpm;
  const barLengthSec = beatLengthSec * 4;
  let offset = 44;

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const barIdx = Math.floor(t / barLengthSec) % chords.length;
    const chord = chords[barIdx];
    const beatPos = (t % beatLengthSec) / beatLengthSec;

    let sampleL = 0;
    let sampleR = 0;

    // 1. Pad / Chord Synthesizer
    for (let c = 0; c < chord.length; c++) {
      const freq = chord[c];
      const detune = 1.0 + (c % 2 === 0 ? 0.003 : -0.003);
      const wave = Math.sin(2 * Math.PI * freq * t) * 0.12;
      const waveDetuned = Math.sin(2 * Math.PI * (freq * detune) * t) * 0.08;

      // Stereo panning per chord voice
      const pan = (c / (chord.length - 1)) * 1.6 - 0.8;
      sampleL += (wave + waveDetuned) * (1 - pan * 0.4);
      sampleR += (wave + waveDetuned) * (1 + pan * 0.4);
    }

    // 2. Bassline (Punchy sub & saw)
    const rootFreq = chord[0] * 0.5; // sub-octave
    const bassEnv = Math.exp(-beatPos * 4);
    const bassWave = Math.sin(2 * Math.PI * rootFreq * t) * 0.35 * (0.6 + 0.4 * bassEnv);
    sampleL += bassWave;
    sampleR += bassWave;

    // 3. Drum Rhythm (Kick on 1 & 3, Snare/Clap on 2 & 4, Hi-Hat on 8ths)
    const quarterBeat = (t % (beatLengthSec * 0.5)) / (beatLengthSec * 0.5);
    const isKick = beatPos < 0.25 || (beatPos >= 0.5 && beatPos < 0.75);
    const isSnare = beatPos >= 0.25 && beatPos < 0.5;

    if (style !== "ambient") {
      // Kick drum (pitch drop sine)
      if (isKick) {
        const kickT = (t % (beatLengthSec * 0.5));
        const kickFreq = 140 * Math.exp(-kickT * 35) + 45;
        const kickEnv = Math.exp(-kickT * 18);
        const kick = Math.sin(2 * Math.PI * kickFreq * kickT) * 0.4 * kickEnv;
        sampleL += kick;
        sampleR += kick;
      }

      // Snare / Clap (Filtered noise)
      if (isSnare) {
        const snareT = (t % (beatLengthSec * 0.5));
        const snareNoise = (Math.random() * 2 - 1) * Math.exp(-snareT * 14) * 0.22;
        sampleL += snareNoise * 1.1;
        sampleR += snareNoise * 0.9;
      }

      // Hi-hats
      const hatT = quarterBeat * (beatLengthSec * 0.5);
      const hatNoise = (Math.random() * 2 - 1) * Math.exp(-hatT * 45) * 0.08;
      sampleL += hatNoise * 0.8;
      sampleR += hatNoise * 1.2;
    }

    // Master Soft Limiter / Saturation
    sampleL = Math.tanh(sampleL * 0.85);
    sampleR = Math.tanh(sampleR * 0.85);

    // Fade in and fade out
    const fadeIn = Math.min(1, t / 1.5);
    const fadeOut = Math.min(1, (durationSec - t) / 1.5);
    const masterAmp = fadeIn * fadeOut;

    const int16L = Math.max(-32767, Math.min(32767, Math.floor(sampleL * masterAmp * 32767)));
    const int16R = Math.max(-32767, Math.min(32767, Math.floor(sampleR * masterAmp * 32767)));

    view.setInt16(offset, int16L, true);
    view.setInt16(offset + 2, int16R, true);
    offset += 4;
  }

  return new Blob([buffer], { type: "audio/wav" });
}

function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

/**
 * Built-in Sample High-Fidelity Audiophile Library
 */
export const SAMPLE_TRACKS_META: Omit<Track, "blobKey">[] = [
  {
    id: "sample_neon_horizon",
    title: "Neon Horizon (Lossless FLAC Master)",
    artist: "Kavinsky Waveform & The Midnight",
    album: "Endless Sunset Hi-Res Sessions",
    year: "2026",
    genre: "Synthwave / Cyber",
    duration: 52,
    format: "flac",
    bitrate: "Lossless (1411 kbps)",
    sampleRate: "96.0 kHz",
    bitDepth: "24-bit FLAC Studio Master",
    isLossless: true,
    fileSize: 18452000,
    accentColor: "#6366f1",
    addedAt: Date.now() - 1000 * 60 * 60 * 24 * 2,
    syncSource: "sample",
    isOfflineCached: true,
    playCount: 14,
    isFavorite: true,
    lyrics: "Driving through the neon glow / Reflections in the midnight rain / High-fidelity frequencies in the air...",
    coverArtUrl:
      "data:image/svg+xml;utf8," +
      encodeURIComponent(`
        <svg xmlns="http://www.w3.org/2000/svg" width="500" height="500" viewBox="0 0 500 500">
          <defs>
            <linearGradient id="g1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#4f46e5"/>
              <stop offset="50%" stop-color="#7c3aed"/>
              <stop offset="100%" stop-color="#ec4899"/>
            </linearGradient>
            <radialGradient id="sun" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stop-color="#fbbf24"/>
              <stop offset="60%" stop-color="#f43f5e"/>
              <stop offset="100%" stop-color="#4f46e5" stop-opacity="0"/>
            </radialGradient>
          </defs>
          <rect width="500" height="500" fill="url(#g1)"/>
          <circle cx="250" cy="220" r="110" fill="url(#sun)"/>
          <g stroke="#ffffff" stroke-width="1.5" opacity="0.35">
            <line x1="0" y1="360" x2="500" y2="360"/>
            <line x1="0" y1="390" x2="500" y2="390"/>
            <line x1="0" y1="430" x2="500" y2="430"/>
            <line x1="0" y1="480" x2="500" y2="480"/>
            <line x1="250" y1="330" x2="0" y2="500"/>
            <line x1="250" y1="330" x2="100" y2="500"/>
            <line x1="250" y1="330" x2="200" y2="500"/>
            <line x1="250" y1="330" x2="300" y2="500"/>
            <line x1="250" y1="330" x2="400" y2="500"/>
            <line x1="250" y1="330" x2="500" y2="500"/>
          </g>
          <text x="250" y="460" fill="#ffffff" font-size="20" font-family="system-ui" font-weight="bold" text-anchor="middle" letter-spacing="4">NEON HORIZON</text>
        </svg>
      `),
  },
  {
    id: "sample_tokyo_rain",
    title: "Tokyo Rain Reflections",
    artist: "Lofi Blossom & Nujabes Tribute",
    album: "Late Night Coffee Sessions",
    year: "2026",
    genre: "Lo-Fi / Chillhop",
    duration: 48,
    format: "wav",
    bitrate: "1536 kbps PCM",
    sampleRate: "48.0 kHz",
    bitDepth: "24-bit PCM Uncompressed",
    isLossless: true,
    fileSize: 15120000,
    accentColor: "#10b981",
    addedAt: Date.now() - 1000 * 60 * 60 * 24 * 3,
    syncSource: "sample",
    isOfflineCached: true,
    playCount: 9,
    isFavorite: true,
    coverArtUrl:
      "data:image/svg+xml;utf8," +
      encodeURIComponent(`
        <svg xmlns="http://www.w3.org/2000/svg" width="500" height="500" viewBox="0 0 500 500">
          <defs>
            <linearGradient id="g2" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#064e3b"/>
              <stop offset="50%" stop-color="#059669"/>
              <stop offset="100%" stop-color="#10b981"/>
            </linearGradient>
          </defs>
          <rect width="500" height="500" fill="url(#g2)"/>
          <circle cx="250" cy="230" r="90" fill="#34d399" opacity="0.4"/>
          <circle cx="250" cy="230" r="50" fill="#a7f3d0" opacity="0.8"/>
          <text x="250" y="440" fill="#ffffff" font-size="22" font-family="system-ui" font-weight="bold" text-anchor="middle" letter-spacing="3">TOKYO RAIN</text>
        </svg>
      `),
  },
  {
    id: "sample_cyber_velocity",
    title: "Cyber Velocity (24-bit Hi-Res)",
    artist: "Glitch Vector x Master Circuit",
    album: "Neural Sync Protocols",
    year: "2026",
    genre: "Electronic / Cyberpunk",
    duration: 54,
    format: "ogg",
    bitrate: "320 kbps Vorbis",
    sampleRate: "48.0 kHz",
    bitDepth: "Lossless Q10",
    isLossless: false,
    fileSize: 9800000,
    accentColor: "#06b6d4",
    addedAt: Date.now() - 1000 * 60 * 60 * 12,
    syncSource: "sample",
    isOfflineCached: false,
    playCount: 22,
    isFavorite: false,
    coverArtUrl:
      "data:image/svg+xml;utf8," +
      encodeURIComponent(`
        <svg xmlns="http://www.w3.org/2000/svg" width="500" height="500" viewBox="0 0 500 500">
          <defs>
            <linearGradient id="g3" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#0f172a"/>
              <stop offset="60%" stop-color="#0891b2"/>
              <stop offset="100%" stop-color="#06b6d4"/>
            </linearGradient>
          </defs>
          <rect width="500" height="500" fill="url(#g3)"/>
          <polygon points="250,90 380,310 120,310" stroke="#38bdf8" stroke-width="4" fill="none"/>
          <polygon points="250,150 330,280 170,280" fill="#38bdf8" opacity="0.6"/>
          <text x="250" y="440" fill="#ffffff" font-size="22" font-family="system-ui" font-weight="bold" text-anchor="middle" letter-spacing="4">CYBER VELOCITY</text>
        </svg>
      `),
  },
  {
    id: "sample_nocturne_serenade",
    title: "Nocturne in D Minor (Acoustic Master)",
    artist: "Chopin & The Modern String Ensemble",
    album: "Audiophile Concert Masters Vol. 4",
    year: "2025",
    genre: "Classical / Acoustic",
    duration: 50,
    format: "mp3",
    bitrate: "320 kbps CBR",
    sampleRate: "44.1 kHz",
    bitDepth: "16-bit Master",
    isLossless: false,
    fileSize: 8400000,
    accentColor: "#f59e0b",
    addedAt: Date.now() - 1000 * 60 * 60 * 24 * 5,
    syncSource: "sample",
    isOfflineCached: true,
    playCount: 16,
    isFavorite: true,
    coverArtUrl:
      "data:image/svg+xml;utf8," +
      encodeURIComponent(`
        <svg xmlns="http://www.w3.org/2000/svg" width="500" height="500" viewBox="0 0 500 500">
          <defs>
            <linearGradient id="g4" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#451a03"/>
              <stop offset="60%" stop-color="#b45309"/>
              <stop offset="100%" stop-color="#fbbf24"/>
            </linearGradient>
          </defs>
          <rect width="500" height="500" fill="url(#g4)"/>
          <circle cx="250" cy="220" r="80" stroke="#fef3c7" stroke-width="3" fill="none"/>
          <circle cx="250" cy="220" r="50" fill="#fde68a" opacity="0.8"/>
          <text x="250" y="440" fill="#ffffff" font-size="22" font-family="system-ui" font-weight="bold" text-anchor="middle" letter-spacing="3">NOCTURNE D MINOR</text>
        </svg>
      `),
  },
  {
    id: "sample_astral_clouds",
    title: "Astral Cloud Voyage (3D Spatial)",
    artist: "Solaris Ambient Project",
    album: "Zero Gravity Meditation",
    year: "2026",
    genre: "Ambient / Space",
    duration: 55,
    format: "m4a",
    bitrate: "256 kbps AAC",
    sampleRate: "48.0 kHz",
    bitDepth: "24-bit Spatial Audio",
    isLossless: false,
    fileSize: 7200000,
    accentColor: "#ec4899",
    addedAt: Date.now() - 1000 * 60 * 60 * 24 * 1,
    syncSource: "sample",
    isOfflineCached: true,
    playCount: 31,
    isFavorite: false,
    coverArtUrl:
      "data:image/svg+xml;utf8," +
      encodeURIComponent(`
        <svg xmlns="http://www.w3.org/2000/svg" width="500" height="500" viewBox="0 0 500 500">
          <defs>
            <linearGradient id="g5" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#831843"/>
              <stop offset="60%" stop-color="#db2777"/>
              <stop offset="100%" stop-color="#f472b6"/>
            </linearGradient>
          </defs>
          <rect width="500" height="500" fill="url(#g5)"/>
          <circle cx="250" cy="230" r="100" fill="#fbcfe8" opacity="0.3"/>
          <circle cx="250" cy="230" r="60" fill="#fdf2f8" opacity="0.8"/>
          <text x="250" y="440" fill="#ffffff" font-size="22" font-family="system-ui" font-weight="bold" text-anchor="middle" letter-spacing="3">ASTRAL CLOUDS</text>
        </svg>
      `),
  },
];
