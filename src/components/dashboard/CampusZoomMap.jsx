import { Building2, MapPin } from "lucide-react";

export default function CampusZoomMap() {
  return (
    <div className="relative mx-auto h-[390px] max-w-[920px] [perspective:1400px]">
      <div className="absolute inset-[9%_3%_2%] translate-y-7 rounded-[30px] bg-slate-700/25 blur-2xl" />
      <div className="absolute inset-[5%_2%_7%] translate-x-2 translate-y-5 rounded-[26px] border border-slate-400/30 bg-slate-500/35 shadow-xl [transform:rotateX(8deg)_rotateZ(-1.2deg)]" />
      <div className="campus-plane absolute inset-[1%_2%_11%] overflow-hidden rounded-[26px] border-[6px] border-white/90 bg-slate-100 shadow-[0_12px_0_-5px_rgba(100,116,139,.4),0_30px_55px_-26px_rgba(15,23,42,.75),inset_2px_2px_3px_white] [transform:rotateX(8deg)_rotateZ(-1.2deg)] [transform-style:preserve-3d]">
        <img src="/assets/campus-aerial.jpg" alt="Aerial map of Dearne Valley College campus" className="campus-aerial absolute inset-0 h-full w-full object-cover" />
        <div className="pointer-events-none absolute inset-0 z-10 opacity-30 [background-image:linear-gradient(rgba(255,255,255,.28)_1px,transparent_1px),linear-gradient(90deg,rgba(15,94,184,.10)_1px,transparent_1px)] [background-size:34px_34px]" />
        <div className="map-reflection pointer-events-none absolute -left-[18%] -top-[35%] z-10 h-[78%] w-[72%] rotate-[-18deg] rounded-full bg-gradient-to-r from-white/70 via-cyan-100/35 to-transparent blur-2xl" />
        <div className="pointer-events-none absolute inset-0 z-10 bg-[radial-gradient(circle_at_18%_12%,rgba(255,255,255,.74),transparent_28%),radial-gradient(circle_at_82%_78%,rgba(14,165,233,.18),transparent_24%),linear-gradient(145deg,rgba(255,255,255,.24),transparent_34%,rgba(15,23,42,.12))]" />
        <span className="pointer-events-none absolute left-[8%] top-[7%] z-10 h-24 w-24 rounded-full bg-white/50 blur-3xl" />
        <span className="pointer-events-none absolute bottom-[4%] right-[9%] z-10 h-28 w-28 rounded-full bg-cyan-300/25 blur-3xl" />
        <div className="health-location pointer-events-none absolute left-[51.8%] top-[64%] z-20 -translate-x-1/2 -translate-y-1/2">
          <span className="health-ring absolute left-1/2 top-1/2 h-28 w-28 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-cyan-400/70 bg-cyan-300/10" />
          <span className="health-ring health-ring-delay absolute left-1/2 top-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full border border-blue-500/80" />
          <span className="relative grid h-10 w-10 place-items-center rounded-full border-[3px] border-white bg-gradient-to-br from-blue-500 to-cyan-400 text-white shadow-[0_0_0_5px_rgba(14,165,233,.22),0_0_32px_rgba(6,182,212,.95)]">
            <MapPin className="h-5 w-5" />
          </span>
          <span className="health-stem absolute left-1/2 top-9 h-20 w-px -translate-x-1/2 bg-gradient-to-b from-cyan-300 to-transparent" />
        </div>
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
    </div>
  );
}
