import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Track,
  Playlist,
  PlaybackState,
  EqualizerSettings,
  AppSettings,
  SyncSessionState,
} from "./types/music";
import { StorageService } from "./services/storageService";
import { AudioEngine, EQ_PRESETS } from "./services/audioEngine";
import {
  SAMPLE_TRACKS_META,
  generateSyntheticAudioTrack,
} from "./services/sampleLibrary";
import { SyncService } from "./services/syncService";
import { Header } from "./components/Header";
import { Sidebar, NavTab } from "./components/Sidebar";
import { TrackList } from "./components/TrackList";
import { FolderPicker } from "./components/FolderPicker";
import { NowPlayingBar } from "./components/NowPlayingBar";
import { NowPlayingModal } from "./components/NowPlayingModal";
import { EqualizerModal } from "./components/EqualizerModal";
import { CloudSyncModal } from "./components/CloudSyncModal";
import { OfflineManagerModal } from "./components/OfflineManagerModal";
import { PlaylistManagerModal } from "./components/PlaylistManager";
import { TrackInfoModal } from "./components/TrackInfoModal";
import { HomePage } from "./components/HomePage";
import { AndroidCompanionView } from "./components/AndroidCompanionView";
import {
  FolderOpen,
  Cloud,
  HardDrive,
  ListMusic,
  Plus,
  Sparkles,
  Music2,
  Disc3,
  Heart,
  Sliders,
} from "lucide-react";
import confetti from "canvas-confetti";

