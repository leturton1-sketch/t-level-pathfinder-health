import { Building2, MapPin } from "lucide-react";

export default function CampusZoomMap() {
  return (
    <div className="relative left-1/2 campus-image-viewport h-[494px] w-full max-w-none -translate-x-1/2 [perspective:1750px]">
      <div className="absolute inset-[9%_3%_2%] translate-y-7 rounded-[30px] bg-slate-700/25 blur-2xl" />
      <div className="absolute inset-[5%_2%_7%] translate-x-2 translate-y-5 rounded-[26px] border border-slate-400/30 bg-slate-500/35 shadow-xl [transform:rotateX(8deg)_rotateZ(-1.2deg)]" />
      <div className="isometric-frame-wrapper campus-plane absolute inset-[1%_1%_9%] overflow-hidden rounded-[26px] border-[6px] border-white/90 bg-slate-100 shadow-[0_12px_0_-5px_rgba(100,116,139,.4),0_30px_55px_-26px_rgba(15,23,42,.75),inset_2px_2px_3px_white] [transform:rotateX(8deg)_rotateZ(-1.2deg)] [transform-style:preserve-3d]">
        <img src="/assets/campus-map.png" alt="Campus map of Dearne Valley College and the surrounding area" className="campus-aerial absolute inset-0 h-full w-full object-cover" />
        <div className="pointer-events-none absolute inset-0 z-10 opacity-30 [background-image:linear-gradient(rgba(255,255,255,.28)_1px,transparent_1px),linear-gradient(90deg,rgba(15,94,184,.10)_1px,transparent_1px)] [background-size:34px_34px]" />
        <div className="map-reflection pointer-events-none absolute -left-[18%] -top-[35%] z-10 h-[78%] w-[72%] rotate-[-18deg] rounded-full bg-gradient-to-r from-white/70 via-cyan-100/35 to-transparent blur-2xl" />
        <div className="pointer-events-none absolute inset-0 z-10 bg-[radial-gradient(circle_at_18%_12%,rgba(255,255,255,.74),transparent_28%),radial-gradient(circle_at_82%_78%,rgba(14,165,233,.18),transparent_24%),linear-gradient(145deg,rgba(255,255,255,.24),transparent_34%,rgba(15,23,42,.12))]" />
        <span className="pointer-events-none absolute bottom-[4%] right-[9%] z-10 h-28 w-28 rounded-full bg-cyan-300/25 blur-3xl" />
        <div className="health-location pointer-events-none absolute left-[50%] top-[41.5%] z-20 h-0 w-0">
          <div className="health-label absolute left-12 top-1/2 w-[250px] -translate-y-1/2 overflow-hidden rounded-2xl border border-white/95 bg-white/78 px-4 py-3 text-slate-950 shadow-[0_4px_0_-2px_rgba(118,90,176,.24),0_18px_38px_-16px_rgba(36,27,58,.72),inset_1px_1px_2px_rgba(255,255,255,.98)] backdrop-blur-2xl">
            <span className="pointer-events-none absolute inset-x-4 top-0 h-px bg-white" />
            <span className="pointer-events-none absolute -right-5 -top-6 h-16 w-24 rotate-[-18deg] rounded-full bg-white/70 blur-xl" />
            <div className="relative flex items-center gap-2">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-purple-200/80 bg-purple-100/80 text-purple-700 shadow-[inset_1px_1px_1px_white,0_5px_12px_-8px_rgba(36,27,58,.7)]"><Building2 className="h-4 w-4" /></span>
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-[.14em] text-purple-800 [text-shadow:0_1px_0_rgba(255,255,255,.9)]">Destination located</p>
                <p className="mt-1 text-[13px] font-black leading-tight text-slate-950 [text-shadow:0_1px_0_rgba(255,255,255,.95)]">Health Department</p>
                <p className="mt-1 text-[10px] font-semibold text-slate-700 [text-shadow:0_1px_0_rgba(255,255,255,.9)]">T Level Health Provision</p>
              </div>
            </div>
          </div>
          <div className="absolute left-0 top-0 -translate-x-1/2 -translate-y-1/2">
            <span className="health-stem absolute left-full top-1/2 h-px w-12 -translate-y-1/2 bg-cyan-400/80" />
            <span className="health-ring absolute left-1/2 top-1/2 h-28 w-28 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-cyan-400/70 bg-cyan-300/10" />
            <span className="health-ring health-ring-delay absolute left-1/2 top-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full border border-blue-500/80" />
            <span className="relative grid h-10 w-10 place-items-center rounded-full border-[3px] border-white bg-gradient-to-br from-blue-500 to-cyan-400 text-white shadow-[0_0_0_5px_rgba(14,165,233,.22),0_0_32px_rgba(6,182,212,.95)]">
              <MapPin className="h-5 w-5" />
            </span>
          </div>
        </div>
      </div>
      <div className="pointer-events-none absolute bottom-5 left-5 right-5 z-30 overflow-hidden rounded-full border border-white/80 bg-white/55 p-1 shadow-lg backdrop-blur-xl">
        <div className="campus-progress h-1.5 origin-left rounded-full bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500" />
      </div>
    </div>
  );
}
