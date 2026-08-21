import { RotateCcw, RotateCw, Copy, Trash2, X } from "lucide-react";
import { getItemLabel } from "@/lib/wardItems";

export default function WardPropertiesPanel({ item, onRotate15, onRotate90, onDuplicate, onDelete, onClose }) {
  if (!item) return null;

  const rotationDeg = Math.round(((item.rotationY || 0) * 180 / Math.PI) % 360);

  return (
    <div className="polished-glass-edge absolute top-16 right-3 z-20 w-56 overflow-hidden rounded-2xl border border-white/80 bg-white/70 shadow-2xl backdrop-blur-2xl animate-slide-up">
      <div className="bg-gradient-to-r from-slate-700/90 to-emerald-800/85 text-white px-4 py-2.5 flex items-center justify-between">
        <h3 className="font-display text-xs tracking-wide">PROPERTIES</h3>
        <button onClick={onClose} className="p-1 rounded hover:bg-slate-700" aria-label="Close properties">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="p-3 space-y-3">
        {/* Name */}
        <div>
          <p className="text-[9px] font-semibold text-slate-400 uppercase mb-1">Name</p>
          <p className="text-sm font-heading font-bold text-slate-800">{getItemLabel(item)}</p>
        </div>

        {/* Position */}
        <div>
          <p className="text-[9px] font-semibold text-slate-400 uppercase mb-1">Position</p>
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-slate-50 rounded-lg px-2 py-1.5">
              <span className="text-[9px] text-slate-400">X</span>
              <p className="text-sm font-bold text-slate-800">{item.x.toFixed(1)}</p>
            </div>
            <div className="bg-slate-50 rounded-lg px-2 py-1.5">
              <span className="text-[9px] text-slate-400">Z</span>
              <p className="text-sm font-bold text-slate-800">{item.z.toFixed(1)}</p>
            </div>
          </div>
        </div>

        {/* Rotation */}
        <div>
          <p className="text-[9px] font-semibold text-sky-700 uppercase mb-1">Rotate this item: {rotationDeg}°</p>
          <div className="flex items-center gap-1.5">
            <button onClick={() => onRotate15("left")}
              className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg border border-slate-200 bg-slate-50 text-[10px] text-slate-600 hover:bg-slate-100 transition-colors"
              aria-label="Rotate 15 degrees left">
              <RotateCcw className="w-3 h-3" /> 15°
            </button>
            <button onClick={() => onRotate15("right")}
              className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg border border-slate-200 bg-slate-50 text-[10px] text-slate-600 hover:bg-slate-100 transition-colors"
              aria-label="Rotate 15 degrees right">
              <RotateCw className="w-3 h-3" /> 15°
            </button>
          </div>
          <div className="flex items-center gap-1.5 mt-1.5">
            <button onClick={() => onRotate90("left")}
              className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg border border-slate-200 bg-slate-50 text-[10px] text-slate-600 hover:bg-slate-100 transition-colors"
              aria-label="Rotate 90 degrees left">
              <RotateCcw className="w-3 h-3" /> 90°
            </button>
            <button onClick={() => onRotate90("right")}
              className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg border border-slate-200 bg-slate-50 text-[10px] text-slate-600 hover:bg-slate-100 transition-colors"
              aria-label="Rotate 90 degrees right">
              <RotateCw className="w-3 h-3" /> 90°
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5 pt-2 border-t border-slate-100">
          <button onClick={onDuplicate}
            className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg border border-slate-200 bg-slate-50 text-[10px] font-medium text-slate-600 hover:bg-slate-100 transition-colors"
            aria-label="Duplicate item">
            <Copy className="w-3.5 h-3.5" /> Duplicate
          </button>
          <button onClick={onDelete}
            className="flex items-center justify-center gap-1 py-2 px-3 rounded-lg border border-clinical-red/30 bg-clinical-red/5 text-[10px] font-semibold text-clinical-red hover:bg-clinical-red/10 transition-colors"
            aria-label="Delete item">
            <Trash2 className="w-3.5 h-3.5" /> Delete
          </button>
        </div>
      </div>
    </div>
  );
}