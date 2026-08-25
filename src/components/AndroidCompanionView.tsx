import React, { useState, useEffect, useRef } from "react";
import {
  Smartphone,
  Laptop,
  Cloud,
  HardDrive,
  Sliders,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Volume2,
  VolumeX,
  Radio,
  Download,
  DownloadCloud,
  Check,
  Copy,
  Code,
  FileCode,
  FolderArchive,
  QrCode,
  Sparkles,
  RefreshCw,
  Wifi,
  Battery,
  Disc3,
  ListMusic,
  Share2,
  ExternalLink,
  ChevronDown,
  Info,
  Layers,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Maximize2,
  Minimize2,
  Cast,
} from "lucide-react";
import JSZip from "jszip";
import { Track, PlaybackState, EqualizerSettings, SyncSessionState } from "../types/music";
import { ANDROID_PROJECT_FILES, AndroidProjectFile } from "../data/androidSourceCode";
import { SyncService } from "../services/syncService";

interface AndroidCompanionViewProps {
  tracks: Track[];
  currentTrack: Track | null;
  playbackState: PlaybackState;
  onPlayTrack: (track: Track) => void;
  onTogglePlayPause: () => void;
  onSeek: (seconds: number) => void;
  onNextTrack: () => void;
  onPrevTrack: () => void;
  eqSettings: EqualizerSettings;
  onUpdateEqBand: (bandIndex: number, gainDb: number) => void;
  onToggleEq: (enabled: boolean) => void;
  syncState: SyncSessionState;
  onStartHostSession: () => Promise<void>;
  onJoinClientSession: (code: string) => Promise<void>;
  onPushLibraryToCloud: () => Promise<void>;
  onDownloadAllSyncedTracks: () => Promise<void>;
  activeAccentColor: string;
  onOpenDesktopView: () => void;
}

const EQ_FREQS = ["32Hz", "64Hz", "125Hz", "250Hz", "500Hz", "1kHz", "2kHz", "4kHz", "8kHz", "16kHz"];

