import { MapPin, ScanSearch } from "lucide-react";

export default function CampusZoomMap() {
  return (
    <div className="campus-zoom relative mx-auto h-[380px] max-w-[900px] overflow-hidden rounded-[28px] border border-white/90 bg-slate-200 shadow-[0_18px_0_-9px_rgba(100,116,139,.32),0_36px_70px_-34px_rgba(15,23,42,.68),inset_1px_1px_2px_white]">
      <img
        src="/assets/campus-wide.jpg"
        alt="Wide view of the Dearne Valley College campus and surrounding area"
        className="campus-wide absolute inset-0 h-full w-full object-cover"
      />
      <img
        src="/assets/campus-close.jpg"
        alt="Detailed view of Dearne Valley College campus buildings"
        className="campus-close absolute inset-0 h-full w-full object-cover"
      />

      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,.2),transparent_28%,rgba(15,23,42,.12))]" />
      <div className="pointer-events-none absolute left-4 top-4 flex items-center gap-2 rounded-2xl border border-white/90 bg-white/72 px-3 py-2 shadow-lg backdrop-blur-xl">
        <span className="grid h-8 w-8 place-items-center rounded-xl bg-gradient-to-br from-cyan-400 to-sky-700 text-white shadow-md">
          <ScanSearch className="h-4 w-4" />
        </span>
        <div>
          <p className="text-[9px] font-black uppercase tracking-[.18em] text-cyan-700">Campus approach</p>
          <p className="text-[10px] font-semibold text-slate-700">Locating T Level Health Corridor</p>
        </div>
      </div>

      <div className="campus-target pointer-events-none absolute left-[45.2%] top-[45.5%]">
        <span className="absolute -left-5 -top-5 h-10 w-10 animate-ping rounded-full border-2 border-cyan-400/70" />
        <span className="relative grid h-8 w-8 place-items-center rounded-full border-2 border-white bg-gradient-to-br from-rose-400 to-pink-600 text-white shadow-[0_0_24px_rgba(244,114,182,.8)]">
          <MapPin className="h-4 w-4" />
        </span>
      </div>

      <div className="pointer-events-none absolute bottom-5 left-5 right-5 overflow-hidden rounded-full border border-white/70 bg-white/45 p-1 shadow-lg backdrop-blur-xl">
        <div className="campus-progress h-1.5 origin-left rounded-full bg-gradient-to-r from-cyan-400 via-sky-500 to-pink-400" />
      </div>

      <div className="campus-detail-label pointer-events-none absolute bottom-10 right-5 rounded-xl border border-white/90 bg-slate-900/78 px-3 py-2 text-white shadow-xl backdrop-blur-xl">
        <p className="text-[9px] font-black uppercase tracking-[.16em] text-cyan-200">Dearne Valley College</p>
        <p className="text-[10px] text-slate-200">T Level Health teaching campus</p>
      </div>

      <style>{`
        .campus-wide {
          animation: campusWideJourney 16s cubic-bezier(.45,0,.2,1) infinite;
          transform-origin: 46% 47%;
          will-change: transform, opacity, filter;
        }
        .campus-close {
          animation: campusCloseResolve 16s cubic-bezier(.45,0,.2,1) infinite;
          transform-origin: 50% 50%;
          will-change: transform, opacity, filter;
        }
        .campus-target { animation: campusTarget 16s ease-in-out infinite; }
        .campus-progress { animation: campusProgress 16s linear infinite; }
        .campus-detail-label { animation: campusLabel 16s ease-in-out infinite; }
        @keyframes campusWideJourney {
          0%, 8% { transform: scale(1); opacity: 1; filter: saturate(.92); }
          58% { transform: scale(2.18) translate(3.5%, 2%); opacity: 1; filter: saturate(1.06); }
          68%, 92% { transform: scale(2.42) translate(4%, 2.5%); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes campusCloseResolve {
          0%, 52% { transform: scale(1.34); opacity: 0; filter: blur(4px); }
          68% { transform: scale(1.08); opacity: 1; filter: blur(0); }
          92% { transform: scale(1); opacity: 1; filter: blur(0); }
          100% { transform: scale(1.08); opacity: 0; }
        }
        @keyframes campusTarget {
          0%, 48% { opacity: 1; transform: scale(1); }
          60%, 100% { opacity: 0; transform: scale(1.7); }
        }
        @keyframes campusProgress {
          0% { transform: scaleX(0); }
          92% { transform: scaleX(1); }
          100% { transform: scaleX(0); }
        }
        @keyframes campusLabel {
          0%, 58% { opacity: 0; transform: translateY(8px); }
          70%, 92% { opacity: 1; transform: translateY(0); }
          100% { opacity: 0; transform: translateY(8px); }
        }
        @media (prefers-reduced-motion: reduce) {
          .campus-wide, .campus-target, .campus-progress { animation: none; opacity: 0; }
          .campus-close, .campus-detail-label { animation: none; opacity: 1; transform: none; filter: none; }
        }
      `}</style>
    </div>
  );
}
