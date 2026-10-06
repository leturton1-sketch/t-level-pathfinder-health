import { CheckCircle, X, AlertCircle, Lightbulb, Route, Stethoscope, BookOpen, ArrowRight } from "lucide-react";
import { getCorrectPathway, getPatientLearningPoints } from "@/lib/scenarioDebrief";
import { SKBadgeGroup } from "@/components/SKBadge";
import NEWS2Badge from "@/components/NEWS2Badge";

/**
 * Post-simulation clinical debrief. Shows the score, a detailed walk-through of
 * the correct pathway (prompt → correct action → rationale), the learner's own
 * decision path, and patient-specific key learning points derived from the
 * scenario's patient details and any incorrect steps.
 */
export default function ScenarioDebrief({ scenario, decisions, score, maxScore, onNavigate, onExit }) {
  const safeMax = maxScore || score || 1;
  const pct = Math.round((score / safeMax) * 100);
  const pathway = getCorrectPathway(scenario);
  const learningPoints = getPatientLearningPoints(scenario, decisions);
  const patientName = scenario?.patient_name || "the patient";

  return (
    <div className="clinical-page-shell clinical-page-shell--narrow min-h-screen bg-background">
      <div className="text-center mb-6">
        <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-3 ${pct >= 70 ? "bg-clinical-green/20" : "bg-clinical-amber/20"}`}>
          {pct >= 70 ? <CheckCircle className="w-8 h-8 text-clinical-green" /> : <AlertCircle className="w-8 h-8 text-clinical-amber" />}
        </div>
        <h1 className="text-xl font-heading font-bold text-foreground">Scenario Complete</h1>
        <p className="text-sm text-muted-foreground">{scenario.name}</p>
        <div className="text-3xl font-heading font-bold text-clinical-teal mt-2">{pct}%</div>
        {scenario.initial_news2 != null && <div className="mt-2 flex justify-center"><NEWS2Badge score={scenario.initial_news2} /></div>}
      </div>

      <div className="rounded-xl border border-border bg-card p-4 mb-4 shadow-sm">
        <h2 className="text-sm font-heading font-bold text-foreground mb-2 flex items-center gap-1.5"><Stethoscope className="w-4 h-4 text-clinical-teal" /> Clinical Debrief</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">{scenario.debrief_rationale || `Review your assessment of ${patientName} against the correct pathway below.`}</p>
      </div>

      <div className="rounded-xl border border-border bg-card p-4 mb-4 shadow-sm">
        <h2 className="text-sm font-heading font-bold text-foreground mb-3 flex items-center gap-1.5"><Route className="w-4 h-4 text-clinical-teal" /> Correct Pathway</h2>
        <p className="text-xs text-muted-foreground mb-3">The optimal sequence of actions for {patientName}, with the reasoning for each step.</p>
        <ol className="space-y-3">
          {pathway.map((step, i) => (
            <li key={step.nodeId || i} className="rounded-lg border border-clinical-green/20 bg-clinical-green/5 p-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-clinical-green text-white text-[10px] font-bold">{i + 1}</span>
                <span className="text-[10px] font-bold uppercase tracking-wide text-clinical-green">Step {i + 1}</span>
              </div>
              <p className="text-xs font-semibold text-foreground mb-1.5">{step.prompt}</p>
              <div className="flex items-start gap-1.5 mb-1.5">
                <ArrowRight className="w-3.5 h-3.5 text-clinical-green shrink-0 mt-0.5" />
                <p className="text-xs font-medium text-clinical-green">{step.correctChoice}</p>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed pl-5">{step.feedback}</p>
            </li>
          ))}
        </ol>
      </div>

      <div className="rounded-xl border border-border bg-card p-4 mb-4 shadow-sm">
        <h2 className="text-sm font-heading font-bold text-foreground mb-3 flex items-center gap-1.5"><BookOpen className="w-4 h-4 text-clinical-teal" /> Your Decisions</h2>
        <div className="space-y-2">
          {decisions.map((d, i) => (
            <div key={i} className={`rounded-lg p-3 text-xs ${d.correct ? "bg-clinical-green/5 border border-clinical-green/20" : "bg-clinical-red/5 border border-clinical-red/20"}`}>
              <div className="flex items-center gap-2 mb-1">
                {d.correct ? <CheckCircle className="w-3.5 h-3.5 text-clinical-green" /> : <X className="w-3.5 h-3.5 text-clinical-red" />}
                <span className="font-semibold text-foreground">Step {i + 1}: {d.choice}</span>
              </div>
              <p className="text-muted-foreground">{d.feedback}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-clinical-teal/30 bg-clinical-teal/5 p-4 mb-4 shadow-sm">
        <h2 className="text-sm font-heading font-bold text-foreground mb-3 flex items-center gap-1.5"><Lightbulb className="w-4 h-4 text-clinical-amber" /> Key Learning Points for {patientName}</h2>
        <ul className="space-y-2">
          {learningPoints.map((point, i) => (
            <li key={i} className="flex items-start gap-2 text-xs text-foreground leading-relaxed">
              <span className="grid h-4 w-4 shrink-0 place-items-center rounded-full bg-clinical-amber/20 text-clinical-amber mt-0.5"><Lightbulb className="w-2.5 h-2.5" /></span>
              <span>{point}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="mb-4"><SKBadgeGroup skCodes={scenario.sk_codes} poCodes={scenario.performance_outcomes} /></div>

      <div className="pf-progress-links" aria-label="Continue your learning">
        <button className="pf-secondary-button" onClick={() => onNavigate?.("/care-planning")}>Continue to care planning</button>
        <button className="pf-secondary-button" onClick={() => onNavigate?.("/reflection")}>Reflect on your decisions</button>
        <button className="pf-secondary-button" onClick={() => onNavigate?.("/performance")}>View progress and feedback</button>
      </div>
      <button onClick={onExit}
        className="w-full py-3 rounded-lg bg-clinical-teal text-white font-heading font-semibold text-sm hover:opacity-90">Back to Ward</button>
    </div>
  );
}