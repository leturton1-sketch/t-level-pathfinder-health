import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { isLoggedIn } from "@/lib/clinicalAuth";
import { SKBadgeGroup } from "@/components/SKBadge";
import { ClipboardList, Stethoscope, Target, ShieldAlert, Droplet, FileText, Users, RefreshCw, ChevronRight } from "lucide-react";

const TOOLS = [
  { id: "abcde", title: "ABCDE Assessment", icon: Stethoscope, description: "Systematic airway, breathing, circulation, disability, exposure assessment", skCodes: ["SK2", "SK17"], poCodes: ["PO4", "PO9"], to: "/care-planning/abcde", accent: "clinical-teal" },
  { id: "news2", title: "NEWS2 Scoring", icon: ClipboardList, description: "National Early Warning Score calculator with auto-escalation", skCodes: ["SK1", "SK17"], poCodes: ["PO4", "PO9"], to: "/care-planning/news2", accent: "clinical-amber" },
  { id: "smart", title: "SMART Goals", icon: Target, description: "Specific, Measurable, Achievable, Relevant, Time-bound care goals", skCodes: ["SK3", "SK9"], poCodes: ["PO6", "PO9"], to: "/care-planning/smart-goals", accent: "clinical-green" },
  { id: "risk", title: "Risk Assessments", icon: ShieldAlert, description: "Falls (Morse), pressure ulcer (Waterlow), VTE assessment", skCodes: ["SK4"], poCodes: ["PO4", "PO6"], to: "/care-planning/abcde", accent: "clinical-red" },
  { id: "fluid", title: "Fluid Balance Chart", icon: Droplet, description: "Cumulative input/output tracking with running totals", skCodes: ["SK5"], poCodes: ["PO4", "PO9"], to: "/care-planning/abcde", accent: "clinical-teal" },
  { id: "handover", title: "SBAR Handover", icon: FileText, description: "Situation, Background, Assessment, Recommendation handover summary", skCodes: ["SK6", "SK10"], poCodes: ["PO4", "PO9"], to: "/care-planning/abcde", accent: "primary" },
  { id: "mdt", title: "MDT Referral", icon: Users, description: "Multi-Disciplinary Team referral template", skCodes: ["SK11"], poCodes: ["PO4"], to: "/care-planning/abcde", accent: "primary" },
  { id: "reflective", title: "Reflective Log", icon: RefreshCw, description: "What / So What / Now What reflective practice (CS4)", skCodes: ["SK12"], poCodes: ["PO4"], to: "/care-planning/abcde", accent: "clinical-teal" },
];

const accentMap = {
  "clinical-teal": "border-clinical-teal/30 bg-clinical-teal/5 hover:border-clinical-teal/60",
  "clinical-amber": "border-clinical-amber/30 bg-clinical-amber/5 hover:border-clinical-amber/60",
  "clinical-green": "border-clinical-green/30 bg-clinical-green/5 hover:border-clinical-green/60",
  "clinical-red": "border-clinical-red/30 bg-clinical-red/5 hover:border-clinical-red/60",
  "primary": "border-primary/30 bg-primary/5 hover:border-primary/60",
};

export default function CarePlanning() {
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoggedIn()) navigate("/login");
  }, [navigate]);

  return (
    <div className="min-h-screen bg-clinical-navy px-4 pt-6 pb-24 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
          <ClipboardList className="w-5 h-5 text-clinical-teal" />
          Care Planning Suite
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Full clinical documentation tools mapped to T Level Performance Outcomes
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {TOOLS.map((tool, idx) => (
          <button
            key={tool.id}
            onClick={() => navigate(tool.to)}
            className={`group text-left rounded-xl border p-4 transition-all animate-slide-up ${accentMap[tool.accent]}`}
            style={{ animationDelay: `${idx * 40}ms` }}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="p-2 rounded-lg bg-background/40">
                <tool.icon className="w-5 h-5 text-foreground" />
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-clinical-teal transition-colors" />
            </div>
            <h3 className="font-bold text-sm text-foreground mb-1">{tool.title}</h3>
            <p className="text-xs text-muted-foreground mb-2">{tool.description}</p>
            <SKBadgeGroup skCodes={tool.skCodes} poCodes={tool.poCodes} />
          </button>
        ))}
      </div>
    </div>
  );
}