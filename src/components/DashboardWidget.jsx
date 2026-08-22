import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";

export default function DashboardWidget({ title, subtitle, icon: Icon, metric, metricLabel, accent = "clinical-teal", to, delay = 0 }) {
  const navigate = useNavigate();

  const accentColors = {
    "clinical-teal": "from-clinical-teal/20 to-transparent border-clinical-teal/30 text-clinical-teal",
    "clinical-amber": "from-clinical-amber/20 to-transparent border-clinical-amber/30 text-clinical-amber",
    "clinical-green": "from-clinical-green/20 to-transparent border-clinical-green/30 text-clinical-green",
    "clinical-red": "from-clinical-red/20 to-transparent border-clinical-red/30 text-clinical-red",
    "primary": "from-primary/20 to-transparent border-primary/30 text-primary",
  };

  return (
    <button
      onClick={() => navigate(to)}
      className="group relative w-full text-left animate-slide-up"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className={`tlevel-3d-panel relative overflow-hidden rounded-2xl bg-gradient-to-br ${accentColors[accent]} p-4 transition-all duration-300 hover:-translate-y-1 hover:scale-[1.015] hover:border-opacity-60`}>
        <div className="flex items-start justify-between mb-3">
          <div className="p-2 rounded-lg bg-background/40 backdrop-blur-sm">
            {Icon && <Icon className="w-5 h-5" />}
          </div>
          <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
        <h3 className="font-bold text-sm text-foreground mb-1">{title}</h3>
        {subtitle && <p className="text-xs text-muted-foreground mb-2">{subtitle}</p>}
        {metric !== undefined && (
          <div className="mt-2">
            <div className="text-2xl font-bold text-foreground">{metric}</div>
            {metricLabel && <div className="text-xs text-muted-foreground">{metricLabel}</div>}
          </div>
        )}
      </div>
    </button>
  );
}