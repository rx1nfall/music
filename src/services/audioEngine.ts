import { EqualizerSettings, Track } from "../types/music";

export const EQ_FREQUENCIES = [32, 64, 125, 250, 500, 1000, 2000, 4000, 8000, 16000];

export interface EQPreset {
  id: string;
  name: string;
  gains: number[];
  bassBoost?: number;
  spatializer?: boolean;
  preamp?: number;
}

export const EQ_PRESETS: EQPreset[] = [
  { id: "flat", name: "Flat (Neutral)", gains: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0], preamp: 0, bassBoost: 0 },
  { id: "bass_boost", name: "Bass Booster", gains: [6, 5.5, 4, 2, 0, 0, 0, 0, 0, 0], preamp: -1, bassBoost: 6 },
  { id: "bass_reducer", name: "Bass Reducer", gains: [-6, -5, -3.5, -1.5, 0, 0, 0, 0, 0, 0], preamp: 0, bassBoost: 0 },
  { id: "treble_boost", name: "Treble Booster", gains: [0, 0, 0, 0, 1, 2.5, 4.5, 6, 7, 7.5], preamp: -1, bassBoost: 0 },
  { id: "vocal", name: "Vocal Clarity", gains: [-2, -2, -1, 1.5, 3.5, 4, 3, 1, 0, -1], preamp: 0, bassBoost: 0 },
  { id: "electronic", name: "Electronic / Dance", gains: [5.5, 5, 2, 0, -1.5, 2, 3.5, 4, 4.5, 5], preamp: -1, bassBoost: 4 },
  { id: "rock", name: "Rock / Metal", gains: [4.5, 3.5, 2, -1, -1.5, 1, 3, 4.5, 4, 4.5], preamp: -1, bassBoost: 2 },
  { id: "classical", name: "Classical / Orchestral", gains: [4, 3, 2, 1, -1, -1, 0, 2, 3.5, 4], preamp: 0, bassBoost: 1 },
  { id: "acoustic", name: "Acoustic / Warm", gains: [3, 2.5, 1.5, 1, 1.5, 2, 2.5, 3, 2.5, 2], preamp: 0, bassBoost: 1 },
  { id: "spatial_cinema", name: "3D Spatial Immersive", gains: [3.5, 2.5, 1, 0, 0.5, 1.5, 3, 4, 4.5, 5], preamp: -1, bassBoost: 3, spatializer: true },
];

export class AudioEngine {
  private static instance: AudioEngine;

  private ctx: AudioContext | null = null;
  private audioDeckA: HTMLAudioElement | null = null;
  private audioDeckB: HTMLAudioElement | null = null;
  private activeDeck: "A" | "B" = "A";

  private sourceNodeA: MediaElementAudioSourceNode | null = null;
  private sourceNodeB: MediaElementAudioSourceNode | null = null;

  private preampGainNode: GainNode | null = null;
  private masterGainNode: GainNode | null = null;
  private eqFilters: BiquadFilterNode[] = [];
  private bassBoostFilter: BiquadFilterNode | null = null;
  private stereoPannerNode: StereoPannerNode | null = null;
  private analyserNode: AnalyserNode | null = null;

  private isInitialized = false;
  private isCrossfading = false;

  // Listeners
  private onTimeUpdateCallback: ((time: number, duration: number) => void) | null = null;
  private onTrackEndedCallback: (() => void) | null = null;
  private onTrackLoadStartCallback: (() => void) | null = null;

  private currentTrack: Track | null = null;
  private nextTrackPreloadUrl: string | null = null;

  public static getInstance(): AudioEngine {
    if (!AudioEngine.instance) {
      AudioEngine.instance = new AudioEngine();
    }
    return AudioEngine.instance;
  }

  constructor() {
    // Audio elements will be created and connected on first user action
  }

