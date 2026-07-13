import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { isLoggedIn, getCurrentUser } from "@/lib/clinicalAuth";
import { SKBadgeGroup } from "@/components/SKBadge";
import { ArrowLeft, Save, Send, BookOpen } from "lucide-react";

const SECTIONS = [
  {
    key: "airway",
    title: "A — Airway",
    color: "clinical-teal",
    prompts: [
      { id: "patency", label: "Is the airway patent?", type: "select", options: ["Patent", "Partially obstructed", "Fully obstructed"] },
      { id: "signs", label: "Signs of obstruction", type: "text", placeholder: "e.g., stridor, gurgling, snoring" },
      { id: "management", label: "Airway management", type: "select", options: ["No intervention needed", "Head tilt/chin lift", "Oropharyngeal airway (OPA)", "Nasopharyngeal airway (NPA)", "Suction required"] },
    ],
  },
  {
    key: "breathing",
    title: "B — Breathing",
    color: "clinical-green",
    prompts: [
      { id: "rate", label: "Respiratory rate (breaths/min)", type: "number", placeholder: "12-20 normal" },
      { id: "effort", label: "Work of breathing", type: "select", options: ["Normal", "Increased", " accessory muscle use", "Severely laboured"] },
      { id: "spo2", label: "SpO₂ (%)", type: "number", placeholder: "≥96 normal" },
      { id: "o2", label: "Supplemental O₂", type: "select", options: ["None", "Nasal cannula", "Simple face mask", "Non-rebreather"] },
      { id: "sounds", label: "Breath sounds", type: "text", placeholder: "e.g., clear, wheeze, crackles" },
    ],
  },
  {
    key: "circulation",
    title: "C — Circulation",
    color: "clinical-amber",
    prompts: [
      { id: "hr", label: "Heart rate (bpm)", type: "number", placeholder: "51-90 normal" },
      { id: "bp", label: "Blood pressure (mmHg)", type: "text", placeholder: "e.g., 120/80" },
      { id: "crt", label: "Capillary refill time (sec)", type: "number", placeholder: "<2 normal" },
      { id: "skin", label: "Skin colour/temperature", type: "text", placeholder: "e.g., pink, warm, pale, clammy" },
      { id: "iv", label: "IV access", type: "select", options: ["Established", "Required", "Not indicated"] },
    ],
  },
  {
    key: "disability",
    title: "D — Disability",
    color: "clinical-red",
    prompts: [
      { id: "avpu", label: "Conscious level (AVPU)", type: "select", options: ["Alert", "Voice", "Pain", "Unresponsive"] },
      { id: "pupils", label: "Pupil assessment", type: "text", placeholder: "e.g., equal, reactive, 3mm" },
      { id: "glucose", label: "Blood glucose (mmol/L)", type: "number", placeholder: "4-7 normal" },
    ],
  },
  {
    key: "exposure",
    title: "E — Exposure",
    color: "clinical-teal",
    prompts: [
      { id: "temp", label: "Temperature (°C)", type: "number", placeholder: "36.1-38.0 normal" },
      { id: "skin", label: "Skin inspection findings", type: "textarea", placeholder: "Rashes, wounds, pressure areas, signs of infection" },
      { id: "dignity", label: "Dignity maintained?", type: "select", options: ["Yes", "No — curtains drawn", "No — privacy needed"] },
    ],
  },
];

