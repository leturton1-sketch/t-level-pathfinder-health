import { useEffect, useState } from "react";

export default function OverheadLight({ active = true }) {
  const [on, setOn] = useState(false);

  useEffect(() => {
    if (active) {
      const timer = setTimeout(() => setOn(true), 100);
      return () => clearTimeout(timer);
    }
  }, [active]);

  return (
    <div className="relative flex flex-col items-center pointer-events-none">
      {/* Metallic strip light fixture */}
      <div className="relative w-48 h-3 rounded-full bg-slate-400 overflow-visible shadow-md">
        {/* Light tube */}
        <div
          className={`absolute inset-0 rounded-full transition-all duration-300 ${
            on
              ? "bg-gradient-to-r from-amber-50 via-white to-amber-50 shadow-[0_0_15px_rgba(255,245,200,0.7)]"
              : "bg-slate-500"
          }`}
          style={on ? { animation: "flicker-on 1.5s ease-in-out" } : {}}
        />
        {/* Soft glow */}
        {on && (
          <div
            className="absolute inset-0 rounded-full blur-md"
            style={{
              background:
                "radial-gradient(ellipse, rgba(255,250,230,0.5) 0%, rgba(255,240,200,0.1) 60%, transparent 100%)",
            }}
          />
        )}
      </div>
      {/* Mounting bracket */}
      <div className="w-1 h-2 bg-slate-500 -mt-0.5" />
    </div>
  );
}