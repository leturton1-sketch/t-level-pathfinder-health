import { AlertTriangle, Pill } from "lucide-react";

const ADMIN_STATUS = {
  given: { symbol: "✓", color: "text-clinical-green", bg: "bg-clinical-green/10", label: "Given" },
  withheld: { symbol: "W", color: "text-clinical-amber", bg: "bg-clinical-amber/10", label: "Withheld" },
  omitted: { symbol: "O", color: "text-clinical-red", bg: "bg-clinical-red/10", label: "Omitted" },
  due: { symbol: "·", color: "text-slate-400", bg: "bg-slate-50", label: "Due" },
  "—": { symbol: "—", color: "text-slate-300", bg: "bg-slate-50", label: "N/A" },
  running: { symbol: "↻", color: "text-blue-500", bg: "bg-blue-50", label: "Running" },
};

export default function DrugChartTab({ drugChart = [] }) {
  const allergyRows = drugChart.filter((d) => d.allergyFlag);
  const regularMeds = drugChart.filter((d) => !d.allergyFlag);
  const slots = ["06:00", "14:00", "22:00", "PRN"];

  return (
    <div className="p-3 sm:p-4 space-y-3">
      {/* Allergy banners */}
      {allergyRows.map((row, i) => (
        <div key={`aller${i}`} className="rounded-xl border-2 border-clinical-red bg-clinical-red/10 px-3 py-2.5 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-clinical-red shrink-0" />
          <div>
            <p className="text-xs font-heading font-bold text-clinical-red uppercase tracking-wide">{row.note || `ALLERGY: ${row.drug}`}</p>
            <p className="text-[10px] text-clinical-red/80">Never prescribe / administer this medication</p>
          </div>
        </div>
      ))}

      {/* Drug chart table */}
      <div className="rounded-xl border border-slate-200 overflow-hidden bg-white">
        <div className="bg-slate-800 px-3 py-2 flex items-center gap-2">
          <Pill className="w-3.5 h-3.5 text-white" />
          <h3 className="text-xs font-heading font-bold text-white uppercase tracking-wide">Current Prescriptions — Drug Chart</h3>
        </div>
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-[11px] min-w-[640px]">
            <thead>
              <tr className="bg-slate-100 text-slate-500 font-heading font-semibold uppercase tracking-wide">
                <th className="text-left px-2 py-1.5">Drug</th>
                <th className="text-left px-2 py-1.5">Dose</th>
                <th className="text-left px-2 py-1.5">Route</th>
                <th className="text-left px-2 py-1.5">Freq.</th>
                <th className="text-left px-2 py-1.5">Started</th>
                <th className="text-left px-2 py-1.5">Prescriber</th>
                {slots.map((s) => <th key={s} className="px-1.5 py-1.5 text-center font-mono">{s}</th>)}
              </tr>
            </thead>
            <tbody>
              {regularMeds.map((drug, i) => (
                <tr key={i} className="border-t border-slate-100 hover:bg-slate-50/50">
                  <td className="px-2 py-1.5 font-semibold text-slate-800">{drug.drug}</td>
                  <td className="px-2 py-1.5 font-mono text-slate-700">{drug.dose}</td>
                  <td className="px-2 py-1.5 text-slate-600">{drug.route}</td>
                  <td className="px-2 py-1.5 text-slate-600">{drug.frequency}</td>
                  <td className="px-2 py-1.5 font-mono text-slate-500">{drug.startDate}</td>
                  <td className="px-2 py-1.5 text-slate-600">{drug.prescriber}</td>
                  {(drug.admin || []).map((slot, si) => {
                    const st = ADMIN_STATUS[slot.status] || ADMIN_STATUS["—"];
                    return (
                      <td key={si} className="px-1.5 py-1.5 text-center">
                        <span className={`inline-flex w-6 h-6 items-center justify-center rounded font-bold text-[11px] ${st.bg} ${st.color}`} title={st.label}>{st.symbol}</span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {regularMeds.some((d) => d.note) && (
          <div className="border-t border-slate-100 p-2 space-y-1">
            {regularMeds.filter((d) => d.note).map((d, i) => (
              <p key={i} className="text-[10px] text-clinical-amber flex items-start gap-1">
                <AlertTriangle className="w-3 h-3 shrink-0 mt-0.5" /> <span><strong>{d.drug}:</strong> {d.note}</span>
              </p>
            ))}
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-[10px] text-slate-500">
        {Object.entries(ADMIN_STATUS).filter(([k]) => k !== "—" && k !== "running").map(([key, st]) => (
          <span key={key} className="flex items-center gap-1"><span className={`inline-flex w-4 h-4 items-center justify-center rounded font-bold ${st.bg} ${st.color}`}>{st.symbol}</span> {st.label}</span>
        ))}
      </div>
    </div>
  );
}