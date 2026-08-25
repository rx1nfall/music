import React from "react";
import {
  Music2,
  FolderOpen,
  ListMusic,
  Cloud,
  HardDrive,
  Sliders,
  Heart,
  Disc3,
  Clock,
  Plus,
  Radio,
  Sparkles,
  Shield,
  Home,
  Compass,
} from "lucide-react";
import { Playlist } from "../types/music";

export type NavTab =
  | "all_tracks"
  | "folders"
  | "playlists"
  | "sync"
  | "offline"
  | "equalizer"
  | "favorites"
  | "lossless";

interface SidebarProps {
  currentView?: "home" | "music";
  onNavigateView?: (view: "home" | "music") => void;
  activeTab: NavTab;
  onTabSelect: (tab: NavTab) => void;
  playlists: Playlist[];
  selectedPlaylistId: string | null;
  onSelectPlaylist: (id: string | null) => void;
  onCreatePlaylist: () => void;
  activeAccentColor: string;
  totalTracksCount: number;
  offlineCount: number;
  losslessCount: number;
  favoritesCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView = "music",
  onNavigateView,
  activeTab,
  onTabSelect,
  playlists,
  selectedPlaylistId,
  onSelectPlaylist,
  onCreatePlaylist,
  activeAccentColor,
  totalTracksCount,
  offlineCount,
  losslessCount,
  favoritesCount,
}) => {
  const mainNavItems = [
    {
      id: "all_tracks" as NavTab,
      label: "All Music",
      icon: Music2,
      count: totalTracksCount,
    },
    {
      id: "folders" as NavTab,
      label: "Computer Folders",
      icon: FolderOpen,
      badge: "Local Hub",
    },
    {
      id: "favorites" as NavTab,
      label: "Favorites",
      icon: Heart,
      count: favoritesCount,
    },
    {
      id: "lossless" as NavTab,
      label: "Hi-Res Lossless",
      icon: Disc3,
      count: losslessCount,
      badge: "FLAC/WAV",
    },
    {
      id: "offline" as NavTab,
      label: "Offline Vault",
      icon: HardDrive,
      count: offlineCount,
    },
    {
      id: "sync" as NavTab,
      label: "Cloud & Phone Sync",
      icon: Cloud,
      badge: "Cross-Device",
    },
    {
      id: "equalizer" as NavTab,
      label: "10-Band Equalizer",
      icon: Sliders,
    },
  ];

  return (
    <aside
      id="app-navigation-sidebar"
      className="hidden md:flex flex-col w-64 h-full p-4 border-r border-[#49454F]/30 bg-[#1C1B1F] overflow-y-auto shrink-0 select-none text-[#E6E1E5]"
    >
      {/* Navigation Sections */}
      <div className="space-y-6 flex-1">
        {/* Home & Overview Quick Launch */}
        <div>
          <div className="px-3 mb-2 text-[11px] font-bold uppercase tracking-wider text-[#938F99]">
            Overview
          </div>
          <button
            id="nav-item-home-portal"
            onClick={() => {
              if (onNavigateView) onNavigateView("home");
            }}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-2xl text-xs font-bold transition-all ${
              currentView === "home"
                ? "shadow-sm font-bold"
                : "text-[#CAC4D0] hover:bg-[#2B2930] hover:text-[#E6E1E5]"
            }`}
            style={
              currentView === "home"
                ? { backgroundColor: activeAccentColor, color: "#381E72" }
                : undefined
            }
          >
            <div className="flex items-center gap-2.5">
              <Home className="w-4 h-4" />
              <span>Home Hub</span>
            </div>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                currentView === "home"
                  ? "bg-[#381E72]/20 text-[#381E72]"
                  : "bg-[#2B2930] text-[#CAC4D0] border border-[#49454F]/40"
              }`}
            >
              Main
            </span>
          </button>
        </div>

        {/* Main Section */}
        <div>
          <div className="px-3 mb-2 text-[11px] font-bold uppercase tracking-wider text-[#938F99]">
            Music Library
          </div>
          <nav className="space-y-1">
            {mainNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === "music" && activeTab === item.id && !selectedPlaylistId;
              return (
                <button
                  key={item.id}
                  id={`nav-item-${item.id}`}
                  onClick={() => {
                    if (onNavigateView) onNavigateView("music");
                    onSelectPlaylist(null);
                    onTabSelect(item.id);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-2xl text-xs font-semibold transition-all ${
                    isActive
                      ? "shadow-sm font-bold"
                      : "text-[#CAC4D0] hover:bg-[#2B2930] hover:text-[#E6E1E5]"
                  }`}
                  style={
                    isActive
                      ? { backgroundColor: activeAccentColor, color: "#381E72" }
                      : undefined
                  }
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </div>

                  {item.badge ? (
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                        isActive
                          ? "bg-[#381E72]/20 text-[#381E72]"
                          : "bg-[#2B2930] text-[#CAC4D0] border border-[#49454F]/40"
                      }`}
                    >
                      {item.badge}
                    </span>
                  ) : item.count !== undefined ? (
                    <span
                      className={`text-[11px] font-mono px-1.5 rounded-md ${
                        isActive
                          ? "bg-[#381E72]/15 text-[#381E72]"
                          : "text-[#938F99]"
                      }`}
                    >
                      {item.count}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Playlists Section */}
        <div>
          <div className="flex items-center justify-between px-3 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#938F99]">
              Playlists
            </span>
            <button
              id="btn-sidebar-create-playlist"
              onClick={onCreatePlaylist}
              className="p-1 rounded-full hover:bg-[#2B2930] text-[#CAC4D0] hover:text-[#E6E1E5] transition-colors"
              title="Create New Playlist"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-1">
            {playlists.length === 0 ? (
              <div className="px-3 py-2 text-xs text-[#938F99] italic">
                No custom playlists yet
              </div>
            ) : (
              playlists.map((pl) => {
                const isSelected = selectedPlaylistId === pl.id;
                return (
                  <button
                    key={pl.id}
                    id={`playlist-item-${pl.id}`}
                    onClick={() => {
                      onSelectPlaylist(pl.id);
                      onTabSelect("playlists");
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-2xl text-xs font-semibold transition-all ${
                      isSelected
                        ? "shadow-sm font-bold"
                        : "text-[#CAC4D0] hover:bg-[#2B2930] hover:text-[#E6E1E5]"
                    }`}
                    style={
                      isSelected
                        ? { backgroundColor: activeAccentColor, color: "#381E72" }
                        : undefined
                    }
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <ListMusic className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{pl.name}</span>
                    </div>
                    <span
                      className={`text-[10px] font-mono shrink-0 ml-1 ${
                        isSelected ? "text-[#381E72]/80" : "text-[#938F99]"
                      }`}
                    >
                      {pl.trackIds.length}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Privacy & High-Fidelity Banner */}
      <div className="mt-4 p-3 rounded-2xl bg-[#211F26] border border-[#49454F]/30 text-[#CAC4D0]">
        <div className="flex items-center gap-2 text-xs font-semibold text-[#E6E1E5] mb-1">
          <Shield className="w-3.5 h-3.5 text-emerald-400" />
          <span>Zero-Telemetry Vault</span>
        </div>
        <p className="text-[11px] leading-relaxed text-[#938F99]">
          Audio decoding & IndexedDB cache run 100% client-side with E2E device pairing.
        </p>
      </div>
    </aside>
  );
};
