import React, { useEffect, useRef } from "react";
import { AudioEngine } from "../services/audioEngine";

interface AudioVisualizerProps {
  isPlaying: boolean;
  accentColor?: string;
  mode?: "bars" | "wave" | "circle";
  className?: string;
}

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({
  isPlaying,
  accentColor = "#6366f1",
  mode = "bars",
  className = "w-full h-24",
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameId = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const engine = AudioEngine.getInstance();
    const bufferLength = 64;
    const freqData = new Uint8Array(bufferLength);
    const waveData = new Uint8Array(128);

    let phase = 0;

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;

      ctx.clearRect(0, 0, width, height);

      if (isPlaying) {
        engine.getFrequencyData(freqData);
        engine.getWaveformData(waveData);
      } else {
        // Idle gentle breathing wave
        for (let i = 0; i < bufferLength; i++) {
          freqData[i] = Math.max(0, Math.sin(phase + i * 0.15) * 20 + 8);
        }
        for (let i = 0; i < 128; i++) {
          waveData[i] = 128 + Math.sin(phase + i * 0.1) * 8;
        }
        phase += 0.03;
      }

      if (mode === "bars") {
        const barWidth = (width / bufferLength) * 1.5;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
          const barHeight = (freqData[i] / 255) * height * 0.85;

          const gradient = ctx.createLinearGradient(0, height, 0, height - barHeight);
          gradient.addColorStop(0, `${accentColor}33`);
          gradient.addColorStop(0.6, accentColor);
          gradient.addColorStop(1, "#ffffff");

          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.roundRect(x, height - barHeight, Math.max(2, barWidth - 2), barHeight, [3, 3, 0, 0]);
          ctx.fill();

          x += barWidth;
          if (x > width) break;
        }
      } else if (mode === "wave") {
        ctx.beginPath();
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = accentColor;
        ctx.shadowColor = accentColor;
        ctx.shadowBlur = 10;

        const sliceWidth = width / 128;
        let x = 0;

        for (let i = 0; i < 128; i++) {
          const v = waveData[i] / 128.0;
          const y = (v * height) / 2;

          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
          x += sliceWidth;
        }

        ctx.stroke();
        ctx.shadowBlur = 0;
      } else if (mode === "circle") {
        const centerX = width / 2;
        const centerY = height / 2;
        const radius = Math.min(centerX, centerY) * 0.65;

        ctx.save();
        ctx.translate(centerX, centerY);

        for (let i = 0; i < bufferLength; i++) {
          const rad = (i / bufferLength) * Math.PI * 2;
          const barLen = (freqData[i] / 255) * 35;

          const x1 = Math.cos(rad) * radius;
          const y1 = Math.sin(rad) * radius;
          const x2 = Math.cos(rad) * (radius + barLen);
          const y2 = Math.sin(rad) * (radius + barLen);

          ctx.strokeStyle = accentColor;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.stroke();
        }

        ctx.restore();
      }

      animationFrameId.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [isPlaying, accentColor, mode]);

  return (
    <div id="audio-visualizer-container" className={`relative overflow-hidden ${className}`}>
      <canvas
        ref={canvasRef}
        width={400}
        height={100}
        className="w-full h-full block"
      />
    </div>
  );
};
