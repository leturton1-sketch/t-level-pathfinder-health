import { useEffect, useRef, useState } from "react";
import { BellRing, CheckCircle, Mic, Send, Square, Users, X } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useVoiceSynthesis } from "@/hooks/useVoiceSynthesis";
import { CALL_BELL_INTERVALS, assignLearners, chooseRandom, getAdlTaskPool } from "@/lib/adlScenario";
import { getPatientForBed } from "@/lib/wardPatients";
import { playUISound } from "@/lib/uiSound";

function assessSbar(text, task) {
  const value = text.toLowerCase();
  const sections = [
    ["Situation", /\bsituation\b|my name is|i am calling|current concern|needs help/],
    ["Background", /\bbackground\b|admitted|history|diagnosis|care plan|normally/],
    ["Assessment", /\bassessment\b|i observed|i found|skin|pain|mobility|intake|continence|consent/],
    ["Recommendation", /\brecommendation\b|recommend|request|review|monitor|document|escalat/],
  ];
  const present = sections.filter(([, pattern]) => pattern.test(value)).map(([name]) => name);
  const care = [
    ["dignity and consent", /dignity|privacy|consent|choice|preference/],
    ["safety", /safe|risk|equipment|manual handling|two staff|two people/],
    ["infection prevention", /hand hygiene|gloves|apron|infection|ppe/],
    ["documentation and escalation", /document|record|report|escalat|registered nurse/],
  ].filter(([, pattern]) => pattern.test(value)).map(([name]) => name);
  const score = Math.min(100, present.length * 18 + care.length * 7);
  const missing = sections.map(([name]) => name).filter((name) => !present.includes(name));
  return {
    score,
    strengths: present.length ? `Clear ${present.join(", ")} content${care.length ? `, with attention to ${care.join(" and ")}` : ""}.` : "You identified that a handover was required.",
    improvements: missing.length ? `Make the ${missing.join(", ")} section${missing.length > 1 ? "s" : ""} explicit and clinically specific.` : "Add exact observations, actions completed and the required timeframe.",
    tip: task.staff === 2 ? "State that two staff are required and confirm the moving-and-handling or repositioning plan." : "Finish with one clear recommendation, named escalation route and timeframe.",
    safe_to_complete: present.length >= 3 && /safe|consent|dignity|privacy|care plan|risk/.test(value),
  };
}

