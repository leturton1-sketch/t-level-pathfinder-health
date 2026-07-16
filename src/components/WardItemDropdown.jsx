import { useState } from "react";
import { ChevronDown, Package, Check } from "lucide-react";
import { WARD_ITEM_TYPES } from "@/lib/wardItems";

export default function WardItemDropdown({ selectedItemForPlacement, onSelectItemType }) {
  const [open, setOpen] = useState(false);

  const selectedLabel = WARD_ITEM_TYPES.find(t => t.type === selectedItemForPlacement)?.label || "Add Item";

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 text-xs font-heading font-medium bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
      >
        <Package className="w-3.5 h-3.5 text-clinical-teal" />
        <span>{selectedLabel}</span>
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute top-full left-0 mt-1 z-20 w-56 max-h-64 overflow-y-auto bg-white rounded-lg border border-slate-200 shadow-xl scrollbar-thin">
            {WARD_ITEM_TYPES.map((itemType) => (
              <button
                key={itemType.type}
                onClick={() => {
                  onSelectItemType(itemType.type);
                  setOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 text-xs hover:bg-slate-50 transition-colors ${
                  selectedItemForPlacement === itemType.type ? "bg-clinical-teal/10 text-clinical-teal font-semibold" : "text-slate-700"
                }`}
              >
                <span>{itemType.label}</span>
                {selectedItemForPlacement === itemType.type && <Check className="w-3.5 h-3.5" />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}