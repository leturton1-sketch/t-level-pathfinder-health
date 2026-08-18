import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { ResponsiveContainer, BarChart, Bar, LineChart, Line, Tooltip } from "recharts";
import {
  BookOpen, Stethoscope, ClipboardList, Brain, BarChart3, Network,
  CheckCircle, Circle, ChevronRight,
} from "lucide-react";

const TOOLTIP_STYLE = { fontSize: "10px", background: "#ffffff", border: "1px solid #D8DEE6", borderRadius: "8px" };

function Skeleton() {
  return <div className="space-y-2">
    <div className="h-6 w-16 rounded bg-muted animate-pulse" />
    <div className="h-16 rounded bg-muted animate-pulse" />
  </div>;
}

export function WhiteboardCard({ icon: Icon, title, onNavigate, loading, children }) {
  return (
    <button onClick={onNavigate} className="group w-full text-left rounded-2xl border border-border bg-card p-4 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all flex flex-col h-full">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#14B8A6] to-[#0F766E] flex items-center justify-center shadow-sm">
            <Icon className="w-5 h-5 text-white" />
          </div>
          <h3 className="font-heading font-bold text-sm text-foreground">{title}</h3>
        </div>
        <span className="flex items-center gap-1 text-[9px] font-heading uppercase tracking-wider text-clinical-teal">
          <span className="w-1.5 h-1.5 rounded-full bg-clinical-green animate-pulse" /> Live
        </span>
      </div>
      {loading ? <Skeleton /> : children}
      <div className="mt-3 flex items-center gap-1 text-[10px] font-heading font-semibold text-muted-foreground group-hover:text-clinical-teal">
        Open module <ChevronRight className="w-3 h-3" />
      </div>
    </button>
  );
}

export function LearningCard({ onNavigate }) {
  const [modules, setModules] = useState([]);
  const [progress, setProgress] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const m = await base44.entities.TheoryModule.list("order_index", 50);
        if (m.length) setModules(m);
      } catch {}
      setProgress(JSON.parse(localStorage.getItem("theory_progress") || "{}"));
      setLoading(false);
    })();
  }, []);

  const total = modules.length || 9;
  const completed = Object.values(progress).filter(Boolean).length;
  const pct = Math.round((completed / total) * 100);

  return (
    <WhiteboardCard icon={BookOpen} title="Learning" loading={loading} onNavigate={onNavigate}>
      <div className="flex items-end justify-between mb-2">
        <span className="text-2xl font-heading font-bold text-foreground">{completed}<span className="text-sm text-muted-foreground">/{total}</span></span>
        <span className="text-[10px] text-muted-foreground">modules complete</span>
      </div>
      <div className="h-1.5 rounded-full bg-secondary overflow-hidden mb-2">
        <div className="h-full bg-gradient-to-r from-[#14B8A6] to-[#0F766E]" style={{ width: `${pct}%` }} />
      </div>
      <div className="space-y-1">
        {modules.slice(0, 3).map((m, i) => (
          <div key={i} className="flex items-center gap-1.5 text-[11px]">
            {progress[m.spec_area] ? <CheckCircle className="w-3 h-3 text-clinical-green shrink-0" /> : <Circle className="w-3 h-3 text-muted-foreground/40 shrink-0" />}
            <span className="text-muted-foreground truncate">{m.title}</span>
          </div>
        ))}
        {modules.length === 0 && <p className="text-[11px] text-muted-foreground">9 spec areas · T Level Core</p>}
      </div>
    </WhiteboardCard>
  );
}

export function WardCard({ onNavigate }) {
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    base44.entities.Scenario.list().then((s) => setCount(s.length)).catch(() => {}).finally(() => setLoading(false));
  }, []);
  return (
    <WhiteboardCard icon={Stethoscope} title="Ward Simulation" loading={loading} onNavigate={onNavigate}>
      <div className="flex items-center justify-between mb-2">
        <div>
          <div className="text-2xl font-heading font-bold text-foreground">{count}</div>
          <div className="text-[10px] text-muted-foreground">scenarios ready</div>
        </div>
        <div className="text-right">
          <div className="text-[9px] font-heading uppercase text-muted-foreground">Suites</div>
          <div className="text-sm font-heading font-bold text-foreground">A · B · C · D</div>
        </div>
      </div>
      <div className="rounded-lg bg-muted p-2 text-[10px] text-muted-foreground leading-relaxed">
        3D interactive virtual hospital — tap a bed to begin a clinical scenario.
      </div>
    </WhiteboardCard>
  );
}

