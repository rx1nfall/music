import React, { useState } from "react";
import {
  ListMusic,
  Plus,
  Trash2,
  Edit2,
  X,
  Sparkles,
  Music2,
  Play,
  Shuffle,
  Check,
} from "lucide-react";
import { Playlist, Track } from "../types/music";

interface PlaylistManagerProps {
  isOpen: boolean;
  onClose: () => void;
  onCreatePlaylist: (name: string, description: string) => void;
  onDeletePlaylist?: (id: string) => void;
  activeAccentColor: string;
}

export const PlaylistManagerModal: React.FC<PlaylistManagerProps> = ({
  isOpen,
  onClose,
  onCreatePlaylist,
  activeAccentColor,
}) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onCreatePlaylist(name.trim(), description.trim());
    setName("");
    setDescription("");
    onClose();
  };

  return (
    <div
      id="create-playlist-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div className="w-full max-w-md p-6 rounded-3xl bg-[#1C1B1F] text-[#E6E1E5] border border-[#49454F]/40 shadow-2xl space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="p-2.5 rounded-2xl shadow-md"
              style={{ backgroundColor: activeAccentColor, color: "#381E72" }}
            >
              <ListMusic className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#E6E1E5]">New Playlist</h2>
              <p className="text-xs text-[#938F99]">Organize your favorite tracks</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-[#2B2930] text-[#CAC4D0] hover:text-[#E6E1E5] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-[#CAC4D0]">Playlist Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Audiophile Night Drive, Chill FLAC"
              className="w-full px-4 py-2.5 rounded-2xl bg-[#2B2930] border border-[#49454F]/40 text-sm text-[#E6E1E5] placeholder-[#938F99] focus:outline-none focus:border-[#D0BCFF]"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-[#CAC4D0]">Description (Optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add optional notes or mood tags..."
              rows={3}
              className="w-full px-4 py-2.5 rounded-2xl bg-[#2B2930] border border-[#49454F]/40 text-sm text-[#E6E1E5] placeholder-[#938F99] focus:outline-none focus:border-[#D0BCFF] resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-full text-xs font-semibold text-[#CAC4D0] hover:bg-[#2B2930] hover:text-[#E6E1E5] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-full text-xs font-bold text-[#381E72] bg-[#D0BCFF] shadow-md transition-transform hover:scale-[1.02] active:scale-[0.98]"
              style={{ backgroundColor: activeAccentColor, color: "#381E72" }}
            >
              Create Playlist
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
