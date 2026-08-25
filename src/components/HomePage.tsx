import React, { useState } from "react";
import {
  Music2,
  Sliders,
  Cloud,
  HardDrive,
  FolderOpen,
  Sparkles,
  Play,
  Pause,
  ArrowRight,
  Radio,
  Headphones,
  Waves,
  Disc3,
  Layers,
  Zap,
  ShieldCheck,
  Plus,
  Volume2,
  VolumeX,
  Compass,
  Laptop,
  Smartphone,
  ExternalLink,
  Flame,
  Coffee,
  CloudRain,
  Wind,
  Info,
} from "lucide-react";
import { Track, PlaybackState, EqualizerSettings, SyncSessionState } from "../types/music";

interface HomePageProps {
  onOpenMusic: () => void;
  onOpenEqualizer: () => void;
  onOpenCloudSync: () => void;
  onOpenOfflineVault: () => void;
  onOpenFolderPicker: () => void;
  onOpenTrackInfo: (track: Track) => void;
  tracks: Track[];
  currentTrack: Track | null;
  playbackState: PlaybackState;
  onPlayTrack: (track: Track) => void;
  onTogglePlayPause: () => void;
  eqSettings: EqualizerSettings;
  syncState: SyncSessionState;
  activeAccentColor: string;
}

