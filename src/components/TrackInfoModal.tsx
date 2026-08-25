import React from "react";
import {
  Info,
  X,
  Disc3,
  HardDrive,
  Cpu,
  FileCode,
  Layers,
  Sparkles,
  ShieldCheck,
  Music,
} from "lucide-react";
import { Track } from "../types/music";

interface TrackInfoModalProps {
  track: Track | null;
  isOpen: boolean;
  onClose: () => void;
  activeAccentColor: string;
}

export const TrackInfoModal: React.FC<TrackInfoModalProps> = ({
  track,
  isOpen,
  onClose,
  activeAccentColor,
}) => {
  if (!isOpen || !track) return null;

  const formatFileSize = (bytes: number) => {
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(2)} MB (${bytes.toLocaleString()} bytes)`;
  };

  return (
    <div
      id="track-info-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div className="w-full max-w-lg max-h-[85vh] overflow-y-auto p-6 rounded-3xl bg-[#1C1B1F] text-[#E6E1E5] border border-[#49454F]/40 shadow-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="p-2.5 rounded-2xl shadow-md"
              style={{ backgroundColor: activeAccentColor, color: "#381E72" }}
            >
              <Info className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#E6E1E5]">Hi-Fi Audio Stream Details</h2>
              <p className="text-xs text-[#938F99]">Codec, Tag & Storage Inspection</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-[#2B2930] text-[#CAC4D0] hover:text-[#E6E1E5] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Track Hero */}
        <div className="flex items-center gap-4 p-4 rounded-2xl bg-[#2B2930] border border-[#49454F]/40">
          <div className="w-16 h-16 rounded-xl overflow-hidden bg-[#1C1B1F] shrink-0 border border-[#49454F]/30">
            {track.coverArtUrl ? (
              <img
                src={track.coverArtUrl}
                alt={track.title}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div
                className="w-full h-full flex items-center justify-center"
                style={{ backgroundColor: track.accentColor || activeAccentColor, color: "#381E72" }}
              >
                <Disc3 className="w-8 h-8" />
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-bold text-[#E6E1E5] truncate">{track.title}</h3>
            <p className="text-xs text-[#CAC4D0] truncate">{track.artist}</p>
            <p className="text-[11px] text-[#938F99] truncate">{track.album}</p>
          </div>
        </div>

        {/* Specifications Grid */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="p-3.5 rounded-2xl bg-[#2B2930] border border-[#49454F]/20 space-y-1">
            <span className="text-[#938F99] block">Audio Container</span>
            <span className="font-mono font-bold uppercase text-[#EADDFF]">
              {track.format}
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#2B2930] border border-[#49454F]/20 space-y-1">
            <span className="text-[#938F99] block">Fidelity Grade</span>
            <span className="font-mono font-bold text-amber-300">
              {track.isLossless ? "Lossless Studio Master" : "High-Bitrate Compressed"}
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#2B2930] border border-[#49454F]/20 space-y-1">
            <span className="text-[#938F99] block">Sample Rate</span>
            <span className="font-mono font-bold text-[#E6E1E5]">
              {track.sampleRate || "44.1 kHz"}
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#2B2930] border border-[#49454F]/20 space-y-1">
            <span className="text-[#938F99] block">Bit Depth</span>
            <span className="font-mono font-bold text-[#E6E1E5]">
              {track.bitDepth || (track.isLossless ? "24-bit" : "16-bit")}
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#2B2930] border border-[#49454F]/20 space-y-1">
            <span className="text-[#938F99] block">Bitrate</span>
            <span className="font-mono font-bold text-[#E6E1E5]">
              {track.bitrate || "320 kbps"}
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#2B2930] border border-[#49454F]/20 space-y-1">
            <span className="text-[#938F99] block">Payload Size</span>
            <span className="font-mono font-bold text-[#E6E1E5]">
              {formatFileSize(track.fileSize)}
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#2B2930] border border-[#49454F]/20 space-y-1">
            <span className="text-[#938F99] block">Genre / Year</span>
            <span className="font-mono font-bold text-[#E6E1E5]">
              {track.genre || "General"} {track.year ? `(${track.year})` : ""}
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#2B2930] border border-[#49454F]/20 space-y-1">
            <span className="text-[#938F99] block">Storage Vault</span>
            <span className="font-mono font-bold text-emerald-400">
              {track.isOfflineCached
                ? "IndexedDB Blob Cache"
                : track.syncSource === "cloud"
                ? "Cloud Sync Relay"
                : "Local File System"}
            </span>
          </div>
        </div>

        {track.filePath && (
          <div className="p-3 rounded-2xl bg-[#2B2930] border border-[#49454F]/30 text-[11px] font-mono text-[#938F99] break-all">
            <span className="text-[#CAC4D0] block mb-1">Path origin:</span>
            {track.filePath}
          </div>
        )}

        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-full text-xs font-bold bg-[#D0BCFF] text-[#381E72] hover:bg-[#EADDFF] transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
