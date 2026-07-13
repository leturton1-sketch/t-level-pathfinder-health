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
    <div className="fixed inset-0 z-[100] bg-clinical-navy flex items-center justify-center overflow-hidden">
      <div className="relative w-full h-full flex items-center justify-center">
        {/* CRT line expansion */}
        <div className="absolute inset-0 bg-white animate-crt-boot origin-center" style={{ height: "2px" }} />
        
        {/* Expanding screen */}
        <div className="absolute inset-0 bg-clinical-navy animate-crt-boot origin-center" style={{ animationDelay: "0.3s", opacity: 0 }} />
        
        {/* Scanline sweep */}
        {phase === "scanline" && (
          <>
            <div className="absolute left-0 right-0 h-32 bg-gradient-to-b from-transparent via-clinical-teal/20 to-transparent animate-scanline" />
            <div className="text-clinical-teal font-bold text-xl tracking-widest animate-fade-in" style={{ animationDelay: "0.3s" }}>
              CLINICALEDGE
            </div>
            <div className="absolute bottom-12 text-muted-foreground text-sm animate-fade-in" style={{ animationDelay: "0.6s" }}>
              T Level Health Learning Platform — Booting clinical dashboard…
            </div>
          </>
        )}
      </div>
    </div>
  );
}