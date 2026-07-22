import { Bed, Archive, Activity, Droplets, Blinds, Armchair, Table, Trash2, Droplet, Monitor, Tv, LayoutGrid } from "lucide-react";
import { WARD_ITEM_TYPES } from "@/lib/wardItems";

const ICON_MAP = {
  bed: Bed,
  bedside_cabinet: Archive,
  observation_monitor: Activity,
  iv_stand: Droplets,
  curtain: Blinds,
  chair: Armchair,
  overbed_table: Table,
  waste_bin: Trash2,
  sink: Droplet,
  nurses_station: Monitor,
  tv: Tv,
  table: Table,
  countertop: LayoutGrid,
};

export default function WardEditPanel({
  selectedItemForPlacement, onSelectItemType, itemCount,
  snapToGrid, onSnapToggle, onUndo, onRedo, canUndo, canRedo,
  onResetLayout, onExitEdit,
}) {
  return (
    <div className="absolute top-16 left-3 z-20 w-56 sm:w-60 bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden animate-slide-up max-h-[calc(100vh-100px)] flex flex-col">
      <div className="bg-slate-800 text-white px-4 py-2.5 flex items-center justify-between shrink-0">
        <h3 className="font-display text-xs tracking-wide">EDIT WARD</h3>
        <button onClick={onExitEdit} className="flex items-center gap-1 text-[10px] bg-clinical-teal text-white px-2 py-1 rounded-md hover:opacity-90">
          Done — Save Layout
        </button>
      </div>

      <div className="overflow-y-auto scrollbar-thin flex-1">
        {/* Snap to Grid toggle */}
        <div className="p-3 border-b border-slate-100">
          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-xs font-heading font-semibold text-slate-700">Snap to Grid</span>
            <button
              onClick={onSnapToggle}
              className={`relative w-10 h-5 rounded-full transition-colors ${snapToGrid ? "bg-clinical-teal" : "bg-slate-300"}`}
              role="switch"
              aria-checked={snapToGrid}
              aria-label="Toggle snap to grid"
            >
              <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${snapToGrid ? "translate-x-5" : "translate-x-0.5"}`} />
            </button>
          </label>
        </div>

        {/* Undo / Redo / Reset */}
        <div className="p-3 border-b border-slate-100">
          <div className="flex items-center gap-1.5">
            <button onClick={onUndo} disabled={!canUndo}
              className="flex-1 py-2 rounded-lg border border-slate-200 bg-slate-50 text-[10px] font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-30 transition-colors"
              aria-label="Undo">
              ↶ Undo
            </button>
            <button onClick={onRedo} disabled={!canRedo}
              className="flex-1 py-2 rounded-lg border border-slate-200 bg-slate-50 text-[10px] font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-30 transition-colors"
              aria-label="Redo">
              ↷ Redo
            </button>
            <button onClick={onResetLayout}
              className="flex-1 py-2 rounded-lg border border-clinical-red/30 bg-clinical-red/5 text-[10px] font-medium text-clinical-red hover:bg-clinical-red/10 transition-colors"
              aria-label="Reset layout">
              Reset
            </button>
          </div>
        </div>

        {/* Item palette */}
        <div className="p-3">
          <p className="text-[9px] font-semibold text-slate-400 uppercase mb-2 tracking-wide">Add Items</p>
          <div className="grid grid-cols-2 gap-1.5">
            {WARD_ITEM_TYPES.map((item) => {
              const Icon = ICON_MAP[item.type] || Table;
              const isActive = selectedItemForPlacement === item.type;
              return (
                <button key={item.type} onClick={() => onSelectItemType(item.type)}
                  className={`flex flex-col items-center gap-1 p-2 rounded-lg border text-[10px] font-medium transition-all ${
                    isActive ? "border-clinical-teal bg-clinical-teal/10 text-clinical-teal" : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
                  }`}>
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="px-3 py-2 bg-slate-50 border-t border-slate-200 text-[9px] text-slate-400 shrink-0">
        {selectedItemForPlacement
          ? "Click on the floor to place."
          : `${itemCount} items · Drag to reposition · Click to select`}
      </div>
    </div>
  );
}