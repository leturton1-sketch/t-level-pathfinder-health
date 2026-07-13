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
      {/* Strip light fixture */}
      <div className="relative w-48 h-3 rounded-full bg-slate-700/80 overflow-visible">
        {/* Light tube */}
        <div
          className={`absolute inset-0 rounded-full transition-all duration-100 ${
            on ? "bg-gradient-to-r from-amber-100 via-white to-amber-100" : "bg-slate-600"
          }`}
          style={on ? { animation: "flicker-on 1.5s ease-in-out" } : {}}
        />
        {/* Glow */}
        {on && (
          <div
            className="absolute inset-0 rounded-full blur-md"
            style={{
              background: "radial-gradient(ellipse, rgba(255,240,200,0.8) 0%, rgba(255,200,100,0.2) 60%, transparent 100%)",
            }}
          />
        )}
      </div>
      {/* Light cone projecting downward */}
      {on && (
        <div
          className="absolute top-3 w-72 h-96 -z-10 animate-fade-in"
          style={{
            background: "linear-gradient(to bottom, rgba(255,240,200,0.15) 0%, rgba(255,230,150,0.05) 50%, transparent 100%)",
            clipPath: "polygon(40% 0%, 60% 0%, 100% 100%, 0% 100%)",
            filter: "blur(8px)",
          }}
        />
      )}
      {/* Mounting bracket */}
      <div className="w-1 h-2 bg-slate-600 -mt-0.5" />
    </div>
  );
}