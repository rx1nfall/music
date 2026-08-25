import React, { useState } from "react";
import {
  Play,
  Pause,
  Heart,
  MoreVertical,
  HardDrive,
  Cloud,
  Disc3,
  Clock,
  Plus,
  Trash2,
  Download,
  Info,
  ListPlus,
  Shuffle,
  Volume2,
  Sparkles,
  ArrowUpDown,
} from "lucide-react";
import { Track, Playlist } from "../types/music";

interface TrackListProps {
  tracks: Track[];
  currentTrackId: string | null;
  isPlaying: boolean;
  onPlayTrack: (track: Track) => void;
  onTogglePlayPause: () => void;
  onToggleFavorite: (trackId: string) => void;
  onPlayAll: (tracks: Track[], shuffle?: boolean) => void;
  onAddToPlaylist: (trackId: string, playlistId: string) => void;
  onToggleOfflineCache: (track: Track) => void;
  onOpenTrackInfo: (track: Track) => void;
  playlists: Playlist[];
  activeAccentColor: string;
  listTitle?: string;
  listSubtitle?: string;
  headerAction?: React.ReactNode;
}

export const TrackList: React.FC<TrackListProps> = ({
  tracks,
  currentTrackId,
  isPlaying,
  onPlayTrack,
  onTogglePlayPause,
  onToggleFavorite,
  onPlayAll,
  onAddToPlaylist,
  onToggleOfflineCache,
  onOpenTrackInfo,
  playlists,
  activeAccentColor,
  listTitle = "All Music",
  listSubtitle,
  headerAction,
}) => {
  const [activeMenuTrackId, setActiveMenuTrackId] = useState<string | null>(null);
  const [showPlaylistSubmenu, setShowPlaylistSubmenu] = useState(false);
  const [sortBy, setSortBy] = useState<"title" | "artist" | "album" | "duration" | "addedAt">("addedAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const formatDuration = (sec: number): string => {
    const mins = Math.floor(sec / 60);
    const remainingSec = Math.floor(sec % 60);
    return `${mins}:${remainingSec < 10 ? "0" : ""}${remainingSec}`;
  };

  const sortedTracks = [...tracks].sort((a, b) => {
    let comparison = 0;
    if (sortBy === "title") comparison = a.title.localeCompare(b.title);
    else if (sortBy === "artist") comparison = a.artist.localeCompare(b.artist);
    else if (sortBy === "album") comparison = a.album.localeCompare(b.album);
    else if (sortBy === "duration") comparison = a.duration - b.duration;
    else if (sortBy === "addedAt") comparison = a.addedAt - b.addedAt;

    return sortOrder === "asc" ? comparison : -comparison;
  });

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto px-4 sm:px-8 py-6 text-[#E6E1E5]">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#E6E1E5]">
              {listTitle}
            </h1>
            <span
              className="text-xs font-bold px-2 py-0.5 rounded-full"
              style={{
                backgroundColor: `${activeAccentColor}25`,
                color: activeAccentColor,
              }}
            >
              {tracks.length} {tracks.length === 1 ? "Track" : "Tracks"}
            </span>
          </div>
          {listSubtitle && (
            <p className="text-xs sm:text-sm text-[#CAC4D0] mt-1">
              {listSubtitle}
            </p>
          )}
        </div>

        {/* Action Buttons & Sort */}
        <div className="flex items-center gap-2">
          {tracks.length > 0 && (
            <>
              <button
                id="btn-tracklist-play-all"
                onClick={() => onPlayAll(sortedTracks, false)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold shadow-md transition-transform hover:scale-105 active:scale-95"
                style={{ backgroundColor: activeAccentColor, color: "#381E72" }}
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Play All</span>
              </button>

              <button
                id="btn-tracklist-shuffle-all"
                onClick={() => onPlayAll(sortedTracks, true)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold bg-[#2B2930] hover:bg-[#36343B] text-[#E6E1E5] border border-[#49454F]/40 transition-colors"
                title="Shuffle Play"
              >
                <Shuffle className="w-3.5 h-3.5 text-[#D0BCFF]" />
                <span className="hidden sm:inline">Shuffle</span>
              </button>
            </>
          )}

          {headerAction}

          {/* Sort selector */}
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 text-xs font-medium rounded-full bg-[#2B2930] text-[#E6E1E5] border border-[#49454F]/40 focus:border-[#D0BCFF] cursor-pointer outline-none"
            >
              <option value="addedAt">Recent</option>
              <option value="title">Title</option>
              <option value="artist">Artist</option>
              <option value="duration">Duration</option>
            </select>
          </div>
        </div>
      </div>

      {/* Empty State */}
      {tracks.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-12 text-center my-auto">
          <div className="p-4 rounded-3xl bg-[#211F26] border border-[#49454F]/30 text-[#938F99] mb-3">
            <Disc3 className="w-10 h-10 animate-spin-slow text-[#D0BCFF]" />
          </div>
          <h3 className="text-base font-bold text-[#E6E1E5] mb-1">
            No audio tracks in this section
          </h3>
          <p className="text-xs text-[#938F99] max-w-sm">
            Import a folder from your computer, connect your phone, or create a custom playlist.
          </p>
        </div>
      ) : (
        /* Track Table */
        <div className="space-y-1.5 pb-24">
          {sortedTracks.map((track, index) => {
            const isCurrent = currentTrackId === track.id;
            const isMenuOpen = activeMenuTrackId === track.id;

            return (
              <div
                key={track.id}
                id={`track-item-${track.id}`}
                className={`group relative flex items-center justify-between px-3.5 py-2.5 rounded-2xl transition-all duration-150 select-none ${
                  isCurrent
                    ? "bg-[#2B2930] border border-[#D0BCFF]/30 shadow-md"
                    : "hover:bg-[#211F26] border border-transparent hover:border-[#49454F]/20"
                }`}
              >
                {/* Left: Play Trigger / Index & Artwork & Title */}
                <div
                  className="flex items-center gap-3.5 min-w-0 flex-1 cursor-pointer"
                  onClick={() => {
                    if (isCurrent) onTogglePlayPause();
                    else onPlayTrack(track);
                  }}
                >
                  {/* Artwork / Index */}
                  <div className="relative w-11 h-11 rounded-xl overflow-hidden bg-[#2B2930] border border-[#49454F]/30 shrink-0 shadow-sm">
                    {track.coverArtUrl ? (
                      <img
                        src={track.coverArtUrl}
                        alt={track.title}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div
                        className="w-full h-full flex items-center justify-center text-white"
                        style={{ backgroundColor: track.accentColor || activeAccentColor }}
                      >
                        <Disc3 className="w-5 h-5 opacity-70" />
                      </div>
                    )}

                    {/* Hover Play / Playing indicator overlay */}
                    <div
                      className={`absolute inset-0 flex items-center justify-center bg-black/50 transition-opacity ${
                        isCurrent ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                      }`}
                    >
                      {isCurrent && isPlaying ? (
                        <div className="flex items-end gap-0.5 h-4">
                          <span
                            className="w-1 bg-[#D0BCFF] rounded-full animate-pulse"
                            style={{ height: "60%" }}
                          />
                          <span
                            className="w-1 bg-[#D0BCFF] rounded-full animate-pulse"
                            style={{ height: "100%", animationDelay: "150ms" }}
                          />
                          <span
                            className="w-1 bg-[#D0BCFF] rounded-full animate-pulse"
                            style={{ height: "40%", animationDelay: "300ms" }}
                          />
                        </div>
                      ) : (
                        <Play className="w-4 h-4 fill-white text-white translate-x-0.5" />
                      )}
                    </div>
                  </div>

                  {/* Title & Artist & Format Badges */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p
                        className={`text-xs sm:text-sm font-semibold truncate ${
                          isCurrent
                            ? "font-bold text-[#D0BCFF]"
                            : "text-[#E6E1E5]"
                        }`}
                        style={isCurrent ? { color: activeAccentColor } : undefined}
                      >
                        {track.title}
                      </p>

                      {/* Hi-Res / Lossless Badge */}
                      {track.isLossless && (
                        <span className="hidden sm:inline-flex items-center text-[9px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.2 rounded bg-amber-400/15 text-amber-300 border border-amber-400/30">
                          Hi-Res
                        </span>
                      )}

                      <span className="hidden md:inline-flex text-[9px] font-mono uppercase px-1.5 py-0.2 rounded bg-[#36343B] text-[#CAC4D0] border border-[#49454F]/40">
                        {track.format}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-[#CAC4D0] truncate mt-0.5">
                      <span className="truncate">{track.artist}</span>
                      <span className="opacity-40">&bull;</span>
                      <span className="hidden sm:inline truncate">{track.album}</span>
                    </div>
                  </div>
                </div>

                {/* Right: Storage Status, Duration, Favorite, Menu */}
                <div className="flex items-center gap-2 sm:gap-4 shrink-0 pl-2">
                  {/* Offline status badge */}
                  <button
                    onClick={() => onToggleOfflineCache(track)}
                    className="p-1.5 rounded-full hover:bg-[#36343B] text-[#CAC4D0] hover:text-[#E6E1E5] transition-colors"
                    title={
                      track.isOfflineCached
                        ? "Cached in IndexedDB for Offline Playback"
                        : "Download for Offline Playback"
                    }
                  >
                    {track.isOfflineCached ? (
                      <HardDrive className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Download className="w-3.5 h-3.5 opacity-40 hover:opacity-100 text-[#CAC4D0]" />
                    )}
                  </button>

                  {/* Favorite Toggle */}
                  <button
                    id={`btn-fav-${track.id}`}
                    onClick={() => onToggleFavorite(track.id)}
                    className="p-1.5 rounded-full hover:bg-[#36343B] transition-colors"
                    title={track.isFavorite ? "Remove from Favorites" : "Add to Favorites"}
                  >
                    <Heart
                      className={`w-3.5 h-3.5 transition-transform ${
                        track.isFavorite
                          ? "fill-rose-400 text-rose-400 scale-110"
                          : "text-[#938F99] hover:text-[#E6E1E5]"
                      }`}
                    />
                  </button>

                  {/* Duration */}
                  <span className="text-xs font-mono text-[#CAC4D0] w-10 text-right">
                    {formatDuration(track.duration)}
                  </span>

                  {/* Context Menu Button */}
                  <div className="relative">
                    <button
                      id={`btn-menu-${track.id}`}
                      onClick={() => {
                        setActiveMenuTrackId(isMenuOpen ? null : track.id);
                        setShowPlaylistSubmenu(false);
                      }}
                      className="p-1.5 rounded-full hover:bg-[#36343B] text-[#CAC4D0] hover:text-[#E6E1E5] transition-colors"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>

                    {/* Popover Menu */}
                    {isMenuOpen && (
                      <div
                        className="absolute right-0 mt-2 w-48 p-1.5 rounded-2xl shadow-2xl bg-[#2B2930] border border-[#49454F] z-50 animate-in fade-in zoom-in-95 duration-100"
                      >
                        <button
                          onClick={() => {
                            onPlayTrack(track);
                            setActiveMenuTrackId(null);
                          }}
                          className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs rounded-xl hover:bg-[#36343B] text-[#E6E1E5]"
                        >
                          <Play className="w-3.5 h-3.5 text-[#D0BCFF]" />
                          <span>Play Now</span>
                        </button>

                        <button
                          onClick={() => {
                            onToggleOfflineCache(track);
                            setActiveMenuTrackId(null);
                          }}
                          className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs rounded-xl hover:bg-[#36343B] text-[#E6E1E5]"
                        >
                          <HardDrive className="w-3.5 h-3.5 text-[#D0BCFF]" />
                          <span>{track.isOfflineCached ? "Remove from Offline" : "Save Offline"}</span>
                        </button>

                        {/* Add to Playlist Dropdown */}
                        <div className="relative">
                          <button
                            onClick={() => setShowPlaylistSubmenu(!showPlaylistSubmenu)}
                            className="w-full flex items-center justify-between px-2.5 py-1.5 text-xs rounded-xl hover:bg-[#36343B] text-[#E6E1E5]"
                          >
                            <div className="flex items-center gap-2">
                              <ListPlus className="w-3.5 h-3.5 text-[#D0BCFF]" />
                              <span>Add to Playlist</span>
                            </div>
                            <span>&rsaquo;</span>
                          </button>

                          {showPlaylistSubmenu && (
                            <div className="pl-4 py-1 space-y-1 border-l-2 border-[#49454F] my-1">
                              {playlists.map((pl) => (
                                <button
                                  key={pl.id}
                                  onClick={() => {
                                    onAddToPlaylist(track.id, pl.id);
                                    setActiveMenuTrackId(null);
                                  }}
                                  className="w-full text-left px-2 py-1 text-[11px] rounded-lg hover:bg-[#36343B] text-[#CAC4D0] hover:text-[#E6E1E5] truncate"
                                >
                                  {pl.name}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>

                        <button
                          onClick={() => {
                            onOpenTrackInfo(track);
                            setActiveMenuTrackId(null);
                          }}
                          className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs rounded-xl hover:bg-[#36343B] text-[#E6E1E5]"
                        >
                          <Info className="w-3.5 h-3.5 text-[#D0BCFF]" />
                          <span>Hi-Fi Audio Info</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
