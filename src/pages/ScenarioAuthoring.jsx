import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { isLoggedIn, getCurrentUser } from "@/lib/clinicalAuth";
import { PREBUILT_SCENARIOS } from "@/lib/specData";
import ScenarioEditor from "@/components/scenario/ScenarioEditor";
import NEWS2Badge from "@/components/NEWS2Badge";
import { SKBadgeGroup } from "@/components/SKBadge";
import {
  Shield, Plus, Copy, Pencil, Trash2, Clock, User, Heart,
  Lock, AlertTriangle, Stethoscope,
} from "lucide-react";

const AUTHORIZED_ROLES = ["super_admin", "admin", "tutor"];

export default function ScenarioAuthoring() {
  const navigate = useNavigate();
  const user = getCurrentUser();
  const authorized = AUTHORIZED_ROLES.includes(user?.role);

  const [dbScenarios, setDbScenarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editor, setEditor] = useState(null); // { mode: 'new'|'clone'|'edit', scenario }
  const [confirmDelete, setConfirmDelete] = useState(null);

  useEffect(() => {
    if (!isLoggedIn()) { navigate("/login"); return; }
    if (!authorized) return;
    loadScenarios();
  }, [navigate, authorized]);

  const loadScenarios = useCallback(async () => {
    setLoading(true);
    try {
      const existing = await base44.entities.Scenario.list();
      setDbScenarios(existing);
    } catch {
      setDbScenarios([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Access denied screen
  if (!authorized) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="max-w-sm w-full rounded-2xl bg-card border border-clinical-red/30 shadow-xl p-6 text-center">
          <div className="w-14 h-14 rounded-full bg-clinical-red/10 flex items-center justify-center mx-auto mb-3">
            <Lock className="w-7 h-7 text-clinical-red" />
          </div>
          <h1 className="font-heading font-bold text-lg text-foreground mb-1">Access Restricted</h1>
          <p className="text-sm text-muted-foreground mb-4">
            Scenario authoring is only available to tutors, admins, and super admins.
          </p>
          <button onClick={() => navigate("/")} className="w-full py-2.5 rounded-lg bg-clinical-teal text-white text-sm font-heading font-semibold hover:opacity-90">
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const handleNew = () => setEditor({ mode: "new", scenario: null });

  const handleClone = (scenario) => {
    // Strip id so the editor creates a new record; rename to indicate clone
    setEditor({
      mode: "clone",
      scenario: { ...scenario, name: `${scenario.name} (Clone)`, id: undefined },
    });
  };

  const handleEdit = (scenario) => setEditor({ mode: "edit", scenario });

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      await base44.entities.Scenario.delete(confirmDelete.id);
      setDbScenarios((prev) => prev.filter((s) => s.id !== confirmDelete.id));
    } catch {
      // ignore — refresh to confirm state
    }
    setConfirmDelete(null);
  };

  const handleSave = (saved) => {
    setEditor(null);
    loadScenarios();
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-card/95 backdrop-blur border-b border-border shadow-sm">
        <div className="mx-auto max-w-4xl px-4 py-2 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <button onClick={() => navigate("/")} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground shrink-0">←</button>
              <Shield className="w-5 h-5 text-clinical-teal shrink-0" />
              <h1 className="font-heading font-bold text-sm sm:text-base text-foreground truncate">Scenario Authoring Tool</h1>
              <span className="hidden sm:inline-flex items-center gap-1 rounded-md bg-clinical-teal/10 px-2 py-0.5 text-[10px] font-heading font-semibold text-clinical-teal">
                <Lock className="w-2.5 h-2.5" /> {user?.role}
              </span>
            </div>
            <button onClick={handleNew}
              className="flex items-center gap-1.5 rounded-lg bg-clinical-teal text-white px-3 py-1.5 text-xs font-heading font-semibold hover:opacity-90 shrink-0">
              <Plus className="w-3.5 h-3.5" /> New Scenario
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-3 sm:px-4 pt-4 space-y-5">
        {/* Custom scenarios */}
        <section>
          <div className="flex items-center gap-1.5 mb-2">
            <Stethoscope className="w-4 h-4 text-clinical-teal" />
            <h2 className="text-sm font-heading font-bold text-foreground">Authored Scenarios</h2>
            <span className="text-[10px] text-muted-foreground">({dbScenarios.length})</span>
          </div>
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <div className="w-6 h-6 border-2 border-clinical-teal/30 border-t-clinical-teal rounded-full animate-spin" />
            </div>
          ) : dbScenarios.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-muted p-6 text-center">
              <p className="text-xs text-muted-foreground">No authored scenarios yet. Clone a prebuilt one or create a new one to get started.</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {dbScenarios.map((sc) => (
                <ScenarioCard key={sc.id} scenario={sc} onEdit={() => handleEdit(sc)} onClone={() => handleClone(sc)} onDelete={() => setConfirmDelete(sc)} />
              ))}
            </div>
          )}
        </section>

        {/* Prebuilt scenarios (clone source) */}
        <section>
          <div className="flex items-center gap-1.5 mb-2">
            <Copy className="w-4 h-4 text-muted-foreground" />
            <h2 className="text-sm font-heading font-bold text-foreground">Prebuilt Scenarios</h2>
            <span className="text-[10px] text-muted-foreground">Clone to customise</span>
          </div>
          <div className="space-y-2.5">
            {PREBUILT_SCENARIOS.map((sc, idx) => (
              <ScenarioCard key={idx} scenario={sc} prebuilt onClone={() => handleClone(sc)} />
            ))}
          </div>
        </section>
      </div>

      {/* Editor modal */}
      {editor && (
        <ScenarioEditor
          initialScenario={editor.scenario}
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
              <h2 className="font-heading font-bold text-foreground">Delete Scenario?</h2>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Are you sure you want to delete "{confirmDelete.name}"? This action cannot be undone.
            </p>
            <div className="flex gap-2">
              <button onClick={() => setConfirmDelete(null)} className="flex-1 py-2.5 rounded-lg border border-border text-slate-700 text-sm font-heading font-semibold hover:bg-muted">Cancel</button>
              <button onClick={handleDelete} className="flex-1 py-2.5 rounded-lg bg-clinical-red text-white text-sm font-heading font-semibold hover:opacity-90">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ScenarioCard({ scenario, prebuilt, onEdit, onClone, onDelete }) {
  return (
    <div className="rounded-xl border border-border bg-card p-3.5 shadow-sm">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {prebuilt ? (
              <span className="text-[10px] font-semibold uppercase rounded px-1.5 py-0.5 bg-muted text-muted-foreground">Prebuilt</span>
            ) : (
              <span className="text-[10px] font-semibold uppercase rounded px-1.5 py-0.5 bg-clinical-teal/15 text-clinical-teal">Custom</span>
            )}
            <span className={`text-[10px] font-semibold uppercase rounded px-1.5 py-0.5 ${
              scenario.difficulty === "guided" ? "bg-clinical-green/15 text-clinical-green" :
              scenario.difficulty === "intermediate" ? "bg-clinical-amber/15 text-clinical-amber" :
              "bg-clinical-red/15 text-clinical-red"}`}>
              {scenario.difficulty}
            </span>
            <span className="flex items-center gap-1 text-[10px] text-muted-foreground"><Clock className="w-3 h-3" /> {scenario.estimated_duration} min</span>
          </div>
          <h3 className="font-heading font-bold text-sm text-foreground">{scenario.name}</h3>
          <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{scenario.description}</p>
        </div>
        <NEWS2Badge score={scenario.initial_news2} size="sm" />
      </div>
      <div className="flex items-center gap-3 text-[11px] text-muted-foreground mb-2">
        <span className="flex items-center gap-1"><User className="w-3 h-3" /> {scenario.patient_name}</span>
        <span className="flex items-center gap-1"><Heart className="w-3 h-3" /> {scenario.bed_number}</span>
      </div>
      <div className="flex items-center justify-between">
        <SKBadgeGroup skCodes={scenario.sk_codes} poCodes={scenario.performance_outcomes} />
        <div className="flex items-center gap-1">
          <button onClick={onClone} className="flex items-center gap-1 rounded-md border border-border bg-card px-2 py-1 text-[10px] font-heading font-semibold text-muted-foreground hover:bg-muted">
            <Copy className="w-3 h-3" /> Clone
          </button>
          {!prebuilt && onEdit && (
            <button onClick={onEdit} className="flex items-center gap-1 rounded-md border border-border bg-card px-2 py-1 text-[10px] font-heading font-semibold text-muted-foreground hover:bg-muted">
              <Pencil className="w-3 h-3" /> Edit
            </button>
          )}
          {!prebuilt && onDelete && (
            <button onClick={onDelete} className="flex items-center gap-1 rounded-md border border-clinical-red/30 bg-card px-2 py-1 text-[10px] font-heading font-semibold text-clinical-red hover:bg-clinical-red/5">
              <Trash2 className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}