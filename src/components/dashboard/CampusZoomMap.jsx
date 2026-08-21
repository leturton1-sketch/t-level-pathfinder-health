import { Building2, Crosshair, MapPin, ScanSearch } from "lucide-react";

export default function CampusZoomMap() {
  return (
    <div className="relative mx-auto h-[390px] max-w-[920px] [perspective:1400px]">
      <div className="absolute inset-[9%_3%_2%] translate-y-7 rounded-[30px] bg-slate-700/25 blur-2xl" />
      <div className="absolute inset-[5%_2%_7%] translate-x-2 translate-y-5 rounded-[26px] border border-slate-400/30 bg-slate-500/35 shadow-xl [transform:rotateX(8deg)_rotateZ(-1.2deg)]" />
      <div className="campus-plane absolute inset-[1%_2%_11%] overflow-hidden rounded-[26px] border-[6px] border-white/90 bg-slate-100 shadow-[0_12px_0_-5px_rgba(100,116,139,.4),0_30px_55px_-26px_rgba(15,23,42,.75),inset_2px_2px_3px_white] [transform:rotateX(8deg)_rotateZ(-1.2deg)] [transform-style:preserve-3d]">
        <img src="/assets/campus-aerial.jpg" alt="Aerial map of Dearne Valley College campus" className="campus-aerial absolute inset-0 h-full w-full object-cover" />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(145deg,rgba(255,255,255,.28),transparent_32%,rgba(15,23,42,.08))]" />
        <div className="health-location pointer-events-none absolute left-[51.8%] top-[64%] z-20 -translate-x-1/2 -translate-y-1/2">
          <span className="health-ring absolute left-1/2 top-1/2 h-28 w-28 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-cyan-400/70 bg-cyan-300/10" />
          <span className="health-ring health-ring-delay absolute left-1/2 top-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full border border-blue-500/80" />
          <span className="relative grid h-10 w-10 place-items-center rounded-full border-[3px] border-white bg-gradient-to-br from-blue-500 to-cyan-400 text-white shadow-[0_0_0_5px_rgba(14,165,233,.22),0_0_32px_rgba(6,182,212,.95)]">
            <MapPin className="h-5 w-5" />
          </span>
          <span className="health-stem absolute left-1/2 top-9 h-20 w-px -translate-x-1/2 bg-gradient-to-b from-cyan-300 to-transparent" />
        </div>
      </div>
      <div className="pointer-events-none absolute left-5 top-4 z-30 flex items-center gap-2 rounded-2xl border border-white/90 bg-white/75 px-3 py-2 shadow-lg backdrop-blur-xl">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-cyan-400 to-blue-700 text-white shadow-md"><ScanSearch className="h-4 w-4" /></span>
        <div><p className="text-[9px] font-black uppercase tracking-[.18em] text-cyan-700">Aerial campus approach</p><p className="text-[10px] font-semibold text-slate-700">Locating T Level Health Provision</p></div>
      </div>
      <div className="health-label pointer-events-none absolute bottom-11 right-5 z-30 max-w-[240px] rounded-2xl border border-cyan-200/80 bg-slate-950/82 px-3 py-2.5 text-white shadow-[0_12px_30px_-14px_rgba(8,145,178,.9)] backdrop-blur-xl">
        <div className="flex items-center gap-2">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-cyan-400/20 text-cyan-200"><Building2 className="h-4 w-4" /></span>
          <div><p className="text-[9px] font-black uppercase tracking-[.16em] text-cyan-200">Destination located</p><p className="text-[11px] font-bold">T Level Health Provision</p><p className="text-[9px] text-slate-300">Dearne Valley College</p></div>
        </div>
      </div>
      <div className="pointer-events-none absolute bottom-5 left-5 right-5 z-30 overflow-hidden rounded-full border border-white/80 bg-white/55 p-1 shadow-lg backdrop-blur-xl">
        <div className="campus-progress h-1.5 origin-left rounded-full bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500" />
      </div>
      <div className="pointer-events-none absolute right-5 top-5 z-30 rounded-full border border-white/80 bg-white/70 p-2 text-blue-700 shadow-lg backdrop-blur-xl"><Crosshair className="h-4 w-4" /></div>
    </div>
  );
}
