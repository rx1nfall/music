import { get, set, del, keys, createStore } from "idb-keyval";
import { Track, Playlist, EqualizerSettings, AppSettings } from "../types/music";

// Dedicated IndexedDB stores for audio blobs and metadata
const audioBlobStore = createStore("syncwave-audio-blobs", "blobs");
const metaStore = createStore("syncwave-metadata", "meta");

const TRACKS_META_KEY = "library_tracks";
const PLAYLISTS_KEY = "library_playlists";
const EQ_SETTINGS_KEY = "equalizer_settings";
const APP_SETTINGS_KEY = "app_settings";
const SYNC_SESSION_KEY = "sync_session_info";

export const StorageService = {
  // Save audio blob for offline playback
  async saveAudioBlob(trackId: string, blob: Blob): Promise<void> {
    try {
      await set(trackId, blob, audioBlobStore);
    } catch (e) {
      console.error("Failed to save audio blob to IndexedDB:", e);
      throw e;
    }
  },

  // Retrieve audio blob
  async getAudioBlob(trackId: string): Promise<Blob | undefined> {
    try {
      return await get<Blob>(trackId, audioBlobStore);
    } catch (e) {
      console.error("Failed to read audio blob from IndexedDB:", e);
      return undefined;
    }
  },

  // Delete audio blob (Free space)
  async deleteAudioBlob(trackId: string): Promise<void> {
    try {
      await del(trackId, audioBlobStore);
    } catch (e) {
      console.error("Failed to delete audio blob:", e);
    }
  },

  // Check if track is cached offline
  async isTrackCached(trackId: string): Promise<boolean> {
    try {
      const blob = await get<Blob>(trackId, audioBlobStore);
      return !!blob;
    } catch {
      return false;
    }
  },

  // List all cached track IDs
  async getAllCachedTrackIds(): Promise<string[]> {
    try {
      const allKeys = await keys(audioBlobStore);
      return allKeys.map(String);
    } catch {
      return [];
    }
  },

  // Clear all audio cache
  async clearAllAudioCache(): Promise<void> {
    try {
      const allKeys = await keys(audioBlobStore);
      await Promise.all(allKeys.map((k) => del(k, audioBlobStore)));
    } catch (e) {
      console.error("Failed to clear audio cache:", e);
    }
  },

  // Get total offline cache size in bytes
  async getCacheStorageEstimate(): Promise<{
    cachedTracksCount: number;
    estimatedBytesUsed: number;
    quotaBytes: number;
  }> {
    let cachedTracksCount = 0;
    let estimatedBytesUsed = 0;
    let quotaBytes = 0;

    try {
      const allKeys = await keys(audioBlobStore);
      cachedTracksCount = allKeys.length;

      for (const k of allKeys) {
        const b = await get<Blob>(k, audioBlobStore);
        if (b) {
          estimatedBytesUsed += b.size;
        }
      }

      if (navigator.storage && navigator.storage.estimate) {
        const est = await navigator.storage.estimate();
        quotaBytes = est.quota || 0;
        if (!estimatedBytesUsed && est.usage) {
          estimatedBytesUsed = est.usage;
        }
      }
    } catch (e) {
      console.warn("Storage estimate calculation fallback:", e);
    }

    return {
      cachedTracksCount,
      estimatedBytesUsed,
      quotaBytes,
    };
  },

  // Metadata operations
  async saveTracks(tracks: Track[]): Promise<void> {
    await set(TRACKS_META_KEY, tracks, metaStore);
  },

  async getTracks(): Promise<Track[] | undefined> {
    return await get<Track[]>(TRACKS_META_KEY, metaStore);
  },

  async savePlaylists(playlists: Playlist[]): Promise<void> {
    await set(PLAYLISTS_KEY, playlists, metaStore);
  },

  async getPlaylists(): Promise<Playlist[] | undefined> {
    return await get<Playlist[]>(PLAYLISTS_KEY, metaStore);
  },

  async saveEqualizerSettings(settings: EqualizerSettings): Promise<void> {
    await set(EQ_SETTINGS_KEY, settings, metaStore);
  },

  async getEqualizerSettings(): Promise<EqualizerSettings | undefined> {
    return await get<EqualizerSettings>(EQ_SETTINGS_KEY, metaStore);
  },

  async saveAppSettings(settings: AppSettings): Promise<void> {
    await set(APP_SETTINGS_KEY, settings, metaStore);
  },

  async getAppSettings(): Promise<AppSettings | undefined> {
    return await get<AppSettings>(APP_SETTINGS_KEY, metaStore);
  },

  async saveSyncSession(session: any): Promise<void> {
    await set(SYNC_SESSION_KEY, session, metaStore);
  },

  async getSyncSession(): Promise<any | undefined> {
    return await get(SYNC_SESSION_KEY, metaStore);
  },
};
