import {
  AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from "recharts";
import { SK_CODES, PERFORMANCE_OUTCOMES } from "@/lib/specData";
import { TrendingUp, Activity } from "lucide-react";

const TEAL = "#0F75D8";
const GREEN = "#277A52";
const AMBER = "#A65A00";

export default function ProgressOverTime({ results = [], submissions = [] }) {
  const totalSK = Object.keys(SK_CODES).length || 1;
  const totalPO = Object.keys(PERFORMANCE_OUTCOMES).length || 1;

  const events = [
    ...results.map((r) => ({
      date: new Date(r.created_date),
      score: r.score ?? 0,
      sk: r.sk_codes || [],
      po: r.performance_outcomes || [],
    })),
    ...submissions
      .filter((s) => s.status === "submitted" || s.status === "reviewed")
      .map((s) => ({
        date: new Date(s.created_date),
        score: s.status === "reviewed" ? 100 : 80,
        sk: s.sk_codes || [],
        po: s.performance_outcomes || [],
      })),
  ].sort((a, b) => a.date - b.date);

  if (events.length === 0) {
    return (
      <p className="text-xs text-muted-foreground text-center py-6">
        No dated activity yet — complete simulations and care plans to chart your development over time.
      </p>
    );
  }

  let runSum = 0;
  let count = 0;
  const skSet = new Set();
  const poSet = new Set();

  const points = events.map((e, i) => {
    runSum += e.score;
    count += 1;
    e.sk.forEach((c) => skSet.add(c));
    e.po.forEach((c) => poSet.add(c));
    return {
      label: e.date.toLocaleDateString("en-GB", { day: "2-digit", month: "short" }),
      idx: i + 1,
      avgScore: Math.round(runSum / count),
      skPct: Math.round((skSet.size / totalSK) * 100),
      poPct: Math.round((poSet.size / totalPO) * 100),
    };
  });

  return (
    <div className="space-y-5">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <TrendingUp className="w-4 h-4 text-clinical-teal" />
          <h3 className="text-sm font-bold text-foreground">Assessment Progress Over Time</h3>
        </div>
        <p className="text-xs text-muted-foreground mb-2">Cumulative average score across simulations and care plans</p>
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={points} margin={{ top: 5, right: 10, left: -16, bottom: 0 }}>
            <defs>
              <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={TEAL} stopOpacity={0.45} />
                <stop offset="95%" stopColor={TEAL} stopOpacity={0.04} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(260 23% 88%)" />
            <XAxis dataKey="label" tick={{ fontSize: 10, fill: "hsl(265 6% 39%)" }} minTickGap={12} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: "hsl(265 6% 39%)" }} />
            <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid hsl(260 23% 90%)" }} />
            <Area type="monotone" dataKey="avgScore" name="Avg score %" stroke={TEAL} strokeWidth={2} fill="url(#scoreGrad)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div>
        <div className="flex items-center gap-2 mb-1">
          <Activity className="w-4 h-4 text-clinical-green" />
          <h3 className="text-sm font-bold text-foreground">Skill Category Growth Over Time</h3>
        </div>
        <p className="text-xs text-muted-foreground mb-2">Cumulative coverage of skill codes (SK) and performance outcomes (PO)</p>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={points} margin={{ top: 5, right: 10, left: -16, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(260 23% 88%)" />
            <XAxis dataKey="label" tick={{ fontSize: 10, fill: "hsl(265 6% 39%)" }} minTickGap={12} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: "hsl(265 6% 39%)" }} />
            <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid hsl(260 23% 90%)" }} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Line type="monotone" dataKey="skPct" name="SK coverage %" stroke={GREEN} strokeWidth={2} dot={{ r: 2.5 }} />
            <Line type="monotone" dataKey="poPct" name="PO coverage %" stroke={AMBER} strokeWidth={2} dot={{ r: 2.5 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}