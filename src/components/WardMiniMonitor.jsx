import { useNavigate } from "react-router-dom";
import { Bed, Activity } from "lucide-react";
import NEWS2Badge from "./NEWS2Badge";

export default function WardMiniMonitor({ patients = [] }) {
  const navigate = useNavigate();
  const totalBeds = 6;
  const beds = Array.from({ length: totalBeds }, (_, i) => patients[i] || null);
  const highRisk = patients.filter((p) => p.news2_score >= 7).length;
  const mediumRisk = patients.filter((p) => p.news2_score >= 5 && p.news2_score <= 6).length;

  return (
    <button
      onClick={() => navigate("/ward-simulation")}
      className="group relative w-full text-left overflow-hidden rounded-xl border border-border bg-card/60 backdrop-blur-sm p-4 transition-all hover:border-clinical-teal/50 animate-slide-up"
      style={{ animationDelay: "200ms" }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-clinical-teal" />
          <span className="text-sm font-bold text-foreground">Virtual Ward Monitor</span>
        </div>
        <span className="text-xs text-muted-foreground group-hover:text-clinical-teal transition-colors">View ›</span>
      </div>

      {/* Ward layout grid */}
      <div className="grid grid-cols-3 gap-2">
        {beds.map((patient, idx) => (
          <div
            key={idx}
            className={`relative rounded-lg border p-2 transition-all ${
              patient
                ? patient.news2_score >= 7
                  ? "border-clinical-red/40 bg-clinical-red/5"
                  : patient.news2_score >= 5
                  ? "border-clinical-amber/40 bg-clinical-amber/5"
                  : "border-clinical-green/30 bg-clinical-green/5"
                : "border-dashed border-border bg-muted/30"
            }`}
          >
            <div className="flex items-center gap-1 mb-1">
              <Bed className="w-3 h-3 text-muted-foreground" />
              <span className="text-[10px] font-semibold text-muted-foreground">Bed {idx + 1}</span>
            </div>
            {patient ? (
              <div>
                <div className="text-[10px] text-foreground truncate font-medium">{patient.name}</div>
                <div className="mt-1">
                  <NEWS2Badge score={patient.news2_score} size="sm" />
                </div>
              </div>
            ) : (
              <div className="text-[10px] text-muted-foreground italic">Empty</div>
            )}
          </div>
        ))}
      </div>

      {/* Summary bar */}
      <div className="mt-3 flex items-center justify-between text-xs">
        <span className="text-muted-foreground">
          {patients.length}/{totalBeds} occupied
        </span>
        <div className="flex items-center gap-3">
          {highRisk > 0 && (
            <span className="flex items-center gap-1 text-clinical-red">
              <span className="w-2 h-2 rounded-full bg-clinical-red animate-pulse" />
              {highRisk} High
            </span>
          )}
          {mediumRisk > 0 && (
            <span className="flex items-center gap-1 text-clinical-amber">
              <span className="w-2 h-2 rounded-full bg-clinical-amber" />
              {mediumRisk} Medium
            </span>
          )}
        </div>
      </div>
    </button>
  );
}