import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer } from "recharts";

export default function CompetencyRadar({ data }) {
  if (!data || data.length === 0) return null;
  return (
    <ResponsiveContainer width="100%" height={280}>
      <RadarChart data={data} outerRadius="75%">
        <PolarGrid stroke="hsl(210 14% 80%)" />
        <PolarAngleAxis dataKey="label" tick={{ fontSize: 10, fill: "hsl(210 8% 40%)" }} />
        <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 8, fill: "hsl(210 8% 60%)" }} angle={90} />
        <Radar dataKey="progress" stroke="hsl(73 100% 36%)" strokeWidth={2} fill="hsl(73 100% 36%)" fillOpacity={0.35} />
      </RadarChart>
    </ResponsiveContainer>
  );
}