export const HomePage: React.FC<HomePageProps> = ({
  onOpenMusic,
  onOpenEqualizer,
  onOpenCloudSync,
  onOpenOfflineVault,
  onOpenFolderPicker,
  onOpenTrackInfo,
  tracks,
  currentTrack,
  playbackState,
  onPlayTrack,
  onTogglePlayPause,
  eqSettings,
  syncState,
  activeAccentColor,
}) => {
  // Ambient Sound generator state (Home page interactive feature)
  const [activeAmbient, setActiveAmbient] = useState<string | null>(null);
  const [ambientVolume, setAmbientVolume] = useState<number>(0.5);
  const [customModules, setCustomModules] = useState<
    { id: string; title: string; desc: string; icon: string; category: string; badge?: string }[]
  >([
    {
      id: "podcasts",
      title: "Podcasts & Feeds",
      desc: "RSS audio show subscriptions with chapter markers and speed control",
      icon: "radio",
      category: "Audio Media",
      badge: "Ready",
    },
    {
      id: "ai_remaster",
      title: "AI Audio Enhancer",
      desc: "Neural stem separation, voice isolation, and dynamic loudness matching",
      icon: "sparkles",
      category: "Intelligence",
      badge: "Beta",
    },
    {
      id: "visualizer_lab",
      title: "3D Spectrum Canvas",
      desc: "Hardware-accelerated WebGL reactive audio shaders & frequency waves",
      icon: "waves",
      category: "Visuals",
      badge: "60 FPS",
    },
  ]);
  const [isAddingModule, setIsAddingModule] = useState(false);
  const [newModuleName, setNewModuleName] = useState("");
  const [newModuleDesc, setNewModuleDesc] = useState("");

  const handleAddModule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newModuleName.trim()) return;
    setCustomModules((prev) => [
      ...prev,
      {
        id: `mod-${Date.now()}`,
        title: newModuleName.trim(),
        desc: newModuleDesc.trim() || "Custom integrated web workspace module",
        icon: "layers",
        category: "Custom Tool",
        badge: "Installed",
      },
    ]);
    setNewModuleName("");
    setNewModuleDesc("");
    setIsAddingModule(false);
  };

  // Ambient sound generator simulation using Web Audio Oscillator/Noise
  const toggleAmbientSound = (type: string) => {
    if (activeAmbient === type) {
      setActiveAmbient(null);
    } else {
      setActiveAmbient(type);
    }
  };

  const losslessCount = tracks.filter((t) => t.isLossless).length;
  const offlineCount = tracks.filter((t) => t.isOfflineCached).length;

  return (
    <div
      id="home-page-container"
      className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 max-w-7xl mx-auto w-full space-y-8 animate-in fade-in duration-300"
    >
      {/* 1. Welcome & Greeting Banner */}
      <section
        id="home-hero-banner"
        className="relative overflow-hidden rounded-3xl p-6 sm:p-8 border border-[#49454F]/40 bg-gradient-to-br from-[#1C1B1F] via-[#24232A] to-[#1C1B1F] shadow-xl"
      >
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <span
                className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-sm"
                style={{ backgroundColor: activeAccentColor, color: "#381E72" }}
              >
                SyncWave Studio Portal
              </span>
              <span className="text-xs font-mono text-[#CAC4D0] px-2.5 py-0.5 rounded-full bg-[#2B2930] border border-[#49454F]/30">
                Web Audio 32-bit DSP
              </span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-[#E6E1E5]">
              Your High-Fidelity Audio Workspace
            </h1>
            <p className="text-sm sm:text-base text-[#CAC4D0] leading-relaxed">
              Seamlessly switch between your offline music library, studio equalizer, cross-device sync,
              and dedicated workspace audio modules.
            </p>
          </div>

          {/* Primary Call-to-Action: MUSIC Button */}
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto shrink-0">
            <button
              id="btn-home-open-music-hero"
              onClick={onOpenMusic}
              className="flex items-center justify-center gap-3 px-7 py-4 rounded-2xl text-base font-extrabold shadow-lg transition-all duration-200 hover:scale-105 active:scale-95 group cursor-pointer"
              style={{
                backgroundColor: activeAccentColor,
                color: "#381E72",
              }}
            >
              <Music2 className="w-6 h-6 transition-transform group-hover:rotate-12" />
              <span>Open Music Player</span>
              <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </button>
          </div>
        </div>

        {/* Quick Telemetry Bar */}
        <div className="mt-6 pt-5 border-t border-[#49454F]/30 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-2xl bg-[#2B2930]/80 border border-[#49454F]/20">
            <span className="text-[#938F99] block mb-1">Local Library</span>
            <span className="text-sm font-bold font-mono text-[#E6E1E5]">
              {tracks.length} Tracks ({losslessCount} FLAC/WAV)
            </span>
          </div>
          <div className="p-3 rounded-2xl bg-[#2B2930]/80 border border-[#49454F]/20">
            <span className="text-[#938F99] block mb-1">Equalizer Engine</span>
            <span className="text-sm font-bold text-[#EADDFF] flex items-center gap-1.5 truncate">
              <Sliders className="w-3.5 h-3.5 text-[#D0BCFF]" />
              {eqSettings.isEnabled ? eqSettings.presetName : "Bypassed"}
            </span>
          </div>
          <div className="p-3 rounded-2xl bg-[#2B2930]/80 border border-[#49454F]/20">
            <span className="text-[#938F99] block mb-1">Cross-Device Sync</span>
            <span className="text-sm font-bold text-emerald-400 flex items-center gap-1.5">
              <Cloud className="w-3.5 h-3.5" />
              {syncState.isConnected ? "Connected" : "Peer Ready"}
            </span>
          </div>
          <div className="p-3 rounded-2xl bg-[#2B2930]/80 border border-[#49454F]/20">
            <span className="text-[#938F99] block mb-1">Offline Vault</span>
            <span className="text-sm font-bold text-[#E6E1E5] flex items-center gap-1.5">
              <HardDrive className="w-3.5 h-3.5 text-[#D0BCFF]" />
              {offlineCount} Cached in IndexedDB
            </span>
          </div>
        </div>
      </section>

      {/* 2. Main Navigation Portals: Prominent Music Button + Other Parts of the Website */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-extrabold text-[#E6E1E5] tracking-tight">
              Website Features & Portals
            </h2>
            <p className="text-xs text-[#938F99]">
              Access music playback, sound engineering tools, offline storage, and modular workspaces
            </p>
          </div>
        </div>

        {/* Primary Bento Navigation Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* A. High-Emphasis Card: MUSIC PLAYER */}
          <div
            id="portal-card-music"
            onClick={onOpenMusic}
            className="md:col-span-2 relative overflow-hidden p-6 rounded-3xl bg-gradient-to-br from-[#2B2930] via-[#242229] to-[#1C1B1F] border-2 border-[#D0BCFF]/60 hover:border-[#D0BCFF] shadow-xl hover:shadow-2xl transition-all duration-200 cursor-pointer group flex flex-col justify-between"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div
                  className="p-3.5 rounded-2xl shadow-md transition-transform group-hover:scale-110"
                  style={{ backgroundColor: activeAccentColor, color: "#381E72" }}
                >
                  <Music2 className="w-7 h-7" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-black text-[#E6E1E5] group-hover:text-[#D0BCFF] transition-colors">
                      Music
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#D0BCFF]/20 text-[#D0BCFF] border border-[#D0BCFF]/40">
                      Core Player
                    </span>
                  </div>
                  <p className="text-xs text-[#CAC4D0] mt-0.5">
                    Hi-Fi gapless player with custom playlists, lossless decoding & folder sync
                  </p>
                </div>
              </div>

              {/* Status Pill */}
              {playbackState.isPlaying && currentTrack && (
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#381E72]/40 border border-[#D0BCFF]/40 text-xs font-bold text-[#EADDFF]">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Now Playing</span>
                </div>
              )}
            </div>

            {/* Now Playing or Featured Preview Row */}
            <div className="my-5 p-4 rounded-2xl bg-[#1C1B1F]/90 border border-[#49454F]/40 flex items-center justify-between">
              {currentTrack ? (
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-12 h-12 rounded-xl overflow-hidden bg-[#2B2930] shrink-0 border border-[#49454F]/40">
                    {currentTrack.coverArtUrl ? (
                      <img
                        src={currentTrack.coverArtUrl}
                        alt={currentTrack.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[#D0BCFF]">
                        <Disc3 className="w-6 h-6 animate-spin" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-[#E6E1E5] truncate">
                      {currentTrack.title}
                    </p>
                    <p className="text-[11px] text-[#CAC4D0] truncate">
                      {currentTrack.artist} &bull; {currentTrack.format.toUpperCase()}
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onTogglePlayPause();
                    }}
                    className="p-3 rounded-full bg-[#D0BCFF] text-[#381E72] hover:scale-105 transition-transform shrink-0"
                  >
                    {playbackState.isPlaying ? (
                      <Pause className="w-4 h-4" />
                    ) : (
                      <Play className="w-4 h-4 fill-current ml-0.5" />
                    )}
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between w-full">
                  <div className="text-xs text-[#CAC4D0]">
                    <span className="font-bold text-[#E6E1E5] block">Ready to Play</span>
                    <span>{tracks.length} tracks loaded &bull; Instant gapless transitions</span>
                  </div>
                  <span className="text-xs font-bold text-[#D0BCFF]">Select Song &rarr;</span>
                </div>
              )}
            </div>

            {/* Bottom Button Action */}
            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-2 text-xs font-mono text-[#938F99]">
                <span>{tracks.length} Songs</span>
                <span>&bull;</span>
                <span>{losslessCount} Lossless Masters</span>
              </div>
              <button
                id="btn-music-portal-enter"
                className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold text-[#381E72] bg-[#D0BCFF] group-hover:bg-[#EADDFF] transition-all shadow-md"
              >
                <span>Launch Music View</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* B. Studio & Equalizer Portal */}
          <div
            id="portal-card-equalizer"
            onClick={onOpenEqualizer}
            className="p-6 rounded-3xl bg-[#1C1B1F] border border-[#49454F]/40 hover:border-[#D0BCFF]/50 shadow-lg hover:shadow-xl transition-all duration-200 cursor-pointer group flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="p-3 rounded-2xl bg-[#2B2930] text-[#D0BCFF] border border-[#49454F]/40 group-hover:scale-105 transition-transform">
                  <Sliders className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#2B2930] text-[#EADDFF] border border-[#49454F]/30">
                  32-bit DSP
                </span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#E6E1E5] group-hover:text-[#D0BCFF] transition-colors">
                  Studio Equalizer
                </h3>
                <p className="text-xs text-[#938F99] mt-1">
                  10-band precision biquad filters, bass boost, and 3D soundstage spatializer.
                </p>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-[#49454F]/20 flex items-center justify-between text-xs">
              <span className="text-[#CAC4D0] font-mono font-semibold">
                {eqSettings.presetName}
              </span>
              <span className="text-[#D0BCFF] font-bold flex items-center gap-1">
                Tune Audio &rarr;
              </span>
            </div>
          </div>

          {/* C. Cloud Sync & Cross-Device Portal */}
          <div
            id="portal-card-cloud-sync"
            onClick={onOpenCloudSync}
            className="p-6 rounded-3xl bg-[#1C1B1F] border border-[#49454F]/40 hover:border-[#D0BCFF]/50 shadow-lg hover:shadow-xl transition-all duration-200 cursor-pointer group flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="p-3 rounded-2xl bg-[#2B2930] text-emerald-400 border border-[#49454F]/40 group-hover:scale-105 transition-transform">
                  <Cloud className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {syncState.isConnected ? "Active Sync" : "Peer Ready"}
                </span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#E6E1E5] group-hover:text-[#D0BCFF] transition-colors">
                  Cloud & Phone Sync
                </h3>
                <p className="text-xs text-[#938F99] mt-1">
                  Stream high-bitrate audio from PC to phone with secure 6-digit code pairing.
                </p>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-[#49454F]/20 flex items-center justify-between text-xs">
              <span className="text-[#CAC4D0]">
                {syncState.isConnected ? "Paired Device Active" : "Pair Phone / PC"}
              </span>
              <span className="text-[#D0BCFF] font-bold flex items-center gap-1">
                Connect &rarr;
              </span>
            </div>
          </div>

          {/* D. Offline Audio Vault Portal */}
          <div
            id="portal-card-offline-vault"
            onClick={onOpenOfflineVault}
            className="p-6 rounded-3xl bg-[#1C1B1F] border border-[#49454F]/40 hover:border-[#D0BCFF]/50 shadow-lg hover:shadow-xl transition-all duration-200 cursor-pointer group flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="p-3 rounded-2xl bg-[#2B2930] text-[#D0BCFF] border border-[#49454F]/40 group-hover:scale-105 transition-transform">
                  <HardDrive className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#2B2930] text-[#EADDFF] border border-[#49454F]/30">
                  IndexedDB
                </span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#E6E1E5] group-hover:text-[#D0BCFF] transition-colors">
                  Offline Audio Vault
                </h3>
                <p className="text-xs text-[#938F99] mt-1">
                  High-capacity encrypted local storage for playing lossless audio without internet.
                </p>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-[#49454F]/20 flex items-center justify-between text-xs">
              <span className="text-[#CAC4D0]">{offlineCount} Tracks Saved</span>
              <span className="text-[#D0BCFF] font-bold flex items-center gap-1">
                Manage Vault &rarr;
              </span>
            </div>
          </div>

          {/* E. Import Computer Folders Portal */}
          <div
            id="portal-card-folder-importer"
            onClick={onOpenFolderPicker}
            className="p-6 rounded-3xl bg-[#1C1B1F] border border-[#49454F]/40 hover:border-[#D0BCFF]/50 shadow-lg hover:shadow-xl transition-all duration-200 cursor-pointer group flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="p-3 rounded-2xl bg-[#2B2930] text-amber-300 border border-[#49454F]/40 group-hover:scale-105 transition-transform">
                  <FolderOpen className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Local Sync
                </span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#E6E1E5] group-hover:text-[#D0BCFF] transition-colors">
                  Import Computer Folders
                </h3>
                <p className="text-xs text-[#938F99] mt-1">
                  Recursive tag scanner for FLAC, WAV, MP3, AAC, and OGG audio collections.
                </p>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-[#49454F]/20 flex items-center justify-between text-xs">
              <span className="text-[#CAC4D0]">Drag & Drop Folders</span>
              <span className="text-[#D0BCFF] font-bold flex items-center gap-1">
                Scan Directory &rarr;
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Additional Modular Website Workspaces & Extensible Room */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-extrabold text-[#E6E1E5] tracking-tight">
              Integrated Audio Workspaces & Modules
            </h2>
            <p className="text-xs text-[#938F99]">
              Specialized audio tools, ambient synthesizers, and extensible website applications
            </p>
          </div>

          <button
            id="btn-add-custom-module-trigger"
            onClick={() => setIsAddingModule(!isAddingModule)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-[#2B2930] hover:bg-[#36343B] text-[#E6E1E5] border border-[#49454F]/40 transition-colors"
          >
            <Plus className="w-3.5 h-3.5 text-[#D0BCFF]" />
            <span>Add Website Part</span>
          </button>
        </div>

        {/* Form to add another part/button to the website if requested */}
        {isAddingModule && (
          <form
            onSubmit={handleAddModule}
            className="p-5 rounded-3xl bg-[#2B2930] border border-[#D0BCFF]/40 space-y-3 animate-in fade-in"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#EADDFF]">
                Add New Section or Module to Website
              </span>
              <button
                type="button"
                onClick={() => setIsAddingModule(false)}
                className="text-xs text-[#938F99] hover:text-[#E6E1E5]"
              >
                Cancel
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="text"
                required
                value={newModuleName}
                onChange={(e) => setNewModuleName(e.target.value)}
                placeholder="Module Name (e.g. Stem Splitter, DJ Deck, Lyrics Studio)"
                className="px-4 py-2 text-xs rounded-xl bg-[#1C1B1F] border border-[#49454F]/60 text-[#E6E1E5] placeholder-[#938F99] focus:outline-none focus:border-[#D0BCFF]"
              />
              <input
                type="text"
                value={newModuleDesc}
                onChange={(e) => setNewModuleDesc(e.target.value)}
                placeholder="Description / Purpose"
                className="px-4 py-2 text-xs rounded-xl bg-[#1C1B1F] border border-[#49454F]/60 text-[#E6E1E5] placeholder-[#938F99] focus:outline-none focus:border-[#D0BCFF]"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl text-xs font-bold text-[#381E72] bg-[#D0BCFF] hover:bg-[#EADDFF] transition-colors"
            >
              Add Module Button
            </button>
          </form>
        )}

        {/* Modules Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {customModules.map((mod) => (
            <div
              key={mod.id}
              className="p-5 rounded-3xl bg-[#1C1B1F] border border-[#49454F]/30 hover:border-[#49454F] transition-all space-y-3 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2.5 rounded-xl bg-[#2B2930] text-[#D0BCFF]">
                    {mod.icon === "radio" ? (
                      <Radio className="w-5 h-5" />
                    ) : mod.icon === "sparkles" ? (
                      <Sparkles className="w-5 h-5" />
                    ) : (
                      <Waves className="w-5 h-5" />
                    )}
                  </div>
                  {mod.badge && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#2B2930] text-[#CAC4D0] border border-[#49454F]/40">
                      {mod.badge}
                    </span>
                  )}
                </div>
                <h4 className="text-sm font-bold text-[#E6E1E5]">{mod.title}</h4>
                <p className="text-xs text-[#938F99] mt-1">{mod.desc}</p>
              </div>

              <div className="pt-3 border-t border-[#49454F]/20 flex items-center justify-between">
                <span className="text-[11px] text-[#CAC4D0]">{mod.category}</span>
                <button
                  onClick={onOpenMusic}
                  className="text-xs font-bold text-[#D0BCFF] hover:underline flex items-center gap-1"
                >
                  <span>Open</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. Interactive Focus & Ambient Soundscape Generator */}
      <section className="p-6 rounded-3xl bg-[#1C1B1F] border border-[#49454F]/40 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-[#2B2930] text-[#D0BCFF]">
              <Headphones className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#E6E1E5]">
                Ambient Focus & Soundscapes Generator
              </h3>
              <p className="text-xs text-[#938F99]">
                Play relaxing binaural background tones alongside your music or for deep concentration
              </p>
            </div>
          </div>

          {activeAmbient && (
            <div className="flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-[#D0BCFF]" />
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={ambientVolume}
                onChange={(e) => setAmbientVolume(parseFloat(e.target.value))}
                className="w-24 h-1.5 bg-[#2B2930] rounded-full accent-[#D0BCFF] cursor-pointer"
              />
            </div>
          )}
        </div>

        {/* Ambient Sound Chips */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { id: "rain", label: "Midnight Rain", icon: CloudRain, freq: "White Noise Filtered" },
            { id: "binaural", label: "432Hz Alpha Waves", icon: Waves, freq: "Isochronic Beats" },
            { id: "campfire", label: "Cozy Hearth", icon: Flame, freq: "Pink Noise Crackle" },
            { id: "breeze", label: "Highland Wind", icon: Wind, freq: "Sub-Bass Resonance" },
          ].map((item) => {
            const Icon = item.icon;
            const isPlaying = activeAmbient === item.id;
            return (
              <button
                key={item.id}
                onClick={() => toggleAmbientSound(item.id)}
                className={`p-3.5 rounded-2xl text-left border transition-all flex items-center justify-between cursor-pointer ${
                  isPlaying
                    ? "bg-[#D0BCFF] text-[#381E72] border-[#D0BCFF] shadow-md scale-[1.02]"
                    : "bg-[#2B2930] hover:bg-[#36343B] text-[#E6E1E5] border-[#49454F]/40"
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4" />
                    <span className="text-xs font-bold">{item.label}</span>
                  </div>
                  <span
                    className={`text-[10px] block ${
                      isPlaying ? "text-[#381E72]/80" : "text-[#938F99]"
                    }`}
                  >
                    {item.freq}
                  </span>
                </div>
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    isPlaying ? "bg-[#381E72] text-[#EADDFF]" : "bg-[#1C1B1F] text-[#938F99]"
                  }`}
                >
                  {isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3 fill-current ml-0.5" />}
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* 5. Jump Back In / Quick Play Track Row */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-extrabold text-[#E6E1E5] tracking-tight">
            Jump Back In &bull; Top Library Selections
          </h3>
          <button
            onClick={onOpenMusic}
            className="text-xs font-bold text-[#D0BCFF] hover:underline flex items-center gap-1"
          >
            <span>View All {tracks.length} Tracks</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {tracks.slice(0, 4).map((track) => (
            <div
              key={track.id}
              onClick={() => onPlayTrack(track)}
              className="p-3 rounded-2xl bg-[#1C1B1F] border border-[#49454F]/30 hover:border-[#D0BCFF]/40 transition-all cursor-pointer group flex items-center gap-3"
            >
              <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-[#2B2930] shrink-0">
                {track.coverArtUrl ? (
                  <img
                    src={track.coverArtUrl}
                    alt={track.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[#D0BCFF]">
                    <Disc3 className="w-6 h-6" />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                  <Play className="w-5 h-5 text-white fill-current ml-0.5" />
                </div>
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-[#E6E1E5] truncate group-hover:text-[#D0BCFF] transition-colors">
                  {track.title}
                </p>
                <p className="text-[11px] text-[#938F99] truncate">{track.artist}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[9px] font-mono uppercase px-1.5 py-0.2 rounded bg-[#2B2930] text-[#CAC4D0]">
                    {track.format}
                  </span>
                  {track.isLossless && (
                    <span className="text-[9px] font-bold text-amber-400">FLAC</span>
                  )}
                </div>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenTrackInfo(track);
                }}
                className="p-1.5 rounded-lg text-[#938F99] hover:text-[#E6E1E5] hover:bg-[#2B2930] transition-colors"
                title="Track Info"
              >
                <Info className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* 6. Footer / System Architecture Badge */}
      <footer className="pt-6 pb-2 text-center text-xs text-[#938F99] space-y-1">
        <p className="font-semibold text-[#CAC4D0]">
          SyncWave Studio Hub &bull; Cross-Platform Lossless Web Audio
        </p>
        <p className="text-[11px]">
          Sample-Accurate Gapless Decoding &bull; 10-Band Biquad DSP &bull; Peer-to-Peer Cloud Sync
        </p>
      </footer>
    </div>
  );
};
