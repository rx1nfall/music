import React from "react";
import {
  Search,
  Sliders,
  Cloud,
  CloudCheck,
  HardDrive,
  Moon,
  Sun,
  Palette,
  FolderOpen,
  Sparkles,
  Smartphone,
  ShieldCheck,
  Home,
  Music2,
} from "lucide-react";
import {
  SyncSessionState,
  AppSettings,
  MaterialThemeMode,
  DarkModeSetting,
} from "../types/music";

interface HeaderProps {
  currentView: "home" | "music";
  onNavigateView: (view: "home" | "music") => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  syncState: SyncSessionState;
  onOpenSyncModal: () => void;
  onOpenEqualizer: () => void;
  onOpenOfflineManager: () => void;
  onOpenFolderPicker: () => void;
  appSettings: AppSettings;
  onUpdateAppSettings: (settings: Partial<AppSettings>) => void;
  activeAccentColor: string;
  cachedCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  onNavigateView,
  searchQuery,
  onSearchChange,
  syncState,
  onOpenSyncModal,
  onOpenEqualizer,
  onOpenOfflineManager,
  onOpenFolderPicker,
  appSettings,
  onUpdateAppSettings,
  activeAccentColor,
  cachedCount,
}) => {
  const [showThemeMenu, setShowThemeMenu] = React.useState(false);

  const themeOptions: { id: MaterialThemeMode; label: string; color: string }[] = [
    { id: "dynamic", label: "Dynamic Monet (Album Art)", color: activeAccentColor },
    { id: "lavender", label: "Elegant Lavender", color: "#D0BCFF" },
    { id: "pixel-blue", label: "Sky Blue", color: "#A8C7FA" },
    { id: "emerald", label: "Sage Green", color: "#A8EBA2" },
    { id: "amber", label: "Warm Amber", color: "#FFDDB3" },
    { id: "rose", label: "Dusk Rose", color: "#FFD8E4" },
  ];

  const toggleDarkMode = () => {
    const nextMode: DarkModeSetting =
      appSettings.darkMode === "dark"
        ? "amoled"
        : appSettings.darkMode === "amoled"
        ? "light"
        : "dark";
    onUpdateAppSettings({ darkMode: nextMode });
  };

  return (
    <header
      id="app-header"
      className="sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6 py-3 transition-colors duration-200 border-b border-[#49454F]/30 bg-[#1C1B1F]/90 backdrop-blur-md text-[#E6E1E5]"
    >
      {/* Brand & View Switcher */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => onNavigateView("home")}
          className="flex items-center gap-2.5 hover:opacity-90 transition-opacity text-left cursor-pointer"
        >
          <div
            className="flex items-center justify-center w-10 h-10 rounded-2xl shadow-sm transition-transform hover:scale-105"
            style={{ backgroundColor: activeAccentColor, color: "#381E72" }}
          >
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold tracking-tight text-[#E6E1E5]">
                SyncWave
              </h1>
              <span
                className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full"
                style={{
                  backgroundColor: `${activeAccentColor}25`,
                  color: activeAccentColor,
                }}
              >
                Hi-Fi Hub
              </span>
            </div>
            <p className="hidden sm:block text-xs text-[#CAC4D0]">
              Material You &bull; Gapless &bull; Cloud & Local Sync
            </p>
          </div>
        </button>

        {/* Home & Music Page Navigation Switcher */}
        <div className="hidden sm:flex items-center p-1 rounded-full bg-[#2B2930] border border-[#49454F]/40 ml-2">
          <button
            id="btn-nav-view-home"
            onClick={() => onNavigateView("home")}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
              currentView === "home"
                ? "bg-[#D0BCFF] text-[#381E72] shadow-sm"
                : "text-[#CAC4D0] hover:text-[#E6E1E5]"
            }`}
          >
            <Home className="w-3.5 h-3.5" />
            <span>Home</span>
          </button>
          <button
            id="btn-nav-view-music"
            onClick={() => onNavigateView("music")}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
              currentView === "music"
                ? "bg-[#D0BCFF] text-[#381E72] shadow-sm"
                : "text-[#CAC4D0] hover:text-[#E6E1E5]"
            }`}
          >
            <Music2 className="w-3.5 h-3.5" />
            <span>Music</span>
          </button>
        </div>

        {/* Quick Open Folder Button */}
        <button
          id="btn-header-open-folder"
          onClick={onOpenFolderPicker}
          className="ml-1 hidden xl:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-[#2B2930] hover:bg-[#36343B] text-[#E6E1E5] border border-[#49454F]/40 transition-colors"
        >
          <FolderOpen className="w-3.5 h-3.5 text-[#D0BCFF]" />
          <span>Add Folder</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="flex-1 max-w-md mx-3 sm:mx-6">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#938F99]" />
          <input
            id="track-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search tracks, artists, albums, or FLAC/WAV..."
            className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm rounded-full bg-[#2B2930] border border-[#49454F]/40 focus:border-[#D0BCFF] text-[#E6E1E5] placeholder-[#938F99] focus:outline-none transition-all shadow-inner"
          />
        </div>
      </div>

      {/* Action Controls */}
      <div className="flex items-center gap-1.5 sm:gap-2.5">
        {/* Cloud Sync Status */}
        <button
          id="btn-header-cloud-sync"
          onClick={onOpenSyncModal}
          className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
            syncState.isConnected
              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm"
              : "bg-[#2B2930] hover:bg-[#36343B] text-[#E6E1E5] border border-[#49454F]/40"
          }`}
          title="Cloud Sync & Phone Streaming"
        >
          {syncState.isConnected ? (
            <>
              <CloudCheck className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              <span className="hidden md:inline">
                {syncState.role === "host" ? "Sync Host" : "Connected to PC"}
              </span>
            </>
          ) : (
            <>
              <Smartphone className="w-3.5 h-3.5 text-[#D0BCFF]" />
              <span className="hidden md:inline">Sync Phone</span>
            </>
          )}
        </button>

        {/* Offline Manager */}
        <button
          id="btn-header-offline-vault"
          onClick={onOpenOfflineManager}
          className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full text-xs font-medium bg-[#2B2930] hover:bg-[#36343B] text-[#E6E1E5] border border-[#49454F]/40 transition-colors"
          title="Offline Storage & Library Manager"
        >
          <HardDrive className="w-3.5 h-3.5 text-[#D0BCFF]" />
          <span className="hidden sm:inline">Offline</span>
          {cachedCount > 0 && (
            <span
              className="px-1.5 py-0.2 rounded-full text-[10px] font-bold"
              style={{ backgroundColor: activeAccentColor, color: "#381E72" }}
            >
              {cachedCount}
            </span>
          )}
        </button>

        {/* Equalizer Quick Button */}
        <button
          id="btn-header-equalizer"
          onClick={onOpenEqualizer}
          className="p-2 rounded-full bg-[#2B2930] hover:bg-[#36343B] text-[#E6E1E5] border border-[#49454F]/40 transition-colors relative"
          title="10-Band Graphic Equalizer"
        >
          <Sliders className="w-4 h-4 text-[#D0BCFF]" />
        </button>

        {/* Theme Picker Dropdown Toggle */}
        <div className="relative">
          <button
            id="btn-header-theme-picker"
            onClick={() => setShowThemeMenu(!showThemeMenu)}
            className="p-2 rounded-full bg-[#2B2930] hover:bg-[#36343B] text-[#E6E1E5] border border-[#49454F]/40 transition-colors"
            title="Material You Dynamic Themes"
          >
            <Palette className="w-4 h-4 text-[#D0BCFF]" />
          </button>

          {showThemeMenu && (
            <div
              className="absolute right-0 mt-2 w-56 p-2 rounded-2xl shadow-2xl bg-[#2B2930] border border-[#49454F] z-50 animate-in fade-in zoom-in-95 duration-100"
            >
              <div className="px-2 py-1 text-xs font-semibold text-[#CAC4D0] uppercase tracking-wider">
                Material You Palette
              </div>
              <div className="space-y-1 my-1">
                {themeOptions.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => {
                      onUpdateAppSettings({ themeMode: opt.id });
                      setShowThemeMenu(false);
                    }}
                    className={`w-full flex items-center gap-2 px-2.5 py-1.5 text-xs rounded-xl text-left transition-colors ${
                      appSettings.themeMode === opt.id
                        ? "bg-[#36343B] text-[#E6E1E5] font-semibold border border-[#49454F]"
                        : "text-[#CAC4D0] hover:bg-[#36343B]/60 hover:text-[#E6E1E5]"
                    }`}
                  >
                    <span
                      className="w-3.5 h-3.5 rounded-full border border-white/20 shrink-0"
                      style={{ backgroundColor: opt.color }}
                    />
                    <span className="truncate">{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Dark Mode / Light Mode Switch */}
        <button
          id="btn-header-dark-mode"
          onClick={toggleDarkMode}
          className="p-2 rounded-full bg-[#2B2930] hover:bg-[#36343B] text-[#E6E1E5] border border-[#49454F]/40 transition-colors"
          title={`Theme: ${appSettings.darkMode.toUpperCase()}`}
        >
          {appSettings.darkMode === "light" ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-[#D0BCFF]" />
          )}
        </button>
      </div>
    </header>
  );
};
