import { Track, PlaybackState, SyncSessionState } from "../types/music";

export class SyncService {
  private static instance: SyncService;
  private syncPollInterval: any = null;

  public static getInstance(): SyncService {
    if (!SyncService.instance) {
      SyncService.instance = new SyncService();
    }
    return SyncService.instance;
  }

  // Create session as Host (e.g. Computer)
  async createHostSession(deviceName: string): Promise<{
    sessionId: string;
    sessionCode: string;
  }> {
    const res = await fetch("/api/sync/create-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ deviceName }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "Failed to create session" }));
      throw new Error(err.error || "Failed to create sync session");
    }

    return await res.json();
  }

  // Join session as Client (e.g. Phone) using 6-digit code
  async joinClientSession(sessionCode: string): Promise<{
    sessionId: string;
    sessionCode: string;
    hostDevice: string;
    tracks: any[];
    playbackState: any;
  }> {
    const res = await fetch("/api/sync/join-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionCode }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "Failed to join session" }));
      throw new Error(err.error || "Invalid session code");
    }

    return await res.json();
  }

  // Push library manifest to cloud sync session
  async pushLibrary(sessionId: string, tracks: Track[]): Promise<void> {
    const serializedTracks = tracks.map((t) => ({
      id: t.id,
      title: t.title,
      artist: t.artist,
      album: t.album,
      duration: t.duration,
      format: t.format,
      bitrate: t.bitrate,
      sampleRate: t.sampleRate,
      isLossless: t.isLossless,
      fileSize: t.fileSize,
      coverArtUrl: t.coverArtUrl,
      accentColor: t.accentColor,
      genre: t.genre,
      year: t.year,
      addedAt: t.addedAt,
      isFavorite: t.isFavorite,
    }));

    await fetch("/api/sync/push-library", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId, tracks: serializedTracks }),
    });
  }

  // Upload track audio buffer to cloud relay
  async uploadTrackBinary(sessionId: string, trackId: string, blob: Blob): Promise<void> {
    await fetch(`/api/sync/upload-track-binary/${sessionId}/${trackId}`, {
      method: "POST",
      headers: {
        "Content-Type": blob.type || "audio/mpeg",
      },
      body: blob,
    });
  }

  // Stream URL generator
  getStreamUrl(sessionId: string, trackId: string): string {
    return `/api/sync/stream/${sessionId}/${trackId}`;
  }

  // Push playback state
  async pushPlaybackState(
    sessionId: string,
    state: Partial<PlaybackState> & { currentTrackId: string | null }
  ): Promise<void> {
    await fetch("/api/sync/state", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId,
        playbackState: {
          currentTrackId: state.currentTrackId,
          isPlaying: state.isPlaying,
          currentTime: state.currentTime,
          duration: state.duration,
          volume: state.volume,
          shuffle: state.shuffle,
          repeatMode: state.repeatMode,
        },
      }),
    });
  }

  // Poll remote playback state
  async fetchRemoteState(sessionId: string): Promise<{
    playbackState: any;
    tracks?: any[];
    hostDevice?: string;
  }> {
    const res = await fetch(`/api/sync/library/${sessionId}`);
    if (!res.ok) throw new Error("Sync session lost");
    return await res.json();
  }

  startStatePolling(
    sessionId: string,
    onStateReceived: (remoteState: any) => void,
    intervalMs: number = 2000
  ): () => void {
    this.stopStatePolling();
    this.syncPollInterval = setInterval(async () => {
      try {
        const data = await this.fetchRemoteState(sessionId);
        if (data && data.playbackState) {
          onStateReceived(data);
        }
      } catch (e) {
        // silent fail on network glitch
      }
    }, intervalMs);

    return () => this.stopStatePolling();
  }

  stopStatePolling(): void {
    if (this.syncPollInterval) {
      clearInterval(this.syncPollInterval);
      this.syncPollInterval = null;
    }
  }
}
