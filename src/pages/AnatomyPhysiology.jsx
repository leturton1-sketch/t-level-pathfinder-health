import { Activity } from "lucide-react";

export default function AnatomyPhysiology() {
  return (
    <div className="clinical-page-shell clinical-page-shell--standard">
      <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-violet-50">
            <Activity className="h-6 w-6 text-violet-600" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-violet-600">Pathfinder Health</p>
            <h1 className="text-2xl font-black text-slate-900">Anatomy &amp; Physiology</h1>
          </div>
        </div>
        <p className="mt-5 max-w-2xl text-sm leading-6 text-slate-600">
          This section has been cleared and is ready to be rebuilt. Previous anatomy graphics, 3D models, visualisers, animation controls and model-specific editing code have been removed.
        </p>
      </div>
    </div>
  );
}
