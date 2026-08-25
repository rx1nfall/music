import React, { useState, useRef } from "react";
import {
  FolderOpen,
  UploadCloud,
  FileAudio,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  Sparkles,
  Layers,
  HardDrive,
} from "lucide-react";
import { Track } from "../types/music";
import { parseAudioFile } from "../services/metadataParser";
import { StorageService } from "../services/storageService";

interface FolderPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onTracksImported: (tracks: Track[]) => void;
  activeAccentColor: string;
}

const SUPPORTED_EXTENSIONS = [
  "mp3",
  "wav",
  "flac",
  "ogg",
  "m4a",
  "mp4",
  "aac",
  "opus",
  "webm",
];

export const FolderPicker: React.FC<FolderPickerProps> = ({
  isOpen,
  onClose,
  onTracksImported,
  activeAccentColor,
}) => {
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState({
    current: 0,
    total: 0,
    currentFileName: "",
  });
  const [dragOver, setDragOver] = useState(false);
  const [importedCount, setImportedCount] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  // Modern File System Access API directory picker
  const handlePickDirectoryNative = async () => {
    setErrorMsg(null);
    if ("showDirectoryPicker" in window) {
      try {
        setIsScanning(true);
        const dirHandle = await (window as any).showDirectoryPicker({
          mode: "read",
        });

        const files: { file: File; path: string }[] = [];
        await scanDirectoryHandle(dirHandle, "", files);

        if (files.length === 0) {
          setErrorMsg("No supported audio files (MP3, FLAC, WAV, OGG, M4A) found in the selected folder.");
          setIsScanning(false);
          return;
        }

        await processAndSaveAudioFiles(files);
      } catch (err: any) {
        if (err.name !== "AbortError") {
          console.error("Directory picker error:", err);
          setErrorMsg(err.message || "Failed to read folder.");
        }
        setIsScanning(false);
      }
    } else {
      // Fallback to webkitdirectory input
      fileInputRef.current?.click();
    }
  };

  const scanDirectoryHandle = async (
    dirHandle: any,
    currentPath: string,
    resultList: { file: File; path: string }[]
  ) => {
    for await (const entry of dirHandle.values()) {
      if (entry.kind === "file") {
        const file = await entry.getFile();
        const ext = file.name.split(".").pop()?.toLowerCase() || "";
        if (SUPPORTED_EXTENSIONS.includes(ext)) {
          resultList.push({
            file,
            path: currentPath ? `${currentPath}/${file.name}` : file.name,
          });
        }
      } else if (entry.kind === "directory") {
        const newPath = currentPath ? `${currentPath}/${entry.name}` : entry.name;
        await scanDirectoryHandle(entry, newPath, resultList);
      }
    }
  };

  // HTML5 Fallback file picker
  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    setErrorMsg(null);
    setIsScanning(true);

    const validFiles: { file: File; path: string }[] = [];
    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      const ext = file.name.split(".").pop()?.toLowerCase() || "";
      if (SUPPORTED_EXTENSIONS.includes(ext)) {
        validFiles.push({
          file,
          path: file.webkitRelativePath || file.name,
        });
      }
    }

    if (validFiles.length === 0) {
      setErrorMsg("No supported audio files found in selected directory.");
      setIsScanning(false);
      return;
    }

    await processAndSaveAudioFiles(validFiles);
  };

  // Drag & Drop Folder or Files
  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    setErrorMsg(null);

    const items = e.dataTransfer.items;
    if (!items || items.length === 0) return;

    setIsScanning(true);
    const validFiles: { file: File; path: string }[] = [];

    // Helper for DataTransferItemList webkitGetAsEntry
    const traverseEntry = async (entry: any, path: string) => {
      if (entry.isFile) {
        return new Promise<void>((resolve) => {
          entry.file((file: File) => {
            const ext = file.name.split(".").pop()?.toLowerCase() || "";
            if (SUPPORTED_EXTENSIONS.includes(ext)) {
              validFiles.push({
                file,
                path: path ? `${path}/${file.name}` : file.name,
              });
            }
            resolve();
          });
        });
      } else if (entry.isDirectory) {
        const dirReader = entry.createReader();
        const readEntries = async (): Promise<any[]> => {
          return new Promise((resolve) => {
            dirReader.readEntries((entries: any[]) => resolve(entries));
          });
        };

        let entries: any[] = [];
        let batch: any[] = [];
        do {
          batch = await readEntries();
          entries = entries.concat(batch);
        } while (batch.length > 0);

        for (const child of entries) {
          await traverseEntry(child, path ? `${path}/${entry.name}` : entry.name);
        }
      }
    };

    try {
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.webkitGetAsEntry) {
          const entry = item.webkitGetAsEntry();
          if (entry) {
            await traverseEntry(entry, "");
          }
        }
      }

      if (validFiles.length === 0) {
        setErrorMsg("No supported audio files detected in dropped folder.");
        setIsScanning(false);
        return;
      }

      await processAndSaveAudioFiles(validFiles);
    } catch (err: any) {
      console.error("Drop folder error:", err);
      setErrorMsg("Error parsing dropped folder.");
      setIsScanning(false);
    }
  };

  // Parse Metadata & Persist into IndexedDB
  const processAndSaveAudioFiles = async (
    files: { file: File; path: string }[]
  ) => {
    setScanProgress({ current: 0, total: files.length, currentFileName: "" });
    const parsedTracks: Track[] = [];

    for (let i = 0; i < files.length; i++) {
      const { file, path } = files[i];
      setScanProgress({
        current: i + 1,
        total: files.length,
        currentFileName: file.name,
      });

      const trackId = "local_" + Math.random().toString(36).substring(2, 9) + "_" + Date.now();
      const meta = await parseAudioFile(file, path);

      // Save blob to IndexedDB for seamless offline playback
      await StorageService.saveAudioBlob(trackId, file);

      const newTrack: Track = {
        id: trackId,
        title: meta.title || file.name,
        artist: meta.artist || "Unknown Artist",
        album: meta.album || "Unknown Album",
        year: meta.year,
        genre: meta.genre,
        duration: meta.duration || 180,
        format: meta.format || "mp3",
        bitrate: meta.bitrate || "320 kbps",
        sampleRate: meta.sampleRate || "44.1 kHz",
        bitDepth: meta.bitDepth || "16-bit",
        isLossless: meta.isLossless || false,
        fileSize: file.size,
        coverArtUrl: meta.coverArtUrl,
        accentColor: meta.accentColor || activeAccentColor,
        filePath: path,
        addedAt: Date.now(),
        syncSource: "local",
        isOfflineCached: true,
        playCount: 0,
        isFavorite: false,
        blobKey: trackId,
      };

      parsedTracks.push(newTrack);
    }

    onTracksImported(parsedTracks);
    setIsScanning(false);
    setImportedCount(parsedTracks.length);

    setTimeout(() => {
      onClose();
    }, 1200);
  };

  return (
    <div
      id="folder-picker-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div
        className="w-full max-w-lg p-6 rounded-3xl bg-[#1C1B1F] text-[#E6E1E5] border border-[#49454F]/40 shadow-2xl space-y-5"
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="p-2.5 rounded-2xl shadow-md"
              style={{ backgroundColor: activeAccentColor, color: "#381E72" }}
            >
              <FolderOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#E6E1E5]">
                Import Music Folder
              </h2>
              <p className="text-xs text-[#938F99]">
                Sync music directly from your computer storage
              </p>
            </div>
          </div>

          {!isScanning && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-[#2B2930] text-[#CAC4D0] hover:text-[#E6E1E5] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Scan Progress State */}
        {isScanning ? (
          <div className="py-8 space-y-4 text-center">
            <div className="relative flex items-center justify-center">
              <Loader2
                className="w-12 h-12 animate-spin text-[#D0BCFF]"
                style={{ color: activeAccentColor }}
              />
              <span className="absolute text-xs font-mono font-bold text-[#EADDFF]">
                {Math.round((scanProgress.current / Math.max(1, scanProgress.total)) * 100)}%
              </span>
            </div>

            <div className="space-y-1">
              <p className="text-sm font-semibold text-[#E6E1E5]">
                Extracting Hi-Fi Metadata & Artwork...
              </p>
              <p className="text-xs text-[#938F99] font-mono truncate max-w-sm mx-auto">
                {scanProgress.currentFileName || "Scanning..."}
              </p>
              <p className="text-xs text-[#CAC4D0]">
                {scanProgress.current} of {scanProgress.total} tracks parsed
              </p>
            </div>

            <div className="w-full bg-[#2B2930] h-2 rounded-full overflow-hidden border border-[#49454F]/20">
              <div
                className="h-full transition-all duration-150 rounded-full"
                style={{
                  width: `${(scanProgress.current / Math.max(1, scanProgress.total)) * 100}%`,
                  backgroundColor: activeAccentColor,
                }}
              />
            </div>
          </div>
        ) : importedCount !== null ? (
          <div className="py-8 space-y-3 text-center animate-in zoom-in-95">
            <div className="inline-flex p-3 rounded-full bg-emerald-500/20 text-emerald-400">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h3 className="text-base font-bold text-[#E6E1E5]">
              {importedCount} Tracks Successfully Added!
            </h3>
            <p className="text-xs text-[#938F99]">
              Cached locally in IndexedDB &bull; Ready for Gapless playback & Cloud sync.
            </p>
          </div>
        ) : (
          /* Dropzone & Actions */
          <div className="space-y-4">
            <div
              onClick={handlePickDirectoryNative}
              className={`p-8 border-2 border-dashed rounded-2xl text-center cursor-pointer transition-all ${
                dragOver
                  ? "border-[#D0BCFF] bg-[#D0BCFF]/10 scale-[1.01]"
                  : "border-[#49454F] hover:border-[#CAC4D0] bg-[#2B2930]/60 hover:bg-[#2B2930]"
              }`}
            >
              <div className="flex flex-col items-center gap-3">
                <div className="p-3 rounded-2xl bg-[#1C1B1F] text-[#D0BCFF] border border-[#49454F]/30">
                  <UploadCloud className="w-8 h-8" />
                </div>
                <div>
                  <p className="text-sm font-bold text-[#E6E1E5]">
                    Click to Choose Folder or Drag & Drop Here
                  </p>
                  <p className="text-xs text-[#938F99] mt-1">
                    Select your Music directory containing albums, artists, or audio files
                  </p>
                </div>
              </div>
            </div>

            {/* Hidden Input Fallback */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileInputChange}
              // @ts-ignore
              webkitdirectory=""
              directory=""
              multiple
              className="hidden"
            />

            {/* Supported Formats Pill Row */}
            <div>
              <div className="text-[11px] font-semibold uppercase text-[#938F99] mb-2">
                Supported High-Fidelity Audio Formats
              </div>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { name: "FLAC", desc: "Lossless Hi-Res" },
                  { name: "WAV", desc: "PCM Uncompressed" },
                  { name: "MP3", desc: "ID3v2 320k" },
                  { name: "OGG", desc: "Vorbis" },
                  { name: "M4A / AAC", desc: "ALAC / Apple" },
                  { name: "OPUS", desc: "Ultra-Efficient" },
                ].map((fmt) => (
                  <span
                    key={fmt.name}
                    className="px-2.5 py-1 rounded-full text-xs font-mono font-medium bg-[#2B2930] text-[#E6E1E5] border border-[#49454F]/40"
                  >
                    <span className="font-bold text-[#EADDFF]">{fmt.name}</span>
                    <span className="text-[10px] text-[#938F99] ml-1">({fmt.desc})</span>
                  </span>
                ))}
              </div>
            </div>

            {/* Error Message */}
            {errorMsg && (
              <div className="flex items-center gap-2 p-3 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Buttons */}
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-full text-xs font-semibold text-[#CAC4D0] hover:bg-[#2B2930] hover:text-[#E6E1E5] transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                id="btn-select-music-folder-action"
                onClick={handlePickDirectoryNative}
                className="px-5 py-2.5 rounded-full text-xs font-bold text-[#381E72] bg-[#D0BCFF] shadow-md transition-transform hover:scale-[1.02] active:scale-[0.98]"
                style={{
                  backgroundColor: activeAccentColor,
                  color: "#381E72",
                }}
              >
                Select Folder on Computer
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
