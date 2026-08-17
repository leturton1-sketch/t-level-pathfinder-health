import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { isLoggedIn, getCurrentUser } from "@/lib/clinicalAuth";
import { calculateNEWS2, NEWS2_PARAMS } from "@/lib/news2";
import { SKBadgeGroup } from "@/components/SKBadge";
import NEWS2Badge from "@/components/NEWS2Badge";
import { ArrowLeft, Save, Send, Info, AlertTriangle } from "lucide-react";
import { getActiveEhrPatient, getUnreadTabs, getComplianceFields } from "@/lib/ehrCompliance";

export default function NEWS2Scoring() {
  const navigate = useNavigate();
  const user = getCurrentUser();
  const [vitals, setVitals] = useState({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [ehrWarning, setEhrWarning] = useState("");

  useEffect(() => {
    if (!isLoggedIn()) navigate("/login");
  }, [navigate]);

  const result = calculateNEWS2(vitals);

  const handleChange = (key, value) => {
    setVitals((prev) => {
      const updated = { ...prev };
      if (key === "supplemental_o2") {
        updated[key] = !updated[key];
      } else if (key === "avpu") {
        updated[key] = value;
      } else {
        updated[key] = value === "" ? undefined : Number(value);
      }
      return updated;
    });
    setSaved(false);
  };

  const handleSave = async (submit = false) => {
    setSaving(true);
    setEhrWarning("");

    let compliance = {};
    let navDelay = 0;

    if (submit) {
      const ehrPatientId = getActiveEhrPatient();
      if (ehrPatientId) {
        const unread = getUnreadTabs(ehrPatientId);
        compliance = getComplianceFields(ehrPatientId);
        if (unread.length > 0) {
          setEhrWarning(`You submitted without reading ${unread.join(", ")} — this has been noted.`);
          navDelay = 2500;
        }
      }
    }

    try {
      await base44.entities.CarePlanSubmission.create({
        student_id: user.id,
        student_name: user.full_name,
        type: "news2",
        title: `NEWS2 Assessment — ${new Date().toLocaleDateString("en-GB")}`,
        content: JSON.stringify({ vitals, result }),
        status: submit ? "submitted" : "draft",
        sk_codes: ["SK1", "SK17"],
        performance_outcomes: ["PO4", "PO9"],
        ...compliance,
      });
      setSaved(true);
      if (submit) setTimeout(() => navigate("/care-planning"), navDelay);
    } catch {
      const drafts = JSON.parse(localStorage.getItem("careplan_drafts") || "[]");
      drafts.push({ type: "news2", data: { vitals, result }, timestamp: Date.now(), submitted: submit });
      localStorage.setItem("careplan_drafts", JSON.stringify(drafts));
      setSaved(true);
      if (submit) setTimeout(() => navigate("/care-planning"), navDelay);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-clinical-navy">
      <div className="sticky top-0 z-20 bg-clinical-navy/90 backdrop-blur-md border-b border-border">
        <div className="flex items-center gap-3 px-4 py-3 max-w-3xl mx-auto">
          <button onClick={() => navigate("/care-planning")} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <div className="flex-1">
            <h1 className="text-sm font-bold text-foreground">NEWS2 Scoring</h1>
            <p className="text-[10px] text-muted-foreground">National Early Warning Score</p>
          </div>
          <SKBadgeGroup skCodes={["SK1", "SK17"]} poCodes={["PO4", "PO9"]} />
        </div>
      </div>

      <div className="px-4 pt-4 pb-32 max-w-3xl mx-auto">
        {/* Score display */}
        <div className={`rounded-xl border-2 p-4 mb-4 text-center transition-all ${
          result.escalation === "high" ? "border-clinical-red bg-clinical-red/10" :
          result.escalation === "medium" ? "border-clinical-amber bg-clinical-amber/10" :
          "border-clinical-green bg-clinical-green/10"
        }`}>
          <div className="flex items-center justify-center gap-3">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Aggregate NEWS2 Score</p>
              <div className="text-4xl font-bold text-foreground">{result.score}</div>
            </div>
            <NEWS2Badge score={result.score} size="lg" />
          </div>
          <p className="text-xs text-muted-foreground mt-2">{result.recommendation}</p>
        </div>

        {/* Input parameters */}
        <div className="rounded-xl border border-border bg-card/60 p-4 mb-4">
          <h2 className="text-sm font-bold text-foreground mb-3">Physiological Parameters</h2>
          <div className="space-y-3">
            {NEWS2_PARAMS.map((param) => (
              <div key={param.key} className="flex items-center gap-3">
                <label className="text-sm text-foreground flex-1">{param.label}</label>
                {param.type === "toggle" ? (
                  <button
                    onClick={() => handleChange(param.key, !vitals[param.key])}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                      vitals.supplemental_o2
                        ? "bg-clinical-amber/20 text-clinical-amber border border-clinical-amber/40"
                        : "bg-muted/40 text-muted-foreground border border-border"
                    }`}
                  >
                    {vitals.supplemental_o2 ? "Yes" : "No"}
                  </button>
                ) : param.type === "select" ? (
                  <select
                    value={vitals[param.key] || ""}
                    onChange={(e) => handleChange(param.key, e.target.value)}
                    className="bg-muted/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-clinical-teal w-28"
                  >
                    <option value="">—</option>
                    {param.options.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                ) : (
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      step={param.key === "temp" ? "0.1" : "1"}
                      value={vitals[param.key] || ""}
                      onChange={(e) => handleChange(param.key, e.target.value)}
                      placeholder={param.placeholder}
                      className="bg-muted/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-clinical-teal w-28 text-center"
                    />
                    {param.unit && <span className="text-xs text-muted-foreground w-16">{param.unit}</span>}
                  </div>
                )}
                {result.breakdown[param.key] && (
                  <span className={`text-xs font-bold w-6 text-center ${
                    result.breakdown[param.key].points === 0 ? "text-clinical-green" :
                    result.breakdown[param.key].points <= 2 ? "text-clinical-amber" : "text-clinical-red"
                  }`}>
                    +{result.breakdown[param.key].points}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Score breakdown */}
        {result.score > 0 && (
          <div className="rounded-xl border border-border bg-card/40 p-3 mb-4">
            <p className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1">
              <Info className="w-3 h-3" /> SCORE BREAKDOWN
            </p>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(result.breakdown).map(([key, val]) => (
                <div key={key} className="flex items-center justify-between text-xs bg-muted/30 rounded-lg px-2 py-1.5">
                  <span className="text-muted-foreground uppercase">{key}</span>
                  <span className="text-foreground font-semibold">{val.value} → +{val.points}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Save/Submit */}
        <div className="flex gap-2">
          <button
            onClick={() => handleSave(false)}
            disabled={saving}
            className="flex-1 py-3 rounded-lg border border-border text-foreground font-semibold text-sm hover:bg-muted/50 transition-all flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4" /> {saved ? "Saved ✓" : "Save Draft"}
          </button>
          <button
            onClick={() => handleSave(true)}
            disabled={saving}
            className="flex-1 py-3 rounded-lg bg-clinical-teal text-white font-semibold text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
          >
            <Send className="w-4 h-4" /> Submit for Review
          </button>
        </div>

        {ehrWarning && (
          <div className="mt-3 rounded-lg border border-clinical-amber bg-clinical-amber/10 px-3 py-2.5 flex items-start gap-2 animate-fade-in">
            <AlertTriangle className="w-4 h-4 text-clinical-amber shrink-0 mt-0.5" />
            <p className="text-xs text-clinical-amber font-medium">{ehrWarning}</p>
          </div>
        )}
      </div>
    </div>
  );
}