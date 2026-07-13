import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { isLoggedIn, getCurrentUser } from "@/lib/clinicalAuth";
import { SKBadgeGroup } from "@/components/SKBadge";
import { ArrowLeft, Save, Send, CheckCircle, AlertCircle } from "lucide-react";

const GOAL_FIELDS = [
  {
    key: "specific",
    label: "S — Specific",
    description: "What exactly needs to be achieved? Who is involved? Where will it happen?",
    placeholder: "e.g., Patient will mobilise independently to the bathroom within 3 days",
    hint: "Be precise — avoid vague terms like 'improve' or 'better'",
  },
  {
    key: "measurable",
    label: "M — Measurable",
    description: "How will progress be tracked? What metrics or observations will be used?",
    placeholder: "e.g., Distance walked (metres), assistance level required (1-3 person), frequency per day",
    hint: "Use quantifiable data — numbers, scales, frequency",
  },
  {
    key: "achievable",
    label: "A — Achievable",
    description: "Is this realistic given the patient's condition, resources, and environment?",
    placeholder: "e.g., Patient has adequate mobility pre-morbid, physiotherapy available daily, walking aid provided",
    hint: "Consider barriers and enablers",
  },
  {
    key: "relevant",
    label: "R — Relevant",
    description: "Why is this goal important for this patient's care plan?",
    placeholder: "e.g., Promotes independence, reduces falls risk, supports discharge planning",
    hint: "Link to person-centred outcomes",
  },
  {
    key: "time",
    label: "T — Time-bound",
    description: "When should this goal be achieved? What is the review date?",
    placeholder: "e.g., Within 72 hours, reviewed daily, target discharge date: 15/07/2026",
    hint: "Set a clear deadline and review schedule",
  },
];

export default function SMARTGoals() {
  const navigate = useNavigate();
  const user = getCurrentUser();
  const [goals, setGoals] = useState({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!isLoggedIn()) navigate("/login");
  }, [navigate]);

  const handleChange = (key, value) => {
    setGoals((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const validation = GOAL_FIELDS.map((f) => ({
    key: f.key,
    complete: goals[f.key] && goals[f.key].trim().length > 10,
  }));

  const allComplete = validation.every((v) => v.complete);

  const handleSave = async (submit = false) => {
    setSaving(true);
    try {
      await base44.entities.CarePlanSubmission.create({
        student_id: user.id,
        student_name: user.full_name,
        type: "smart_goals",
        title: `SMART Goals — ${new Date().toLocaleDateString("en-GB")}`,
        content: JSON.stringify(goals),
        status: submit ? "submitted" : "draft",
        sk_codes: ["SK3", "SK9"],
        performance_outcomes: ["PO6", "PO9"],
      });
      setSaved(true);
      if (submit) navigate("/care-planning");
    } catch {
      const drafts = JSON.parse(localStorage.getItem("careplan_drafts") || "[]");
      drafts.push({ type: "smart_goals", data: goals, timestamp: Date.now(), submitted: submit });
      localStorage.setItem("careplan_drafts", JSON.stringify(drafts));
      setSaved(true);
      if (submit) navigate("/care-planning");
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
            <h1 className="text-sm font-bold text-foreground">SMART Goals Builder</h1>
            <p className="text-[10px] text-muted-foreground">Person-centred care goal planning</p>
          </div>
          <SKBadgeGroup skCodes={["SK3", "SK9"]} poCodes={["PO6", "PO9"]} />
        </div>
      </div>

      <div className="px-4 pt-4 pb-32 max-w-3xl mx-auto">
        {/* Progress indicator */}
        <div className="flex items-center gap-2 mb-4">
          {GOAL_FIELDS.map((field, idx) => {
            const complete = validation[idx].complete;
            return (
              <div key={field.key} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  complete ? "bg-clinical-green/20 text-clinical-green border border-clinical-green/40" : "bg-muted/40 text-muted-foreground border border-border"
                }`}>
                  {complete ? <CheckCircle className="w-4 h-4" /> : field.label.charAt(0)}
                </div>
                {idx < GOAL_FIELDS.length - 1 && (
                  <div className={`w-6 h-0.5 ${complete ? "bg-clinical-green/40" : "bg-border"}`} />
                )}
              </div>
            );
          })}
        </div>

        {/* Form fields */}
        <div className="space-y-3">
          {GOAL_FIELDS.map((field) => {
            const complete = goals[field.key] && goals[field.key].trim().length > 10;
            return (
              <div key={field.key} className={`rounded-xl border p-4 transition-all ${
                complete ? "border-clinical-green/30 bg-clinical-green/5" : "border-border bg-card/60"
              }`}>
                <div className="flex items-start justify-between mb-1">
                  <h3 className="text-sm font-bold text-foreground">{field.label}</h3>
                  {complete && <CheckCircle className="w-4 h-4 text-clinical-green" />}
                </div>
                <p className="text-xs text-muted-foreground mb-2">{field.description}</p>
                <textarea
                  value={goals[field.key] || ""}
                  onChange={(e) => handleChange(field.key, e.target.value)}
                  placeholder={field.placeholder}
                  rows={3}
                  className={`w-full bg-muted/50 border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none resize-none transition-colors ${
                    complete ? "border-clinical-green/30 focus:border-clinical-green" : "border-border focus:border-clinical-teal"
                  }`}
                />
                <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {field.hint}
                </p>
              </div>
            );
          })}
        </div>

        {/* Save/Submit */}
        <div className="flex gap-2 mt-4">
          <button
            onClick={() => handleSave(false)}
            disabled={saving}
            className="flex-1 py-3 rounded-lg border border-border text-foreground font-semibold text-sm hover:bg-muted/50 transition-all flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4" /> {saved ? "Saved ✓" : "Save Draft"}
          </button>
          <button
            onClick={() => handleSave(true)}
            disabled={saving || !allComplete}
            className="flex-1 py-3 rounded-lg bg-clinical-teal text-white font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-40 flex items-center justify-center gap-2"
          >
            <Send className="w-4 h-4" /> Submit for Review
          </button>
        </div>
        {!allComplete && (
          <p className="text-center text-xs text-muted-foreground mt-2">Complete all SMART fields to enable submission</p>
        )}
      </div>
    </div>
  );
}