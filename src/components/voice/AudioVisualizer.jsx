import React from "react";

/**
 * AudioVisualizer — animated bar visualizer reacting to assistant state.
 * speaking/listening/thinking animate; idle is static.
 */
export default function AudioVisualizer({ state, bars = 14 }) {
  const active = ["speaking", "listening", "thinking"].includes(state);
  const color =
    state === "speaking" ? "bg-clinical-teal" :
    state === "listening" ? "bg-clinical-green" :
    state === "thinking" ? "bg-clinical-amber" : "bg-slate-400/40";

  return (
    <div className="flex items-end justify-center gap-0.5 h-10" aria-hidden="true">
      {Array.from({ length: bars }).map((_, i) => (
        <div
          key={i}
          className={`w-1 rounded-full transition-all ${active ? `${color} waveform-bar` : "bg-slate-300/60"}`}
          style={{
            height: active ? `${30 + ((i * 53) % 70)}%` : "20%",
            animationDelay: `${(i % 7) * 0.08}s`,
            animationDuration: `${0.5 + (i % 4) * 0.12}s`,
          }}
        />
      ))}
    </div>
  );
}