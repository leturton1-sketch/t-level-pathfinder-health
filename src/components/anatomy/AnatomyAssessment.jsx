import { useState } from "react";
import { Brain, CheckCircle2, RotateCcw, Sparkles, Target, Trophy, XCircle } from "lucide-react";
import Anatomy3DViewer from "@/components/anatomy/Anatomy3DViewer";
import { ANATOMY_STRUCTURES, SYSTEM_META } from "@/lib/anatomy3D";

// Organs students must place. Internal systems only — outer layers are hidden
// so the body shell reads as a translucent mannequin to place organs into.
const ASSESSMENT_ORGANS = [
  "brain", "heart", "lungs", "liver", "stomach",
  "kidneys", "bladder", "large_intestine", "spleen", "pancreas",
];
const ACTIVE_SYSTEMS = [
  "nervous", "cardiovascular", "respiratory", "digestive",
  "urinary", "endocrine", "lymphatic", "reproductive",
];
// ~8cm tolerance in body units (body height ≈ 1.7).
const TOLERANCE = 0.08;

const panel = "polished-glass-edge rounded-[28px] border border-white/90 bg-gradient-to-br from-white/92 via-slate-100/82 to-slate-200/68 shadow-[0_12px_0_-6px_rgba(100,116,139,.24),0_28px_60px_-32px_rgba(15,23,42,.55),inset_1px_1px_2px_white] backdrop-blur-2xl";

function scramble(defaults) {
  const out = {};
  ASSESSMENT_ORGANS.forEach((id) => {
    const base = defaults[id]?.position || [0, 0, 0];
    const angle = Math.random() * Math.PI * 2;
    const dist = 0.26 + Math.random() * 0.16;
    out[id] = [
      base[0] + Math.cos(angle) * dist,
      base[1] + (Math.random() - 0.5) * 0.34,
      base[2] + Math.sin(angle) * dist * 0.55,
    ];
  });
  return out;
}

