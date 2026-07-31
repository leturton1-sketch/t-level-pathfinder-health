import { CheckCircle, Circle, Award } from "lucide-react";

export default function AreaProgressCard({ area, completed, quiz, delay }) {
  const pct = quiz ? quiz.pct : completed ? 50 : 0;
  return (
    <div
      className="rounded-xl border border-border bg-card/60 p-3.5 animate-slide-up"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-center gap-2 mb-1.5">
        {completed ? (
          <CheckCircle className="w-4 h-4 text-clinical-green shrink-0" />
        ) : (
          <Circle className="w-4 h-4 text-muted-foreground/40 shrink-0" />
        )}
        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">{area.code}</span>
        <span className="text-[10px] text-muted-foreground ml-auto">{area.volume}</span>
      </div>
      <h3 className="text-sm font-bold text-foreground mb-1 leading-tight">{area.title_full || area.title}</h3>
      <div className="flex items-center gap-2 mt-2">
        <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
          <div
            className={`h-full rounded-full ${pct >= 80 ? "bg-clinical-green" : pct >= 50 ? "bg-clinical-teal" : pct > 0 ? "bg-clinical-amber" : "bg-muted-foreground/30"}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        {quiz ? (
          <span className="flex items-center gap-1 text-[10px] font-semibold text-clinical-teal">
            <Award className="w-3 h-3" /> {quiz.score}/{quiz.total}
          </span>
        ) : completed ? (
          <span className="text-[10px] text-muted-foreground">Done</span>
        ) : (
          <span className="text-[10px] text-muted-foreground/50">—</span>
        )}
      </div>
    </div>
  );
}