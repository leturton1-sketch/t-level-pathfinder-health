import { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { isLoggedIn } from "@/lib/clinicalAuth";
import { THEORY_MODULES } from "@/lib/specData";
import { getKnowledgeChecks } from "@/lib/theoryContent";
import { SKBadgeGroup } from "@/components/SKBadge";
import ReactMarkdown from "react-markdown";
import { ArrowLeft, Clock, CheckCircle, BookMarked, ChevronRight, AlertCircle } from "lucide-react";

export default function TheoryDetail() {
  const { moduleId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [module, setModule] = useState(location.state?.module || null);
  const [loading, setLoading] = useState(true);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  useEffect(() => {
    if (!isLoggedIn()) {
      navigate("/login");
      return;
    }
    loadModule();
  }, [navigate, moduleId]);

  const loadModule = async () => {
    if (module) {
      setLoading(false);
      return;
    }
    try {
      const m = await base44.entities.TheoryModule.get(moduleId);
      setModule(m);
    } catch {
      // Try local fallback
      const local = THEORY_MODULES.find((_, i) => `local_${i}` === moduleId);
      if (local) setModule(local);
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = () => {
    const progress = JSON.parse(localStorage.getItem("theory_progress") || "{}");
    if (module?.spec_area) progress[module.spec_area] = true;
    localStorage.setItem("theory_progress", JSON.stringify(progress));
    navigate("/theory");
  };

  const handleSubmitQuiz = () => {
    setQuizSubmitted(true);
    if (module?.spec_area) {
      const scores = JSON.parse(localStorage.getItem("theory_quiz_scores") || "{}");
      scores[module.spec_area] = { score: quizScore, total: quizQuestions.length, pct: Math.round((quizScore / quizQuestions.length) * 100) };
      localStorage.setItem("theory_quiz_scores", JSON.stringify(scores));
    }
  };

  // Knowledge check questions — stored per module (20 per volume), specData fallback
  const quizQuestions = module ? (getKnowledgeChecks(module).length > 0 ? getKnowledgeChecks(module) : [
    {
      question: `Which specification area does "${module.title}" belong to?`,
      options: [module.spec_area, "Area 1", "Area 5", "Area 9"],
      correct: module.spec_area,
    },
  ]) : [];

  const handleQuizAnswer = (qIdx, answer) => {
    setQuizAnswers({ ...quizAnswers, [qIdx]: answer });
  };

  const quizScore = quizQuestions.filter((q, idx) => quizAnswers[idx] === q.correct).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-clinical-navy">
        <div className="w-8 h-8 border-2 border-clinical-teal/30 border-t-clinical-teal rounded-full animate-spin" />
      </div>
    );
  }

  if (!module) {
    return (
      <div className="min-h-screen bg-clinical-navy flex items-center justify-center px-4">
        <div className="text-center">
          <AlertCircle className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Module not found.</p>
          <button onClick={() => navigate("/theory")} className="mt-4 text-clinical-teal text-sm">← Back to Theory</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-clinical-navy">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-clinical-navy/90 backdrop-blur-md border-b border-border">
        <div className="flex items-center gap-3 px-4 py-3 max-w-3xl mx-auto">
          <button onClick={() => navigate("/theory")} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
              {module.volume} · {module.spec_area}
            </p>
            <h1 className="text-sm font-bold text-foreground truncate">{module.title}</h1>
          </div>
          <span className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
            <Clock className="w-3 h-3" /> {module.estimated_duration}m
          </span>
        </div>
      </div>

      <div className="px-4 pt-4 pb-32 max-w-3xl mx-auto">
        {/* SK/PO badges */}
        <div className="mb-4">
          <p className="text-xs font-semibold text-muted-foreground mb-1.5">MAPPED TO:</p>
          <SKBadgeGroup skCodes={module.sk_codes || []} poCodes={module.performance_outcomes || []} />
        </div>

        {/* Content */}
        <div className="prose prose-sm max-w-none mb-6">
          <ReactMarkdown
            components={{
              h2: ({ node, ...props }) => <h2 className="text-lg font-bold text-foreground mt-5 mb-2" {...props} />,
              h3: ({ node, ...props }) => <h3 className="text-base font-bold text-clinical-teal mt-4 mb-1.5" {...props} />,
              p: ({ node, ...props }) => <p className="text-sm text-foreground/90 leading-relaxed mb-3" {...props} />,
              li: ({ node, ...props }) => <li className="text-sm text-foreground/90 leading-relaxed" {...props} />,
              ul: ({ node, ...props }) => <ul className="space-y-1 mb-3 list-disc list-inside" {...props} />,
              strong: ({ node, ...props }) => <strong className="font-bold text-foreground" {...props} />,
            }}
          >
            {module.content}
          </ReactMarkdown>
        </div>

        {/* References */}
        {module.references && module.references.length > 0 && (
          <div className="mb-6 rounded-xl border border-border bg-card/40 p-3">
            <p className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1">
              <BookMarked className="w-3 h-3" /> EVIDENCE & REFERENCES
            </p>
            <ul className="space-y-1">
              {module.references.map((ref, i) => (
                <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                  <span className="text-clinical-teal shrink-0">•</span> {ref}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Knowledge check */}
        <div className="rounded-xl border border-clinical-teal/30 bg-clinical-teal/5 p-4 mb-6">
          <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-clinical-teal" />
            Knowledge Check
          </h3>
          <div className="space-y-4">
            {quizQuestions.map((q, qIdx) => (
              <div key={qIdx}>
                <p className="text-sm text-foreground mb-2">{qIdx + 1}. {q.question}</p>
                <div className="space-y-1.5">
                  {q.options.map((opt) => {
                    const selected = quizAnswers[qIdx] === opt;
                    const isCorrect = quizSubmitted && opt === q.correct;
                    const isWrong = quizSubmitted && selected && opt !== q.correct;
                    return (
                      <button
                        key={opt}
                        onClick={() => handleQuizAnswer(qIdx, opt)}
                        className={`w-full text-left text-sm rounded-lg border px-3 py-2 transition-all ${
                          isCorrect
                            ? "border-clinical-green bg-clinical-green/10 text-clinical-green"
                            : isWrong
                            ? "border-clinical-red bg-clinical-red/10 text-clinical-red"
                            : selected
                            ? "border-clinical-teal bg-clinical-teal/10 text-clinical-teal"
                            : "border-border bg-muted/30 text-foreground hover:border-clinical-teal/40"
                        }`}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
          {quizSubmitted && (
            <div className="mt-3 text-sm text-center">
              <span className={quizScore === quizQuestions.length ? "text-clinical-green" : "text-clinical-amber"}>
                Score: {quizScore}/{quizQuestions.length}
              </span>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          {!quizSubmitted ? (
            <button
              onClick={handleSubmitQuiz}
              disabled={Object.keys(quizAnswers).length < quizQuestions.length}
              className="flex-1 py-3 rounded-lg border border-clinical-teal/40 text-clinical-teal font-semibold text-sm disabled:opacity-40 hover:bg-clinical-teal/10 transition-all"
            >
              Check Answers
            </button>
          ) : null}
          <button
            onClick={handleComplete}
            className="flex-1 py-3 rounded-lg bg-clinical-teal text-white font-semibold text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
          >
            Mark Complete <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}