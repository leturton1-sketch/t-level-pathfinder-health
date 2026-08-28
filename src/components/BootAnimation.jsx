import { useEffect, useState } from "react";

export default function BootAnimation({ onComplete }) {
  const [phase, setPhase] = useState("booting");

  useEffect(() => {
    const timer = setTimeout(() => {
      setPhase("scanline");
      const t2 = setTimeout(() => {
        onComplete?.();
      }, 1500);
      return () => clearTimeout(t2);
    }, 1800);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-[100] bg-white flex items-center justify-center overflow-hidden">
      <div className="relative w-full h-full flex items-center justify-center">
        {/* CRT line expansion — neon green */}
        <div className="absolute inset-0 bg-clinical-teal animate-crt-boot origin-center" style={{ height: "2px" }} />

        {/* Expanding screen */}
        <div className="absolute inset-0 bg-white animate-crt-boot origin-center" style={{ animationDelay: "0.3s", opacity: 0 }} />

        {/* Scanline sweep */}
        {phase === "scanline" && (
          <>
            <div className="absolute left-0 right-0 h-32 bg-gradient-to-b from-transparent via-clinical-teal/15 to-transparent animate-scanline" />
            <div className="text-clinical-teal font-bold text-xl tracking-widest animate-fade-in" style={{ animationDelay: "0.3s" }}>
              PATHFINDER HEALTH
            </div>
            <div className="absolute bottom-12 text-slate-400 text-sm animate-fade-in" style={{ animationDelay: "0.6s" }}>
              Clinical Skills Academy (RNN Group) — Booting clinical dashboard…
            </div>
          </>
        )}
      </div>
    </div>
  );
}