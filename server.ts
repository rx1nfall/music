import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

interface SyncSessionData {
  sessionId: string;
  sessionCode: string;
  hostDevice: string;
  createdAt: number;
  lastActive: number;
  tracks: Array<{
    id: string;
    title: string;
    artist: string;
    album: string;
    duration: number;
    format: string;
    bitrate?: string;
    sampleRate?: string;
    isLossless?: boolean;
    fileSize: number;
    coverArtUrl?: string;
  }>;
  playbackState: {
    currentTrackId: string | null;
    isPlaying: boolean;
    currentTime: number;
    duration: number;
    volume: number;
    shuffle: boolean;
    repeatMode: "off" | "all" | "one";
    updatedAt: number;
  };
}

// In-memory sync registry and track cache
const sessions = new Map<string, SyncSessionData>();
const trackAudioCache = new Map<string, { buffer: Buffer; mimeType: string }>();

function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // JSON parser with generous limit for audio metadata and sync payloads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ extended: true, limit: "50mb" }));

  // Raw body parser for binary track streaming upload
  app.use("/api/sync/upload-track-binary/:sessionId/:trackId", express.raw({ type: "*/*", limit: "150mb" }));

  // API Health Check
  app.get("/api/health", (req, res) => {
    res.json({
      status: "ok",
      serverTime: new Date().toISOString(),
      activeSessions: sessions.size,
      cachedTracks: trackAudioCache.size,
    });
  });

  // Create a new sync session (e.g. on Computer/Host)
  app.post("/api/sync/create-session", (req, res) => {
    const { deviceName } = req.body;
    const sessionCode = generateCode();
    const sessionId = "sess_" + Math.random().toString(36).substring(2, 10) + "_" + Date.now();

    const session: SyncSessionData = {
      sessionId,
      sessionCode,
      hostDevice: deviceName || "Desktop Music Host",
      createdAt: Date.now(),
      lastActive: Date.now(),
      tracks: [],
      playbackState: {
        currentTrackId: null,
        isPlaying: false,
        currentTime: 0,
        duration: 0,
        volume: 0.8,
        shuffle: false,
        repeatMode: "off",
        updatedAt: Date.now(),
      },
    };

    sessions.set(sessionId, session);
    // Also index by code for lookup
    sessions.set(`code_${sessionCode}`, session);

    res.json({
      success: true,
      sessionId,
      sessionCode,
      hostDevice: session.hostDevice,
    });
  });

  // Join a sync session (e.g. from Phone using 6-digit Code)
  app.post("/api/sync/join-session", (req, res) => {
    const { sessionCode } = req.body;
    if (!sessionCode) {
      return res.status(400).json({ error: "Session code required" });
    }

    const cleanCode = String(sessionCode).trim().toUpperCase();
    const session = sessions.get(`code_${cleanCode}`);

    if (!session) {
      return res.status(404).json({ error: "Invalid or expired session code. Please verify on host." });
    }

    session.lastActive = Date.now();

    res.json({
      success: true,
      sessionId: session.sessionId,
      sessionCode: session.sessionCode,
      hostDevice: session.hostDevice,
      tracks: session.tracks,
      playbackState: session.playbackState,
    });
  });

  // Push library metadata to sync session
  app.post("/api/sync/push-library", (req, res) => {
    const { sessionId, tracks } = req.body;
    const session = sessions.get(sessionId);

    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    if (Array.isArray(tracks)) {
      session.tracks = tracks;
      session.lastActive = Date.now();
    }

    res.json({ success: true, trackCount: session.tracks.length });
  });

  // Get library from session
  app.get("/api/sync/library/:sessionId", (req, res) => {
    const { sessionId } = req.params;
    const session = sessions.get(sessionId);

    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    session.lastActive = Date.now();
    res.json({
      success: true,
      tracks: session.tracks,
      playbackState: session.playbackState,
      hostDevice: session.hostDevice,
    });
  });

  // Upload binary track for cloud synchronization & streaming
  app.post("/api/sync/upload-track-binary/:sessionId/:trackId", (req, res) => {
    const { sessionId, trackId } = req.params;
    const mimeType = req.headers["content-type"] || "audio/mpeg";

    if (!req.body || !(req.body instanceof Buffer)) {
      return res.status(400).json({ error: "Invalid audio buffer" });
    }

    const cacheKey = `${sessionId}_${trackId}`;
    trackAudioCache.set(cacheKey, {
      buffer: req.body,
      mimeType,
    });

    res.json({ success: true, trackId, size: req.body.length });
  });

  // Stream track with HTTP 206 Partial Content (Range requests for instant seeking & gapless audio)
  app.get("/api/sync/stream/:sessionId/:trackId", (req, res) => {
    const { sessionId, trackId } = req.params;
    const cacheKey = `${sessionId}_${trackId}`;
    const cached = trackAudioCache.get(cacheKey);

    if (!cached) {
      return res.status(404).json({ error: "Audio track not cached in cloud sync relay. Keep host connected." });
    }

    const { buffer, mimeType } = cached;
    const total = buffer.length;
    const range = req.headers.range;

    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : total - 1;
      const chunkSize = end - start + 1;

      res.writeHead(206, {
        "Content-Range": `bytes ${start}-${end}/${total}`,
        "Accept-Ranges": "bytes",
        "Content-Length": chunkSize,
        "Content-Type": mimeType,
      });

      const sliced = buffer.subarray(start, end + 1);
      res.end(sliced);
    } else {
      res.writeHead(200, {
        "Content-Length": total,
        "Content-Type": mimeType,
        "Accept-Ranges": "bytes",
      });
      res.end(buffer);
    }
  });

  // Sync playback state (play, pause, seek, current track)
  app.post("/api/sync/state", (req, res) => {
    const { sessionId, playbackState } = req.body;
    const session = sessions.get(sessionId);

    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    if (playbackState) {
      session.playbackState = {
        ...session.playbackState,
        ...playbackState,
        updatedAt: Date.now(),
      };
      session.lastActive = Date.now();
    }

    res.json({ success: true, playbackState: session.playbackState });
  });

  app.get("/api/sync/state/:sessionId", (req, res) => {
    const { sessionId } = req.params;
    const session = sessions.get(sessionId);

    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    res.json({
      success: true,
      playbackState: session.playbackState,
      lastActive: session.lastActive,
    });
  });

  // Vite middleware setup for SPA
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`SyncWave Music Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
