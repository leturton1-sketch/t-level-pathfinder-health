import { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { isLoggedIn } from "@/lib/clinicalAuth";
import { THEORY_MODULES } from "@/lib/specData";
import { getKnowledgeChecks } from "@/lib/theoryContent";
import { SKBadgeGroup } from "@/components/SKBadge";
import ReactMarkdown from "react-markdown";
import { ArrowLeft, Clock, CheckCircle, BookMarked, ChevronRight, AlertCircle, Target } from "lucide-react";

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
      setModule(await base44.entities.TheoryModule.get(moduleId));
    } catch {
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

  const quizQuestions = module ? (getKnowledgeChecks(module).length > 0 ? getKnowledgeChecks(module) : [{
    question: `Which specification area does "${module.title}" belong to?`,
    options: [module.spec_area, "Area 1", "Area 5", "Area 9"],
    correct: module.spec_area,
  }]) : [];

  const quizScore = quizQuestions.filter((q, idx) => quizAnswers[idx] === q.correct).length;

  const handleSubmitQuiz = () => {
    setQuizSubmitted(true);
    if (module?.spec_area) {
      const scores = JSON.parse(localStorage.getItem("theory_quiz_scores") || "{}");
      scores[module.spec_area] = {
        score: quizScore,
        total: quizQuestions.length,
        pct: Math.round((quizScore / quizQuestions.length) * 100),
      };
      localStorage.setItem("theory_quiz_scores", JSON.stringify(scores));
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background" role="status" aria-label="Loading module">
        <div className="h-9 w-9 animate-spin rounded-full border-2 border-tl-blue/25 border-t-tl-blue" />
      </div>
    );
  }

  if (!module) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="rounded-[24px] border border-white bg-white/90 p-8 text-center shadow-xl backdrop-blur-xl">
          <AlertCircle className="mx-auto mb-3 h-9 w-9 text-tl-blue" aria-hidden="true" />
          <p className="font-semibold text-slate-800">Module not found.</p>
          <button onClick={() => navigate("/theory")} className="mt-5 rounded-xl bg-tl-blue px-4 py-2.5 text-sm font-bold text-white">Back to Theory</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(15,117,216,0.12),transparent_34%),radial-gradient(circle_at_85%_15%,rgba(255,147,105,0.09),transparent_28%)]">
      <header className="sticky top-0 z-20 border-b border-white/90 bg-white/85 shadow-[0_8px_24px_rgba(66,55,88,0.08)] backdrop-blur-2xl">
        <div className="mx-auto flex max-w-4xl items-center gap-3 px-4 py-3 sm:px-6">
          <button
            onClick={() => navigate("/theory")}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-800 shadow-sm transition hover:-translate-y-0.5 hover:border-tl-blue/30 hover:text-tl-blue focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-tl-blue/25"
            aria-label="Back to theory modules"
          >
            <ArrowLeft className="h-5 w-5" aria-hidden="true" />
          </button>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-tl-blue">{module.volume} · {module.spec_area}</p>
            <h1 className="truncate text-base font-extrabold text-slate-950 sm:text-lg">{module.title}</h1>
          </div>
          <span className="flex shrink-0 items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm">
            <Clock className="h-4 w-4 text-tl-blue" aria-hidden="true" /> {module.estimated_duration} min
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 pb-32 pt-6 sm:px-6">
        <section className="polished-glass-edge mb-6 rounded-[24px] border border-white/90 bg-white/82 p-4 shadow-[0_14px_32px_rgba(66,55,88,0.11),inset_0_1px_0_white] backdrop-blur-xl sm:p-6" aria-labelledby="mapping-heading">
          <div className="mb-3 flex items-center gap-2">
            <Target className="h-4 w-4 text-tl-blue" aria-hidden="true" />
            <h2 id="mapping-heading" className="text-sm font-bold text-slate-900">Specification mapping</h2>
          </div>
          <SKBadgeGroup skCodes={module.sk_codes || []} poCodes={module.performance_outcomes || []} />
        </section>

        <article className="polished-glass-edge mb-6 rounded-[28px] border border-white/90 bg-white/92 p-6 shadow-[0_20px_46px_rgba(66,55,88,0.13),inset_0_1px_0_white] backdrop-blur-xl sm:p-8">
          <ReactMarkdown
            components={{
              h1: ({ node, ...props }) => <h1 className="mb-6 text-2xl font-extrabold tracking-tight text-slate-950 sm:text-3xl" {...props} />,
              h2: ({ node, ...props }) => <h2 className="mb-3 mt-8 border-b border-tl-blue/15 pb-2 text-xl font-extrabold tracking-tight text-slate-950 first:mt-0 sm:text-2xl" {...props} />,
              h3: ({ node, ...props }) => <h3 className="mb-2 mt-6 text-lg font-bold text-tl-blue sm:text-xl" {...props} />,
              p: ({ node, ...props }) => <p className="mb-4 text-[15px] leading-7 text-slate-800 sm:text-base" {...props} />,
              li: ({ node, ...props }) => <li className="pl-1 text-[15px] leading-7 text-slate-800 marker:text-tl-blue sm:text-base" {...props} />,
              ul: ({ node, ...props }) => <ul className="mb-6 ml-6 list-disc space-y-1.5" {...props} />,
              ol: ({ node, ...props }) => <ol className="mb-6 ml-6 list-decimal space-y-1.5" {...props} />,
              strong: ({ node, ...props }) => <strong className="font-extrabold text-slate-950" {...props} />,
              blockquote: ({ node, ...props }) => <blockquote className="my-6 rounded-r-xl border-l-4 border-tl-blue bg-tl-blue/8 px-4 py-3 text-slate-800" {...props} />,
              table: ({ node, ...props }) => <div className="my-6 overflow-x-auto rounded-xl border border-slate-200"><table className="w-full border-collapse text-left text-sm text-slate-800" {...props} /></div>,
              th: ({ node, ...props }) => <th className="bg-tl-blue/10 px-3 py-2.5 font-bold text-slate-950" {...props} />,
              td: ({ node, ...props }) => <td className="border-t border-slate-200 px-3 py-2.5 align-top" {...props} />,
            }}
          >
            {module.content}
          </ReactMarkdown>
        </article>

        {module.references?.length > 0 && (
          <section className="mb-6 rounded-[22px] border border-tl-blue/18 bg-gradient-to-br from-white to-sky-50/80 p-6 shadow-[0_12px_28px_rgba(66,55,88,0.09),inset_0_1px_0_white]" aria-labelledby="references-heading">
            <h2 id="references-heading" className="mb-3 flex items-center gap-2 text-sm font-extrabold uppercase tracking-[0.08em] text-slate-900">
              <BookMarked className="h-4 w-4 text-tl-blue" aria-hidden="true" /> Evidence & references
            </h2>
            <ul className="space-y-2">
              {module.references.map((ref, index) => (
                <li key={index} className="flex items-start gap-2 text-sm leading-6 text-slate-700">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-tl-blue" aria-hidden="true" /> {ref}
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="mb-6 rounded-[28px] border border-tl-blue/20 bg-white/90 p-6 shadow-[0_18px_40px_rgba(66,55,88,0.12),inset_0_1px_0_white] backdrop-blur-xl sm:p-8" aria-labelledby="knowledge-check-heading">
          <h2 id="knowledge-check-heading" className="mb-6 flex items-center gap-2 text-lg font-extrabold text-slate-950">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-tl-blue/12 text-tl-blue"><CheckCircle className="h-5 w-5" aria-hidden="true" /></span>
            Knowledge Check
          </h2>
          <div className="space-y-7">
            {quizQuestions.map((q, qIdx) => (
              <fieldset key={qIdx}>
                <legend className="mb-3 text-[15px] font-bold leading-6 text-slate-900 sm:text-base">{qIdx + 1}. {q.question}</legend>
                <div className="space-y-2">
                  {q.options.map((opt) => {
                    const selected = quizAnswers[qIdx] === opt;
                    const isCorrect = quizSubmitted && opt === q.correct;
                    const isWrong = quizSubmitted && selected && opt !== q.correct;
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setQuizAnswers({ ...quizAnswers, [qIdx]: opt })}
                        aria-pressed={selected}
                        className={`w-full rounded-xl border px-4 py-3 text-left text-sm font-medium leading-5 shadow-sm transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-tl-blue/20 ${
                          isCorrect
                            ? "border-emerald-400 bg-emerald-50 text-emerald-900"
                            : isWrong
                            ? "border-rose-400 bg-rose-50 text-rose-900"
                            : selected
                            ? "border-tl-blue bg-tl-blue/10 text-slate-950 ring-2 ring-tl-blue/15"
                            : "border-slate-200 bg-white text-slate-800 hover:-translate-y-0.5 hover:border-tl-blue/35"
                        }`}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
              </fieldset>
            ))}
          </div>
          {quizSubmitted && (
            <div className={`mt-6 rounded-xl px-4 py-3 text-center text-sm font-extrabold ${quizScore === quizQuestions.length ? "bg-emerald-100 text-emerald-900" : "bg-amber-100 text-amber-900"}`} role="status">
              Score: {quizScore}/{quizQuestions.length}
            </div>
          )}
        </section>

        <div className="flex flex-col gap-3 rounded-[22px] border border-white/90 bg-white/80 p-3 shadow-lg backdrop-blur-xl sm:flex-row">
          {!quizSubmitted && (
            <button
              onClick={handleSubmitQuiz}
              disabled={Object.keys(quizAnswers).length < quizQuestions.length}
              className="flex-1 rounded-xl border border-tl-blue/30 bg-white px-5 py-3.5 text-sm font-extrabold text-tl-blue transition hover:bg-tl-blue/8 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400 disabled:opacity-70"
            >
              Check Answers
            </button>
          )}
          <button
            onClick={handleComplete}
            className="flex-1 rounded-xl bg-gradient-to-r from-tl-blue to-sky-600 px-5 py-3.5 text-sm font-extrabold text-white shadow-[0_10px_22px_rgba(41,231,255,0.25)] transition hover:-translate-y-0.5 hover:shadow-[0_14px_28px_rgba(41,231,255,0.32)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-tl-blue/25"
          >
            <span className="flex items-center justify-center gap-2">Mark Complete <ChevronRight className="h-4 w-4" aria-hidden="true" /></span>
          </button>
        </div>
      </main>
    </div>
  );
}