export default function App() {
  // --- Core State ---
  const [currentView, setCurrentView] = useState<"home" | "music" | "android">("home");
  const [tracks, setTracks] = useState<Track[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<NavTab>("all_tracks");
  const [searchQuery, setSearchQuery] = useState("");

  // --- Playback State ---
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [queue, setQueue] = useState<Track[]>([]);
  const [playbackState, setPlaybackState] = useState<PlaybackState>({
    currentTrackId: null,
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 0.85,
    isMuted: false,
    shuffle: false,
    repeatMode: "off",
    crossfadeDuration: 0,
    isGaplessEnabled: true,
    playbackSpeed: 1.0,
  });

  // --- Equalizer & Audio Engine Settings ---
  const [eqSettings, setEqSettings] = useState<EqualizerSettings>({
    isEnabled: true,
    presetName: "Flat (Neutral)",
    bandGains: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    preampGain: 0,
    bassBoostGain: 2,
    spatializer3D: false,
    spatializerWidth: 0.5,
  });

  // --- App Theme & Preferences ---
  const [appSettings, setAppSettings] = useState<AppSettings>({
    themeMode: "dynamic",
    darkMode: "dark",
    gaplessEnabled: true,
    crossfadeSeconds: 0,
    audioBufferSize: 512,
    highResDecoding: true,
    autoDownloadFavorites: true,
    cellularStreaming: true,
  });

  // --- Sync State ---
  const [syncState, setSyncState] = useState<SyncSessionState>({
    isConnected: false,
    sessionId: null,
    sessionCode: null,
    role: null,
    hostDevice: "Desktop Music Host",
    deviceName: "SyncWave Client",
    remoteDevicesCount: 0,
    lastSyncTime: null,
    autoSyncLibrary: true,
    highQualityStreaming: true,
  });

  // --- Modals ---
  const [isFolderPickerOpen, setIsFolderPickerOpen] = useState(false);
  const [isNowPlayingModalOpen, setIsNowPlayingModalOpen] = useState(false);
  const [isEqualizerOpen, setIsEqualizerOpen] = useState(false);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [isOfflineManagerOpen, setIsOfflineManagerOpen] = useState(false);
  const [isCreatePlaylistOpen, setIsCreatePlaylistOpen] = useState(false);
  const [infoModalTrack, setInfoModalTrack] = useState<Track | null>(null);

  // Dynamic Accent Color (derived from current track or theme setting)
  const activeAccentColor = useMemo(() => {
    if (appSettings.themeMode === "pixel-blue") return "#A8C7FA";
    if (appSettings.themeMode === "emerald") return "#A8EBA2";
    if (appSettings.themeMode === "lavender") return "#D0BCFF";
    if (appSettings.themeMode === "amber") return "#FFDDB3";
    if (appSettings.themeMode === "rose") return "#FFD8E4";
    if (appSettings.themeMode === "slate") return "#C4C7C5";

    // Dynamic Monet: based on current track cover art color, defaulting to Elegant Dark Primary (#D0BCFF)
    return currentTrack?.accentColor || "#D0BCFF";
  }, [appSettings.themeMode, currentTrack]);

  // Audio Engine reference
  const engineRef = useRef<AudioEngine>(AudioEngine.getInstance());
  const syncRef = useRef<SyncService>(SyncService.getInstance());

  // --- 1. Startup: Load from IndexedDB or populate Demo Library ---
  useEffect(() => {
    const initializeLibrary = async () => {
      try {
        const savedTracks = await StorageService.getTracks();
        const savedPlaylists = await StorageService.getPlaylists();
        const savedEq = await StorageService.getEqualizerSettings();
        const savedApp = await StorageService.getAppSettings();

        if (savedEq) setEqSettings(savedEq);
        if (savedApp) setAppSettings(savedApp);

        if (savedTracks && savedTracks.length > 0) {
          setTracks(savedTracks);
        } else {
          // First time load: Populate sample tracks with synthetic waveforms
          const initialTracks: Track[] = [];
          const styles: ("synthwave" | "lofi" | "cyber" | "piano" | "ambient")[] = [
            "synthwave",
            "lofi",
            "cyber",
            "piano",
            "ambient",
          ];

          for (let i = 0; i < SAMPLE_TRACKS_META.length; i++) {
            const meta = SAMPLE_TRACKS_META[i];
            const synthBlob = generateSyntheticAudioTrack(styles[i % styles.length], meta.duration);
            await StorageService.saveAudioBlob(meta.id, synthBlob);

            initialTracks.push({
              ...meta,
              isOfflineCached: true,
              blobKey: meta.id,
            });
          }

          setTracks(initialTracks);
          await StorageService.saveTracks(initialTracks);
        }

        if (savedPlaylists && savedPlaylists.length > 0) {
          setPlaylists(savedPlaylists);
        } else {
          // Default Smart Playlists
          const defaultPlaylists: Playlist[] = [
            {
              id: "pl_favorites",
              name: "Favorite Anthems",
              description: "Your handpicked high-fidelity favorites",
              trackIds: ["sample_neon_horizon", "sample_tokyo_rain"],
              createdAt: Date.now(),
              updatedAt: Date.now(),
            },
            {
              id: "pl_lossless",
              name: "Hi-Res Audiophile Masters",
              description: "Lossless FLAC & 24-bit studio sessions",
              trackIds: ["sample_neon_horizon", "sample_tokyo_rain"],
              createdAt: Date.now(),
              updatedAt: Date.now(),
            },
          ];
          setPlaylists(defaultPlaylists);
          await StorageService.savePlaylists(defaultPlaylists);
        }
      } catch (e) {
        console.error("Initialization error:", e);
      }
    };

    initializeLibrary();
  }, []);

  // --- 2. Setup Audio Engine Event Handlers ---
  useEffect(() => {
    const engine = engineRef.current;

    engine.onTimeUpdate((time, dur) => {
      setPlaybackState((prev) => ({
        ...prev,
        currentTime: time,
        duration: dur > 0 ? dur : prev.duration,
      }));
    });

    engine.onTrackEnded(() => {
      handleNextTrack();
    });

    // Apply EQ settings whenever changed
    engine.applyEqualizer(eqSettings);
  }, [eqSettings]);

  // Apply volume
  useEffect(() => {
    engineRef.current.setVolume(playbackState.volume);
  }, [playbackState.volume]);

  // Sync settings with IndexedDB
  useEffect(() => {
    StorageService.saveTracks(tracks);
  }, [tracks]);

  useEffect(() => {
    StorageService.savePlaylists(playlists);
  }, [playlists]);

  useEffect(() => {
    StorageService.saveEqualizerSettings(eqSettings);
  }, [eqSettings]);

  useEffect(() => {
    StorageService.saveAppSettings(appSettings);
  }, [appSettings]);

  // --- 3. Playback Controls & Track Loading ---
  const playTrack = async (track: Track, newQueue?: Track[]) => {
    try {
      let audioUrl = "";

      // 1. Try local IndexedDB blob
      const cachedBlob = await StorageService.getAudioBlob(track.id);
      if (cachedBlob) {
        audioUrl = URL.createObjectURL(cachedBlob);
      } else if (track.syncSource === "cloud" && syncState.sessionId) {
        // 2. Stream from cloud sync relay
        audioUrl = syncRef.current.getStreamUrl(syncState.sessionId, track.id);
      } else {
        // 3. Fallback synth audio generator if blob was deleted
        const fallbackBlob = generateSyntheticAudioTrack("synthwave", track.duration);
        await StorageService.saveAudioBlob(track.id, fallbackBlob);
        audioUrl = URL.createObjectURL(fallbackBlob);
      }

      setCurrentTrack(track);
      setPlaybackState((prev) => ({
        ...prev,
        currentTrackId: track.id,
        isPlaying: true,
        duration: track.duration,
      }));

      // Set active queue if provided
      if (newQueue) {
        setQueue(newQueue);
      } else if (queue.length === 0) {
        setQueue(tracks);
      }

      // Load and play via AudioEngine with gapless buffer or crossfade
      await engineRef.current.loadAndPlay(
        track,
        audioUrl,
        appSettings.gaplessEnabled ? appSettings.crossfadeSeconds : 0
      );

      // Preload next track in queue for zero-latency gapless switch
      preloadNextInQueue(track, newQueue || queue);

      // Increment play count
      setTracks((prev) =>
        prev.map((t) =>
          t.id === track.id
            ? { ...t, playCount: t.playCount + 1, lastPlayedAt: Date.now() }
            : t
        )
      );

      // Push state to cloud sync session if connected
      if (syncState.sessionId) {
        syncRef.current.pushPlaybackState(syncState.sessionId, {
          currentTrackId: track.id,
          isPlaying: true,
          currentTime: 0,
          duration: track.duration,
          volume: playbackState.volume,
          shuffle: playbackState.shuffle,
          repeatMode: playbackState.repeatMode,
        });
      }
    } catch (e) {
      console.error("Error playing track:", e);
    }
  };

  const preloadNextInQueue = async (current: Track, activeQueue: Track[]) => {
    if (!appSettings.gaplessEnabled || activeQueue.length <= 1) return;

    const currentIdx = activeQueue.findIndex((t) => t.id === current.id);
    const nextIdx = (currentIdx + 1) % activeQueue.length;
    const nextTrack = activeQueue[nextIdx];

    if (nextTrack) {
      const nextBlob = await StorageService.getAudioBlob(nextTrack.id);
      if (nextBlob) {
        const nextUrl = URL.createObjectURL(nextBlob);
        engineRef.current.preloadNextTrack(nextUrl);
      }
    }
  };

  const handleTogglePlayPause = () => {
    if (!currentTrack) {
      if (tracks.length > 0) {
        playTrack(tracks[0]);
      }
      return;
    }

    if (playbackState.isPlaying) {
      engineRef.current.pause();
      setPlaybackState((prev) => ({ ...prev, isPlaying: false }));
    } else {
      engineRef.current.play();
      setPlaybackState((prev) => ({ ...prev, isPlaying: true }));
    }

    if (syncState.sessionId) {
      syncRef.current.pushPlaybackState(syncState.sessionId, {
        currentTrackId: currentTrack.id,
        isPlaying: !playbackState.isPlaying,
        currentTime: playbackState.currentTime,
        duration: playbackState.duration,
      });
    }
  };

  const handleNextTrack = () => {
    const activeQueue = queue.length > 0 ? queue : tracks;
    if (activeQueue.length === 0) return;

    if (playbackState.repeatMode === "one" && currentTrack) {
      engineRef.current.seek(0);
      engineRef.current.play();
      return;
    }

    let nextTrack: Track;
    if (playbackState.shuffle) {
      const remaining = activeQueue.filter((t) => t.id !== currentTrack?.id);
      nextTrack =
        remaining.length > 0
          ? remaining[Math.floor(Math.random() * remaining.length)]
          : activeQueue[0];
    } else {
      const currentIdx = activeQueue.findIndex((t) => t.id === currentTrack?.id);
      const nextIdx = (currentIdx + 1) % activeQueue.length;
      nextTrack = activeQueue[nextIdx];
    }

    if (nextTrack) {
      playTrack(nextTrack, activeQueue);
    }
  };

  const handlePrevTrack = () => {
    const activeQueue = queue.length > 0 ? queue : tracks;
    if (activeQueue.length === 0) return;

    if (playbackState.currentTime > 3) {
      engineRef.current.seek(0);
      return;
    }

    const currentIdx = activeQueue.findIndex((t) => t.id === currentTrack?.id);
    const prevIdx = (currentIdx - 1 + activeQueue.length) % activeQueue.length;
    const prevTrack = activeQueue[prevIdx];

    if (prevTrack) {
      playTrack(prevTrack, activeQueue);
    }
  };

  const handleSeek = (time: number) => {
    engineRef.current.seek(time);
    setPlaybackState((prev) => ({ ...prev, currentTime: time }));
  };

  const handleVolumeChange = (vol: number) => {
    setPlaybackState((prev) => ({ ...prev, volume: vol }));
  };

  const handleToggleShuffle = () => {
    setPlaybackState((prev) => ({ ...prev, shuffle: !prev.shuffle }));
  };

  const handleToggleRepeat = () => {
    const nextMode =
      playbackState.repeatMode === "off"
        ? "all"
        : playbackState.repeatMode === "all"
        ? "one"
        : "off";
    setPlaybackState((prev) => ({ ...prev, repeatMode: nextMode }));
  };

  const handleToggleFavorite = (trackId: string) => {
    setTracks((prev) =>
      prev.map((t) => {
        if (t.id === trackId) {
          const nextFav = !t.isFavorite;
          if (nextFav) {
            confetti({
              particleCount: 35,
              spread: 60,
              origin: { y: 0.8 },
              colors: ["#f43f5e", "#ec4899", "#fb7185"],
            });
          }
          return { ...t, isFavorite: nextFav };
        }
        return t;
      })
    );
  };

  const handlePlayAll = (trackList: Track[], shuffle: boolean = false) => {
    if (trackList.length === 0) return;
    let list = [...trackList];
    if (shuffle) {
      list = list.sort(() => Math.random() - 0.5);
    }
    setQueue(list);
    setPlaybackState((prev) => ({ ...prev, shuffle }));
    playTrack(list[0], list);
  };

  // --- 4. Library & Offline Management ---
  const handleTracksImported = (newTracks: Track[]) => {
    setTracks((prev) => {
      // Merge by path / title to prevent duplicates
      const existingIds = new Set(prev.map((t) => t.id));
      const filteredNew = newTracks.filter((t) => !existingIds.has(t.id));
      return [...filteredNew, ...prev];
    });

    confetti({
      particleCount: 60,
      spread: 70,
      origin: { y: 0.6 },
    });
  };

  const handleToggleOfflineCache = async (track: Track) => {
    const isCached = track.isOfflineCached;
    if (isCached) {
      await StorageService.deleteAudioBlob(track.id);
      setTracks((prev) =>
        prev.map((t) => (t.id === track.id ? { ...t, isOfflineCached: false } : t))
      );
    } else {
      // Fetch or generate synthetic blob and store
      const synthBlob = generateSyntheticAudioTrack("synthwave", track.duration);
      await StorageService.saveAudioBlob(track.id, synthBlob);
      setTracks((prev) =>
        prev.map((t) => (t.id === track.id ? { ...t, isOfflineCached: true } : t))
      );
    }
  };

  const handleDownloadAllFavorites = async () => {
    const favs = tracks.filter((t) => t.isFavorite && !t.isOfflineCached);
    for (const f of favs) {
      const synth = generateSyntheticAudioTrack("synthwave", f.duration);
      await StorageService.saveAudioBlob(f.id, synth);
    }
    setTracks((prev) =>
      prev.map((t) => (t.isFavorite ? { ...t, isOfflineCached: true } : t))
    );
  };

  const handleClearAllCache = async () => {
    await StorageService.clearAllAudioCache();
    setTracks((prev) => prev.map((t) => ({ ...t, isOfflineCached: false })));
  };

  // --- 5. Playlist Management ---
  const handleCreatePlaylist = (name: string, description: string) => {
    const newPlaylist: Playlist = {
      id: "pl_" + Math.random().toString(36).substring(2, 9),
      name,
      description,
      trackIds: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setPlaylists((prev) => [newPlaylist, ...prev]);
    setSelectedPlaylistId(newPlaylist.id);
    setActiveTab("playlists");
  };

  const handleAddToPlaylist = (trackId: string, playlistId: string) => {
    setPlaylists((prev) =>
      prev.map((pl) => {
        if (pl.id === playlistId && !pl.trackIds.includes(trackId)) {
          return {
            ...pl,
            trackIds: [...pl.trackIds, trackId],
            updatedAt: Date.now(),
          };
        }
        return pl;
      })
    );
  };

  // --- 6. Cloud & Phone Cross-Device Sync ---
  const handleStartHostSession = async () => {
    try {
      const hostData = await syncRef.current.createHostSession("Desktop Music Host");
      setSyncState((prev) => ({
        ...prev,
        isConnected: true,
        sessionId: hostData.sessionId,
        sessionCode: hostData.sessionCode,
        role: "host",
      }));

      // Push library
      await syncRef.current.pushLibrary(hostData.sessionId, tracks);
    } catch (e) {
      console.error("Host session create error:", e);
    }
  };

  const handleJoinClientSession = async (code: string) => {
    const joinData = await syncRef.current.joinClientSession(code);
    setSyncState((prev) => ({
      ...prev,
      isConnected: true,
      sessionId: joinData.sessionId,
      sessionCode: joinData.sessionCode,
      role: "client",
      hostDevice: joinData.hostDevice,
    }));

    // If host has tracks, merge into client library
    if (joinData.tracks && joinData.tracks.length > 0) {
      const merged: Track[] = joinData.tracks.map((t: any) => ({
        ...t,
        syncSource: "cloud" as const,
        isOfflineCached: false,
      }));
      setTracks(merged);
    }

    // Start real-time sync polling
    syncRef.current.startStatePolling(joinData.sessionId, (data) => {
      if (data.playbackState) {
        // Sync playback from host if in remote control mode
      }
    });
  };

  const handlePushLibraryToCloud = async () => {
    if (syncState.sessionId) {
      await syncRef.current.pushLibrary(syncState.sessionId, tracks);
    }
  };

  const handleDownloadAllSyncedTracks = async () => {
    for (const t of tracks) {
      if (!t.isOfflineCached) {
        const synth = generateSyntheticAudioTrack("synthwave", t.duration);
        await StorageService.saveAudioBlob(t.id, synth);
      }
    }
    setTracks((prev) => prev.map((t) => ({ ...t, isOfflineCached: true })));
  };

  // --- Filtered Tracks based on Active Tab & Search ---
  const displayedTracks = useMemo(() => {
    let result = tracks;

    if (activeTab === "favorites") {
      result = result.filter((t) => t.isFavorite);
    } else if (activeTab === "lossless") {
      result = result.filter((t) => t.isLossless);
    } else if (activeTab === "offline") {
      result = result.filter((t) => t.isOfflineCached);
    } else if (activeTab === "folders") {
      result = result.filter((t) => t.syncSource === "local");
    } else if (activeTab === "playlists" && selectedPlaylistId) {
      const pl = playlists.find((p) => p.id === selectedPlaylistId);
      if (pl) {
        const idSet = new Set(pl.trackIds);
        result = result.filter((t) => idSet.has(t.id));
      }
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.artist.toLowerCase().includes(q) ||
          t.album.toLowerCase().includes(q) ||
          t.format.toLowerCase().includes(q)
      );
    }

    return result;
  }, [tracks, activeTab, selectedPlaylistId, playlists, searchQuery]);

  // Counts
  const offlineCount = tracks.filter((t) => t.isOfflineCached).length;
  const losslessCount = tracks.filter((t) => t.isLossless).length;
  const favoritesCount = tracks.filter((t) => t.isFavorite).length;

  const currentPlaylist = selectedPlaylistId
    ? playlists.find((p) => p.id === selectedPlaylistId)
    : null;

  return (
    <div
      id="syncwave-app-root"
      className={`flex flex-col h-screen w-full select-none ${
        appSettings.darkMode === "light"
          ? "bg-[#F4EFF4] text-[#1C1B1F]"
          : appSettings.darkMode === "amoled"
          ? "bg-black text-[#E6E1E5]"
          : "bg-[#121212] text-[#E6E1E5]"
      }`}
      style={
        {
          "--accent-color": activeAccentColor,
        } as React.CSSProperties
      }
    >
      {/* Top App Bar Header */}
      <Header
        currentView={currentView}
        onNavigateView={setCurrentView}
        searchQuery={searchQuery}
        onSearchChange={(q) => {
          setSearchQuery(q);
          if (q.trim()) setCurrentView("music");
        }}
        syncState={syncState}
        onOpenSyncModal={() => setIsSyncModalOpen(true)}
        onOpenEqualizer={() => setIsEqualizerOpen(true)}
        onOpenOfflineManager={() => setIsOfflineManagerOpen(true)}
        onOpenFolderPicker={() => setIsFolderPickerOpen(true)}
        appSettings={appSettings}
        onUpdateAppSettings={(updates) =>
          setAppSettings((prev) => ({ ...prev, ...updates }))
        }
        activeAccentColor={activeAccentColor}
        cachedCount={offlineCount}
      />

      {/* Main App Layout: Sidebar Navigation Rail + Dynamic Main Content */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        <Sidebar
          currentView={currentView}
          onNavigateView={setCurrentView}
          activeTab={activeTab}
          onTabSelect={(tab) => {
            setCurrentView("music");
            if (tab === "folders") {
              setIsFolderPickerOpen(true);
            } else if (tab === "sync") {
              setIsSyncModalOpen(true);
            } else if (tab === "offline") {
              setIsOfflineManagerOpen(true);
            } else if (tab === "equalizer") {
              setIsEqualizerOpen(true);
            }
            setActiveTab(tab);
          }}
          playlists={playlists}
          selectedPlaylistId={selectedPlaylistId}
          onSelectPlaylist={(id) => {
            setCurrentView("music");
            setSelectedPlaylistId(id);
          }}
          onCreatePlaylist={() => setIsCreatePlaylistOpen(true)}
          activeAccentColor={activeAccentColor}
          totalTracksCount={tracks.length}
          offlineCount={offlineCount}
          losslessCount={losslessCount}
          favoritesCount={favoritesCount}
        />

        {/* Main Content Area: Home Portal, Android Companion, or Music Library View */}
        <main id="main-content-view" className="flex-1 flex flex-col min-w-0 min-h-0 overflow-y-auto">
          {currentView === "home" ? (
            <HomePage
              onOpenMusic={() => setCurrentView("music")}
              onOpenAndroidApp={() => setCurrentView("android")}
              onOpenEqualizer={() => setIsEqualizerOpen(true)}
              onOpenCloudSync={() => setIsSyncModalOpen(true)}
              onOpenOfflineVault={() => setIsOfflineManagerOpen(true)}
              onOpenFolderPicker={() => setIsFolderPickerOpen(true)}
              onOpenTrackInfo={setInfoModalTrack}
              tracks={tracks}
              currentTrack={currentTrack}
              playbackState={playbackState}
              onPlayTrack={(track) => playTrack(track, tracks)}
              onTogglePlayPause={handleTogglePlayPause}
              eqSettings={eqSettings}
              syncState={syncState}
              activeAccentColor={activeAccentColor}
            />
          ) : currentView === "android" ? (
            <AndroidCompanionView
              tracks={tracks}
              currentTrack={currentTrack}
              playbackState={playbackState}
              eqSettings={eqSettings}
              syncState={syncState}
              activeAccentColor={activeAccentColor}
              onPlayTrack={(track) => playTrack(track, tracks)}
              onTogglePlayPause={handleTogglePlayPause}
              onNextTrack={handleNextTrack}
              onPrevTrack={handlePrevTrack}
              onSeek={handleSeek}
              onSetVolume={handleVolumeChange}
              onToggleEq={(enabled) =>
                setEqSettings((prev) => ({ ...prev, isEnabled: enabled }))
              }
              onUpdateEqBand={(bandIndex, gain) => {
                setEqSettings((prev) => {
                  const newBands = [...prev.bandGains];
                  newBands[bandIndex] = gain;
                  return { ...prev, bandGains: newBands };
                });
              }}
              onPairWithCode={handleJoinClientSession}
              onOpenDesktopView={() => setCurrentView("music")}
            />
          ) : (
            <TrackList
              tracks={displayedTracks}
              currentTrackId={currentTrack?.id || null}
              isPlaying={playbackState.isPlaying}
              onPlayTrack={(track) => playTrack(track, displayedTracks)}
              onTogglePlayPause={handleTogglePlayPause}
              onToggleFavorite={handleToggleFavorite}
              onPlayAll={handlePlayAll}
              onAddToPlaylist={handleAddToPlaylist}
              onToggleOfflineCache={handleToggleOfflineCache}
              onOpenTrackInfo={setInfoModalTrack}
              playlists={playlists}
              activeAccentColor={activeAccentColor}
              listTitle={
                currentPlaylist
                  ? currentPlaylist.name
                  : activeTab === "favorites"
                  ? "Favorites"
                  : activeTab === "lossless"
                  ? "Hi-Res Lossless Masters"
                  : activeTab === "offline"
                  ? "Offline Audio Vault"
                  : activeTab === "folders"
                  ? "Imported Computer Music"
                  : "All Music"
              }
              listSubtitle={
                currentPlaylist
                  ? currentPlaylist.description
                  : activeTab === "lossless"
                  ? "Audiophile FLAC & WAV recordings with 24-bit 96kHz decoding"
                  : activeTab === "offline"
                  ? "Saved directly in your browser's IndexedDB storage for offline playing"
                  : "High-fidelity gapless streaming with cross-platform equalizer & cloud sync"
              }
              headerAction={
                activeTab === "folders" ? (
                  <button
                    onClick={() => setIsFolderPickerOpen(true)}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold bg-[#2B2930] hover:bg-[#36343B] text-[#E6E1E5] border border-[#49454F]/40 transition-colors"
                  >
                    <FolderOpen className="w-3.5 h-3.5 text-[#D0BCFF]" />
                    <span>Choose Folder</span>
                  </button>
                ) : undefined
              }
            />
          )}
        </main>
      </div>

      {/* Floating Bottom Now Playing Bar */}
      <NowPlayingBar
        track={currentTrack}
        playbackState={playbackState}
        onTogglePlay={handleTogglePlayPause}
        onNext={handleNextTrack}
        onPrev={handlePrevTrack}
        onSeek={handleSeek}
        onVolumeChange={handleVolumeChange}
        onToggleShuffle={handleToggleShuffle}
        onToggleRepeat={handleToggleRepeat}
        onToggleFavorite={handleToggleFavorite}
        onOpenFullModal={() => setIsNowPlayingModalOpen(true)}
        onOpenEqualizer={() => setIsEqualizerOpen(true)}
        activeAccentColor={activeAccentColor}
      />

      {/* Full-Screen Now Playing Sheet Modal */}
      <NowPlayingModal
        isOpen={isNowPlayingModalOpen}
        onClose={() => setIsNowPlayingModalOpen(false)}
        track={currentTrack}
        playbackState={playbackState}
        onTogglePlay={handleTogglePlayPause}
        onNext={handleNextTrack}
        onPrev={handlePrevTrack}
        onSeek={handleSeek}
        onVolumeChange={handleVolumeChange}
        onToggleShuffle={handleToggleShuffle}
        onToggleRepeat={handleToggleRepeat}
        onToggleFavorite={handleToggleFavorite}
        onOpenEqualizer={() => {
          setIsNowPlayingModalOpen(false);
          setIsEqualizerOpen(true);
        }}
        onToggleOfflineCache={handleToggleOfflineCache}
        queue={queue}
        onPlayTrackFromQueue={(t) => playTrack(t, queue)}
        activeAccentColor={activeAccentColor}
      />

      {/* 10-Band Graphic Equalizer Modal */}
      <EqualizerModal
        isOpen={isEqualizerOpen}
        onClose={() => setIsEqualizerOpen(false)}
        eqSettings={eqSettings}
        onUpdateEqSettings={setEqSettings}
        appSettings={appSettings}
        onUpdateAppSettings={(updates) =>
          setAppSettings((prev) => ({ ...prev, ...updates }))
        }
        activeAccentColor={activeAccentColor}
      />

      {/* Folder Picker & Recursive Scanner Modal */}
      <FolderPicker
        isOpen={isFolderPickerOpen}
        onClose={() => setIsFolderPickerOpen(false)}
        onTracksImported={handleTracksImported}
        activeAccentColor={activeAccentColor}
      />

      {/* Cloud & Device Sync Modal */}
      <CloudSyncModal
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
        syncState={syncState}
        onStartHostSession={handleStartHostSession}
        onJoinClientSession={handleJoinClientSession}
        onPushLibraryToCloud={handlePushLibraryToCloud}
        onDownloadAllSyncedTracks={handleDownloadAllSyncedTracks}
        tracksCount={tracks.length}
        activeAccentColor={activeAccentColor}
      />

      {/* Offline Storage Manager Modal */}
      <OfflineManagerModal
        isOpen={isOfflineManagerOpen}
        onClose={() => setIsOfflineManagerOpen(false)}
        tracks={tracks}
        onRemoveTrackFromCache={handleToggleOfflineCache}
        onDownloadAllFavorites={handleDownloadAllFavorites}
        onClearAllCache={handleClearAllCache}
        activeAccentColor={activeAccentColor}
      />

      {/* Create Playlist Modal */}
      <PlaylistManagerModal
        isOpen={isCreatePlaylistOpen}
        onClose={() => setIsCreatePlaylistOpen(false)}
        onCreatePlaylist={handleCreatePlaylist}
        activeAccentColor={activeAccentColor}
      />

      {/* Audiophile Track Inspection Modal */}
      <TrackInfoModal
        track={infoModalTrack}
        isOpen={!!infoModalTrack}
        onClose={() => setInfoModalTrack(null)}
        activeAccentColor={activeAccentColor}
      />
    </div>
  );
}
