import { Activity, ClipboardList, BookOpen, Mic } from "lucide-react";

const SUGGESTIONS = [
  { icon: Activity, label: "Explain the ABCDE assessment" },
  { icon: ClipboardList, label: "Help me write a care plan" },
  { icon: BookOpen, label: "What does NEWS2 measure?" },
  { icon: Mic, label: "List voice commands" },
];

export default function AISuggestions({ onPick }) {
  return (
    <div className="px-2.5 pb-1.5">
      <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400">Suggestions</p>
      <div className="flex flex-wrap gap-1.5">
        {SUGGESTIONS.map(({ icon: Icon, label }) => (
          <button
            key={label}
            type="button"
            onClick={() => onPick(label)}
            className="flex items-center gap-1.5 rounded-full border border-clinical-teal/30 bg-white/70 px-2.5 py-1 text-[11px] font-medium text-slate-700 hover:border-clinical-teal/60 hover:bg-clinical-teal/10 transition-colors"
          >
            <Icon className="h-3 w-3 text-clinical-teal" />
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}