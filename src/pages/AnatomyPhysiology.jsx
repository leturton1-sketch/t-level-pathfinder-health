import { Activity, Cuboid, Layers3, ScanLine, Sparkles } from "lucide-react";
import AnatomyCanvasWorkspace from "@/components/anatomy/AnatomyCanvasWorkspace";
import AnatomyViewer from "@/components/AnatomyViewer";

export default function AnatomyPhysiology() {
  return (
    <div className="clinical-page-shell clinical-page-shell--wide">
      <div className="mb-4 rounded-3xl border border-slate-200 bg-white/95 p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-violet-100 to-rose-50">
              <Activity className="h-6 w-6 text-violet-700" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-violet-600">Pathfinder Health · Anatomy Lab</p>
              <h1 className="text-2xl font-black tracking-tight text-slate-950">Anatomy &amp; Physiology 3D Workspace</h1>
              <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600">
                Full rendered WebGL anatomy environment for spatial learning, model inspection, cross-sectional anatomy and clinical annotation.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-200 bg-violet-50 px-3 py-1.5 text-[10px] font-black text-violet-700"><Cuboid className="h-3.5 w-3.5" /> THREE.JS</span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1.5 text-[10px] font-black text-cyan-700"><Layers3 className="h-3.5 w-3.5" /> MESH LAYERS</span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-3 py-1.5 text-[10px] font-black text-rose-700"><ScanLine className="h-3.5 w-3.5" /> LIVE SLICING</span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-[10px] font-black text-amber-700"><Sparkles className="h-3.5 w-3.5" /> STUDIO RENDER</span>
          </div>
        </div>
      </div>

      <div className="mb-4 rounded-3xl border border-slate-200 bg-white/95 p-4 shadow-sm">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-violet-600">BodyParts3D clinical atlas</p>
        <h2 className="mt-1 text-lg font-black text-slate-950">Detailed anatomical systems</h2>
        <p className="mt-1 text-sm leading-6 text-slate-600">
          Explore the higher-fidelity atlas model by anatomical system. The model is loaded from the
          Human Atlas dataset and can be isolated with the layer controls.
        </p>
      </div>
      <AnatomyViewer />
      <details className="mt-4 rounded-3xl border border-slate-200 bg-white/95 p-4 shadow-sm">
        <summary className="cursor-pointer text-sm font-black text-slate-900">Open model inspection workspace</summary>
        <div className="mt-4">
          <AnatomyCanvasWorkspace />
        </div>
      </details>
    </div>
  );
}
