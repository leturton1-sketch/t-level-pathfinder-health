import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { isLoggedIn, getCurrentUser } from "@/lib/clinicalAuth";
import ScenarioEditor from "@/components/scenario/ScenarioEditor";
import { SKBadgeGroup } from "@/components/SKBadge";
import NEWS2Badge from "@/components/NEWS2Badge";
import {
  Layers, Plus, Copy, Pencil, Trash2, Clock, User, Heart,
  Lock, AlertTriangle, Play, FileStack,
} from "lucide-react";

const AUTHORIZED_ROLES = ["super_admin", "admin", "tutor"];

export default function ScenarioTemplates() {
  const navigate = useNavigate();
  const user = getCurrentUser();
  const authorized = AUTHORIZED_ROLES.includes(user?.role);

  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editor, setEditor] = useState(null); // { mode, template }
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [busy, setBusy] = useState(null); // templateId being cloned to scenario

  useEffect(() => {
    if (!isLoggedIn()) { navigate("/login"); return; }
    if (!authorized) return;
    loadTemplates();
  }, [navigate, authorized]);

  const loadTemplates = useCallback(async () => {
    setLoading(true);
    try {
      const list = await base44.entities.ScenarioTemplate.list();
      setTemplates(list);
    } catch {
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  }, []);

  if (!authorized) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="max-w-sm w-full rounded-2xl bg-card border border-clinical-red/30 shadow-xl p-6 text-center">
          <div className="w-14 h-14 rounded-full bg-clinical-red/10 flex items-center justify-center mx-auto mb-3">
            <Lock className="w-7 h-7 text-clinical-red" />
          </div>
          <h1 className="font-heading font-bold text-lg text-foreground mb-1">Access Restricted</h1>
          <p className="text-sm text-muted-foreground mb-4">Template authoring is only available to tutors, admins, and super admins.</p>
          <button onClick={() => navigate("/")} className="w-full py-2.5 rounded-lg bg-clinical-teal text-white text-sm font-heading font-semibold hover:opacity-90">Back to Dashboard</button>
        </div>
      </div>
    );
  }

  const handleNew = () => setEditor({ mode: "new", template: null });

  const handleEdit = (t) => setEditor({ mode: "edit", template: t });

  const handleClone = (t) => {
    setEditor({ mode: "new", template: { ...t, name: `${t.name} (Clone)`, id: undefined } });
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      await base44.entities.ScenarioTemplate.delete(confirmDelete.id);
      setTemplates((prev) => prev.filter((t) => t.id !== confirmDelete.id));
    } catch { /* refresh handles state */ }
    setConfirmDelete(null);
  };

  // Use a template to create a live simulation scenario (clone to the Scenario entity)
  const handleUseInSimulation = async (t) => {
    setBusy(t.id);
    try {
      await base44.entities.Scenario.create({
        name: `${t.name} — Exercise`,
        description: t.description,
        difficulty: t.difficulty,
        estimated_duration: t.estimated_duration,
        patient_name: t.patient_name,
        patient_age: t.patient_age,
        patient_condition: t.patient_condition,
        patient_comorbidities: t.patient_comorbidities,
        patient_medications: t.patient_medications,
        patient_allergies: t.patient_allergies,
        bed_number: t.bed_number,
        initial_vitals: t.initial_vitals,
        initial_news2: t.initial_news2,
        decision_tree: t.decision_tree,
        sk_codes: t.sk_codes || [],
        performance_outcomes: t.performance_outcomes || [],
        debrief_rationale: t.debrief_rationale,
        assigned_cohorts: t.assigned_cohorts || [],
        category: t.category,
        is_custom: true,
        creator_id: user?.id,
      });
      navigate("/ward-simulation");
    } catch { /* ignore */ }
    setBusy(null);
  };

  const handleSave = () => {
    setEditor(null);
    loadTemplates();
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-card/95 backdrop-blur border-b border-border shadow-sm">
        <div className="mx-auto max-w-4xl px-4 py-2 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <button onClick={() => navigate("/")} className="p-1.5 rounded-lg hover:bg-slate-100 text-muted-foreground shrink-0">←</button>
              <Layers className="w-5 h-5 text-clinical-teal shrink-0" />
              <h1 className="font-heading font-bold text-sm sm:text-base text-foreground truncate">Patient Scenario Templates</h1>
              <span className="hidden sm:inline-flex items-center gap-1 rounded-md bg-clinical-teal/10 px-2 py-0.5 text-[10px] font-heading font-semibold text-clinical-teal">
                <Lock className="w-2.5 h-2.5" /> {user?.role}
              </span>
            </div>
            <button onClick={handleNew}
              className="flex items-center gap-1.5 rounded-lg bg-clinical-teal text-white px-3 py-1.5 text-xs font-heading font-semibold hover:opacity-90 shrink-0">
              <Plus className="w-3.5 h-3.5" /> New Template
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 pt-4 sm:px-6 lg:px-8">
        {/* Intro card */}
        <div className="rounded-xl border border-clinical-teal/30 bg-clinical-teal/5 p-3.5 mb-4 flex items-start gap-3">
          <FileStack className="w-5 h-5 text-clinical-teal shrink-0 mt-0.5" />
          <div>
            <h2 className="text-sm font-heading font-bold text-foreground mb-0.5">Reusable Template Library</h2>
            <p className="text-xs text-muted-foreground leading-relaxed">Build patient scenarios once, save them as templates, then clone and adapt them for new simulation exercises. Use a template directly in the ward simulator with one tap.</p>
          </div>
        </div>

        {/* Templates grid */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-6 h-6 border-2 border-clinical-teal/30 border-t-clinical-teal rounded-full animate-spin" />
          </div>
        ) : templates.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-muted p-8 text-center">
            <Layers className="w-8 h-8 text-muted-foreground/50 mx-auto mb-2" />
            <p className="text-sm font-heading font-semibold text-foreground mb-1">No templates yet</p>
            <p className="text-xs text-muted-foreground mb-4">Create a reusable patient scenario template to get started.</p>
            <button onClick={handleNew} className="inline-flex items-center gap-1.5 rounded-lg bg-clinical-teal text-white px-4 py-2 text-xs font-heading font-semibold hover:opacity-90">
              <Plus className="w-3.5 h-3.5" /> Build First Template
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {templates.map((t) => (
              <div key={t.id} className="rounded-xl border border-border bg-card p-3.5 shadow-sm flex flex-col">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className={`text-[10px] font-semibold uppercase rounded px-1.5 py-0.5 ${
                        t.difficulty === "guided" ? "bg-clinical-green/15 text-clinical-green" :
                        t.difficulty === "intermediate" ? "bg-clinical-amber/15 text-clinical-amber" :
                        "bg-clinical-red/15 text-clinical-red"}`}>
                        {t.difficulty}
                      </span>
                      <span className="flex items-center gap-1 text-[10px] text-muted-foreground"><Clock className="w-3 h-3" /> {t.estimated_duration} min</span>
                      {t.category && <span className="text-[10px] text-muted-foreground capitalize">{t.category.replace("_", " ")}</span>}
                    </div>
                    <h3 className="font-heading font-bold text-sm text-foreground truncate">{t.name}</h3>
                    {t.description && <p className="text-xs text-muted-foreground mt-0.5 leading-snug line-clamp-2">{t.description}</p>}
                  </div>
                  <NEWS2Badge score={t.initial_news2} size="sm" />
                </div>
                <div className="flex items-center gap-3 text-[11px] text-muted-foreground mb-2">
                  <span className="flex items-center gap-1 truncate"><User className="w-3 h-3 shrink-0" /> {t.patient_name}</span>
                  <span className="flex items-center gap-1 shrink-0"><Heart className="w-3 h-3" /> {t.bed_number}</span>
                </div>
                {(t.sk_codes?.length > 0 || t.performance_outcomes?.length > 0) && (
                  <div className="mb-3"><SKBadgeGroup skCodes={t.sk_codes} poCodes={t.performance_outcomes} /></div>
                )}
                <div className="flex items-center gap-1 mt-auto pt-1">
                  <button onClick={() => handleUseInSimulation(t)} disabled={busy === t.id}
                    className="flex-1 flex items-center justify-center gap-1 rounded-md bg-clinical-teal text-white px-2 py-1.5 text-[10px] font-heading font-semibold hover:opacity-90 disabled:opacity-50">
                    {busy === t.id ? <div className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <Play className="w-3 h-3" />}
                    Use in Simulation
                  </button>
                  <button onClick={() => handleClone(t)} className="flex items-center gap-1 rounded-md border border-border bg-card px-2 py-1.5 text-[10px] font-heading font-semibold text-muted-foreground hover:bg-muted" title="Clone to new template">
                    <Copy className="w-3 h-3" />
                  </button>
                  <button onClick={() => handleEdit(t)} className="flex items-center gap-1 rounded-md border border-border bg-card px-2 py-1.5 text-[10px] font-heading font-semibold text-muted-foreground hover:bg-muted" title="Edit template">
                    <Pencil className="w-3 h-3" />
                  </button>
                  <button onClick={() => setConfirmDelete(t)} className="flex items-center gap-1 rounded-md border border-clinical-red/30 bg-card px-2 py-1.5 text-[10px] font-heading font-semibold text-clinical-red hover:bg-clinical-red/5" title="Delete template">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Editor modal */}
      {editor && (
        <ScenarioEditor
          initialScenario={editor.template}
          entityName="ScenarioTemplate"
          onSave={handleSave}
          onCancel={() => setEditor(null)}
        />
      )}

      {/* Delete confirmation */}
      {confirmDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/30 backdrop-blur-sm animate-fade-in" onClick={() => setConfirmDelete(null)}>
          <div className="bg-card rounded-xl shadow-2xl p-6 max-w-sm w-[90%]" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-3">
              <AlertTriangle className="w-6 h-6 text-clinical-amber" />
              <h2 className="font-heading font-bold text-foreground">Delete Template?</h2>
            </div>
            <p className="text-sm text-muted-foreground mb-4">Delete "{confirmDelete.name}"? Scenarios already created from it are unaffected.</p>
            <div className="flex gap-2">
              <button onClick={() => setConfirmDelete(null)} className="flex-1 py-2.5 rounded-lg border border-border text-foreground text-sm font-heading font-semibold hover:bg-muted">Cancel</button>
              <button onClick={handleDelete} className="flex-1 py-2.5 rounded-lg bg-clinical-red text-white text-sm font-heading font-semibold hover:opacity-90">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}