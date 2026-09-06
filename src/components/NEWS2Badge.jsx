export default function NEWS2Badge({ score, size = "md" }) {
  let color, bg, label;
  if (score === 0) {
    color = "text-clinical-green"; bg = "bg-clinical-green/15 border-clinical-green/40"; label = "Low";
  } else if (score >= 1 && score <= 4) {
    color = "text-clinical-green"; bg = "bg-clinical-green/15 border-clinical-green/40"; label = "Low";
  } else if (score >= 5 && score <= 6) {
    color = "text-clinical-amber"; bg = "bg-clinical-amber/15 border-clinical-amber/40 animate-pulse-amber"; label = "Medium";
  } else {
    color = "text-clinical-red"; bg = "bg-clinical-red/15 border-clinical-red/40 animate-pulse-red"; label = "High";
  }

  const sizes = { sm: "text-xs px-2 py-0.5", md: "text-sm px-2.5 py-1", lg: "text-lg px-4 py-2" };

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border font-bold ${color} ${bg} ${sizes[size]}`}>
      <span className="font-mono">{score}</span>
      <span className="opacity-80">{label}</span>
    </span>
  );
}