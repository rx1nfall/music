import React, { useState } from "react";
import {
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
  Maximize2,
  Heart,
  HardDrive,
  Disc3,
  Sparkles,
} from "lucide-react";
import { Track, PlaybackState, RepeatMode } from "../types/music";

interface NowPlayingBarProps {
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
  onOpenFullModal: () => void;
  onOpenEqualizer: () => void;
  activeAccentColor: string;
}

export const NowPlayingBar: React.FC<NowPlayingBarProps> = ({
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
  onOpenFullModal,
  onOpenEqualizer,
  activeAccentColor,
}) => {
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);

  if (!track) return null;

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
      id="now-playing-bottom-bar"
      className="fixed bottom-0 left-0 right-0 z-40 px-3 sm:px-6 py-2.5 bg-[#1C1B1F]/95 backdrop-blur-xl border-t border-[#49454F]/40 shadow-2xl text-[#E6E1E5] transition-all duration-200"
    >
      {/* Top Thin Interactive Scrubber Bar */}
      <div
        className="group relative -top-2.5 -mx-3 sm:-mx-6 h-1.5 hover:h-2.5 bg-[#2B2930] cursor-pointer transition-all"
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const clickX = e.clientX - rect.left;
          const pct = Math.max(0, Math.min(1, clickX / rect.width));
          onSeek(pct * playbackState.duration);
        }}
      >
        <div
          className="h-full relative rounded-r-full transition-all"
          style={{
            width: `${progressPercent}%`,
            backgroundColor: activeAccentColor,
          }}
        >
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-[#EADDFF] shadow-md opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 sm:gap-6 max-w-7xl mx-auto">
        {/* Left: Track Info & Artwork */}
        <div
          className="flex items-center gap-3 min-w-0 max-w-[40%] sm:max-w-[30%] cursor-pointer group"
          onClick={onOpenFullModal}
        >
          <div className="relative w-12 h-12 rounded-2xl overflow-hidden bg-[#2B2930] border border-[#49454F]/40 shrink-0 shadow-md">
            {track.coverArtUrl ? (
              <img
                src={track.coverArtUrl}
                alt={track.title}
                className={`w-full h-full object-cover transition-transform group-hover:scale-105 ${
                  playbackState.isPlaying ? "animate-spin-slow" : ""
                }`}
                referrerPolicy="no-referrer"
              />
            ) : (
              <div
                className="w-full h-full flex items-center justify-center text-white"
                style={{ backgroundColor: track.accentColor || activeAccentColor }}
              >
                <Disc3 className="w-6 h-6 opacity-80" />
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <h4 className="text-xs sm:text-sm font-bold text-[#E6E1E5] truncate">
                {track.title}
              </h4>
              {track.isLossless && (
                <span className="hidden lg:inline-flex text-[9px] font-mono font-bold uppercase px-1 rounded bg-amber-400/15 text-amber-300 border border-amber-400/30">
                  Hi-Res
                </span>
              )}
            </div>
            <p className="text-[11px] sm:text-xs text-[#CAC4D0] truncate">
              {track.artist}
            </p>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(track.id);
            }}
            className="hidden sm:block p-1 text-[#938F99] hover:text-rose-400"
          >
            <Heart
              className={`w-4 h-4 ${
                track.isFavorite ? "fill-rose-400 text-rose-400" : ""
              }`}
            />
          </button>
        </div>

        {/* Center: Playback Controls */}
        <div className="flex flex-col items-center gap-1">
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Shuffle */}
            <button
              id="btn-player-shuffle"
              onClick={onToggleShuffle}
              className={`p-2 rounded-full transition-colors ${
                playbackState.shuffle
                  ? "font-bold"
                  : "text-[#CAC4D0] hover:text-[#E6E1E5] hover:bg-[#2B2930]"
              }`}
              style={
                playbackState.shuffle
                  ? { backgroundColor: activeAccentColor, color: "#381E72" }
                  : undefined
              }
              title="Shuffle Mode"
            >
              <Shuffle className="w-3.5 h-3.5" />
            </button>

            {/* Prev */}
            <button
              id="btn-player-prev"
              onClick={onPrev}
              className="p-2 rounded-full text-[#CAC4D0] hover:text-[#E6E1E5] hover:bg-[#2B2930] transition-colors"
              title="Previous Track"
            >
              <SkipBack className="w-4 h-4 fill-current" />
            </button>

            {/* Play/Pause Primary FAB */}
            <button
              id="btn-player-play-pause"
              onClick={onTogglePlay}
              className="w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-105 active:scale-95"
              style={{ backgroundColor: activeAccentColor, color: "#381E72" }}
              title={playbackState.isPlaying ? "Pause" : "Play"}
            >
              {playbackState.isPlaying ? (
                <Pause className="w-5 h-5 fill-current" />
              ) : (
                <Play className="w-5 h-5 fill-current translate-x-0.5" />
              )}
            </button>

            {/* Next */}
            <button
              id="btn-player-next"
              onClick={onNext}
              className="p-2 rounded-full text-[#CAC4D0] hover:text-[#E6E1E5] hover:bg-[#2B2930] transition-colors"
              title="Next Track"
            >
              <SkipForward className="w-4 h-4 fill-current" />
            </button>

            {/* Repeat */}
            <button
              id="btn-player-repeat"
              onClick={onToggleRepeat}
              className={`p-2 rounded-full transition-colors ${
                playbackState.repeatMode !== "off"
                  ? "font-bold"
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
                <Repeat1 className="w-3.5 h-3.5" />
              ) : (
                <Repeat className="w-3.5 h-3.5" />
              )}
            </button>
          </div>

          {/* Time display (desktop) */}
          <div className="hidden md:flex items-center gap-2 text-[10px] font-mono text-[#938F99]">
            <span>{formatTime(playbackState.currentTime)}</span>
            <span>/</span>
            <span>{formatTime(playbackState.duration)}</span>
          </div>
        </div>

        {/* Right: Audio FX, Volume & Expand */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Equalizer Quick Button */}
          <button
            id="btn-player-eq"
            onClick={onOpenEqualizer}
            className="p-2 rounded-full hover:bg-[#2B2930] text-[#CAC4D0] hover:text-[#E6E1E5] transition-colors"
            title="10-Band Equalizer"
          >
            <Sliders className="w-4 h-4" />
          </button>

          {/* Volume Control */}
          <div className="relative flex items-center">
            <button
              onClick={() =>
                onVolumeChange(playbackState.volume === 0 ? 0.8 : 0)
              }
              className="p-2 rounded-full hover:bg-[#2B2930] text-[#CAC4D0] hover:text-[#E6E1E5] transition-colors"
            >
              {playbackState.volume === 0 ? (
                <VolumeX className="w-4 h-4" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </button>

            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={playbackState.volume}
              onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
              className="hidden lg:block w-20 h-1.5 accent-[#D0BCFF] bg-[#2B2930] rounded-full cursor-pointer"
              style={{ accentColor: activeAccentColor }}
            />
          </div>

          {/* Expand Full Player Modal Button */}
          <button
            id="btn-player-expand-modal"
            onClick={onOpenFullModal}
            className="p-2 rounded-full hover:bg-[#2B2930] text-[#CAC4D0] hover:text-[#E6E1E5] transition-colors"
            title="Open Full Player"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
