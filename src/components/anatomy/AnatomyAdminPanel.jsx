import { useState } from "react";
import { ANATOMY_STRUCTURES } from "@/lib/anatomy3D";
import { Eye, EyeOff, Scissors, RotateCcw, Plus, Trash2, SlidersHorizontal, Move3D } from "lucide-react";

const SHAPES = [
  { value: "sphere", label: "Sphere" },
  { value: "capsule", label: "Capsule" },
  { value: "cylinder", label: "Cylinder" },
  { value: "torus", label: "Torus" },
];

const field = "w-full rounded-lg border border-slate-300 bg-white/90 px-2 py-1.5 text-xs font-semibold text-slate-900 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-200";
const btn = "flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11px] font-bold transition";

function Slider({ label, value, min, max, step, onChange, unit = "" }) {
  return (
    <label className="block">
      <span className="flex items-center justify-between text-[10px] font-bold text-slate-600">
        <span>{label}</span>
        <span className="font-mono text-slate-800">{Number(value).toFixed(2)}{unit}</span>
      </span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(e.target.value)} className="w-full accent-violet-600" />
    </label>
  );
}

export default function AnatomyAdminPanel({ selectedId, overrides, setOverrides, hidden, setHidden, clipped, setClipped, custom, setCustom }) {
  const [newCustom, setNewCustom] = useState({ name: "", shape: "sphere", radius: "0.04", x: "0", y: "1", z: "0", color: "#765AB0" });

  const def = ANATOMY_STRUCTURES.find((s) => s.id === selectedId);
  const ov = overrides[selectedId] || {};
  const pos = ov.position || (def?.position ? [...def.position] : [0, 0, 0]);
  const rot = ov.rotation || (def?.rotation ? [...def.rotation] : [0, 0, 0]);
  const isHidden = hidden.includes(selectedId);
  const isClipped = clipped.includes(selectedId);

  const setPos = (axis, val) => {
    const next = [...pos]; next[axis] = parseFloat(val);
    setOverrides((o) => ({ ...o, [selectedId]: { ...o[selectedId], position: next } }));
  };
  const setRot = (axis, val) => {
    const next = [...rot]; next[axis] = parseFloat(val);
    setOverrides((o) => ({ ...o, [selectedId]: { ...o[selectedId], rotation: next } }));
  };
  const reset = () => setOverrides((o) => { const n = { ...o }; delete n[selectedId]; return n; });
  const toggleHidden = () => setHidden((h) => h.includes(selectedId) ? h.filter((x) => x !== selectedId) : [...h, selectedId]);
  const toggleClipped = () => setClipped((c) => c.includes(selectedId) ? c.filter((x) => x !== selectedId) : [...c, selectedId]);

  const buildShape = (type, r) => type === "sphere" ? { type: "sphere", radius: r }
    : type === "capsule" ? { type: "capsule", radius: r, length: r * 2 }
    : type === "cylinder" ? { type: "cylinder", radiusTop: r, radiusBottom: r, height: r * 3, radialSegments: 18 }
    : { type: "torus", radius: r, tube: r * 0.3, radialSegments: 10, tubularSegments: 24 };

  const addCustom = () => {
    const id = `custom_${Date.now()}`;
    const r = Math.max(0.005, parseFloat(newCustom.radius) || 0.04);
    setCustom((c) => [...c, {
      id, name: newCustom.name || "Custom part",
      shape: buildShape(newCustom.shape, r),
      position: [parseFloat(newCustom.x) || 0, parseFloat(newCustom.y) || 1, parseFloat(newCustom.z) || 0],
      color: newCustom.color,
    }]);
    setNewCustom({ name: "", shape: "sphere", radius: "0.04", x: "0", y: "1", z: "0", color: "#765AB0" });
  };

  const removeCustom = (id) => setCustom((c) => c.filter((item) => item.id !== id));

  return (
    <div className="polished-glass-edge rounded-2xl border border-white/90 bg-white/90 p-4 shadow-lg backdrop-blur-xl">
      <div className="mb-3 flex items-center gap-2">
        <SlidersHorizontal className="h-4 w-4 text-violet-600" />
        <h3 className="text-sm font-black text-slate-900">Anatomy editor (admin)</h3>
        <span className="ml-auto rounded-full bg-rose-100 px-2 py-0.5 text-[9px] font-black text-rose-700">EDIT MODE</span>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)]">
        {/* Transform */}
        <div className="rounded-xl border border-slate-200 bg-white/70 p-3">
          <p className="mb-2 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-violet-700"><Move3D className="h-3.5 w-3.5" />Transform selected</p>
          <select value={selectedId || ""} onChange={(e) => {/* selection comes from 3D click */}} disabled className={`${field} mb-2`} aria-label="Selected structure">
            <option value="">Select a structure in the model</option>
            {ANATOMY_STRUCTURES.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            {custom.map((s) => <option key={s.id} value={s.id}>{s.name} (custom)</option>)}
          </select>
          <p className="truncate text-xs font-bold text-slate-800">{def?.name || (custom.find((c) => c.id === selectedId)?.name) || "None selected"}</p>

          <div className="mt-2 space-y-1.5">
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Position</p>
            <Slider label="X" value={pos[0]} min={-0.6} max={0.6} step={0.005} onChange={(v) => setPos(0, v)} />
            <Slider label="Y" value={pos[1]} min={0} max={2} step={0.005} onChange={(v) => setPos(1, v)} />
            <Slider label="Z" value={pos[2]} min={-0.4} max={0.4} step={0.005} onChange={(v) => setPos(2, v)} />
          </div>
          <div className="mt-2 space-y-1.5">
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Rotation (rad)</p>
            <Slider label="X" value={rot[0]} min={-3.14} max={3.14} step={0.01} onChange={(v) => setRot(0, v)} />
            <Slider label="Y" value={rot[1]} min={-3.14} max={3.14} step={0.01} onChange={(v) => setRot(1, v)} />
            <Slider label="Z" value={rot[2]} min={-3.14} max={3.14} step={0.01} onChange={(v) => setRot(2, v)} />
          </div>
          <button onClick={reset} disabled={!def && !ov.position} className={`${btn} mt-2 w-full justify-center border-slate-200 bg-white text-slate-700 hover:border-violet-300 disabled:opacity-40`}>
            <RotateCcw className="h-3.5 w-3.5" />Reset transform
          </button>
        </div>

        {/* Cut & delete */}
        <div className="rounded-xl border border-slate-200 bg-white/70 p-3">
          <p className="mb-2 text-[10px] font-black uppercase tracking-wider text-rose-700">Modify component</p>
          <div className="space-y-2">
            <button onClick={toggleHidden} disabled={!selectedId} className={`${btn} w-full justify-center ${isHidden ? "border-emerald-400 bg-emerald-500 text-white" : "border-slate-200 bg-white text-slate-700 hover:border-emerald-300"} disabled:opacity-40`}>
              {isHidden ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}{isHidden ? "Restore" : "Delete / hide"}
            </button>
            <button onClick={toggleClipped} disabled={!selectedId} className={`${btn} w-full justify-center ${isClipped ? "border-violet-500 bg-violet-600 text-white" : "border-slate-200 bg-white text-slate-700 hover:border-violet-300"} disabled:opacity-40`}>
              <Scissors className="h-3.5 w-3.5" />{isClipped ? "Uncut" : "Cut (clip)"}
            </button>
          </div>
          <p className="mt-3 text-[10px] leading-4 text-slate-500">Delete hides a structure from the model. Cut applies a clipping plane to slice the selected component for cross-sectional viewing.</p>
        </div>

        {/* Add component */}
        <div className="rounded-xl border border-slate-200 bg-white/70 p-3">
          <p className="mb-2 text-[10px] font-black uppercase tracking-wider text-emerald-700"><Plus className="mr-1 inline h-3.5 w-3.5" />Add body component</p>
          <div className="grid grid-cols-2 gap-2">
            <label className="col-span-2 text-[10px] font-bold text-slate-600">Name<input value={newCustom.name} onChange={(e) => setNewCustom((c) => ({ ...c, name: e.target.value }))} className={`${field} mt-1`} placeholder="e.g. Tumour mass" /></label>
            <label className="text-[10px] font-bold text-slate-600">Shape<select value={newCustom.shape} onChange={(e) => setNewCustom((c) => ({ ...c, shape: e.target.value }))} className={`${field} mt-1`}>{SHAPES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}</select></label>
            <label className="text-[10px] font-bold text-slate-600">Size<input type="number" step="0.005" value={newCustom.radius} onChange={(e) => setNewCustom((c) => ({ ...c, radius: e.target.value }))} className={`${field} mt-1`} /></label>
            <label className="text-[10px] font-bold text-slate-600">X<input type="number" step="0.01" value={newCustom.x} onChange={(e) => setNewCustom((c) => ({ ...c, x: e.target.value }))} className={`${field} mt-1`} /></label>
            <label className="text-[10px] font-bold text-slate-600">Y<input type="number" step="0.01" value={newCustom.y} onChange={(e) => setNewCustom((c) => ({ ...c, y: e.target.value }))} className={`${field} mt-1`} /></label>
            <label className="text-[10px] font-bold text-slate-600">Z<input type="number" step="0.01" value={newCustom.z} onChange={(e) => setNewCustom((c) => ({ ...c, z: e.target.value }))} className={`${field} mt-1`} /></label>
            <label className="text-[10px] font-bold text-slate-600">Colour<input type="color" value={newCustom.color} onChange={(e) => setNewCustom((c) => ({ ...c, color: e.target.value }))} className="mt-1 h-8 w-full rounded-lg border border-slate-300 bg-white" /></label>
          </div>
          <button onClick={addCustom} className={`${btn} mt-2 w-full justify-center border-emerald-500 bg-emerald-600 text-white hover:bg-emerald-700`}>
            <Plus className="h-3.5 w-3.5" />Add component
          </button>

          {custom.length > 0 && (
            <div className="mt-3 space-y-1.5">
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Custom components</p>
              {custom.map((c) => (
                <div key={c.id} className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white/80 px-2 py-1">
                  <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: c.color }} />
                  <span className="min-w-0 flex-1 truncate text-[11px] font-bold text-slate-800">{c.name}</span>
                  <button onClick={() => removeCustom(c.id)} className="text-slate-400 hover:text-rose-600" aria-label={`Remove ${c.name}`}><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <p className="mt-3 text-[10px] text-slate-500">Tip: click any structure in the 3D model to select it, then use the controls above. Changes are saved locally to this browser for admins only.</p>
    </div>
  );
}