export default function ADLScenario({ scenario, bedDesignations, onActiveBedChange, onClose }) {
  const synth = useVoiceSynthesis();
  const [phase, setPhase] = useState("setup");
  const [nameInput, setNameInput] = useState("");
  const [learners, setLearners] = useState([]);
  const [calls, setCalls] = useState([]);
  const [selectedCallId, setSelectedCallId] = useState(null);
  const [sbar, setSbar] = useState("");
  const [feedback, setFeedback] = useState(null);
  const [completed, setCompleted] = useState([]);
  const [listening, setListening] = useState(false);
  const timerRef = useRef(null); const recognitionRef = useRef(null); const previousTaskRef = useRef(null);
  const callsRef = useRef(calls);
  callsRef.current = calls;
  const activeCall = calls.find((call) => call.id === selectedCallId) || calls[0] || null;

  const addLearner = () => {
    const name = nameInput.trim();
    if (name && !learners.some((item) => item.toLowerCase() === name.toLowerCase())) setLearners((current) => [...current, name]);
    setNameInput("");
  };

  const triggerCall = () => {
    if (callsRef.current.length >= 3) return;
    const beds = bedDesignations.filter(Boolean);
    const unoccupied = beds.filter((bed) => !callsRef.current.some((call) => call.bed === bed));
    const bedPool = unoccupied.length ? unoccupied : beds;
    const bed = bedPool[Math.floor(Math.random() * bedPool.length)] || "A1";
    const patient = getPatientForBed(bed);
    const task = chooseRandom(getAdlTaskPool(scenario), previousTaskRef.current);
    previousTaskRef.current = task.id;
    const assigned = assignLearners(learners, task.staff);
    const call = { id: `call_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`, bed, patient, task, assigned, receivedAt: Date.now() };
    const isFirstCall = callsRef.current.length === 0;
    setCalls((current) => {
      if (current.length >= 3) return current;
      const next = [...current, call];
      callsRef.current = next;
      return next;
    });
    setSelectedCallId((current) => current || call.id);
    if (isFirstCall) onActiveBedChange?.(bed);
    playUISound("task");
    synth.speak(`Nurse call bell from bed ${bed}. ${assigned.join(" and ")}, please support ${patient?.name || "the patient"} with ${task.title}. ${task.staff === 2 ? "Two learners are required." : ""}`);
  };

  const selectCall = (call) => {
    setSelectedCallId(call.id);
    setFeedback(null);
    setSbar("");
    onActiveBedChange?.(call.bed);
  };

  const start = () => {
    if (learners.length < 2) return;
    setPhase("running");
    timerRef.current = window.setTimeout(() => {
      triggerCall();
      timerRef.current = window.setInterval(triggerCall, CALL_BELL_INTERVALS[scenario.call_bell_speed] || CALL_BELL_INTERVALS.normal);
    }, 700);
  };
  const submitSbar = () => {
    const result = assessSbar(sbar, activeCall.task);
    setFeedback(result); synth.speak(`Feedback. ${result.strengths} ${result.tip}`);
  };
  const completeTask = () => {
    if (!activeCall || !feedback) return;
    setCompleted((current) => [...current, { task: activeCall.task.title, bed: activeCall.bed, learners: activeCall.assigned, sbar, feedback }]);
    const remaining = callsRef.current.filter((call) => call.id !== activeCall.id);
    callsRef.current = remaining;
    setCalls(remaining);
    setSelectedCallId(remaining[0]?.id || null);
    setFeedback(null);
    setSbar("");
    onActiveBedChange?.(remaining[0]?.bed || null);
  };
  const finish = async () => {
    clearTimeout(timerRef.current); clearInterval(timerRef.current); synth.stop(); onActiveBedChange?.(null);
    if (completed.length) await base44.entities.SimulationResult.create({
      student_id: "group", student_name: learners.join(", "), scenario_id: scenario.id || "adl-prebuilt", scenario_name: scenario.name,
      decisions: JSON.stringify(completed), score: Math.round(completed.reduce((sum, item) => sum + Number(item.feedback.score || 0), 0) / completed.length),
      max_score: 100, decision_path: JSON.stringify({ tasks_completed: completed.length, learners }), completed: true,
      sk_codes: ["SK15", "SK6"], performance_outcomes: ["PO4", "PO6", "PO9"],
    }).catch(() => {});
    onClose?.();
  };
  const toggleDictation = () => {
    if (listening) { recognitionRef.current?.stop(); setListening(false); return; }
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) return;
    const recognition = new Recognition(); recognition.lang = "en-GB"; recognition.continuous = true; recognition.interimResults = false;
    recognition.onresult = (event) => {
      const transcript = Array.from(event.results).slice(event.resultIndex).map((result) => result[0].transcript).join(" ");
      setSbar((current) => `${current} ${transcript}`.trim());
    };
    recognition.onend = () => setListening(false); recognitionRef.current = recognition; recognition.start(); setListening(true);
  };
  useEffect(() => () => { clearTimeout(timerRef.current); clearInterval(timerRef.current); recognitionRef.current?.stop(); synth.stop(); onActiveBedChange?.(null); }, []);

  if (phase === "setup") return <div className="absolute inset-0 z-50 grid place-items-center bg-slate-950/30 p-4 backdrop-blur-sm">
    <div className="polished-glass-edge w-full max-w-lg rounded-[28px] border border-white/90 bg-white/95 p-5 shadow-2xl">
      <div className="flex items-start justify-between"><div><p className="text-[10px] font-black uppercase tracking-[.18em] text-blue-700">SK15 · Group simulation</p><h2 className="mt-1 text-xl font-black text-slate-900">Activities of Daily Living</h2><p className="mt-1 text-sm text-slate-600">Add every learner before activating the ward call bells.</p></div><button type="button" onClick={onClose} aria-label="Close Activities of Daily Living setup" className="rounded-xl p-2 hover:bg-slate-100"><X className="h-4 w-4" /></button></div>
      <div className="mt-4 flex gap-2"><input value={nameInput} onChange={(e) => setNameInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addLearner()} placeholder="Learner name" className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm" /><button onClick={addLearner} className="rounded-xl bg-blue-700 px-4 text-sm font-bold text-white">Add</button></div>
      <div className="mt-3 flex min-h-12 flex-wrap gap-2 rounded-2xl bg-slate-100/80 p-3">{learners.length ? learners.map((name) => <button key={name} onClick={() => setLearners((current) => current.filter((item) => item !== name))} className="rounded-full bg-white px-3 py-1 text-xs font-bold shadow-sm">{name} ×</button>) : <span className="text-xs text-slate-500">No learners added</span>}</div>
      <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs"><div className="rounded-xl bg-blue-50 p-2"><b>{scenario.difficulty || "guided"}</b><br />difficulty</div><div className="rounded-xl bg-cyan-50 p-2"><b>{scenario.call_bell_speed || "normal"}</b><br />call speed</div><div className="rounded-xl bg-emerald-50 p-2"><b>{getAdlTaskPool(scenario).length}</b><br />tasks</div></div>
      <p className="mt-3 text-[10px] text-slate-500">SBAR feedback is assessed locally against the T Level rubric; handover text is not sent to an external AI service.</p>
      <button disabled={learners.length < 2} onClick={start} className="mt-3 w-full rounded-xl bg-gradient-to-r from-blue-700 to-[#FC4421] py-3 text-sm font-black text-white disabled:opacity-40">{learners.length < 2 ? "Add at least two learners" : "Activate call bells"}</button>
    </div>
  </div>;

  return <div className="absolute inset-x-3 bottom-3 z-50 sm:left-auto sm:w-[430px]"><div className="polished-glass-edge max-h-[78vh] overflow-y-auto rounded-[26px] border border-white/90 bg-white/95 p-4 shadow-2xl backdrop-blur-2xl">
    <div className="flex items-center justify-between gap-3"><div><p className="text-[10px] font-black uppercase tracking-[.16em] text-blue-700">ADL simulation · {completed.length} complete</p><h2 className="text-base font-black">{activeCall ? `Care task · Bed ${activeCall.bed}` : "Ward monitoring"}</h2><p className={`mt-0.5 text-xs font-bold ${calls.length === 3 ? "text-red-600" : "text-slate-500"}`}>{calls.length}/3 outstanding care tasks</p></div><button onClick={finish} className="rounded-xl border px-3 py-2 text-xs font-bold">Finish</button></div>
    {calls.length > 0 && <div className="mt-3 grid gap-2" aria-label="Outstanding care task queue">
      {calls.map((call, index) => <button key={call.id} type="button" onClick={() => selectCall(call)} aria-pressed={activeCall?.id === call.id}
        className={`flex items-center justify-between rounded-xl border px-3 py-2 text-left text-xs transition-colors ${activeCall?.id === call.id ? "border-red-300 bg-red-50" : "border-slate-200 bg-white hover:bg-slate-50"}`}>
        <span><b>Priority {index + 1} · Bed {call.bed}</b><span className="block text-slate-600">{call.task.title}</span></span>
        <span className="rounded-full bg-slate-100 px-2 py-1 font-black">{call.assigned.join(" & ")}</span>
      </button>)}
    </div>}
    {!activeCall ? <div className="mt-4 rounded-2xl bg-slate-100 p-5 text-center"><BellRing className="mx-auto h-8 w-8 text-slate-400" /><p className="mt-2 text-sm font-bold">Waiting for the next patient call</p><p className="mt-1 text-xs text-slate-500">Calls can stack to a maximum of three to practise prioritisation and time management.</p><button onClick={triggerCall} className="mt-3 text-xs font-bold text-blue-700">Generate a care task now</button></div> : <>
      <div className="mt-3 animate-pulse rounded-2xl border-2 border-red-300 bg-red-50 p-3"><div className="flex gap-3"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-red-500 text-white shadow-lg"><BellRing className="h-5 w-5" /></span><div><p className="font-black">{activeCall.patient?.name || "Patient"} · Bed {activeCall.bed}</p><p className="text-sm">{activeCall.task.title}</p><p className="mt-1 text-xs font-bold text-red-700"><Users className="mr-1 inline h-3 w-3" />Assigned: {activeCall.assigned.join(" & ")}</p></div></div></div>
      <p className="mt-3 rounded-xl bg-blue-50 p-3 text-xs">{activeCall.task.prompt}</p>
      <label className="mt-3 block text-xs font-black uppercase">SBAR handover — type or dictate</label>
      <textarea value={sbar} onChange={(e) => setSbar(e.target.value)} rows={6} placeholder="Situation… Background… Assessment… Recommendation…" className="mt-1 w-full rounded-2xl border p-3 text-sm" />
      <div className="mt-2 flex gap-2"><button onClick={toggleDictation} className={`flex items-center gap-1 rounded-xl border px-3 py-2 text-xs font-bold ${listening ? "border-red-300 bg-red-50 text-red-700" : ""}`}>{listening ? <Square className="h-3 w-3" /> : <Mic className="h-3 w-3" />}{listening ? "Stop" : "Speak SBAR"}</button><button disabled={!sbar.trim()} onClick={submitSbar} className="flex flex-1 items-center justify-center gap-1 rounded-xl bg-blue-700 px-3 py-2 text-xs font-bold text-white disabled:opacity-40"><Send className="h-3 w-3" />Assess SBAR</button></div>
      {feedback && <div className="mt-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-xs"><div className="flex justify-between"><b>AI-guided SBAR feedback</b><b className="text-lg text-emerald-700">{feedback.score}%</b></div><p><b>Strengths:</b> {feedback.strengths}</p><p><b>Improve:</b> {feedback.improvements}</p><p><b>Tip:</b> {feedback.tip}</p><button onClick={completeTask} data-sound="confirm" className="mt-3 flex w-full items-center justify-center gap-1 rounded-xl bg-emerald-600 py-2 font-black text-white"><CheckCircle className="h-4 w-4" />Complete task</button></div>}
    </>}
  </div></div>;
}