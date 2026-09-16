import { useRef, useState } from "react";
import { Film, Upload, Play, Square, Trash2, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { SYSTEM_META } from "@/lib/anatomy3D";
import { BODY_LAYER_ORDER } from "@/lib/pathophysiologyData";

const card = "polished-glass-edge rounded-2xl border border-white/90 bg-gradient-to-br from-white/92 via-slate-100/82 to-slate-200/68 shadow-[0_12px_0_-6px_rgba(100,116,139,.24),0_28px_60px_-32px_rgba(15,23,42,.55),inset_1px_1px_2px_white] backdrop-blur-2xl";

// Translucent looping video overlay rendered above the 3D viewer. Each active
// system's MP4 plays independently; pointer-events-none keeps the model
// interactive and mix-blend-screen lets the model show through.
export function AnimationOverlay({ animations, active }) {
  if (!active?.length) return null;
  return (
    <div className="pointer-events-none absolute inset-0 z-20">
      {active.map((system) => {
        const anim = animations?.[system];
        if (!anim?.url) return null;
        return (
          <video key={system} src={anim.url} autoPlay loop muted playsInline
            className="absolute inset-0 h-full w-full object-contain opacity-70 mix-blend-screen" />
        );
      })}
    </div>
  );
}

export default function AnatomyAnimationController({ animations, setAnimations, active, setActive }) {
  const fileRefs = useRef({});
  const [uploading, setUploading] = useState(null);

  const handleUpload = async (system, file) => {
    if (!file) return;
    setUploading(system);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setAnimations((prev) => ({ ...prev, [system]: { url: file_url, name: file.name } }));
    } catch {
      alert("Upload failed. Please try again.");
    } finally {
      setUploading(null);
      if (fileRefs.current[system]) fileRefs.current[system].value = "";
    }
  };

  const toggleActive = (system) => {
    setActive((prev) => prev.includes(system) ? prev.filter((s) => s !== system) : [...prev, system]);
  };

  const clearAnimation = (system) => {
    setAnimations((prev) => { const next = { ...prev }; delete next[system]; return next; });
    setActive((prev) => prev.filter((s) => s !== system));
  };

  const playingCount = active.filter((s) => animations?.[s]?.url).length;

  return (
    <div className={`${card} p-5`}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-sky-500 to-cyan-600 text-white shadow"><Film className="h-4 w-4"/></span>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[.18em] text-sky-700">Centralized animation controller</p>
            <h3 className="font-black text-slate-900">System animation studio</h3>
          </div>
        </div>
        <span className="rounded-full bg-slate-900 px-3 py-1.5 text-[10px] font-bold text-white">{playingCount} playing</span>
      </div>
      <p className="mb-3 text-xs text-slate-600">Upload a looping MP4 for any anatomical system, then trigger it independently. Triggered animations overlay the 3D model.</p>
      <div className="grid gap-2 sm:grid-cols-2">
        {BODY_LAYER_ORDER.map((system) => {
          const meta = SYSTEM_META[system];
          const anim = animations?.[system];
          const isActive = active.includes(system);
          const isUploading = uploading === system;
          return (
            <div key={system} className={`flex items-center gap-2 rounded-xl border p-2.5 transition ${isActive ? "border-sky-400 bg-sky-50/80 shadow-sm" : "border-slate-200 bg-white/70"}`}>
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-white" style={{backgroundColor:meta.hex}}><Film className="h-3.5 w-3.5"/></span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-bold text-slate-800">{meta.name}</p>
                <p className="truncate text-[10px] text-slate-500">{anim ? anim.name : "No animation uploaded"}</p>
              </div>
              <input ref={(el) => { fileRefs.current[system] = el; }} type="file" accept="video/mp4,video/webm" className="hidden" onChange={(e) => handleUpload(system, e.target.files?.[0])} />
              <button onClick={() => fileRefs.current[system]?.click()} disabled={isUploading} title="Upload animation" className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:border-sky-300 disabled:opacity-50">
                {isUploading ? <Loader2 className="h-3.5 w-3.5 animate-spin"/> : <Upload className="h-3.5 w-3.5"/>}
              </button>
              <button onClick={() => toggleActive(system)} disabled={!anim} title={isActive ? "Stop overlay" : "Play overlay"} className={`grid h-8 w-8 place-items-center rounded-lg transition disabled:opacity-30 ${isActive ? "bg-rose-600 text-white" : "bg-sky-600 text-white hover:opacity-90"}`}>
                {isActive ? <Square className="h-3.5 w-3.5"/> : <Play className="h-3.5 w-3.5"/>}
              </button>
              <button onClick={() => clearAnimation(system)} disabled={!anim} title="Remove animation" className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:border-rose-300 hover:text-rose-600 disabled:opacity-30">
                <Trash2 className="h-3.5 w-3.5"/>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}