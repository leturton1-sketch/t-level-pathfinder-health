import { useState } from "react";
import { Activity, Brain, CheckCircle2, ChevronRight, ClipboardCheck, Focus, HeartPulse, Info, Layers3, Rotate3D, ScanLine, ShieldAlert, Sparkles, Stethoscope, UserRound } from "lucide-react";
import Anatomy3DViewer from "@/components/anatomy/Anatomy3DViewer";
import { ANATOMY_STRUCTURES, SYSTEM_META } from "@/lib/anatomy3D";
import { BODY_LAYER_ORDER, PATHOPHYSIOLOGY_CONDITIONS, STANDARDISED_PATIENTS, calculateScenarioFeedback } from "@/lib/pathophysiologyData";

const panel = "polished-glass-edge rounded-[28px] border border-white/90 bg-gradient-to-br from-white/92 via-slate-100/82 to-slate-200/68 shadow-[0_12px_0_-6px_rgba(100,116,139,.24),0_28px_60px_-32px_rgba(15,23,42,.55),inset_1px_1px_2px_white] backdrop-blur-2xl";
const input = "w-full rounded-xl border border-slate-300 bg-white/90 px-3 py-2 text-sm font-semibold text-slate-900 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-200";

function Explorer() {
  const [gender, setGender] = useState("male");
  const [removed, setRemoved] = useState([]);
  const [selectedId, setSelectedId] = useState("skin");
  const [viewMode, setViewMode] = useState("full");
  const activeSystems = BODY_LAYER_ORDER.filter((system) => !removed.includes(system));
  const selected = ANATOMY_STRUCTURES.find((item) => item.id === selectedId);
  const nextVisible = BODY_LAYER_ORDER.find((system) => activeSystems.includes(system));

  const peelLayer = (system) => {
    setRemoved((current) => current.includes(system) ? current.filter((item) => item !== system) : [...current, system]);
    setSelectedId(null);
  };

  return <div className="grid gap-4 xl:grid-cols-[260px_minmax(0,1fr)_320px]">
    <aside className={`${panel} p-4`}>
      <div className="mb-4 flex rounded-xl bg-slate-200/70 p-1">
        {["male","female"].map((sex) => <button key={sex} onClick={() => setGender(sex)} className={`flex-1 rounded-lg px-3 py-2 text-xs font-black capitalize transition ${gender === sex ? "bg-violet-600 text-white shadow" : "text-slate-600"}`}>{sex}</button>)}
      </div>
      <p className="mb-2 text-[10px] font-black uppercase tracking-[.18em] text-violet-700">Outer to inner layers</p>
      <div className="space-y-1.5">
        {BODY_LAYER_ORDER.map((system, index) => {
          const meta = SYSTEM_META[system];
          const visible = !removed.includes(system);
          return <button key={system} onClick={() => peelLayer(system)} className={`flex w-full items-center gap-2 rounded-xl border px-3 py-2 text-left transition ${visible ? "border-white bg-white/85 shadow-sm" : "border-slate-200 bg-slate-100/50 opacity-55"}`}>
            <span className="grid h-7 w-7 place-items-center rounded-lg text-[10px] font-black text-white" style={{backgroundColor:meta.hex}}>{index + 1}</span>
            <span className="min-w-0 flex-1 text-xs font-bold text-slate-800">{meta.name}</span>
            <span className="text-[9px] font-bold text-slate-500">{visible ? "Remove" : "Restore"}</span>
          </button>;
        })}
      </div>
      <button onClick={() => setRemoved([])} className="mt-3 w-full rounded-xl bg-slate-900 px-3 py-2 text-xs font-bold text-white">Restore all layers</button>
    </aside>

    <section className={`${panel} overflow-hidden p-3`}>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 px-2">
        <div><p className="text-[10px] font-black uppercase tracking-[.18em] text-cyan-700">Interactive organ system</p><h2 className="font-black text-slate-900">360° thoracic & abdominal visualiser</h2></div>
        <span className="flex items-center gap-1 rounded-full bg-slate-900 px-3 py-1.5 text-[10px] font-bold text-white"><Rotate3D className="h-3.5 w-3.5"/> Drag to rotate · scroll to zoom</span>
      </div>
      <div className="mb-3 flex flex-wrap gap-2 px-2" role="group" aria-label="Anatomical camera view">
        {[
          ["full", "Full body", Rotate3D],
          ["torso", "Torso focus", Focus],
          ["cross-section", "Cross-section", ScanLine],
        ].map(([mode, label, Icon]) => <button key={mode} onClick={() => setViewMode(mode)} aria-pressed={viewMode === mode}
          className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-[11px] font-black transition ${viewMode === mode ? "border-violet-600 bg-violet-600 text-white shadow-md" : "border-slate-200 bg-white text-slate-700 hover:border-violet-300"}`}>
          <Icon className="h-3.5 w-3.5"/>{label}
        </button>)}
      </div>
      <div className="relative h-[620px] overflow-hidden rounded-[22px] border border-slate-200 bg-[#F8FAFC]">
        <div className="pointer-events-none absolute left-3 top-3 z-10 flex flex-wrap gap-1.5">
          <span className="rounded-full border border-rose-200 bg-white/80 px-2.5 py-1 text-[9px] font-black text-rose-700 backdrop-blur-md">MUSCLE · SEMI-TRANSPARENT</span>
          <span className="rounded-full border border-emerald-200 bg-white/80 px-2.5 py-1 text-[9px] font-black text-emerald-700 backdrop-blur-md">ORGANS · OPAQUE</span>
          <span className="rounded-full border border-cyan-200 bg-white/80 px-2.5 py-1 text-[9px] font-black text-cyan-700 backdrop-blur-md">DIAPHRAGM · FROSTED</span>
        </div>
        <Anatomy3DViewer gender={gender} activeSystems={activeSystems} selectedId={selectedId} isolatedId={null} reconstructId={null} onSelectStructure={setSelectedId} resetNonce={0} viewMode={viewMode}/>
      </div>
      <p className="mt-2 px-2 text-xs text-slate-600">Current outermost visible layer: <strong>{SYSTEM_META[nextVisible]?.name || "All layers removed"}</strong>. Select a structure in the model for its physiology and clinical relevance.</p>
    </section>

    <aside className={`${panel} p-5`}>
      {selected ? <>
        <span className="inline-flex rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider text-white" style={{backgroundColor:SYSTEM_META[selected.system].hex}}>{SYSTEM_META[selected.system].name}</span>
        <h2 className="mt-3 text-2xl font-black text-slate-900">{selected.name}</h2>
        <div className="mt-4 rounded-2xl bg-white/80 p-4"><p className="text-[10px] font-black uppercase tracking-wider text-violet-700">Structure & function</p><p className="mt-2 text-sm leading-6 text-slate-700">{selected.function}</p></div>
        <div className="mt-3 rounded-2xl border border-cyan-200 bg-cyan-50/80 p-4"><p className="flex items-center gap-2 text-xs font-black text-cyan-900"><Stethoscope className="h-4 w-4"/> Clinical connection</p><p className="mt-2 text-sm leading-6 text-cyan-950">{selected.clinicalNote}</p></div>
      </> : <div className="grid min-h-[400px] place-items-center text-center"><div><Info className="mx-auto h-10 w-10 text-violet-500"/><h2 className="mt-3 font-black text-slate-900">Select a body part</h2><p className="mt-2 text-sm text-slate-600">Click any visible structure to explore its anatomy, physiology and clinical relevance.</p></div></div>}
    </aside>
  </div>;
}

function Pathophysiology() {
  const [conditionId, setConditionId] = useState(PATHOPHYSIOLOGY_CONDITIONS[0].id);
  const condition = PATHOPHYSIOLOGY_CONDITIONS.find((item) => item.id === conditionId);
  return <div className="grid gap-4 xl:grid-cols-[300px_minmax(0,1fr)_340px]">
    <aside className={`${panel} p-4`}>
      <p className="mb-3 text-[10px] font-black uppercase tracking-[.18em] text-rose-700">T Level condition library</p>
      <div className="space-y-2">{PATHOPHYSIOLOGY_CONDITIONS.map((item) => <button key={item.id} onClick={() => setConditionId(item.id)} className={`w-full rounded-2xl border p-3 text-left transition ${conditionId === item.id ? "border-rose-300 bg-rose-50 shadow-md" : "border-white bg-white/75 hover:bg-white"}`}><p className="text-xs font-black text-slate-900">{item.name}</p><p className="mt-1 text-[10px] capitalize text-slate-500">{SYSTEM_META[item.system]?.name}</p></button>)}</div>
    </aside>
    <section className={`${panel} overflow-hidden p-3`}>
      <div className="mb-3 flex items-center justify-between px-2"><div><p className="text-[10px] font-black uppercase tracking-[.18em] text-rose-700">Animated disease process</p><h2 className="text-xl font-black text-slate-900">{condition.name}</h2></div><span className="animate-pulse rounded-full bg-rose-100 px-3 py-1.5 text-[10px] font-black text-rose-700">PATHOLOGY ACTIVE</span></div>
      <div className="h-[620px] overflow-hidden rounded-[22px] bg-slate-950"><Anatomy3DViewer gender="female" activeSystems={[condition.system]} selectedId={condition.structureId} isolatedId={null} reconstructId={null} pathologyStructureId={condition.structureId} onSelectStructure={()=>{}} resetNonce={0}/></div>
    </section>
    <aside className={`${panel} p-5`}>
      <h3 className="text-lg font-black text-slate-900">What changes?</h3><p className="mt-2 text-sm leading-6 text-slate-700">{condition.summary}</p>
      <div className="mt-4 rounded-2xl bg-slate-900 p-4 text-white"><p className="text-[10px] font-black uppercase tracking-wider text-cyan-300">Animation key</p><p className="mt-2 text-sm leading-6 text-slate-200">{condition.animation}</p></div>
      <h3 className="mt-5 text-sm font-black text-slate-900">Expected presentation</h3><ul className="mt-2 space-y-2">{condition.signs.map((sign)=><li key={sign} className="flex items-center gap-2 text-sm text-slate-700"><ShieldAlert className="h-4 w-4 text-rose-500"/>{sign}</li>)}</ul>
      <h3 className="mt-5 text-sm font-black text-slate-900">Care priorities</h3><ol className="mt-2 space-y-2">{condition.priorities.map((priority,index)=><li key={priority} className="flex gap-2 text-sm text-slate-700"><span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-violet-100 text-[10px] font-black text-violet-700">{index+1}</span>{priority}</li>)}</ol>
    </aside>
  </div>;
}

function ScenarioLab() {
  const [patientId, setPatientId] = useState(STANDARDISED_PATIENTS[0].id);
  const patient = STANDARDISED_PATIENTS.find((item) => item.id === patientId);
  const condition = PATHOPHYSIOLOGY_CONDITIONS.find((item) => item.id === patient.conditionId);
  const [observations, setObservations] = useState({});
  const [choices, setChoices] = useState([]);
  const [feedback, setFeedback] = useState(null);
  const reset = (id=patientId) => { setPatientId(id); setObservations({}); setChoices([]); setFeedback(null); };
  const setObservation = (key,value) => setObservations((current)=>({...current,[key]:value}));
  const toggleChoice = (id) => setChoices((current)=>current.includes(id)?current.filter((item)=>item!==id):[...current,id]);
  const labels = {rr:"Respiratory rate",spo2:"SpO₂",hr:"Heart rate",sbp:"Systolic BP",temp:"Temperature",avpu:"AVPU"};

  return <div className="grid gap-4 xl:grid-cols-[300px_minmax(0,1fr)_360px]">
    <aside className={`${panel} p-4`}><p className="mb-3 text-[10px] font-black uppercase tracking-[.18em] text-violet-700">Standardised patients</p>{STANDARDISED_PATIENTS.map((item)=><button key={item.id} onClick={()=>reset(item.id)} className={`mb-2 w-full rounded-2xl border p-3 text-left ${patientId===item.id?"border-violet-300 bg-violet-50":"border-white bg-white/75"}`}><p className="font-black text-slate-900">{item.name}</p><p className="text-xs text-slate-500">{item.age} years · {PATHOPHYSIOLOGY_CONDITIONS.find((c)=>c.id===item.conditionId)?.name}</p></button>)}
      <div className="mt-4 rounded-2xl bg-slate-900 p-4 text-white"><UserRound className="h-5 w-5 text-cyan-300"/><p className="mt-2 font-black">{patient.name}</p><p className="mt-1 text-xs leading-5 text-slate-300">{patient.history}</p></div>
    </aside>
    <section className={`${panel} p-5`}>
      <div className="flex items-start justify-between gap-4"><div><p className="text-[10px] font-black uppercase tracking-[.18em] text-violet-700">Clinical decision lab</p><h2 className="text-2xl font-black text-slate-900">{condition.name}</h2></div><ClipboardCheck className="h-8 w-8 text-violet-600"/></div>
      <h3 className="mt-5 text-sm font-black text-slate-900">1. Record the vital information</h3><p className="mt-1 text-xs text-slate-600">Enter your own measured values. All fields are required before a complete review can be awarded.</p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{patient.required.map((key)=><label key={key} className="text-xs font-bold text-slate-700">{labels[key]}<input aria-label={labels[key]} type={key==="avpu"?"text":"number"} step={key==="temp"?"0.1":"1"} className={`${input} mt-1`} value={observations[key]??""} onChange={(event)=>setObservation(key,event.target.value)}/></label>)}</div>
      <h3 className="mt-6 text-sm font-black text-slate-900">2. Select and sequence care interventions</h3><div className="mt-3 space-y-2">{patient.choices.map((choice)=><button key={choice.id} onClick={()=>toggleChoice(choice.id)} className={`flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition ${choices.includes(choice.id)?"border-violet-400 bg-violet-50":"border-slate-200 bg-white"}`}><span className={`grid h-7 w-7 place-items-center rounded-full ${choices.includes(choice.id)?"bg-violet-600 text-white":"bg-slate-100 text-slate-500"}`}>{choices.includes(choice.id)?<CheckCircle2 className="h-4 w-4"/>:<ChevronRight className="h-4 w-4"/>}</span><span className="text-sm font-bold text-slate-800">{choice.label}</span></button>)}</div>
      <button onClick={()=>setFeedback(calculateScenarioFeedback(patient,observations,choices))} className="mt-5 w-full rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-5 py-3 text-sm font-black text-white shadow-lg"><Sparkles className="mr-2 inline h-4 w-4"/>Submit session for formative feedback</button>
    </section>
    <aside className={`${panel} p-5`}>
      {!feedback ? <div className="grid min-h-[480px] place-items-center text-center"><div><Activity className="mx-auto h-12 w-12 text-violet-500"/><h2 className="mt-3 font-black text-slate-900">Patient response monitor</h2><p className="mt-2 text-sm text-slate-600">Your observations and interventions determine whether the patient improves, stabilises or deteriorates.</p></div></div> : <>
        <div className={`rounded-2xl p-4 text-white ${feedback.outcome==="improving"?"bg-emerald-600":feedback.outcome==="stable"?"bg-amber-500":"bg-rose-600"}`}><p className="text-[10px] font-black uppercase tracking-wider">Patient outcome</p><p className="mt-1 text-2xl font-black capitalize">{feedback.outcome}</p><p className="mt-2 text-sm">Session score: {feedback.score}%</p></div>
        <h3 className="mt-5 text-sm font-black text-slate-900">What you did well</h3><ul className="mt-2 space-y-2">{(feedback.strengths.length?feedback.strengths:["You completed the decision cycle and can now use the review points to improve."]).map((item)=><li key={item} className="rounded-xl bg-emerald-50 p-3 text-xs leading-5 text-emerald-900">{item}</li>)}</ul>
        <h3 className="mt-5 text-sm font-black text-slate-900">Constructive next steps</h3><ul className="mt-2 space-y-2">{(feedback.improvements.length?feedback.improvements:["Maintain this structured approach and explain the physiology behind each intervention."]).map((item)=><li key={item} className="rounded-xl bg-amber-50 p-3 text-xs leading-5 text-amber-950">{item}</li>)}</ul>
        <div className="mt-4 space-y-2">{patient.choices.filter((choice)=>choices.includes(choice.id)).map((choice)=><div key={choice.id} className="rounded-xl border border-slate-200 bg-white/80 p-3"><p className="text-xs font-black text-slate-800">{choice.label}</p><p className="mt-1 text-[11px] leading-5 text-slate-600">{choice.rationale}</p></div>)}</div>
        <button onClick={()=>reset()} className="mt-4 w-full rounded-xl bg-slate-900 px-3 py-2 text-xs font-bold text-white">Start again</button>
      </>}
    </aside>
  </div>;
}

export default function AnatomyPhysiology() {
  const [tab,setTab]=useState("explore");
  const tabs=[["explore","Anatomy & physiology",Layers3],["pathology","Pathophysiology",Brain],["scenario","Scenario lab",HeartPulse]];
  return <main className="min-h-screen bg-[radial-gradient(circle_at_10%_5%,rgba(255,255,255,.98),transparent_30%),radial-gradient(circle_at_88%_14%,rgba(205,190,235,.48),transparent_32%),linear-gradient(145deg,#fbfafc,#f0edf5_54%,#f8f7fa)] px-4 py-6 pb-28 text-slate-900 sm:px-6 lg:px-8">
    <div className="mx-auto max-w-[1600px]">
      <header className={`${panel} mb-5 flex flex-wrap items-center justify-between gap-4 p-5`}><div className="flex items-center gap-4"><span className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-600 text-white shadow-xl"><Brain className="h-7 w-7"/></span><div><p className="text-[10px] font-black uppercase tracking-[.22em] text-violet-700">T Level Health · Areas 8–9</p><h1 className="text-2xl font-black tracking-tight sm:text-3xl">Anatomy, Physiology & Pathophysiology</h1><p className="mt-1 text-sm text-slate-600">Explore structures, visualise disease processes and practise care decisions safely.</p></div></div><span className="rounded-full bg-emerald-100 px-4 py-2 text-xs font-black text-emerald-800">Interactive learning module</span></header>
      <nav className="mb-4 flex flex-wrap gap-2">{tabs.map(([id,label,Icon])=><button key={id} onClick={()=>setTab(id)} className={`flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-black shadow-sm transition ${tab===id?"bg-slate-900 text-white":"bg-white/85 text-slate-700 hover:bg-white"}`}><Icon className="h-4 w-4"/>{label}</button>)}</nav>
      {tab==="explore"?<Explorer/>:tab==="pathology"?<Pathophysiology/>:<ScenarioLab/>}
    </div>
  </main>;
}
