import React, { useEffect, useState } from "react";
import {
  HardDrive,
  Trash2,
  Download,
  CheckCircle2,
  X,
  Sparkles,
  PieChart,
  Disc3,
  Layers,
  ShieldCheck,
  RefreshCw,
} from "lucide-react";
import { Track } from "../types/music";
import { StorageService } from "../services/storageService";

interface OfflineManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  tracks: Track[];
  onRemoveTrackFromCache: (trackId: string) => void;
  onDownloadAllFavorites: () => void;
  onClearAllCache: () => void;
  activeAccentColor: string;
}

export const OfflineManagerModal: React.FC<OfflineManagerModalProps> = ({
  isOpen,
  onClose,
  tracks,
  onRemoveTrackFromCache,
  onDownloadAllFavorites,
  onClearAllCache,
  activeAccentColor,
}) => {
  const [storageStats, setStorageStats] = useState<{
    cachedTracksCount: number;
    estimatedBytesUsed: number;
    quotaBytes: number;
  }>({
    cachedTracksCount: 0,
    estimatedBytesUsed: 0,
    quotaBytes: 0,
  });

  const [isLoadingStats, setIsLoadingStats] = useState(false);

  const fetchStats = async () => {
    setIsLoadingStats(true);
    const est = await StorageService.getCacheStorageEstimate();
    setStorageStats(est);
    setIsLoadingStats(false);
  };

  useEffect(() => {
    if (isOpen) {
      fetchStats();
    }
  }, [isOpen, tracks]);

  if (!isOpen) return null;

  const cachedTracks = tracks.filter((t) => t.isOfflineCached);
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 MB";
    const mb = bytes / (1024 * 1024);
    if (mb < 1000) return `${mb.toFixed(1)} MB`;
    return `${(mb / 1024).toFixed(2)} GB`;
  };

  const usagePercent =
    storageStats.quotaBytes > 0
      ? (storageStats.estimatedBytesUsed / storageStats.quotaBytes) * 100
      : 0;

  return (
    <div
      id="offline-manager-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div className="w-full max-w-xl max-h-[85vh] overflow-y-auto p-6 rounded-3xl bg-[#1C1B1F] text-[#E6E1E5] border border-[#49454F]/40 shadow-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="p-2.5 rounded-2xl shadow-md"
              style={{ backgroundColor: activeAccentColor, color: "#381E72" }}
            >
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#E6E1E5]">Offline Storage & Library Vault</h2>
              <p className="text-xs text-[#938F99]">
                IndexedDB high-capacity local audio storage for offline playback
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-[#2B2930] text-[#CAC4D0] hover:text-[#E6E1E5] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Storage Meter Card */}
        <div className="p-4 rounded-2xl bg-[#2B2930] border border-[#49454F]/40 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-[#CAC4D0]">Local Audio Cache</span>
            <span className="font-mono text-emerald-400 font-bold">
              {formatBytes(storageStats.estimatedBytesUsed)} used
            </span>
          </div>

          {/* Meter Bar */}
          <div className="w-full h-2.5 rounded-full bg-[#1C1B1F] overflow-hidden border border-[#49454F]/30">
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: `${Math.max(4, Math.min(100, usagePercent || (cachedTracks.length > 0 ? 15 : 0)))}%`,
                backgroundColor: activeAccentColor,
              }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-[#938F99]">
            <span>{cachedTracks.length} Tracks stored offline</span>
            <span>
              {storageStats.quotaBytes > 0
                ? `${formatBytes(storageStats.quotaBytes)} Available Quota`
                : "Unlimited Browser Storage"}
            </span>
          </div>
        </div>

        {/* Quick Batch Actions */}
        <div className="grid grid-cols-2 gap-2.5">
          <button
            onClick={() => {
              onDownloadAllFavorites();
              fetchStats();
            }}
            className="flex items-center justify-center gap-2 p-3 rounded-2xl bg-[#2B2930] hover:bg-[#36343B] text-xs font-semibold text-[#E6E1E5] border border-[#49454F]/40 transition-colors"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Cache All Favorites</span>
          </button>

          <button
            onClick={() => {
              onClearAllCache();
              fetchStats();
            }}
            className="flex items-center justify-center gap-2 p-3 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 text-xs font-semibold text-rose-300 border border-rose-500/30 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            <span>Clear Audio Cache</span>
          </button>
        </div>

        {/* List of Offline Cached Tracks */}
        <div>
          <div className="flex items-center justify-between text-xs font-bold text-[#938F99] uppercase tracking-wider mb-2">
            <span>Offline Saved Tracks ({cachedTracks.length})</span>
            <button
              onClick={fetchStats}
              className="flex items-center gap-1 text-[#CAC4D0] hover:text-[#E6E1E5] text-[11px]"
            >
              <RefreshCw className={`w-3 h-3 text-[#D0BCFF] ${isLoadingStats ? "animate-spin" : ""}`} />
              <span>Refresh</span>
            </button>
          </div>

          {cachedTracks.length === 0 ? (
            <div className="p-8 rounded-2xl bg-[#2B2930] text-center text-xs text-[#938F99] border border-[#49454F]/30">
              No tracks downloaded yet. Tap the download icon next to any song to enable offline playback.
            </div>
          ) : (
            <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1">
              {cachedTracks.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-[#2B2930] hover:bg-[#36343B] border border-[#49454F]/20 transition-colors"
                >
                  <div className="min-w-0 flex-1 pr-3">
                    <p className="text-xs font-semibold text-[#E6E1E5] truncate">{t.title}</p>
                    <p className="text-[11px] text-[#938F99] truncate">
                      {t.artist} &bull; {t.format.toUpperCase()} &bull; {(t.fileSize / (1024 * 1024)).toFixed(1)} MB
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      onRemoveTrackFromCache(t.id);
                      fetchStats();
                    }}
                    className="p-1.5 rounded-lg text-[#938F99] hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                    title="Remove from Offline Storage"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Privacy Note */}
        <div className="p-3 rounded-2xl bg-[#2B2930] text-[11px] text-[#CAC4D0] border border-[#49454F]/30 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>
            Offline tracks stay directly inside your private browser storage. No cloud leaks.
          </span>
        </div>
      </div>
    </div>
  );
};
