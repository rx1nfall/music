import React, { useState } from "react";
import {
  Cloud,
  Smartphone,
  Laptop,
  QrCode,
  Copy,
  Check,
  Radio,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  X,
  Sparkles,
  DownloadCloud,
  AlertCircle,
  HardDrive,
} from "lucide-react";
import { SyncSessionState, Track } from "../types/music";

interface CloudSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  syncState: SyncSessionState;
  onStartHostSession: () => Promise<void>;
  onJoinClientSession: (code: string) => Promise<void>;
  onPushLibraryToCloud: () => Promise<void>;
  onDownloadAllSyncedTracks: () => Promise<void>;
  tracksCount: number;
  activeAccentColor: string;
}

export const CloudSyncModal: React.FC<CloudSyncModalProps> = ({
  isOpen,
  onClose,
  syncState,
  onStartHostSession,
  onJoinClientSession,
  onPushLibraryToCloud,
  onDownloadAllSyncedTracks,
  tracksCount,
  activeAccentColor,
}) => {
  const [joinCodeInput, setJoinCodeInput] = useState("");
  const [copied, setCopied] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSyncingLibrary, setIsSyncingLibrary] = useState(false);

  if (!isOpen) return null;

  const handleCopyCode = () => {
    if (syncState.sessionCode) {
      navigator.clipboard.writeText(syncState.sessionCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCodeInput.trim()) return;

    setErrorMsg(null);
    setIsSubmitting(true);
    try {
      await onJoinClientSession(joinCodeInput.trim().toUpperCase());
      setIsSubmitting(false);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to join sync session");
      setIsSubmitting(false);
    }
  };

  const handlePush = async () => {
    setIsSyncingLibrary(true);
    try {
      await onPushLibraryToCloud();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to push library");
    } finally {
      setIsSyncingLibrary(false);
    }
  };

  return (
    <div
      id="cloud-sync-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 rounded-3xl bg-[#1C1B1F] text-[#E6E1E5] border border-[#49454F]/40 shadow-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="p-2.5 rounded-2xl shadow-md"
              style={{ backgroundColor: activeAccentColor, color: "#381E72" }}
            >
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-[#E6E1E5]">Cloud & Cross-Device Sync</h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  E2E Secure
                </span>
              </div>
              <p className="text-xs text-[#938F99]">
                Stream from computer to phone & synchronize offline libraries
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

        {/* Sync Status Banner */}
        {syncState.isConnected ? (
          <div className="p-4 rounded-2xl bg-[#2B2930] border border-emerald-500/30 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span>Active Sync Session</span>
              </div>
              <span className="text-xs font-mono text-[#CAC4D0]">
                Role: {syncState.role === "host" ? "Desktop Host" : "Phone Client"}
              </span>
            </div>

            {syncState.role === "host" ? (
              <div className="space-y-3">
                <p className="text-xs text-[#CAC4D0]">
                  Your computer is hosting the library. Enter this 6-digit code on your phone to connect:
                </p>

                <div className="flex items-center justify-between p-3 rounded-2xl bg-[#1C1B1F] border border-[#49454F]/40">
                  <span className="text-2xl font-mono font-bold tracking-widest text-[#EADDFF]">
                    {syncState.sessionCode}
                  </span>

                  <button
                    onClick={handleCopyCode}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#2B2930] hover:bg-[#36343B] text-xs font-semibold text-[#E6E1E5] border border-[#49454F]/30 transition-colors"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-[#D0BCFF]" />
                        <span>Copy Code</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handlePush}
                    disabled={isSyncingLibrary}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-2xl bg-[#2B2930] hover:bg-[#36343B] text-xs font-bold text-[#E6E1E5] border border-[#49454F]/40 transition-colors"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 text-[#D0BCFF] ${isSyncingLibrary ? "animate-spin" : ""}`} />
                    <span>Push Updated Library ({tracksCount} Tracks)</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-[#CAC4D0]">
                  Connected to host: <span className="font-bold text-[#EADDFF]">{syncState.hostDevice}</span>
                </p>

                <button
                  onClick={onDownloadAllSyncedTracks}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-2xl text-xs font-bold text-[#381E72] bg-[#D0BCFF] shadow-md transition-transform hover:scale-[1.02]"
                  style={{ backgroundColor: activeAccentColor, color: "#381E72" }}
                >
                  <DownloadCloud className="w-4 h-4" />
                  <span>Download Library to Phone (IndexedDB Offline Storage)</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          /* Choose Host or Phone Mode */
          <div className="space-y-4">
            {/* Host Option */}
            <div className="p-4 rounded-2xl bg-[#2B2930] border border-[#49454F]/40 space-y-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-[#D0BCFF]/20 text-[#D0BCFF]">
                  <Laptop className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#E6E1E5]">This Device is My Computer</h3>
                  <p className="text-xs text-[#938F99]">
                    Host your local folder library and generate a pairing code for your phone
                  </p>
                </div>
              </div>

              <button
                id="btn-start-sync-host"
                onClick={onStartHostSession}
                className="w-full py-2.5 rounded-xl text-xs font-bold text-[#381E72] bg-[#D0BCFF] shadow-md transition-transform hover:scale-[1.01]"
                style={{ backgroundColor: activeAccentColor, color: "#381E72" }}
              >
                Generate 6-Digit Phone Pair Code
              </button>
            </div>

            {/* Client Option (Phone Join) */}
            <div className="p-4 rounded-2xl bg-[#2B2930] border border-[#49454F]/40 space-y-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#E6E1E5]">This Device is My Phone</h3>
                  <p className="text-xs text-[#938F99]">
                    Enter the 6-digit sync code displayed on your computer screen
                  </p>
                </div>
              </div>

              <form onSubmit={handleJoin} className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={joinCodeInput}
                    onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
                    placeholder="e.g. 749210 or CODE"
                    maxLength={10}
                    className="flex-1 px-4 py-2.5 text-sm font-mono uppercase font-bold rounded-xl bg-[#1C1B1F] border border-[#49454F]/60 text-[#E6E1E5] placeholder-[#938F99] focus:outline-none focus:border-[#D0BCFF] text-center tracking-widest"
                  />
                  <button
                    type="submit"
                    disabled={isSubmitting || !joinCodeInput.trim()}
                    className="px-5 py-2.5 rounded-xl text-xs font-bold bg-[#D0BCFF] text-[#381E72] hover:bg-[#EADDFF] disabled:opacity-50 transition-colors"
                  >
                    {isSubmitting ? "Connecting..." : "Connect"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Error Alert */}
        {errorMsg && (
          <div className="flex items-center gap-2 p-3 rounded-2xl bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Security & Data Privacy Notice */}
        <div className="p-3.5 rounded-2xl bg-[#2B2930] border border-[#49454F]/30 text-[#CAC4D0] space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-bold text-[#E6E1E5]">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Privacy & High-Fidelity Assurance</span>
          </div>
          <p className="text-[11px] leading-relaxed text-[#938F99]">
            All audio is relayed using secure tokenized streams or stored locally in browser
            IndexedDB storage. No user accounts, advertising trackers, or data harvesting.
          </p>
        </div>
      </div>
    </div>
  );
};
