import { Bed, Frame, Square, Armchair, Monitor, Droplet, Trash2, RotateCw, RotateCcw, X, Save } from "lucide-react";
import { WARD_ITEM_TYPES } from "@/lib/wardItems";

const ICON_MAP = {
  bed: Bed,
  curtain_rail: Frame,
  curtain: Square,
  chair: Armchair,
  nurse_station: Monitor,
  sink: Droplet,
  waste_bin: Trash2,
};

export default function WardEditPanel({
  selectedItemForPlacement,
  onSelectItemType,
  selectedItemId,
  onRotate,
  onDelete,
  onExitEdit,
  itemCount,
}) {
  return (
    <div className="absolute top-16 right-3 z-20 w-56 sm:w-64 bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden animate-slide-up">
      {/* Header */}
      <div className="bg-slate-800 text-white px-4 py-2.5 flex items-center justify-between">
        <h3 className="font-display text-xs tracking-wide">EDIT WARD</h3>
        <button
          onClick={onExitEdit}
          className="flex items-center gap-1 text-[10px] bg-clinical-teal text-white px-2 py-1 rounded-md hover:opacity-90 transition-opacity"
        >
          <Save className="w-3 h-3" /> Save & Exit
        </button>
      </div>

      {/* Item palette */}
      <div className="p-3">
        <p className="text-[9px] font-semibold text-slate-400 uppercase mb-2 tracking-wide">Place Items</p>
        <div className="grid grid-cols-2 gap-1.5">
          {WARD_ITEM_TYPES.map((item) => {
            const Icon = ICON_MAP[item.type] || Square;
            const isActive = selectedItemForPlacement === item.type;
            return (
              <button
                key={item.type}
                onClick={() => onSelectItemType(item.type)}
                className={`flex flex-col items-center gap-1 p-2 rounded-lg border text-[10px] font-medium transition-all ${
                  isActive
                    ? "border-clinical-teal bg-clinical-teal/10 text-clinical-teal"
                    : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected item controls */}
      {selectedItemId && (
        <div className="p-3 border-t border-slate-200 animate-fade-in">
          <p className="text-[9px] font-semibold text-slate-400 uppercase mb-2 tracking-wide">Selected Item</p>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onRotate("left")}
              className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg border border-slate-200 bg-slate-50 text-[10px] text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onRotate("right")}
              className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg border border-slate-200 bg-slate-50 text-[10px] text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onDelete}
              className="flex items-center justify-center py-2 px-2.5 rounded-lg border border-clinical-red/30 bg-clinical-red/5 text-clinical-red hover:bg-clinical-red/10 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Footer info */}
      <div className="px-3 py-2 bg-slate-50 border-t border-slate-200 text-[9px] text-slate-400 leading-tight">
        {selectedItemForPlacement
          ? "Click on the floor to place the item."
          : selectedItemId
          ? "Click floor to move · Rotate or delete above."
          : `${itemCount} item(s) placed · Click an item to select.`}
      </div>
    </div>
  );
}