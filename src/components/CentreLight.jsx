import { useEffect, useState } from "react";

function playFlickerSound() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = "square";
    osc.frequency.value = 120;
    filter.type = "lowpass";
    filter.frequency.value = 800;

    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.04, ctx.currentTime + 0.03);
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.12);
    gain.gain.linearRampToValueAtTime(0.03, ctx.currentTime + 0.2);
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.35);
    gain.gain.linearRampToValueAtTime(0.025, ctx.currentTime + 0.5);
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.65);
    gain.gain.linearRampToValueAtTime(0.02, ctx.currentTime + 0.8);
    gain.gain.linearRampToValueAtTime(0.015, ctx.currentTime + 1.5);
    gain.gain.linearRampToValueAtTime(0.008, ctx.currentTime + 2.5);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 3);
    osc.onended = () => ctx.close();
  } catch (e) {
    // Audio not supported
  }
}

export default function CentreLight() {
  const [on, setOn] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setOn(true);
      playFlickerSound();
    }, 200);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="relative flex flex-col items-center pointer-events-none">
      {/* Ceiling-mounted light panel */}
      <div className="relative w-40 sm:w-56 h-3 rounded-full bg-slate-400 overflow-visible shadow-md">
        <div
          className={`absolute inset-0 rounded-full transition-all duration-300 ${
            on
              ? "bg-gradient-to-r from-amber-50 via-white to-amber-50 shadow-[0_0_20px_rgba(255,245,200,0.6)]"
              : "bg-slate-500"
          }`}
          style={on ? { animation: "flicker-on 1.5s ease-in-out" } : {}}
        />
        {/* Mounting bracket */}
        <div className="absolute left-1/2 -translate-x-1/2 -top-1 w-1 h-2 bg-slate-500" />
      </div>

      {/* Downward glow cone */}
      {on && (
        <div
          className="absolute top-2 w-48 sm:w-64 h-24 sm:h-32"
          style={{
            background:
              "linear-gradient(to bottom, rgba(255,250,230,0.35) 0%, rgba(255,240,200,0.1) 50%, transparent 100%)",
            clipPath: "polygon(30% 0%, 70% 0%, 100% 100%, 0% 100%)",
          }}
        />
      )}
    </div>
  );
}