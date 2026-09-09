import { useState } from "react";
import { Link } from "react-router-dom";
import { getCurrentUser } from "@/lib/clinicalAuth";
import { useESPCase } from "@/lib/ESPCaseContext";
const FIELDS = [["activity", "Activity or scenario"], ["strengths", "What went well, and why?"], ["improvements", "What could you improve?"], ["feedback", "Feedback to act on"], ["action", "Your next action and review date"]];
function readDraft(key) { try { return JSON.parse(localStorage.getItem(key) || "{}"); } catch { return {}; } }
function ReflectionForm({ storageKey, caseName }) {
  const [draft, setDraft] = useState(() => readDraft(storageKey));
  const [message, setMessage] = useState("");
  const [dirty, setDirty] = useState(false);
  const save = event => {
    event.preventDefault();
    try { localStorage.setItem(storageKey, JSON.stringify({ ...draft, savedAt: new Date().toISOString() })); setDirty(false); setMessage("Draft saved on this browser."); }
    catch { setMessage("Unable to save on this browser. Copy your notes before leaving."); }
  };
  return <div className="clinical-page-shell clinical-page-shell--narrow">
    <h1>Reflection</h1><p>Record what you learnt and decide what to practise next.</p>
    {caseName && <p className="mt-3"><strong>ESP case:</strong> {caseName}</p>}
    <p className="mt-3 text-sm text-muted-foreground">These personal notes are saved on this browser only. They are separate from your ESP reflective account and are not sent to your tutor.</p>
    <form onSubmit={save} className="pf-reflection-form">{FIELDS.map(([key, label]) => <label key={key} htmlFor={"reflection-" + key}>{label}<textarea id={"reflection-" + key} rows={key === "activity" ? 2 : 4} value={draft[key] || ""} onChange={e => { setDraft({ ...draft, [key]: e.target.value }); setDirty(true); setMessage(""); }} /></label>)}
      <div><button type="submit" className="pf-primary-button">Save draft</button><span className="ml-3 text-sm" role="status">{message || (dirty ? "Unsaved changes" : "")}</span></div>
    </form>
    {caseName && <Link className="pf-secondary-button mt-5" to="/esp-practice/task-2/reflect">Open your ESP reflective account</Link>}
  </div>;
}
export default function Reflection() {
  const { portfolio } = useESPCase();
  const user = getCurrentUser();
  const storageKey = "pathfinder-reflection:" + (user?.id || "local") + ":" + (portfolio?.case_id || "general");
  return <ReflectionForm key={storageKey} storageKey={storageKey} caseName={portfolio?.case_name} />;
}
