export type AudioFormat =
  | "mp3"
  | "wav"
  | "flac"
  | "ogg"
  | "mp4"
  | "m4a"
  | "aac"
  | "opus"
  | "webm";

export interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  year?: string;
  genre?: string;
  duration: number; // in seconds
  format: AudioFormat;
  bitrate?: string; // e.g. "320 kbps" or "Lossless"
  sampleRate?: string; // e.g. "44.1 kHz", "96 kHz", "192 kHz"
  bitDepth?: string; // e.g. "16-bit", "24-bit"
  isLossless: boolean;
  fileSize: number; // bytes
  coverArtUrl?: string; // Data URL or object URL
  accentColor?: string; // Hex extracted from cover art for Material You dynamic theming
  filePath?: string; // original folder relative path
  addedAt: number;
  syncSource: "local" | "cloud" | "sample";
  isOfflineCached?: boolean; // stored in IndexedDB for offline playing
  playCount: number;
  lastPlayedAt?: number;
  isFavorite?: boolean;
  lyrics?: string;
  blobKey?: string; // key in IndexedDB
}

export interface Playlist {
  id: string;
  name: string;
  description: string;
  coverArtUrl?: string;
  trackIds: string[];
  isSmart?: boolean;
  smartType?: "favorites" | "recent" | "lossless" | "offline" | "most_played";
  createdAt: number;
  updatedAt: number;
}

export type RepeatMode = "off" | "all" | "one";

export interface PlaybackState {
  currentTrackId: string | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number; // 0.0 - 1.0
  isMuted: boolean;
  shuffle: boolean;
  repeatMode: RepeatMode;
  crossfadeDuration: number; // in seconds (0 = gapless instantaneous, 1-10s = crossfade)
  isGaplessEnabled: boolean;
  playbackSpeed: number; // 0.5x - 2.0x
}

export interface EqualizerSettings {
  isEnabled: boolean;
  presetName: string;
  // 10 bands gains in dB (-12dB to +12dB)
  // Frequencies: [32, 64, 125, 250, 500, 1000, 2000, 4000, 8000, 16000] Hz
  bandGains: number[];
  preampGain: number; // dB (-6 to +6)
  bassBoostGain: number; // 0 to 10 (dB)
  spatializer3D: boolean; // Stereo width / 3D spatial expansion
  spatializerWidth: number; // 0.0 to 2.0
}

export interface SyncSessionState {
  isConnected: boolean;
  sessionId: string | null;
  sessionCode: string | null;
  role: "host" | "client" | null;
  hostDevice: string;
  deviceName: string;
  remoteDevicesCount: number;
  lastSyncTime: number | null;
  autoSyncLibrary: boolean;
  highQualityStreaming: boolean;
}

export type MaterialThemeMode =
  | "dynamic"
  | "pixel-blue"
  | "emerald"
  | "lavender"
  | "amber"
  | "rose"
  | "slate";

export type DarkModeSetting = "dark" | "amoled" | "light";

export interface AppSettings {
  themeMode: MaterialThemeMode;
  darkMode: DarkModeSetting;
  customAccentColor?: string;
  gaplessEnabled: boolean;
  crossfadeSeconds: number;
  audioBufferSize: number;
  highResDecoding: boolean;
  autoDownloadFavorites: boolean;
  cellularStreaming: boolean;
}