export default function ABCDEAssessment() {
  const navigate = useNavigate();
  const user = getCurrentUser();
  const [data, setData] = useState({});
  const [activeSection, setActiveSection] = useState(0);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!isLoggedIn()) navigate("/login");
  }, [navigate]);

  const handleChange = (sectionKey, fieldId, value) => {
    setData((prev) => ({
      ...prev,
      [sectionKey]: { ...prev[sectionKey], [fieldId]: value },
    }));
    setSaved(false);
  };

  const handleSave = async (submit = false) => {
    setSaving(true);
    try {
      await base44.entities.CarePlanSubmission.create({
        student_id: user.id,
        student_name: user.full_name,
        type: "abcde",
        title: `ABCDE Assessment — ${new Date().toLocaleDateString("en-GB")}`,
        content: JSON.stringify(data),
        status: submit ? "submitted" : "draft",
        sk_codes: ["SK2", "SK17"],
        performance_outcomes: ["PO4", "PO9"],
      });
      setSaved(true);
      if (submit) navigate("/care-planning");
    } catch (err) {
      // Save to localStorage as offline fallback
      const drafts = JSON.parse(localStorage.getItem("careplan_drafts") || "[]");
      drafts.push({ type: "abcde", data, timestamp: Date.now(), submitted: submit });
      localStorage.setItem("careplan_drafts", JSON.stringify(drafts));
      setSaved(true);
      if (submit) navigate("/care-planning");
    } finally {
      setSaving(false);
    }
  };

  const currentSection = SECTIONS[activeSection];
  const allSectionsComplete = SECTIONS.every((s) => data[s.key]);

  return (
    <div className="min-h-screen bg-clinical-navy">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-clinical-navy/90 backdrop-blur-md border-b border-border">
        <div className="flex items-center gap-3 px-4 py-3 max-w-3xl mx-auto">
          <button onClick={() => navigate("/care-planning")} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <div className="flex-1">
            <h1 className="text-sm font-bold text-foreground">ABCDE Assessment</h1>
            <p className="text-[10px] text-muted-foreground">Systematic clinical assessment</p>
          </div>
          <SKBadgeGroup skCodes={["SK2", "SK17"]} poCodes={["PO4", "PO9"]} />
        </div>
      </div>

      <div className="px-4 pt-4 pb-32 max-w-3xl mx-auto">
        {/* Progress tabs */}
        <div className="flex gap-1.5 mb-4 overflow-x-auto scrollbar-thin pb-1">
          {SECTIONS.map((section, idx) => {
            const isComplete = data[section.key];
            const isActive = activeSection === idx;
            return (
              <button
                key={section.key}
                onClick={() => setActiveSection(idx)}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? `bg-clinical-teal text-white`
                    : isComplete
                    ? "bg-clinical-green/15 text-clinical-green border border-clinical-green/30"
                    : "bg-muted/40 text-muted-foreground border border-border"
                }`}
              >
                {section.title.charAt(0)}
                <span>{section.title.split("—")[1]?.trim() || section.title}</span>
              </button>
            );
          })}
        </div>

        {/* Active section form */}
        <div className="rounded-xl border border-border bg-card/60 p-4 mb-4">
          <h2 className="text-base font-bold text-foreground mb-3">{currentSection.title}</h2>
          <div className="space-y-3">
            {currentSection.prompts.map((prompt) => (
              <div key={prompt.id}>
                <label className="text-xs text-muted-foreground mb-1 block">{prompt.label}</label>
                {prompt.type === "select" ? (
                  <select
                    value={data[currentSection.key]?.[prompt.id] || ""}
                    onChange={(e) => handleChange(currentSection.key, prompt.id, e.target.value)}
                    className="w-full bg-muted/50 border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-clinical-teal"
                  >
                    <option value="">Select…</option>
                    {prompt.options.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                ) : prompt.type === "textarea" ? (
                  <textarea
                    value={data[currentSection.key]?.[prompt.id] || ""}
                    onChange={(e) => handleChange(currentSection.key, prompt.id, e.target.value)}
                    placeholder={prompt.placeholder}
                    rows={3}
                    className="w-full bg-muted/50 border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-clinical-teal resize-none"
                  />
                ) : (
                  <input
                    type={prompt.type === "number" ? "number" : "text"}
                    value={data[currentSection.key]?.[prompt.id] || ""}
                    onChange={(e) => handleChange(currentSection.key, prompt.id, e.target.value)}
                    placeholder={prompt.placeholder}
                    className="w-full bg-muted/50 border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-clinical-teal"
                  />
                )}
              </div>
            ))}
          </div>

          {/* Section navigation */}
          <div className="flex justify-between mt-4">
            <button
              onClick={() => setActiveSection(Math.max(0, activeSection - 1))}
              disabled={activeSection === 0}
              className="text-xs text-muted-foreground disabled:opacity-30"
            >
              ← Previous
            </button>
            <button
              onClick={() => setActiveSection(Math.min(SECTIONS.length - 1, activeSection + 1))}
              disabled={activeSection === SECTIONS.length - 1}
              className="text-xs text-clinical-teal disabled:opacity-30"
            >
              Next section →
            </button>
          </div>
        </div>

        {/* Reference link */}
        <button
          onClick={() => navigate("/knowledge-library")}
          className="w-full flex items-center gap-2 rounded-lg border border-border bg-muted/20 px-3 py-2 text-xs text-muted-foreground hover:text-clinical-teal transition-colors mb-4"
        >
          <BookOpen className="w-3.5 h-3.5" /> Need help? View ABCDE approach in Knowledge Library
        </button>

        {/* Save/Submit buttons */}
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
      </div>
    </div>
  );
}