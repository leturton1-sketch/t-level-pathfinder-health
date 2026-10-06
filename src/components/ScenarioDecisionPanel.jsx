import { useMemo, useState } from "react";
import { CheckCircle, X, ChevronRight, Stethoscope, Activity } from "lucide-react";
import { getDecisionTree, getDecisionTreeSize } from "@/lib/scenarioDecisionTrees";
import NEWS2Badge from "@/components/NEWS2Badge";

/**
 * Plays a clinical scenario's branching decision tree over the 3D ward.
 *
 * Reads the tree once from the scenario (authored decision_tree, a category
 * default, or a ward-patient tree), walks the learner through each node, scores
 * correct choices, nudges vitals toward normal on correct answers, and calls
 * onComplete with the full decision log when the learner reaches an end node.
 */
export default function ScenarioDecisionPanel({ scenario, vitals, onUpdateVitals, onComplete }) {
  const tree = useMemo(() => getDecisionTree(scenario), [scenario]);
  const maxScore = useMemo(() => getDecisionTreeSize(scenario), [scenario]);
  const [currentNodeId, setCurrentNodeId] = useState(tree.entry);
  const [decisions, setDecisions] = useState([]);
  const [feedback, setFeedback] = useState(null);

  const node = tree.nodes[currentNodeId];
  // Shuffle the answer options for the current node so the correct answer
  // lands in a different position on each attempt — the tree's branching
  // structure keeps the clinical question sequence fixed.
  const shuffledOptions = useMemo(
    () => (node?.options ? [...node.options].sort(() => Math.random() - 0.5) : []),
    [currentNodeId, tree]
  );
  if (!node) return null;

  const handleChoose = (option) => {
    if (feedback) return; // lock while feedback is showing
    const decision = {
      prompt: node.prompt,
      choice: option.label,
      correct: !!option.correct,
      feedback: option.feedback,
    };
    const nextDecisions = [...decisions, decision];
    setDecisions(nextDecisions);
    setFeedback(option);
    if (option.correct && vitals && onUpdateVitals) {
      onUpdateVitals({
        ...vitals,
        rr: Math.max(12, (vitals.rr || 16) - 2),
        spo2: Math.min(98, (vitals.spo2 || 94) + 3),
      });
    }
    window.setTimeout(() => {
      setFeedback(null);
      if (!option.next || !tree.nodes[option.next]) {
        onComplete(nextDecisions, maxScore);
      } else {
        setCurrentNodeId(option.next);
      }
    }, 1700);
  };

  const stepNumber = decisions.length + 1;
  const score = decisions.filter((d) => d.correct).length;

  return (
    <div className="absolute left-3 bottom-3 z-40 w-[calc(100%-1.5rem)] sm:w-[400px]">
      <div className="polished-glass-edge max-h-[70vh] overflow-y-auto scrollbar-thin rounded-2xl border border-white/90 bg-white/95 p-4 shadow-2xl backdrop-blur-xl">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-[.16em] text-clinical-teal">
              Clinical decision · Step {stepNumber} of {maxScore}
            </p>
            <h2 className="mt-0.5 truncate text-base font-heading font-bold text-foreground">{scenario.name}</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">Score {score}/{decisions.length || 0}</p>
          </div>
          {scenario.initial_news2 != null && <NEWS2Badge score={scenario.initial_news2} size="sm" />}
        </div>

        {/* Live vitals strip */}
        {vitals && (
          <div className="mt-3 grid grid-cols-4 gap-1.5">
            {[
              { k: "rr", label: "RR" },
              { k: "spo2", label: "SpO₂" },
              { k: "sbp", label: "SBP" },
              { k: "hr", label: "HR" },
            ].map(({ k, label }) => vitals[k] != null && (
              <div key={k} className="rounded-lg border border-border bg-card px-1.5 py-1 text-center">
                <span className="block text-[8px] font-semibold uppercase text-muted-foreground">{label}</span>
                <span className="text-xs font-heading font-bold text-foreground">{vitals[k]}</span>
              </div>
            ))}
          </div>
        )}

        {/* Prompt */}
        <div className="mt-3 rounded-xl border border-clinical-teal/20 bg-clinical-teal/5 p-3">
          <div className="mb-1 flex items-center gap-1.5">
            <Stethoscope className="h-3.5 w-3.5 text-clinical-teal" />
            <span className="text-[10px] font-bold uppercase tracking-wide text-clinical-teal">Clinical prompt</span>
          </div>
          <p className="text-sm font-medium leading-relaxed text-foreground">{node.prompt}</p>
        </div>

        {/* Options */}
        <div className="mt-3 space-y-2" role="group" aria-label="Decision options">
          {shuffledOptions.map((option, idx) => {
            const showResult = feedback && feedback.label === option.label;
            return (
              <button
                key={option.id || idx}
                type="button"
                disabled={!!feedback}
                onClick={() => handleChoose(option)}
                className={`flex w-full items-center justify-between gap-2 rounded-xl border px-3 py-2.5 text-left text-xs font-medium transition-all disabled:cursor-default
                  ${showResult
                    ? option.correct
                      ? "border-clinical-green/50 bg-clinical-green/10 text-foreground"
                      : "border-clinical-red/50 bg-clinical-red/10 text-foreground"
                    : "border-border bg-card text-foreground hover:border-clinical-teal/40 hover:bg-secondary/40"}`}
              >
                <span className="flex-1">{option.label}</span>
                {showResult ? (
                  option.correct
                    ? <CheckCircle className="h-4 w-4 shrink-0 text-clinical-green" />
                    : <X className="h-4 w-4 shrink-0 text-clinical-red" />
                ) : (
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                )}
              </button>
            );
          })}
        </div>

        {/* Feedback */}
        {feedback && (
          <div className={`mt-3 rounded-xl border p-3 text-xs animate-fade-in ${feedback.correct ? "border-clinical-green/30 bg-clinical-green/5" : "border-clinical-red/30 bg-clinical-red/5"}`}>
            <div className="mb-1 flex items-center gap-1.5">
              <Activity className={`h-3.5 w-3.5 ${feedback.correct ? "text-clinical-green" : "text-clinical-red"}`} />
              <span className={`font-heading font-bold uppercase tracking-wide ${feedback.correct ? "text-clinical-green" : "text-clinical-red"}`}>
                {feedback.correct ? "Correct" : "Review needed"}
              </span>
            </div>
            <p className="leading-relaxed text-foreground">{feedback.feedback}</p>
          </div>
        )}
      </div>
    </div>
  );
}