export const AndroidCompanionView: React.FC<AndroidCompanionViewProps> = ({
  tracks,
  currentTrack,
  playbackState,
  onPlayTrack,
  onTogglePlayPause,
  onSeek,
  onNextTrack,
  onPrevTrack,
  eqSettings,
  onUpdateEqBand,
  onToggleEq,
  syncState,
  onStartHostSession,
  onJoinClientSession,
  onPushLibraryToCloud,
  onDownloadAllSyncedTracks,
  activeAccentColor,
  onOpenDesktopView,
}) => {
  const [activeTab, setActiveTab] = useState<"app" | "source" | "pair">("app");
  const [isPhoneFrame, setIsPhoneFrame] = useState(true);
  const [mobileScreen, setMobileScreen] = useState<"player" | "library" | "eq" | "sync">("player");
  const [selectedFile, setSelectedFile] = useState<AndroidProjectFile>(ANDROID_PROJECT_FILES[0]);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isDownloadingZip, setIsDownloadingZip] = useState(false);
  const [joinCodeInput, setJoinCodeInput] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const [joinStatus, setJoinStatus] = useState<string | null>(null);
  const [mobileSearch, setMobileSearch] = useState("");
  const [outputDevice, setOutputDevice] = useState<"speaker" | "bluetooth" | "cast">("bluetooth");
  const [currentTimeDisplay, setCurrentTimeDisplay] = useState("12:45");

  // Dynamic time clock for phone status bar
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTimeDisplay(
        now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false })
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 30000);
    return () => clearInterval(timer);
  }, []);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(selectedFile.content);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyPairLink = () => {
    const url = `${window.location.origin}/?view=android${
      syncState.sessionCode ? `&code=${syncState.sessionCode}` : ""
    }`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleDownloadProjectZip = async () => {
    setIsDownloadingZip(true);
    try {
      const zip = new JSZip();

      // Add README
      zip.file(
        "README.md",
        `# SyncWave Android Hi-Fi Music Companion
Built with Jetpack Compose, Material 3, AndroidX Media3 (ExoPlayer), and Retrofit.

## How to Build & Run
1. Open this folder in **Android Studio Hedgehog / Jellyfish / Ladybug (2024+)**.
2. Sync Gradle dependencies.
3. Run on an Android device or emulator (Android 8.0+ / API 26+).
4. Enter the 6-digit sync code from the SyncWave Desktop Hub to stream lossless FLAC & WAV gaplessly!
`
      );

      // Add all project files
      ANDROID_PROJECT_FILES.forEach((f) => {
        zip.file(f.path, f.content);
      });

      // Generate zip blob
      const content = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(content);
      const a = document.createElement("a");
      a.href = url;
      a.download = "SyncWave-Android-Studio-Project.zip";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Failed to generate zip", e);
    } finally {
      setIsDownloadingZip(false);
    }
  };

  const handleMobileJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCodeInput.trim()) return;
    setIsJoining(true);
    setJoinStatus(null);
    try {
      await onJoinClientSession(joinCodeInput.trim().toUpperCase());
      setJoinStatus("Connected to Desktop Hub!");
      setTimeout(() => setMobileScreen("player"), 1000);
    } catch (err: any) {
      setJoinStatus(err.message || "Failed to pair");
    } finally {
      setIsJoining(false);
    }
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return "0:00";
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const filteredTracks = tracks.filter(
    (t) =>
      t.title.toLowerCase().includes(mobileSearch.toLowerCase()) ||
      t.artist.toLowerCase().includes(mobileSearch.toLowerCase()) ||
      t.album.toLowerCase().includes(mobileSearch.toLowerCase())
  );

  return (
    <div
      id="android-companion-hub"
      className="flex-1 flex flex-col min-h-0 overflow-y-auto px-4 sm:px-8 py-6 max-w-7xl mx-auto w-full space-y-6 animate-in fade-in duration-300"
    >
      {/* Top Banner & Tab Controls */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-6 rounded-3xl bg-[#1C1B1F] border border-[#49454F]/40 shadow-xl">
        <div className="flex items-center gap-4">
          <div
            className="p-3.5 rounded-2xl shadow-md text-[#381E72]"
            style={{ backgroundColor: activeAccentColor }}
          >
            <Smartphone className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-[#E6E1E5] tracking-tight">
                SyncWave for Android
              </h1>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Jetpack Compose & Media3
              </span>
            </div>
            <p className="text-xs text-[#CAC4D0] mt-0.5">
              Material You lossless streaming companion, real-time desktop sync & Android Studio source code
            </p>
          </div>
        </div>

        {/* Mode Selector Tabs */}
        <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-[#2B2930] border border-[#49454F]/40 w-full md:w-auto">
          <button
            id="tab-android-app"
            onClick={() => setActiveTab("app")}
            className={`flex-1 md:flex-initial flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === "app"
                ? "bg-[#D0BCFF] text-[#381E72] shadow-sm"
                : "text-[#CAC4D0] hover:text-[#E6E1E5]"
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>Interactive Android App</span>
          </button>
          <button
            id="tab-android-source"
            onClick={() => setActiveTab("source")}
            className={`flex-1 md:flex-initial flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === "source"
                ? "bg-[#D0BCFF] text-[#381E72] shadow-sm"
                : "text-[#CAC4D0] hover:text-[#E6E1E5]"
            }`}
          >
            <Code className="w-4 h-4" />
            <span>Kotlin & Media3 Source</span>
          </button>
          <button
            id="tab-android-pair"
            onClick={() => setActiveTab("pair")}
            className={`flex-1 md:flex-initial flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === "pair"
                ? "bg-[#D0BCFF] text-[#381E72] shadow-sm"
                : "text-[#CAC4D0] hover:text-[#E6E1E5]"
            }`}
          >
            <QrCode className="w-4 h-4" />
            <span>Install on Real Phone</span>
          </button>
        </div>
      </div>

      {/* TAB 1: INTERACTIVE ANDROID COMPANION APP */}
      {activeTab === "app" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Android Phone Simulator UI */}
          <div className="lg:col-span-6 flex flex-col items-center justify-center">
            {/* Phone Display Toolbar */}
            <div className="flex items-center justify-between w-full max-w-sm mb-3 text-xs text-[#CAC4D0]">
              <span className="font-semibold text-[#EADDFF]">Google Pixel 8 Pro &bull; Android 15</span>
              <button
                onClick={() => setIsPhoneFrame(!isPhoneFrame)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#2B2930] hover:bg-[#36343B] text-[#E6E1E5] border border-[#49454F]/30"
              >
                {isPhoneFrame ? <Maximize2 className="w-3 h-3" /> : <Minimize2 className="w-3 h-3" />}
                <span>{isPhoneFrame ? "Expand View" : "Phone Frame"}</span>
              </button>
            </div>

            {/* Android Device Shell */}
            <div
              className={`w-full max-w-[390px] rounded-[48px] overflow-hidden transition-all duration-300 shadow-2xl border ${
                isPhoneFrame
                  ? "bg-[#1C1B1F] border-[#49454F]/80 p-3 ring-8 ring-[#121212] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)]"
                  : "bg-[#1C1B1F] border-[#49454F]/40 p-0"
              }`}
            >
              {/* Phone Screen Canvas */}
              <div className="relative bg-[#121212] rounded-[38px] overflow-hidden flex flex-col h-[740px] text-[#E6E1E5] border border-[#49454F]/30 select-none">
                {/* 1. Android Top Status Bar */}
                <div className="h-9 px-6 pt-2 flex items-center justify-between text-[11px] font-bold text-[#E6E1E5] bg-[#1C1B1F]/60 backdrop-blur-sm z-30">
                  <span>{currentTimeDisplay}</span>
                  {/* Camera Cutout (Punch-Hole) */}
                  <div className="w-3.5 h-3.5 rounded-full bg-black border border-[#2B2930] shadow-inner" />
                  <div className="flex items-center gap-1.5 text-xs text-[#CAC4D0]">
                    <Wifi className="w-3 h-3" />
                    <span className="text-[10px] font-mono">5G</span>
                    <Battery className="w-3.5 h-3.5" />
                  </div>
                </div>

                {/* 2. Android Dynamic App Bar */}
                <div className="px-5 py-2.5 flex items-center justify-between bg-[#1C1B1F]/90 border-b border-[#49454F]/20">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-6 h-6 rounded-lg flex items-center justify-center text-[#381E72]"
                      style={{ backgroundColor: activeAccentColor }}
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-xs font-black tracking-tight text-[#E6E1E5]">
                      SyncWave Mobile
                    </span>
                  </div>

                  {/* Sync Status Badge */}
                  <button
                    onClick={() => setMobileScreen("sync")}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border transition-colors ${
                      syncState.isConnected
                        ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                        : "bg-[#2B2930] text-[#D0BCFF] border-[#49454F]/40"
                    }`}
                  >
                    <Cloud className="w-3 h-3" />
                    <span>{syncState.isConnected ? "Synced" : "Pair Host"}</span>
                  </button>
                </div>

                {/* 3. Dynamic Phone Body Screen Views */}
                <div className="flex-1 overflow-y-auto p-4 flex flex-col justify-between">
                  {/* SUB-VIEW A: NOW PLAYING */}
                  {mobileScreen === "player" && (
                    <div className="flex-1 flex flex-col justify-between space-y-3 animate-in fade-in">
                      {/* Lossless & Output Router Card */}
                      <div className="flex items-center justify-between text-[11px] p-2 rounded-2xl bg-[#1C1B1F] border border-[#49454F]/30">
                        <div className="flex items-center gap-1.5 text-[#CAC4D0]">
                          <Cast className="w-3.5 h-3.5 text-[#D0BCFF]" />
                          <span>Output:</span>
                          <span className="font-bold text-[#EADDFF]">
                            {outputDevice === "bluetooth"
                              ? "Pixel Buds Pro"
                              : outputDevice === "cast"
                              ? "Living Room Hi-Fi"
                              : "Phone Speaker"}
                          </span>
                        </div>
                        {currentTrack?.isLossless && (
                          <span className="font-mono font-bold text-[9px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300">
                            FLAC 24/96
                          </span>
                        )}
                      </div>

                      {/* Cover Art Box with Dynamic Glow */}
                      <div className="relative aspect-square w-full rounded-3xl overflow-hidden bg-[#1C1B1F] border border-[#49454F]/40 shadow-xl flex items-center justify-center my-1 group">
                        {currentTrack?.coverArtUrl ? (
                          <img
                            src={currentTrack.coverArtUrl}
                            alt={currentTrack.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div
                            className="w-full h-full flex items-center justify-center"
                            style={{ backgroundColor: activeAccentColor, color: "#381E72" }}
                          >
                            <Disc3 className={`w-20 h-20 ${playbackState.isPlaying ? "animate-spin" : ""}`} />
                          </div>
                        )}

                        {/* Stream Relay Badge */}
                        <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-black/70 backdrop-blur-md text-[10px] font-mono text-[#D0BCFF] border border-white/10">
                          {syncState.isConnected ? "Wi-Fi Direct" : "Local Engine"}
                        </div>
                      </div>

                      {/* Track Meta & Favorite */}
                      <div className="flex items-center justify-between">
                        <div className="min-w-0 flex-1 pr-2">
                          <h3 className="text-base font-bold text-[#E6E1E5] truncate">
                            {currentTrack?.title || "Select a Track"}
                          </h3>
                          <p className="text-xs text-[#CAC4D0] truncate">
                            {currentTrack?.artist || "SyncWave Android Client"}
                          </p>
                        </div>
                        <button
                          onClick={() => setMobileScreen("eq")}
                          className="p-2 rounded-xl bg-[#2B2930] text-[#D0BCFF] border border-[#49454F]/30 hover:scale-105 transition-transform"
                          title="Android 10-Band EQ"
                        >
                          <Sliders className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Android 14 Squiggly Progress Waveform */}
                      <div className="space-y-1">
                        <input
                          type="range"
                          min="0"
                          max={playbackState.duration || 100}
                          value={playbackState.currentTime || 0}
                          onChange={(e) => onSeek(parseFloat(e.target.value))}
                          className="w-full h-2 bg-[#2B2930] rounded-full accent-[#D0BCFF] cursor-pointer"
                        />
                        <div className="flex items-center justify-between text-[10px] font-mono text-[#938F99]">
                          <span>{formatTime(playbackState.currentTime)}</span>
                          <span>{formatTime(playbackState.duration)}</span>
                        </div>
                      </div>

                      {/* Android Playback Action Pad */}
                      <div className="flex items-center justify-between px-2 pt-1">
                        <button
                          onClick={onPrevTrack}
                          className="p-3 rounded-full hover:bg-[#2B2930] text-[#CAC4D0] hover:text-[#E6E1E5] transition-colors"
                        >
                          <SkipBack className="w-5 h-5 fill-current" />
                        </button>

                        <button
                          onClick={onTogglePlayPause}
                          className="p-4 rounded-full shadow-lg transition-transform hover:scale-105 active:scale-95 flex items-center justify-center text-[#381E72]"
                          style={{ backgroundColor: activeAccentColor }}
                        >
                          {playbackState.isPlaying ? (
                            <Pause className="w-6 h-6 fill-current" />
                          ) : (
                            <Play className="w-6 h-6 fill-current ml-0.5" />
                          )}
                        </button>

                        <button
                          onClick={onNextTrack}
                          className="p-3 rounded-full hover:bg-[#2B2930] text-[#CAC4D0] hover:text-[#E6E1E5] transition-colors"
                        >
                          <SkipForward className="w-5 h-5 fill-current" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* SUB-VIEW B: MOBILE LIBRARY */}
                  {mobileScreen === "library" && (
                    <div className="flex-1 flex flex-col space-y-3 animate-in fade-in">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#E6E1E5]">
                          Phone Library ({tracks.length} Songs)
                        </span>
                        <span className="text-[10px] font-mono text-emerald-400">
                          {tracks.filter((t) => t.isOfflineCached).length} Saved Offline
                        </span>
                      </div>

                      <input
                        type="text"
                        value={mobileSearch}
                        onChange={(e) => setMobileSearch(e.target.value)}
                        placeholder="Search song, artist, album..."
                        className="w-full px-3 py-2 text-xs rounded-xl bg-[#1C1B1F] border border-[#49454F]/50 text-[#E6E1E5] placeholder-[#938F99] focus:outline-none focus:border-[#D0BCFF]"
                      />

                      <div className="flex-1 overflow-y-auto space-y-1.5 max-h-[460px] pr-1">
                        {filteredTracks.map((t) => (
                          <div
                            key={t.id}
                            onClick={() => {
                              onPlayTrack(t);
                              setMobileScreen("player");
                            }}
                            className={`p-2.5 rounded-2xl border transition-all flex items-center justify-between cursor-pointer ${
                              currentTrack?.id === t.id
                                ? "bg-[#2B2930] border-[#D0BCFF] text-[#E6E1E5]"
                                : "bg-[#1C1B1F] hover:bg-[#2B2930]/70 border-[#49454F]/20 text-[#CAC4D0]"
                            }`}
                          >
                            <div className="min-w-0 flex-1 pr-2">
                              <p className="text-xs font-bold truncate text-[#E6E1E5]">{t.title}</p>
                              <p className="text-[10px] text-[#938F99] truncate">
                                {t.artist} &bull; {t.format.toUpperCase()}
                              </p>
                            </div>
                            <div className="flex items-center gap-1">
                              {t.isLossless && (
                                <span className="text-[9px] font-bold text-amber-300 font-mono">
                                  FLAC
                                </span>
                              )}
                              <Play className="w-3.5 h-3.5 text-[#D0BCFF] fill-current ml-1" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* SUB-VIEW C: MOBILE 10-BAND EQUALIZER */}
                  {mobileScreen === "eq" && (
                    <div className="flex-1 flex flex-col space-y-3 animate-in fade-in">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-xs font-bold text-[#E6E1E5]">Android 10-Band DSP</h4>
                          <p className="text-[10px] text-[#938F99]">DynamicsProcessing & Biquad API</p>
                        </div>
                        <button
                          onClick={() => onToggleEq(!eqSettings.isEnabled)}
                          className={`px-3 py-1 rounded-full text-[10px] font-bold border transition-colors ${
                            eqSettings.isEnabled
                              ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                              : "bg-[#2B2930] text-[#938F99] border-[#49454F]/30"
                          }`}
                        >
                          {eqSettings.isEnabled ? "DSP Active" : "Bypassed"}
                        </button>
                      </div>

                      {/* Slider Grid */}
                      <div className="p-3 rounded-2xl bg-[#1C1B1F] border border-[#49454F]/30 space-y-2">
                        <div className="grid grid-cols-5 gap-2 text-center text-[9px] font-mono">
                          {EQ_FREQS.slice(0, 5).map((freq, idx) => {
                            const gain = eqSettings.bandGains[idx] || 0;
                            return (
                              <div key={freq} className="space-y-1">
                                <span className="text-[#938F99] block">{freq}</span>
                                <input
                                  type="range"
                                  min="-12"
                                  max="12"
                                  step="1"
                                  value={gain}
                                  onChange={(e) => onUpdateEqBand(idx, parseFloat(e.target.value))}
                                  className="w-full h-1.5 bg-[#2B2930] rounded-full accent-[#D0BCFF]"
                                />
                                <span className="text-[#EADDFF] font-bold">
                                  {gain > 0 ? `+${gain}` : gain}dB
                                </span>
                              </div>
                            );
                          })}
                        </div>
                        <div className="grid grid-cols-5 gap-2 text-center text-[9px] font-mono pt-1">
                          {EQ_FREQS.slice(5, 10).map((freq, idx) => {
                            const actualIdx = idx + 5;
                            const gain = eqSettings.bandGains[actualIdx] || 0;
                            return (
                              <div key={freq} className="space-y-1">
                                <span className="text-[#938F99] block">{freq}</span>
                                <input
                                  type="range"
                                  min="-12"
                                  max="12"
                                  step="1"
                                  value={gain}
                                  onChange={(e) =>
                                    onUpdateEqBand(actualIdx, parseFloat(e.target.value))
                                  }
                                  className="w-full h-1.5 bg-[#2B2930] rounded-full accent-[#D0BCFF]"
                                />
                                <span className="text-[#EADDFF] font-bold">
                                  {gain > 0 ? `+${gain}` : gain}dB
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <button
                        onClick={() => setMobileScreen("player")}
                        className="w-full py-2 rounded-xl text-xs font-bold text-[#381E72] bg-[#D0BCFF]"
                      >
                        Apply & Return to Player
                      </button>
                    </div>
                  )}

                  {/* SUB-VIEW D: PHONE SYNC & PAIRING */}
                  {mobileScreen === "sync" && (
                    <div className="flex-1 flex flex-col space-y-3 animate-in fade-in">
                      <div className="text-center space-y-1">
                        <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center">
                          <Cloud className="w-5 h-5" />
                        </div>
                        <h4 className="text-xs font-bold text-[#E6E1E5]">Sync with Desktop Computer</h4>
                        <p className="text-[10px] text-[#938F99]">
                          Connect to your PC to stream FLAC tracks & sync offline library
                        </p>
                      </div>

                      {syncState.isConnected ? (
                        <div className="p-3.5 rounded-2xl bg-[#1C1B1F] border border-emerald-500/30 space-y-2.5">
                          <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Paired to: {syncState.hostDevice || "Desktop Host"}</span>
                          </div>
                          <p className="text-[10px] text-[#CAC4D0]">
                            Session Code: <span className="font-mono font-bold text-[#EADDFF]">{syncState.sessionCode}</span>
                          </p>
                          <button
                            onClick={onDownloadAllSyncedTracks}
                            className="w-full py-2 rounded-xl text-[11px] font-bold text-[#381E72] bg-[#D0BCFF] shadow-sm flex items-center justify-center gap-1.5"
                          >
                            <DownloadCloud className="w-3.5 h-3.5" />
                            <span>Download Library to Phone Storage</span>
                          </button>
                        </div>
                      ) : (
                        <form onSubmit={handleMobileJoin} className="space-y-2">
                          <input
                            type="text"
                            value={joinCodeInput}
                            onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
                            placeholder="Enter 6-Digit Pair Code"
                            maxLength={10}
                            className="w-full px-3 py-2 text-center font-mono font-bold tracking-widest text-xs rounded-xl bg-[#1C1B1F] border border-[#49454F]/60 text-[#E6E1E5] placeholder-[#938F99] focus:outline-none focus:border-[#D0BCFF]"
                          />
                          <button
                            type="submit"
                            disabled={isJoining || !joinCodeInput.trim()}
                            className="w-full py-2 rounded-xl text-xs font-bold bg-[#D0BCFF] text-[#381E72] hover:bg-[#EADDFF] disabled:opacity-50 transition-colors"
                          >
                            {isJoining ? "Pairing..." : "Connect to Desktop Hub"}
                          </button>
                          {joinStatus && (
                            <p className="text-[10px] text-center text-[#EADDFF]">{joinStatus}</p>
                          )}
                        </form>
                      )}

                      <button
                        onClick={() => setMobileScreen("player")}
                        className="w-full py-2 rounded-xl text-xs font-semibold text-[#CAC4D0] bg-[#2B2930] hover:bg-[#36343B]"
                      >
                        Back to Player
                      </button>
                    </div>
                  )}
                </div>

                {/* 4. Android Bottom Navigation Bar (Material 3) */}
                <div className="h-16 px-4 flex items-center justify-around bg-[#1C1B1F]/95 border-t border-[#49454F]/30 z-20">
                  <button
                    onClick={() => setMobileScreen("player")}
                    className={`flex flex-col items-center gap-1 py-1 px-3 rounded-2xl transition-all ${
                      mobileScreen === "player"
                        ? "text-[#381E72] bg-[#D0BCFF] font-bold"
                        : "text-[#CAC4D0] hover:text-[#E6E1E5]"
                    }`}
                  >
                    <Disc3 className="w-4 h-4" />
                    <span className="text-[10px]">Player</span>
                  </button>

                  <button
                    onClick={() => setMobileScreen("library")}
                    className={`flex flex-col items-center gap-1 py-1 px-3 rounded-2xl transition-all ${
                      mobileScreen === "library"
                        ? "text-[#381E72] bg-[#D0BCFF] font-bold"
                        : "text-[#CAC4D0] hover:text-[#E6E1E5]"
                    }`}
                  >
                    <ListMusic className="w-4 h-4" />
                    <span className="text-[10px]">Tracks</span>
                  </button>

                  <button
                    onClick={() => setMobileScreen("eq")}
                    className={`flex flex-col items-center gap-1 py-1 px-3 rounded-2xl transition-all ${
                      mobileScreen === "eq"
                        ? "text-[#381E72] bg-[#D0BCFF] font-bold"
                        : "text-[#CAC4D0] hover:text-[#E6E1E5]"
                    }`}
                  >
                    <Sliders className="w-4 h-4" />
                    <span className="text-[10px]">DSP EQ</span>
                  </button>

                  <button
                    onClick={() => setMobileScreen("sync")}
                    className={`flex flex-col items-center gap-1 py-1 px-3 rounded-2xl transition-all ${
                      mobileScreen === "sync"
                        ? "text-[#381E72] bg-[#D0BCFF] font-bold"
                        : "text-[#CAC4D0] hover:text-[#E6E1E5]"
                    }`}
                  >
                    <Cloud className="w-4 h-4" />
                    <span className="text-[10px]">Sync</span>
                  </button>
                </div>

                {/* 5. Android Gesture Pill Bar */}
                <div className="h-4 flex items-center justify-center bg-[#1C1B1F]/95">
                  <div className="w-24 h-1 rounded-full bg-white/30" />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Android Features, Live Sync Controller & Notification Simulation */}
          <div className="lg:col-span-6 space-y-4">
            {/* Android 14 Media Notification Simulation Card */}
            <div className="p-5 rounded-3xl bg-[#1C1B1F] border border-[#49454F]/40 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-[#E6E1E5] flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4 text-[#D0BCFF]" />
                  <span>Android 14/15 Lockscreen & Notification Widget</span>
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#2B2930] text-[#CAC4D0]">
                  MediaSession API
                </span>
              </div>

              {/* Notification Card */}
              <div className="p-4 rounded-2xl bg-[#2B2930] border border-[#49454F]/30 space-y-3 shadow-md">
                <div className="flex items-center justify-between text-[11px] text-[#CAC4D0]">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-[#D0BCFF]" />
                    <span className="font-bold text-[#E6E1E5]">SyncWave Audio</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono">Pixel Buds Pro</span>
                    <Cast className="w-3.5 h-3.5 text-[#D0BCFF]" />
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl overflow-hidden bg-[#1C1B1F] shrink-0 border border-[#49454F]/30">
                    {currentTrack?.coverArtUrl ? (
                      <img
                        src={currentTrack.coverArtUrl}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[#D0BCFF]">
                        <Disc3 className="w-6 h-6" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-[#E6E1E5] truncate">
                      {currentTrack?.title || "No Track Active"}
                    </p>
                    <p className="text-[11px] text-[#CAC4D0] truncate">
                      {currentTrack?.artist || "SyncWave Android Player"}
                    </p>
                  </div>
                  <button
                    onClick={onTogglePlayPause}
                    className="p-3 rounded-full bg-[#D0BCFF] text-[#381E72] hover:scale-105 transition-transform shrink-0"
                  >
                    {playbackState.isPlaying ? (
                      <Pause className="w-4 h-4 fill-current" />
                    ) : (
                      <Play className="w-4 h-4 fill-current ml-0.5" />
                    )}
                  </button>
                </div>

                {/* Squiggly Bar */}
                <div className="space-y-1">
                  <div className="w-full h-1.5 rounded-full bg-[#1C1B1F] overflow-hidden">
                    <div
                      className="h-full bg-[#D0BCFF] rounded-full transition-all"
                      style={{
                        width: `${
                          playbackState.duration > 0
                            ? (playbackState.currentTime / playbackState.duration) * 100
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[10px] font-mono text-[#938F99]">
                    <span>{formatTime(playbackState.currentTime)}</span>
                    <span>{formatTime(playbackState.duration)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Desktop-to-Phone Sync Command Center */}
            <div className="p-5 rounded-3xl bg-[#1C1B1F] border border-[#49454F]/40 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-[#E6E1E5]">
                    Desktop &harr; Android Synchronization
                  </h3>
                  <p className="text-xs text-[#938F99]">
                    Real-time bidirectional peer control between your PC and phone
                  </p>
                </div>
                <button
                  onClick={onStartHostSession}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-[#381E72] bg-[#D0BCFF] hover:bg-[#EADDFF] transition-colors"
                >
                  Generate Pair Code
                </button>
              </div>

              {syncState.sessionCode && (
                <div className="p-4 rounded-2xl bg-[#2B2930] border border-[#49454F]/40 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-[#938F99] block">Your Desktop 6-Digit Pair Code:</span>
                    <span className="text-2xl font-mono font-black text-[#EADDFF] tracking-widest">
                      {syncState.sessionCode}
                    </span>
                  </div>

                  <button
                    onClick={handleCopyPairLink}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1C1B1F] hover:bg-[#36343B] text-xs font-semibold text-[#E6E1E5] border border-[#49454F]/40 transition-colors"
                  >
                    {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-[#D0BCFF]" />}
                    <span>{copiedLink ? "Copied Link!" : "Copy URL"}</span>
                  </button>
                </div>
              )}

              {/* Sync Features Grid */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-2xl bg-[#2B2930] border border-[#49454F]/30 space-y-1">
                  <span className="text-[#938F99] block">Lossless FLAC Stream</span>
                  <span className="font-bold text-emerald-400 flex items-center gap-1">
                    <Wifi className="w-3.5 h-3.5" />
                    HTTP 206 Partial Chunking
                  </span>
                </div>
                <div className="p-3 rounded-2xl bg-[#2B2930] border border-[#49454F]/30 space-y-1">
                  <span className="text-[#938F99] block">Offline Phone Cache</span>
                  <span className="font-bold text-[#EADDFF] flex items-center gap-1">
                    <HardDrive className="w-3.5 h-3.5 text-[#D0BCFF]" />
                    IndexedDB / Room Sync
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => setActiveTab("source")}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-[#2B2930] hover:bg-[#36343B] text-xs font-bold text-[#E6E1E5] border border-[#49454F]/40 transition-colors"
              >
                <Code className="w-4 h-4 text-[#D0BCFF]" />
                <span>View Kotlin / Android Source Code</span>
              </button>
              <button
                onClick={onOpenDesktopView}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-[#2B2930] hover:bg-[#36343B] text-xs font-bold text-[#E6E1E5] border border-[#49454F]/40 transition-colors"
              >
                <Laptop className="w-4 h-4 text-[#D0BCFF]" />
                <span>Switch to Desktop View</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: NATIVE ANDROID STUDIO KOTLIN SOURCE CODE */}
      {activeTab === "source" && (
        <div className="space-y-4 animate-in fade-in">
          {/* Header & Download Button */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-3xl bg-[#1C1B1F] border border-[#49454F]/40">
            <div>
              <h2 className="text-base font-bold text-[#E6E1E5]">
                Native Android Studio Project Files (Kotlin & Jetpack Compose)
              </h2>
              <p className="text-xs text-[#938F99]">
                Complete production codebase with Media3 ExoPlayer, Foreground Playback Service, and Retrofit Sync
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyCode}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#2B2930] hover:bg-[#36343B] text-xs font-bold text-[#E6E1E5] border border-[#49454F]/40 transition-colors"
              >
                {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-[#D0BCFF]" />}
                <span>{copiedCode ? "Copied!" : "Copy Code"}</span>
              </button>

              <button
                id="btn-download-android-zip"
                onClick={handleDownloadProjectZip}
                disabled={isDownloadingZip}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-[#381E72] bg-[#D0BCFF] hover:bg-[#EADDFF] shadow-md transition-all"
              >
                <FolderArchive className="w-4 h-4" />
                <span>{isDownloadingZip ? "Building ZIP..." : "Download Android Studio Project (.zip)"}</span>
              </button>
            </div>
          </div>

          {/* Project File Tree & Code Viewer */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* File List */}
            <div className="lg:col-span-4 p-4 rounded-3xl bg-[#1C1B1F] border border-[#49454F]/40 space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#938F99] px-2 block">
                Project Files ({ANDROID_PROJECT_FILES.length})
              </span>
              <div className="space-y-1">
                {ANDROID_PROJECT_FILES.map((file) => (
                  <button
                    key={file.path}
                    onClick={() => setSelectedFile(file)}
                    className={`w-full text-left p-2.5 rounded-2xl text-xs transition-all flex items-center justify-between ${
                      selectedFile.path === file.path
                        ? "bg-[#2B2930] text-[#EADDFF] font-bold border border-[#D0BCFF]/50 shadow-sm"
                        : "hover:bg-[#2B2930]/60 text-[#CAC4D0]"
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <FileCode className="w-4 h-4 text-[#D0BCFF] shrink-0" />
                      <span className="truncate">{file.name}</span>
                    </div>
                    <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-[#1C1B1F] text-[#938F99]">
                      {file.category}
                    </span>
                  </button>
                ))}
              </div>

              {/* Build Instructions Card */}
              <div className="mt-4 p-3.5 rounded-2xl bg-[#2B2930] border border-[#49454F]/30 text-xs space-y-1.5">
                <span className="font-bold text-[#E6E1E5] block">Quick Build Guide:</span>
                <ol className="list-decimal list-inside text-[11px] text-[#CAC4D0] space-y-1">
                  <li>Download the project .zip above</li>
                  <li>Open folder in Android Studio</li>
                  <li>Click <span className="font-mono text-[#D0BCFF]">Run &gt; Run 'app'</span></li>
                  <li>Enter 6-digit sync code to stream</li>
                </ol>
              </div>
            </div>

            {/* Code Display Area */}
            <div className="lg:col-span-8 p-4 rounded-3xl bg-[#1C1B1F] border border-[#49454F]/40 space-y-2 flex flex-col">
              <div className="flex items-center justify-between pb-2 border-b border-[#49454F]/30 text-xs">
                <div className="flex items-center gap-2">
                  <FileCode className="w-4 h-4 text-[#D0BCFF]" />
                  <span className="font-mono font-bold text-[#EADDFF]">{selectedFile.path}</span>
                </div>
                <span className="text-[11px] text-[#938F99]">{selectedFile.description}</span>
              </div>

              <pre className="flex-1 overflow-x-auto p-4 rounded-2xl bg-[#121212] border border-[#49454F]/30 text-xs font-mono text-[#E6E1E5] leading-relaxed max-h-[560px]">
                <code>{selectedFile.content}</code>
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: INSTALL ON REAL PHONE VIA PWA & QR CODE */}
      {activeTab === "pair" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in">
          {/* QR Code & Direct Pairing Card */}
          <div className="p-6 rounded-3xl bg-[#1C1B1F] border border-[#49454F]/40 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-[#2B2930] text-[#D0BCFF]">
                <QrCode className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#E6E1E5]">
                  Scan to Open on Real Android Phone
                </h3>
                <p className="text-xs text-[#938F99]">
                  Point your phone's camera at this code to launch the web client
                </p>
              </div>
            </div>

            {/* Simulated Dynamic High-Contrast QR Code */}
            <div className="p-6 rounded-3xl bg-white flex flex-col items-center justify-center space-y-2 shadow-xl mx-auto max-w-xs">
              <div className="w-48 h-48 bg-white flex items-center justify-center p-2 border-4 border-black rounded-2xl relative">
                {/* SVG QR Code Pattern */}
                <svg viewBox="0 0 100 100" className="w-full h-full text-black fill-current">
                  <rect x="5" y="5" width="25" height="25" fill="none" stroke="black" strokeWidth="4" />
                  <rect x="12" y="12" width="11" height="11" />
                  <rect x="70" y="5" width="25" height="25" fill="none" stroke="black" strokeWidth="4" />
                  <rect x="77" y="12" width="11" height="11" />
                  <rect x="5" y="70" width="25" height="25" fill="none" stroke="black" strokeWidth="4" />
                  <rect x="12" y="77" width="11" height="11" />
                  {/* Dense data matrix pattern */}
                  <rect x="35" y="10" width="8" height="8" />
                  <rect x="50" y="10" width="8" height="8" />
                  <rect x="40" y="25" width="8" height="8" />
                  <rect x="55" y="25" width="8" height="8" />
                  <rect x="10" y="40" width="8" height="8" />
                  <rect x="25" y="40" width="8" height="8" />
                  <rect x="40" y="40" width="20" height="20" />
                  <rect x="70" y="40" width="8" height="8" />
                  <rect x="85" y="40" width="8" height="8" />
                  <rect x="35" y="70" width="8" height="8" />
                  <rect x="50" y="70" width="8" height="8" />
                  <rect x="40" y="85" width="8" height="8" />
                  <rect x="70" y="75" width="15" height="15" />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-8 h-8 rounded-full bg-[#1C1B1F] border-2 border-white flex items-center justify-center text-[#D0BCFF]">
                    <Sparkles className="w-4 h-4" />
                  </div>
                </div>
              </div>
              <span className="text-[11px] font-mono text-zinc-900 font-bold">
                {window.location.host}
              </span>
            </div>

            <div className="space-y-2">
              <button
                onClick={handleCopyPairLink}
                className="w-full py-3 rounded-2xl text-xs font-bold text-[#381E72] bg-[#D0BCFF] hover:bg-[#EADDFF] flex items-center justify-center gap-2 shadow-md transition-colors"
              >
                {copiedLink ? <Check className="w-4 h-4 text-[#381E72]" /> : <Copy className="w-4 h-4" />}
                <span>{copiedLink ? "Direct Phone Link Copied!" : "Copy Direct Mobile Pair Link"}</span>
              </button>
            </div>
          </div>

          {/* Android PWA Installation Steps */}
          <div className="p-6 rounded-3xl bg-[#1C1B1F] border border-[#49454F]/40 space-y-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="p-3 rounded-2xl bg-emerald-500/20 text-emerald-400">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#E6E1E5]">
                    Install as Native Android App (PWA)
                  </h3>
                  <p className="text-xs text-[#938F99]">
                    No app store download required &bull; Works offline with Android lockscreen controls
                  </p>
                </div>
              </div>

              <div className="space-y-3 text-xs text-[#CAC4D0]">
                <div className="p-3 rounded-2xl bg-[#2B2930] border border-[#49454F]/30 flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-[#1C1B1F] font-mono font-bold text-center leading-6 shrink-0 text-[#D0BCFF]">
                    1
                  </span>
                  <div>
                    <span className="font-bold text-[#E6E1E5] block">Open in Chrome / Firefox on Android</span>
                    <span>Open the scanned link on your phone's browser.</span>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-[#2B2930] border border-[#49454F]/30 flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-[#1C1B1F] font-mono font-bold text-center leading-6 shrink-0 text-[#D0BCFF]">
                    2
                  </span>
                  <div>
                    <span className="font-bold text-[#E6E1E5] block">Tap "Add to Home Screen" / "Install"</span>
                    <span>Tap the 3 dots in the top right &gt; <strong>Install App</strong> or <strong>Add to Home Screen</strong>.</span>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-[#2B2930] border border-[#49454F]/30 flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-[#1C1B1F] font-mono font-bold text-center leading-6 shrink-0 text-[#D0BCFF]">
                    3
                  </span>
                  <div>
                    <span className="font-bold text-[#E6E1E5] block">Launch from Android App Drawer</span>
                    <span>Enjoy full-screen Android playback with lockscreen MediaSession controls and offline cache!</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-[#2B2930] text-[11px] text-[#CAC4D0] border border-[#49454F]/30 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                Web App Manifest is configured and active with Android theme colors and icons.
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
