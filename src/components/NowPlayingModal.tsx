import React, { useState } from "react";
import {
  ChevronDown,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Repeat1,
  Volume2,
  VolumeX,
  Sliders,
  Heart,
  HardDrive,
  Cloud,
  Disc3,
  Sparkles,
  Layers,
  Radio,
  Music2,
  Info,
  ListMusic,
  Activity,
  Share2,
} from "lucide-react";
import { Track, PlaybackState, EqualizerSettings } from "../types/music";
import { AudioVisualizer } from "./AudioVisualizer";

interface NowPlayingModalProps {
  isOpen: boolean;
  onClose: () => void;
  track: Track | null;
  playbackState: PlaybackState;
  onTogglePlay: () => void;
  onNext: () => void;
  onPrev: () => void;
  onSeek: (time: number) => void;
  onVolumeChange: (vol: number) => void;
  onToggleShuffle: () => void;
  onToggleRepeat: () => void;
  onToggleFavorite: (trackId: string) => void;
  onOpenEqualizer: () => void;
  onToggleOfflineCache: (track: Track) => void;
  queue: Track[];
  onPlayTrackFromQueue: (track: Track) => void;
  activeAccentColor: string;
}

export const NowPlayingModal: React.FC<NowPlayingModalProps> = ({
  isOpen,
  onClose,
  track,
  playbackState,
  onTogglePlay,
  onNext,
  onPrev,
  onSeek,
  onVolumeChange,
  onToggleShuffle,
  onToggleRepeat,
  onToggleFavorite,
  onOpenEqualizer,
  onToggleOfflineCache,
  queue,
  onPlayTrackFromQueue,
  activeAccentColor,
}) => {
  const [activeTab, setActiveTab] = useState<"player" | "queue" | "lyrics" | "info">("player");
  const [visualizerMode, setVisualizerMode] = useState<"bars" | "wave" | "circle">("bars");

  if (!isOpen || !track) return null;

  const formatTime = (sec: number): string => {
    const mins = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${mins}:${s < 10 ? "0" : ""}${s}`;
  };

  const progressPercent =
    playbackState.duration > 0
      ? (playbackState.currentTime / playbackState.duration) * 100
      : 0;

  return (
    <div
      id="now-playing-fullscreen-modal"
      className="fixed inset-0 z-50 flex flex-col bg-[#121212] text-[#E6E1E5] overflow-hidden animate-in slide-in-from-bottom duration-300 select-none"
    >
      {/* Ambient Dynamic Background Glow */}
      <div
        className="absolute inset-0 opacity-20 blur-3xl pointer-events-none transition-colors duration-700"
        style={{
          background: `radial-gradient(circle at 50% 35%, ${track.accentColor || activeAccentColor} 0%, transparent 70%)`,
        }}
      />

      {/* Top Bar */}
      <div className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-[#49454F]/30 bg-[#1C1B1F]/60 backdrop-blur-md">
        <button
          id="btn-close-now-playing-modal"
          onClick={onClose}
          className="p-2 rounded-full hover:bg-[#2B2930] text-[#CAC4D0] hover:text-[#E6E1E5] transition-colors"
          title="Minimize Player"
        >
          <ChevronDown className="w-6 h-6" />
        </button>

        {/* Tab Pills */}
        <div className="flex items-center gap-1 p-1 bg-[#2B2930] border border-[#49454F]/40 rounded-full text-xs font-semibold">
          {[
            { id: "player" as const, label: "Player", icon: Music2 },
            { id: "queue" as const, label: `Queue (${queue.length})`, icon: ListMusic },
            { id: "lyrics" as const, label: "Lyrics", icon: Radio },
            { id: "info" as const, label: "Audiophile Tag", icon: Info },
          ].map((tab) => {
            const Icon = tab.icon;
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all ${
                  isSelected
                    ? "bg-[#D0BCFF] text-[#381E72] shadow-md font-bold"
                    : "text-[#CAC4D0] hover:text-[#E6E1E5]"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Top Right Quick EQ */}
        <button
          onClick={onOpenEqualizer}
          className="p-2 rounded-full hover:bg-[#2B2930] text-[#CAC4D0] hover:text-[#E6E1E5] transition-colors"
          title="Open Equalizer"
        >
          <Sliders className="w-5 h-5" />
        </button>
      </div>

      {/* Main Content Area */}
      <div className="relative z-10 flex-1 overflow-y-auto px-6 py-6 max-w-4xl mx-auto w-full flex flex-col justify-between">
        {activeTab === "player" && (
          <div className="flex-1 flex flex-col items-center justify-center gap-6 my-auto">
            {/* Album Artwork & Visualizer */}
            <div className="relative w-64 h-64 sm:w-80 sm:h-80 rounded-3xl overflow-hidden shadow-2xl bg-[#1C1B1F] border border-[#49454F]/40 group">
              {track.coverArtUrl ? (
                <img
                  src={track.coverArtUrl}
                  alt={track.title}
                  className={`w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 ${
                    playbackState.isPlaying ? "scale-[1.02]" : ""
                  }`}
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div
                  className="w-full h-full flex flex-col items-center justify-center p-6 text-center"
                  style={{ backgroundColor: track.accentColor || activeAccentColor }}
                >
                  <Disc3 className="w-20 h-20 opacity-80 animate-spin-slow mb-4" />
                  <span className="text-sm font-bold uppercase tracking-wider text-white">
                    {track.album}
                  </span>
                </div>
              )}

              {/* Lossless Hi-Res Badge overlay */}
              <div className="absolute top-3 left-3 flex items-center gap-1.5">
                {track.isLossless && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-amber-400 text-[#381E72] shadow-md">
                    Hi-Res Lossless
                  </span>
                )}
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono uppercase bg-black/60 backdrop-blur-md text-white/90">
                  {track.format} &bull; {track.sampleRate}
                </span>
              </div>
            </div>

            {/* Live 60fps Visualizer */}
            <div className="w-full max-w-md space-y-1">
              <div className="flex items-center justify-between text-[11px] text-[#938F99] px-1">
                <span>Real-Time Spectrum</span>
                <div className="flex items-center gap-2">
                  {(["bars", "wave", "circle"] as const).map((m) => (
                    <button
                      key={m}
                      onClick={() => setVisualizerMode(m)}
                      className={`capitalize ${
                        visualizerMode === m
                          ? "text-[#D0BCFF] font-bold underline"
                          : "hover:text-[#E6E1E5]"
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>
              <AudioVisualizer
                isPlaying={playbackState.isPlaying}
                accentColor={track.accentColor || activeAccentColor}
                mode={visualizerMode}
                className="w-full h-16 rounded-2xl bg-[#1C1B1F] border border-[#49454F]/30"
              />
            </div>

            {/* Track Title & Artist */}
            <div className="w-full max-w-md flex items-center justify-between">
              <div className="min-w-0 flex-1 pr-4">
                <h2 className="text-xl sm:text-2xl font-bold truncate text-[#E6E1E5]">
                  {track.title}
                </h2>
                <p className="text-sm text-[#CAC4D0] truncate mt-0.5">
                  {track.artist} &bull; {track.album}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => onToggleOfflineCache(track)}
                  className="p-2.5 rounded-full bg-[#2B2930] hover:bg-[#36343B] text-[#CAC4D0] hover:text-[#E6E1E5] transition-colors"
                  title={track.isOfflineCached ? "Cached Offline" : "Download Offline"}
                >
                  <HardDrive
                    className={`w-5 h-5 ${
                      track.isOfflineCached ? "text-emerald-400" : "text-[#CAC4D0]"
                    }`}
                  />
                </button>

                <button
                  onClick={() => onToggleFavorite(track.id)}
                  className="p-2.5 rounded-full bg-[#2B2930] hover:bg-[#36343B] transition-colors"
                >
                  <Heart
                    className={`w-5 h-5 ${
                      track.isFavorite ? "fill-rose-400 text-rose-400" : "text-[#938F99]"
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Scrubber / Progress Bar */}
            <div className="w-full max-w-md space-y-1.5">
              <input
                type="range"
                min="0"
                max={playbackState.duration || 100}
                step="0.1"
                value={playbackState.currentTime}
                onChange={(e) => onSeek(parseFloat(e.target.value))}
                className="w-full h-2 rounded-full cursor-pointer appearance-none bg-[#2B2930] accent-[#D0BCFF]"
                style={{ accentColor: track.accentColor || activeAccentColor }}
              />
              <div className="flex items-center justify-between text-xs font-mono text-[#938F99]">
                <span>{formatTime(playbackState.currentTime)}</span>
                <span className="text-[10px] tracking-wider text-[#938F99]/60 uppercase">
                  Gapless Buffer: Active
                </span>
                <span>{formatTime(playbackState.duration)}</span>
              </div>
            </div>

            {/* Big Expressive Controls */}
            <div className="flex items-center justify-center gap-6 sm:gap-8">
              <button
                onClick={onToggleShuffle}
                className={`p-3 rounded-full transition-all ${
                  playbackState.shuffle
                    ? "shadow-md font-bold scale-105"
                    : "text-[#CAC4D0] hover:text-[#E6E1E5] hover:bg-[#2B2930]"
                }`}
                style={
                  playbackState.shuffle
                    ? { backgroundColor: activeAccentColor, color: "#381E72" }
                    : undefined
                }
                title="Shuffle"
              >
                <Shuffle className="w-5 h-5" />
              </button>

              <button
                onClick={onPrev}
                className="p-3 rounded-full text-[#CAC4D0] hover:text-[#E6E1E5] hover:bg-[#2B2930] transition-colors"
                title="Previous"
              >
                <SkipBack className="w-7 h-7 fill-current" />
              </button>

              <button
                onClick={onTogglePlay}
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center shadow-2xl transition-transform hover:scale-105 active:scale-95"
                style={{
                  backgroundColor: track.accentColor || activeAccentColor,
                  color: "#381E72",
                }}
              >
                {playbackState.isPlaying ? (
                  <Pause className="w-8 h-8 fill-current" />
                ) : (
                  <Play className="w-8 h-8 fill-current translate-x-1" />
                )}
              </button>

              <button
                onClick={onNext}
                className="p-3 rounded-full text-[#CAC4D0] hover:text-[#E6E1E5] hover:bg-[#2B2930] transition-colors"
                title="Next"
              >
                <SkipForward className="w-7 h-7 fill-current" />
              </button>

              <button
                onClick={onToggleRepeat}
                className={`p-3 rounded-full transition-all ${
                  playbackState.repeatMode !== "off"
                    ? "shadow-md font-bold scale-105"
                    : "text-[#CAC4D0] hover:text-[#E6E1E5] hover:bg-[#2B2930]"
                }`}
                style={
                  playbackState.repeatMode !== "off"
                    ? { backgroundColor: activeAccentColor, color: "#381E72" }
                    : undefined
                }
                title={`Repeat: ${playbackState.repeatMode}`}
              >
                {playbackState.repeatMode === "one" ? (
                  <Repeat1 className="w-5 h-5" />
                ) : (
                  <Repeat className="w-5 h-5" />
                )}
              </button>
            </div>

            {/* Bottom Volume Slider */}
            <div className="w-full max-w-xs flex items-center gap-3 pt-2">
              <VolumeX className="w-4 h-4 text-[#938F99]" />
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={playbackState.volume}
                onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
                className="w-full h-1.5 rounded-full bg-[#2B2930] cursor-pointer accent-[#D0BCFF]"
                style={{ accentColor: track.accentColor || activeAccentColor }}
              />
              <Volume2 className="w-4 h-4 text-[#938F99]" />
            </div>
          </div>
        )}

        {/* Up Next Queue Tab */}
        {activeTab === "queue" && (
          <div className="flex-1 space-y-3">
            <h3 className="text-lg font-bold text-[#E6E1E5] mb-2">Up Next in Queue</h3>
            <div className="space-y-1.5">
              {queue.map((t, idx) => {
                const isCurrent = t.id === track.id;
                return (
                  <div
                    key={`${t.id}_${idx}`}
                    onClick={() => onPlayTrackFromQueue(t)}
                    className={`flex items-center justify-between p-3 rounded-2xl cursor-pointer transition-colors ${
                      isCurrent
                        ? "bg-[#2B2930] text-[#D0BCFF] font-bold border border-[#D0BCFF]/30"
                        : "hover:bg-[#211F26] text-[#CAC4D0]"
                    }`}
                  >
                    <div className="flex items-center gap-3 truncate">
                      <span className="text-xs font-mono text-[#938F99] w-4">
                        {idx + 1}
                      </span>
                      <div className="truncate">
                        <p className="text-sm font-semibold truncate">{t.title}</p>
                        <p className="text-xs text-[#938F99] truncate">{t.artist}</p>
                      </div>
                    </div>
                    <span className="text-xs font-mono text-[#938F99]">
                      {formatTime(t.duration)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Lyrics Tab */}
        {activeTab === "lyrics" && (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-4">
            <h3 className="text-lg font-bold text-[#E6E1E5]">Synchronized Lyrics</h3>
            <p className="text-sm leading-relaxed text-[#CAC4D0] max-w-lg whitespace-pre-line font-medium">
              {track.lyrics ||
                `[00:04.20] High-Fidelity Lossless Soundstage\n[00:08.50] Deep bass frequencies flowing...\n[00:15.80] Seamless gapless transition active\n[00:24.10] Synced across all connected devices.`}
            </p>
          </div>
        )}

        {/* Audiophile Tag Details Tab */}
        {activeTab === "info" && (
          <div className="flex-1 space-y-4 p-5 bg-[#1C1B1F] rounded-3xl border border-[#49454F]/40 text-[#E6E1E5]">
            <h3 className="text-base font-bold text-[#E6E1E5]">Audiophile File Inspection</h3>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-2xl bg-[#2B2930] border border-[#49454F]/30">
                <span className="text-[#938F99] block mb-1">Audio Format</span>
                <span className="font-mono font-bold uppercase text-[#EADDFF]">{track.format}</span>
              </div>
              <div className="p-3 rounded-2xl bg-[#2B2930] border border-[#49454F]/30">
                <span className="text-[#938F99] block mb-1">Sample Rate</span>
                <span className="font-mono font-bold text-[#EADDFF]">{track.sampleRate || "44.1 kHz"}</span>
              </div>
              <div className="p-3 rounded-2xl bg-[#2B2930] border border-[#49454F]/30">
                <span className="text-[#938F99] block mb-1">Bit Depth / Lossless</span>
                <span className="font-mono font-bold text-[#EADDFF]">
                  {track.bitDepth || (track.isLossless ? "24-bit Lossless" : "16-bit")}
                </span>
              </div>
              <div className="p-3 rounded-2xl bg-[#2B2930] border border-[#49454F]/30">
                <span className="text-[#938F99] block mb-1">Bitrate</span>
                <span className="font-mono font-bold text-[#EADDFF]">{track.bitrate || "320 kbps"}</span>
              </div>
              <div className="p-3 rounded-2xl bg-[#2B2930] border border-[#49454F]/30">
                <span className="text-[#938F99] block mb-1">File Size</span>
                <span className="font-mono font-bold text-[#EADDFF]">
                  {(track.fileSize / (1024 * 1024)).toFixed(2)} MB
                </span>
              </div>
              <div className="p-3 rounded-2xl bg-[#2B2930] border border-[#49454F]/30">
                <span className="text-[#938F99] block mb-1">Storage Vault</span>
                <span className="font-mono font-bold text-emerald-400">
                  {track.isOfflineCached ? "Cached Offline in IndexedDB" : "Stream on Demand"}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
