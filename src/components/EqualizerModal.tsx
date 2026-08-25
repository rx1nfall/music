import React, { useRef, useEffect } from "react";
import {
  Sliders,
  X,
  Volume2,
  Sparkles,
  Zap,
  RotateCcw,
  Layers,
  Activity,
  Maximize,
  Radio,
} from "lucide-react";
import { EqualizerSettings, AppSettings } from "../types/music";
import {
  EQ_FREQUENCIES,
  EQ_PRESETS,
  EQPreset,
} from "../services/audioEngine";

interface EqualizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  eqSettings: EqualizerSettings;
  onUpdateEqSettings: (settings: EqualizerSettings) => void;
  appSettings: AppSettings;
  onUpdateAppSettings: (settings: Partial<AppSettings>) => void;
  activeAccentColor: string;
}

export const EqualizerModal: React.FC<EqualizerModalProps> = ({
  isOpen,
  onClose,
  eqSettings,
  onUpdateEqSettings,
  appSettings,
  onUpdateAppSettings,
  activeAccentColor,
}) => {
  const curveCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Draw EQ Frequency response curve
  useEffect(() => {
    if (!isOpen) return;
    const canvas = curveCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    // Grid lines (0dB center, +6dB, -6dB)
    ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
    ctx.lineWidth = 1;

    const zeroY = height / 2;
    ctx.beginPath();
    ctx.moveTo(0, zeroY);
    ctx.lineTo(width, zeroY);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, zeroY - height * 0.25);
    ctx.lineTo(width, zeroY - height * 0.25);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, zeroY + height * 0.25);
    ctx.lineTo(width, zeroY + height * 0.25);
    ctx.stroke();

    // Calculate curve points from 10 bands
    const points: { x: number; y: number }[] = [];
    const numBands = EQ_FREQUENCIES.length;

    for (let i = 0; i < numBands; i++) {
      const gain = eqSettings.isEnabled ? eqSettings.bandGains[i] || 0 : 0;
      const x = (i / (numBands - 1)) * (width - 40) + 20;
      // gain is -12 to +12 dB
      const normalized = -gain / 14; // -1 to +1
      const y = zeroY + normalized * (height * 0.4);
      points.push({ x, y });
    }

    // Draw Smooth Spline curve
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);

    for (let i = 0; i < points.length - 1; i++) {
      const xc = (points[i].x + points[i + 1].x) / 2;
      const yc = (points[i].y + points[i + 1].y) / 2;
      ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
    }
    ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);

    // Gradient stroke
    const grad = ctx.createLinearGradient(0, 0, width, 0);
    grad.addColorStop(0, activeAccentColor);
    grad.addColorStop(0.5, "#a855f7");
    grad.addColorStop(1, "#38bdf8");

    ctx.strokeStyle = grad;
    ctx.lineWidth = 3;
    ctx.stroke();

    // Fill under curve
    ctx.lineTo(points[points.length - 1].x, zeroY);
    ctx.lineTo(points[0].x, zeroY);
    ctx.closePath();
    ctx.fillStyle = `${activeAccentColor}22`;
    ctx.fill();

    // Draw band dots
    for (const p of points) {
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
      ctx.fill();
    }
  }, [isOpen, eqSettings, activeAccentColor]);

  if (!isOpen) return null;

  const handleBandGainChange = (bandIndex: number, newGain: number) => {
    const newBands = [...eqSettings.bandGains];
    newBands[bandIndex] = newGain;
    onUpdateEqSettings({
      ...eqSettings,
      bandGains: newBands,
      presetName: "Custom",
    });
  };

  const handleApplyPreset = (preset: EQPreset) => {
    onUpdateEqSettings({
      ...eqSettings,
      presetName: preset.name,
      bandGains: [...preset.gains],
      preampGain: preset.preamp || 0,
      bassBoostGain: preset.bassBoost || 0,
      spatializer3D: preset.spatializer || false,
    });
  };

  const handleReset = () => {
    const flat = EQ_PRESETS.find((p) => p.id === "flat")!;
    handleApplyPreset(flat);
  };

  const formatFreqLabel = (freq: number): string => {
    return freq >= 1000 ? `${freq / 1000}k` : `${freq}`;
  };

  return (
    <div
      id="equalizer-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 rounded-3xl bg-[#1C1B1F] text-[#E6E1E5] border border-[#49454F]/40 shadow-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="p-2.5 rounded-2xl shadow-md"
              style={{ backgroundColor: activeAccentColor, color: "#381E72" }}
            >
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-[#E6E1E5]">10-Band Graphic Equalizer</h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#2B2930] text-[#EADDFF] border border-[#49454F]/40">
                  32-bit DSP
                </span>
              </div>
              <p className="text-xs text-[#938F99]">
                Cross-platform Web Audio biquad filter audio processor
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Toggle Enable */}
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <span className="text-xs font-semibold text-[#CAC4D0]">
                {eqSettings.isEnabled ? "ON" : "OFF"}
              </span>
              <input
                type="checkbox"
                checked={eqSettings.isEnabled}
                onChange={(e) =>
                  onUpdateEqSettings({ ...eqSettings, isEnabled: e.target.checked })
                }
                className="sr-only"
              />
              <div
                className={`w-11 h-6 rounded-full transition-colors p-0.5 ${
                  eqSettings.isEnabled ? "bg-[#D0BCFF]" : "bg-[#2B2930] border border-[#49454F]/40"
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full transition-transform ${
                    eqSettings.isEnabled ? "bg-[#381E72] translate-x-5" : "bg-[#938F99] translate-x-0"
                  }`}
                />
              </div>
            </label>

            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-[#2B2930] text-[#CAC4D0] hover:text-[#E6E1E5] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Real-Time Frequency Response Curve Canvas */}
        <div className="relative p-3 rounded-2xl bg-[#2B2930] border border-[#49454F]/40 overflow-hidden">
          <div className="flex items-center justify-between text-[11px] font-mono text-[#938F99] mb-1">
            <span>+12 dB</span>
            <span className="text-[#EADDFF] font-semibold">{eqSettings.presetName}</span>
            <span>-12 dB</span>
          </div>
          <canvas
            ref={curveCanvasRef}
            width={600}
            height={100}
            className="w-full h-24 block"
          />
        </div>

        {/* Presets Chips Carousel */}
        <div>
          <div className="flex items-center justify-between text-xs font-bold text-[#938F99] uppercase tracking-wider mb-2">
            <span>Presets</span>
            <button
              onClick={handleReset}
              className="flex items-center gap-1 text-[#CAC4D0] hover:text-[#E6E1E5] text-[11px]"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset to Flat</span>
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {EQ_PRESETS.map((preset) => {
              const isSelected = eqSettings.presetName === preset.name;
              return (
                <button
                  key={preset.id}
                  onClick={() => handleApplyPreset(preset)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    isSelected
                      ? "bg-[#D0BCFF] text-[#381E72] font-bold shadow-md scale-105"
                      : "bg-[#2B2930] hover:bg-[#36343B] text-[#CAC4D0] border border-[#49454F]/40"
                  }`}
                >
                  {preset.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* 10 Vertical Sliders Grid */}
        <div className="p-4 rounded-3xl bg-[#2B2930] border border-[#49454F]/40">
          <div className="flex items-center justify-between gap-1 sm:gap-2">
            {EQ_FREQUENCIES.map((freq, idx) => {
              const gain = eqSettings.bandGains[idx] || 0;
              return (
                <div key={freq} className="flex flex-col items-center gap-2 flex-1">
                  <span className="text-[10px] font-mono text-[#938F99]">
                    {gain > 0 ? `+${gain.toFixed(0)}` : `${gain.toFixed(0)}`}
                  </span>

                  {/* Vertical Range Slider */}
                  <div className="h-32 flex items-center justify-center">
                    <input
                      type="range"
                      min="-12"
                      max="12"
                      step="0.5"
                      value={gain}
                      disabled={!eqSettings.isEnabled}
                      onChange={(e) =>
                        handleBandGainChange(idx, parseFloat(e.target.value))
                      }
                      className="w-24 h-1.5 -rotate-90 appearance-none bg-[#1C1B1F] rounded-full cursor-pointer accent-[#D0BCFF] disabled:opacity-40"
                      style={{
                        accentColor: activeAccentColor,
                      }}
                    />
                  </div>

                  <span className="text-[10px] font-mono font-bold text-[#CAC4D0]">
                    {formatFreqLabel(freq)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Soundstage FX: Bass Boost & 3D Spatializer & Preamp */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Preamp */}
          <div className="p-3.5 rounded-2xl bg-[#2B2930] border border-[#49454F]/40 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-[#CAC4D0]">Preamp Gain</span>
              <span className="font-mono text-[#938F99]">
                {eqSettings.preampGain > 0
                  ? `+${eqSettings.preampGain}dB`
                  : `${eqSettings.preampGain}dB`}
              </span>
            </div>
            <input
              type="range"
              min="-6"
              max="6"
              step="0.5"
              value={eqSettings.preampGain}
              disabled={!eqSettings.isEnabled}
              onChange={(e) =>
                onUpdateEqSettings({
                  ...eqSettings,
                  preampGain: parseFloat(e.target.value),
                })
              }
              className="w-full h-1.5 bg-[#1C1B1F] rounded-full accent-[#D0BCFF] cursor-pointer"
              style={{ accentColor: activeAccentColor }}
            />
          </div>

          {/* Bass Boost */}
          <div className="p-3.5 rounded-2xl bg-[#2B2930] border border-[#49454F]/40 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-[#CAC4D0]">Bass Boost (80Hz)</span>
              <span className="font-mono text-emerald-400">
                +{eqSettings.bassBoostGain}dB
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="10"
              step="0.5"
              value={eqSettings.bassBoostGain}
              disabled={!eqSettings.isEnabled}
              onChange={(e) =>
                onUpdateEqSettings({
                  ...eqSettings,
                  bassBoostGain: parseFloat(e.target.value),
                })
              }
              className="w-full h-1.5 bg-[#1C1B1F] rounded-full accent-[#D0BCFF] cursor-pointer"
              style={{ accentColor: activeAccentColor }}
            />
          </div>

          {/* 3D Spatializer */}
          <div className="p-3.5 rounded-2xl bg-[#2B2930] border border-[#49454F]/40 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-[#CAC4D0]">3D Soundstage</span>
              <button
                onClick={() =>
                  onUpdateEqSettings({
                    ...eqSettings,
                    spatializer3D: !eqSettings.spatializer3D,
                  })
                }
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  eqSettings.spatializer3D
                    ? "bg-[#D0BCFF] text-[#381E72]"
                    : "bg-[#1C1B1F] text-[#938F99] border border-[#49454F]/30"
                }`}
              >
                {eqSettings.spatializer3D ? "Active" : "Bypass"}
              </button>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={eqSettings.spatializerWidth || 0.5}
              disabled={!eqSettings.isEnabled || !eqSettings.spatializer3D}
              onChange={(e) =>
                onUpdateEqSettings({
                  ...eqSettings,
                  spatializerWidth: parseFloat(e.target.value),
                })
              }
              className="w-full h-1.5 bg-[#1C1B1F] rounded-full accent-[#D0BCFF] cursor-pointer"
              style={{ accentColor: activeAccentColor }}
            />
          </div>
        </div>

        {/* Gapless Playback & Crossfade Settings */}
        <div className="p-4 rounded-3xl bg-[#2B2930] border border-[#49454F]/40 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-300" />
              <span className="text-xs font-bold text-[#E6E1E5]">
                Gapless Playback Engine & Crossfade
              </span>
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <span className="text-xs text-[#CAC4D0]">
                {appSettings.gaplessEnabled ? "Gapless Enabled" : "Disabled"}
              </span>
              <input
                type="checkbox"
                checked={appSettings.gaplessEnabled}
                onChange={(e) =>
                  onUpdateAppSettings({ gaplessEnabled: e.target.checked })
                }
                className="sr-only"
              />
              <div
                className={`w-9 h-5 rounded-full transition-colors p-0.5 ${
                  appSettings.gaplessEnabled ? "bg-[#D0BCFF]" : "bg-[#1C1B1F] border border-[#49454F]/40"
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full transition-transform ${
                    appSettings.gaplessEnabled ? "bg-[#381E72] translate-x-4" : "bg-[#938F99] translate-x-0"
                  }`}
                />
              </div>
            </label>
          </div>

          <div className="flex items-center justify-between text-xs text-[#CAC4D0]">
            <span>Crossfade Transition Duration:</span>
            <span className="font-mono font-bold text-[#EADDFF]">
              {appSettings.crossfadeSeconds === 0
                ? "0s (Instant Sample-Accurate Gapless)"
                : `${appSettings.crossfadeSeconds}s Smooth Fade`}
            </span>
          </div>

          <input
            type="range"
            min="0"
            max="8"
            step="1"
            value={appSettings.crossfadeSeconds}
            onChange={(e) =>
              onUpdateAppSettings({ crossfadeSeconds: parseInt(e.target.value, 10) })
            }
            className="w-full h-1.5 bg-[#1C1B1F] rounded-full cursor-pointer accent-[#D0BCFF]"
            style={{ accentColor: activeAccentColor }}
          />
        </div>
      </div>
    </div>
  );
};