export function CarePlanningCard({ onNavigate, userId }) {
  const [subs, setSubs] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!userId) { setLoading(false); return; }
    base44.entities.CarePlanSubmission.filter({ student_id: userId }).then(setSubs).catch(() => {}).finally(() => setLoading(false));
  }, [userId]);
  const submitted = subs.filter((s) => s.status === "submitted" || s.status === "reviewed").length;
  const byType = ["abcde", "news2", "smart_goals", "handover_sbar", "risk_assessment"].map((t) => ({
    name: t.replace("_", " ").toUpperCase(),
    count: subs.filter((s) => s.type === t).length,
  }));
  return (
    <WhiteboardCard icon={ClipboardList} title="Care Planning" loading={loading} onNavigate={onNavigate}>
      <div className="flex items-center gap-4 mb-2">
        <div><div className="text-xl font-heading font-bold text-foreground">{subs.length}</div><div className="text-[10px] text-muted-foreground">records</div></div>
        <div><div className="text-xl font-heading font-bold text-clinical-green">{submitted}</div><div className="text-[10px] text-muted-foreground">submitted</div></div>
      </div>
      <div className="h-16">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={byType}>
            <Bar dataKey="count" fill="#0F766E" radius={[3, 3, 0, 0]} />
            <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: "rgba(15,118,110,0.06)" }} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </WhiteboardCard>
  );
}

export function KnowledgeCard({ onNavigate }) {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    base44.entities.KnowledgeArticle.list().then(setArticles).catch(() => {}).finally(() => setLoading(false));
  }, []);
  return (
    <WhiteboardCard icon={Brain} title="Knowledge" loading={loading} onNavigate={onNavigate}>
      <div className="flex items-end justify-between mb-2">
        <div className="text-2xl font-heading font-bold text-foreground">{articles.length}</div>
        <span className="text-[10px] text-muted-foreground">research articles</span>
      </div>
      <div className="space-y-1.5">
        {articles.slice(0, 3).map((a, i) => (
          <div key={i} className="flex items-center gap-1.5 text-[11px]">
            <span className="text-muted-foreground truncate flex-1">{a.title}</span>
            <span className="text-[8px] font-bold rounded bg-clinical-teal/15 text-clinical-teal px-1 py-0.5">AI</span>
          </div>
        ))}
        {articles.length === 0 && <p className="text-[11px] text-muted-foreground">Evidence-based clinical reference</p>}
      </div>
    </WhiteboardCard>
  );
}

export function PerformanceCard({ onNavigate, userId }) {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!userId) { setLoading(false); return; }
    base44.entities.SimulationResult.filter({ student_id: userId }).then(setResults).catch(() => {}).finally(() => setLoading(false));
  }, [userId]);
  const avg = results.length ? Math.round(results.reduce((s, r) => s + (r.score || 0), 0) / results.length) : 0;
  const data = results.slice(0, 6).map((r, i) => ({ name: `S${i + 1}`, score: r.score || 0 }));
  return (
    <WhiteboardCard icon={BarChart3} title="Performance" loading={loading} onNavigate={onNavigate}>
      <div className="flex items-center gap-4 mb-2">
        <div><div className="text-xl font-heading font-bold text-foreground">{avg}%</div><div className="text-[10px] text-muted-foreground">avg score</div></div>
        <div><div className="text-xl font-heading font-bold text-clinical-teal">{results.length}</div><div className="text-[10px] text-muted-foreground">simulations</div></div>
      </div>
      <div className="h-16">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <Line type="monotone" dataKey="score" stroke="#0F766E" strokeWidth={2} dot={{ r: 2, fill: "#0F766E" }} />
            <Tooltip contentStyle={TOOLTIP_STYLE} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </WhiteboardCard>
  );
}

const ACTIVITIES = ["3D Anatomy Atlas", "PPE Sequencer", "Hazard Hunt", "Science Flashcards", "Mock EPR", "MDT Org Chart"];

export function InteractiveCard({ onNavigate }) {
  return (
    <WhiteboardCard icon={Network} title="Interactive" loading={false} onNavigate={onNavigate}>
      <div className="flex items-end justify-between mb-2">
        <div className="text-2xl font-heading font-bold text-foreground">{ACTIVITIES.length}</div>
        <span className="text-[10px] text-muted-foreground">skills labs</span>
      </div>
      <div className="flex flex-wrap gap-1">
        {ACTIVITIES.map((a) => (
          <span key={a} className="text-[9px] rounded-md bg-muted text-muted-foreground px-1.5 py-0.5">{a}</span>
        ))}
      </div>
    </WhiteboardCard>
  );
}