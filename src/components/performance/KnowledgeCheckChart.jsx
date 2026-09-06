import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

export default function KnowledgeCheckChart({ data }) {
  if (!data || data.length === 0) return null;
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(210 14% 88%)" />
        <XAxis dataKey="label" tick={{ fontSize: 9, fill: "hsl(210 8% 46%)" }} interval={0} angle={-25} textAnchor="end" height={50} />
        <YAxis domain={[0, 100]} tick={{ fontSize: 9, fill: "hsl(210 8% 46%)" }} />
        <Tooltip cursor={{ fill: "hsl(73 100% 36% / 0.08)" }} contentStyle={{ fontSize: 11, borderRadius: 8 }} />
        <Bar dataKey="pct" radius={[4, 4, 0, 0]}>
          {data.map((d, i) => (
            <Cell key={i} fill={d.pct >= 80 ? "hsl(142 71% 45%)" : d.pct >= 50 ? "hsl(38 92% 50%)" : "hsl(0 72% 51%)"} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}