export default function AnatomyAssessment() {
  const [defaults, setDefaults] = useState({});
  const [phase, setPhase] = useState("intro"); // intro | playing | scored
  const [placements, setPlacements] = useState({});
  const [score, setScore] = useState(null);

  const ready = ASSESSMENT_ORGANS.every((id) => defaults[id]?.position);

  const organName = (id) => ANATOMY_STRUCTURES.find((s) => s.id === id)?.name || id;

  const start = () => {
    setPlacements(scramble(defaults));
    setScore(null);
    setPhase("playing");
  };

  const handleTransform = (id, transform) => {
    if (transform.position) setPlacements((p) => ({ ...p, [id]: transform.position }));
  };

  const submit = () => {
    const results = ASSESSMENT_ORGANS.map((id) => {
      const target = defaults[id]?.position || [0, 0, 0];
      const placed = placements[id] || target;
      const dx = placed[0] - target[0];
      const dy = placed[1] - target[1];
      const dz = placed[2] - target[2];
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
      return { id, dist, accuracy: Math.max(0, 1 - dist / TOLERANCE), correct: dist <= TOLERANCE };
    });
    const total = results.reduce((s, r) => s + r.accuracy, 0) / results.length;
    setScore({ results, total: Math.round(total * 100) });
    setPhase("scored");
  };

  const reset = () => { setPhase("intro"); setPlacements({}); setScore(null); };

  const overrides = phase === "intro" ? {} : placements;

  return (
    <div className="grid gap-4 min-[1600px]:grid-cols-[340px_minmax(0,1fr)]">
      <aside className={`${panel} p-6`}>
        <p className="text-[10px] font-black uppercase tracking-[.18em] text-violet-700">T Level · Anatomy assessment</p>
        <h2 className="mt-1 text-2xl font-black text-slate-900">Organ placement challenge</h2>

        {phase === "intro" && (
          <>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Each organ is shown <strong className="text-slate-800">greyed out</strong> and displaced from its correct location.
              Drag every organ into its proper anatomical position, then submit to earn a placement score.
            </p>
            <ul className="mt-4 space-y-2 text-xs text-slate-600">
              <li className="flex items-start gap-2"><Target className="mt-0.5 h-4 w-4 shrink-0 text-violet-600" />Drag an organ with the mouse to translate it.</li>
              <li className="flex items-start gap-2"><Target className="mt-0.5 h-4 w-4 shrink-0 text-violet-600" />Click empty space or hold Shift and drag to rotate the body.</li>
              <li className="flex items-start gap-2"><Target className="mt-0.5 h-4 w-4 shrink-0 text-violet-600" />Scroll to zoom. Organs score within an 8 cm tolerance.</li>
            </ul>
            <button
              onClick={start}
              disabled={!ready}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 py-3 text-sm font-black text-white shadow-lg transition disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Sparkles className="h-4 w-4" />{ready ? "Begin assessment" : "Loading atlas…"}
            </button>
          </>
        )}

        {phase === "playing" && (
          <>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Drag the greyed organs into place. When you are happy with your positioning, submit for scoring.
            </p>
            <div className="mt-4 rounded-2xl bg-slate-900 p-3 text-white">
              <p className="text-[10px] font-black uppercase tracking-wider text-cyan-300">Organs to place</p>
              <p className="mt-1 text-2xl font-black">{ASSESSMENT_ORGANS.length}</p>
            </div>
            <button
              onClick={submit}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-black text-white shadow-lg transition hover:bg-emerald-700"
            >
              <Trophy className="h-4 w-4" />Submit for score
            </button>
          </>
        )}

        {phase === "scored" && score && (
          <>
            <div className={`mt-4 rounded-2xl p-4 text-white ${score.total >= 70 ? "bg-emerald-600" : score.total >= 40 ? "bg-amber-500" : "bg-rose-600"}`}>
              <p className="text-[10px] font-black uppercase tracking-wider">Placement score</p>
              <p className="mt-1 text-4xl font-black">{score.total}%</p>
              <p className="mt-1 text-xs opacity-90">{score.results.filter((r) => r.correct).length} of {score.results.length} organs within tolerance</p>
            </div>
            <div className="mt-4 space-y-2">
              {score.results.map((r) => (
                <div key={r.id} className="rounded-xl border border-slate-200 bg-white/80 p-2.5">
                  <div className="flex items-center gap-2">
                    {r.correct ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <XCircle className="h-4 w-4 text-rose-500" />}
                    <span className="flex-1 text-xs font-bold text-slate-800">{organName(r.id)}</span>
                    <span className="font-mono text-[10px] text-slate-500">{(r.dist * 100).toFixed(1)} cm</span>
                  </div>
                  <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
                    <div className={`h-full ${r.correct ? "bg-emerald-500" : "bg-amber-500"}`} style={{ width: `${Math.round(r.accuracy * 100)}%` }} />
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={reset}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-black text-white shadow-lg transition hover:bg-slate-800"
            >
              <RotateCcw className="h-4 w-4" />Play again
            </button>
          </>
        )}
      </aside>

      <section className={`${panel} overflow-hidden p-3`}>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2 px-2">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[.18em] text-cyan-700">Drag-and-drop assessment</p>
            <h2 className="font-black text-slate-900">Place each organ where it belongs</h2>
          </div>
          <span className="flex items-center gap-1 rounded-full bg-slate-900 px-3 py-1.5 text-[10px] font-bold text-white">
            <Brain className="h-3.5 w-3.5" />{phase === "playing" ? "Drag organs to position" : phase === "scored" ? "Scored" : "Ready"}
          </span>
        </div>
        <div className="relative h-[620px] overflow-hidden rounded-[22px] border border-slate-200 bg-[#F8FAFC]">
          <Anatomy3DViewer
            genitalia="male"
            activeSystems={ACTIVE_SYSTEMS}
            selectedId={null}
            isolatedId={null}
            reconstructId={null}
            onSelectStructure={() => {}}
            editMode={phase === "playing"}
            assessmentMode={phase !== "intro"}
            structureOverrides={overrides}
            onTransformStructure={handleTransform}
            onTransformDefaults={setDefaults}
            hiddenStructures={[]}
            clippedStructures={[]}
            customStructures={[]}
            resetNonce={0}
          />
        </div>
        <p className="mt-2 px-2 text-xs text-slate-600">
          {phase === "playing"
            ? "Greyed organs are misplaced. Drag each into its correct anatomical position, then submit."
            : "Outer body layers are hidden so you can see the placement tray inside the translucent mannequin."}
        </p>
      </section>
    </div>
  );
}