  public async init(): Promise<void> {
    if (this.isInitialized && this.ctx && this.ctx.state !== "closed") {
      if (this.ctx.state === "suspended") {
        await this.ctx.resume();
      }
      return;
    }

    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioContextClass({ latencyHint: "playback" });

      // Create Decks
      this.audioDeckA = new Audio();
      this.audioDeckB = new Audio();

      this.audioDeckA.crossOrigin = "anonymous";
      this.audioDeckB.crossOrigin = "anonymous";
      this.audioDeckA.preload = "auto";
      this.audioDeckB.preload = "auto";

      // Attach Deck Event Listeners
      this.setupDeckEvents(this.audioDeckA, "A");
      this.setupDeckEvents(this.audioDeckB, "B");

      // Connect Web Audio Graph
      // Deck -> SourceNode -> Preamp -> EQ Filters (10) -> Bass Boost -> Master Gain -> Analyser -> Destination
      this.sourceNodeA = this.ctx.createMediaElementSource(this.audioDeckA);
      this.sourceNodeB = this.ctx.createMediaElementSource(this.audioDeckB);

      this.preampGainNode = this.ctx.createGain();
      this.masterGainNode = this.ctx.createGain();
      this.masterGainNode.gain.value = 0.9;

      // Bass Boost Low-Shelf Filter
      this.bassBoostFilter = this.ctx.createBiquadFilter();
      this.bassBoostFilter.type = "lowshelf";
      this.bassBoostFilter.frequency.value = 80;
      this.bassBoostFilter.gain.value = 0;

      // Stereo Panner (3D width)
      if (this.ctx.createStereoPanner) {
        this.stereoPannerNode = this.ctx.createStereoPanner();
        this.stereoPannerNode.pan.value = 0;
      }

      // Analyser for real-time visuals
      this.analyserNode = this.ctx.createAnalyser();
      this.analyserNode.fftSize = 256;
      this.analyserNode.smoothingTimeConstant = 0.8;

      // Build 10-Band Graphic Equalizer
      this.eqFilters = EQ_FREQUENCIES.map((freq) => {
        const filter = this.ctx!.createBiquadFilter();
        if (freq <= 32) {
          filter.type = "lowshelf";
        } else if (freq >= 16000) {
          filter.type = "highshelf";
        } else {
          filter.type = "peaking";
          filter.Q.value = 1.4; // standard 1-octave Q
        }
        filter.frequency.value = freq;
        filter.gain.value = 0;
        return filter;
      });

      // Chain connections
      this.sourceNodeA.connect(this.preampGainNode);
      this.sourceNodeB.connect(this.preampGainNode);

      let lastNode: AudioNode = this.preampGainNode;
      for (const filter of this.eqFilters) {
        lastNode.connect(filter);
        lastNode = filter;
      }

      lastNode.connect(this.bassBoostFilter);
      lastNode = this.bassBoostFilter;

      if (this.stereoPannerNode) {
        lastNode.connect(this.stereoPannerNode);
        lastNode = this.stereoPannerNode;
      }

      lastNode.connect(this.masterGainNode);
      this.masterGainNode.connect(this.analyserNode);
      this.analyserNode.connect(this.ctx.destination);

      this.isInitialized = true;
    } catch (e) {
      console.error("AudioEngine initialization failed:", e);
    }
  }

  private setupDeckEvents(deck: HTMLAudioElement, deckId: "A" | "B"): void {
    deck.addEventListener("timeupdate", () => {
      if (this.activeDeck === deckId && this.onTimeUpdateCallback) {
        this.onTimeUpdateCallback(deck.currentTime, deck.duration || 0);
      }
    });

    deck.addEventListener("ended", () => {
      if (this.activeDeck === deckId && this.onTrackEndedCallback) {
        this.onTrackEndedCallback();
      }
    });

    deck.addEventListener("loadstart", () => {
      if (this.activeDeck === deckId && this.onTrackLoadStartCallback) {
        this.onTrackLoadStartCallback();
      }
    });

    deck.addEventListener("error", (e) => {
      console.warn(`Deck ${deckId} playback error:`, e);
    });
  }

  public getActiveAudioElement(): HTMLAudioElement | null {
    return this.activeDeck === "A" ? this.audioDeckA : this.audioDeckB;
  }

  public getInactiveAudioElement(): HTMLAudioElement | null {
    return this.activeDeck === "A" ? this.audioDeckB : this.audioDeckA;
  }

  /**
   * Load and play a track
   * Supports seamless gapless transition or crossfade if audio is already playing
   */
  public async loadAndPlay(
    track: Track,
    audioSrc: string,
    crossfadeSeconds: number = 0,
    startTime: number = 0
  ): Promise<void> {
    await this.init();

    if (this.ctx && this.ctx.state === "suspended") {
      await this.ctx.resume();
    }

    this.currentTrack = track;

    const currentDeck = this.getActiveAudioElement();
    const nextDeck = this.getInactiveAudioElement();

    if (!currentDeck || !nextDeck) return;

    // Check if we should crossfade
    if (crossfadeSeconds > 0 && !currentDeck.paused && currentDeck.currentTime > 2) {
      this.isCrossfading = true;
      nextDeck.src = audioSrc;
      nextDeck.currentTime = startTime;
      nextDeck.volume = 0;

      await nextDeck.play().catch(console.warn);

      // Perform smooth volume crossfade
      const steps = 20;
      const stepInterval = (crossfadeSeconds * 1000) / steps;
      const currentInitialVol = currentDeck.volume;
      const targetVol = this.masterGainNode ? this.masterGainNode.gain.value : 0.9;

      let step = 0;
      const fadeTimer = setInterval(() => {
        step++;
        const ratio = step / steps;
        currentDeck.volume = Math.max(0, currentInitialVol * (1 - ratio));
        nextDeck.volume = Math.min(1, targetVol * ratio);

        if (step >= steps) {
          clearInterval(fadeTimer);
          currentDeck.pause();
          currentDeck.currentTime = 0;
          this.activeDeck = this.activeDeck === "A" ? "B" : "A";
          this.isCrossfading = false;
        }
      }, stepInterval);
    } else {
      // Direct gapless instant switch
      currentDeck.src = audioSrc;
      currentDeck.currentTime = startTime;
      currentDeck.volume = 1;
      await currentDeck.play().catch(console.warn);
    }

    this.updateMediaSession(track);
  }

  /**
   * Preload next track URL in the secondary deck for true gapless zero-latency playback
   */
  public preloadNextTrack(audioSrc: string): void {
    const nextDeck = this.getInactiveAudioElement();
    if (nextDeck && audioSrc && audioSrc !== this.nextTrackPreloadUrl) {
      this.nextTrackPreloadUrl = audioSrc;
      nextDeck.src = audioSrc;
      nextDeck.preload = "auto";
      nextDeck.load();
    }
  }

  public play(): Promise<void> | void {
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume();
    }
    const deck = this.getActiveAudioElement();
    if (deck) {
      return deck.play();
    }
  }

  public pause(): void {
    const deck = this.getActiveAudioElement();
    if (deck) {
      deck.pause();
    }
  }

  public seek(time: number): void {
    const deck = this.getActiveAudioElement();
    if (deck && isFinite(time)) {
      deck.currentTime = Math.max(0, Math.min(time, deck.duration || time));
    }
  }

  public setVolume(volume: number): void {
    const clamped = Math.max(0, Math.min(1, volume));
    if (this.masterGainNode && this.ctx) {
      this.masterGainNode.gain.setTargetAtTime(clamped, this.ctx.currentTime, 0.05);
    }
    const deck = this.getActiveAudioElement();
    if (deck) {
      deck.volume = 1; // Controlled by master gain in Web Audio graph
    }
  }

  public setPlaybackRate(rate: number): void {
    const deckA = this.audioDeckA;
    const deckB = this.audioDeckB;
    if (deckA) deckA.playbackRate = rate;
    if (deckB) deckB.playbackRate = rate;
  }

  /**
   * Apply Equalizer Settings to 10-Band BiquadFilter graph
   */
  public applyEqualizer(settings: EqualizerSettings): void {
    if (!this.ctx) return;

    const time = this.ctx.currentTime;

    // Apply preamp gain
    if (this.preampGainNode) {
      const preampLin = settings.isEnabled
        ? Math.pow(10, (settings.preampGain || 0) / 20)
        : 1;
      this.preampGainNode.gain.setTargetAtTime(preampLin, time, 0.05);
    }

    // Apply 10 EQ bands
    this.eqFilters.forEach((filter, idx) => {
      const gain = settings.isEnabled ? settings.bandGains[idx] || 0 : 0;
      filter.gain.setTargetAtTime(gain, time, 0.05);
    });

    // Bass Boost Filter
    if (this.bassBoostFilter) {
      const bassGain = settings.isEnabled ? settings.bassBoostGain || 0 : 0;
      this.bassBoostFilter.gain.setTargetAtTime(bassGain, time, 0.05);
    }

    // 3D Spatializer
    if (this.stereoPannerNode) {
      const panVal = settings.isEnabled && settings.spatializer3D
        ? Math.sin(time * 0.1) * (settings.spatializerWidth || 0.5) * 0.4
        : 0;
      this.stereoPannerNode.pan.setTargetAtTime(panVal, time, 0.05);
    }
  }

  /**
   * Get Frequency Data for 60fps Visualizer
   */
  public getFrequencyData(array: Uint8Array): void {
    if (this.analyserNode) {
      this.analyserNode.getByteFrequencyData(array);
    }
  }

  /**
   * Get Time-Domain Waveform Data
   */
  public getWaveformData(array: Uint8Array): void {
    if (this.analyserNode) {
      this.analyserNode.getByteTimeDomainData(array);
    }
  }

  public onTimeUpdate(cb: (currentTime: number, duration: number) => void): void {
    this.onTimeUpdateCallback = cb;
  }

  public onTrackEnded(cb: () => void): void {
    this.onTrackEndedCallback = cb;
  }

  public onTrackLoadStart(cb: () => void): void {
    this.onTrackLoadStartCallback = cb;
  }

  /**
   * Native MediaSession Integration
   */
  private updateMediaSession(track: Track): void {
    if ("mediaSession" in navigator) {
      const artwork = track.coverArtUrl
        ? [{ src: track.coverArtUrl, sizes: "512x512", type: "image/png" }]
        : [];

      navigator.mediaSession.metadata = new MediaMetadata({
        title: track.title,
        artist: track.artist,
        album: track.album,
        artwork,
      });

      navigator.mediaSession.setActionHandler("play", () => this.play());
      navigator.mediaSession.setActionHandler("pause", () => this.pause());
      navigator.mediaSession.setActionHandler("seekto", (details) => {
        if (details.seekTime !== undefined) {
          this.seek(details.seekTime);
        }
      });
    }
  }
}
