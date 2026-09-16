import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Monitor, User, AlertCircle, Pill, Activity, FileText, Clock, Lock, Stethoscope, TrendingDown, TrendingUp,
} from "lucide-react";
import { EPR_PATIENTS } from "@/lib/learningData";

const MED_STATUS_STYLES = {
  due: { label: "Due", bg: "bg-amber-50", text: "text-amber-600", border: "border-amber-200" },
  given: { label: "Given", bg: "bg-clinical-green/10", text: "text-clinical-green", border: "border-clinical-green/30" },
  pending: { label: "Pending", bg: "bg-slate-100", text: "text-slate-500", border: "border-slate-200" },
  prn: { label: "PRN", bg: "bg-blue-50", text: "text-blue-600", border: "border-blue-200" },
};

const TABS = [
  { id: "overview", label: "Overview", icon: User },
  { id: "meds", label: "Medications", icon: Pill },
  { id: "obs", label: "Observations", icon: Activity },
  { id: "notes", label: "Notes", icon: FileText },
];

export default function MockEPR() {
  const [selectedId, setSelectedId] = useState(EPR_PATIENTS[0].id);
  const [activeTab, setActiveTab] = useState("overview");
  const [recordedVitals, setRecordedVitals] = useState(null);
  const [showRecordForm, setShowRecordForm] = useState(false);
  const [form, setForm] = useState({ rr: 18, spo2: 96, sbp: 120, hr: 80, temp: 37.0 });

  const patient = EPR_PATIENTS.find(p => p.id === selectedId);
  const latestObs = recordedVitals || patient.observations[patient.observations.length - 1];

  const getNews2Color = (score) => {
    if (score >= 7) return "text-clinical-red bg-clinical-red/10 border-clinical-red/30";
    if (score >= 5) return "text-clinical-amber bg-clinical-amber/10 border-clinical-amber/30";
    if (score >= 1) return "text-clinical-green bg-clinical-green/10 border-clinical-green/30";
    return "text-slate-500 bg-slate-100 border-slate-200";
  };

  const getTrend = (obs) => {
    if (obs.length < 2) return null;
    const prev = obs[obs.length - 2];
    const curr = obs[obs.length - 1];
    if (curr.news2 < prev.news2) return "down";
    if (curr.news2 > prev.news2) return "up";
    return "stable";
  };

  const trend = getTrend(patient.observations.concat(recordedVitals ? [recordedVitals] : []));

  const calcNews2 = (v) => {
    let score = 0;
    if (v.rr <= 8 || v.rr >= 25) score += 3; else if (v.rr <= 11 || v.rr >= 21) score += 1;
    if (v.spo2 <= 91) score += 3; else if (v.spo2 <= 93) score += 2; else if (v.spo2 <= 95) score += 1;
    if (v.sbp <= 90 || v.sbp >= 220) score += 3; else if (v.sbp <= 100) score += 2; else if (v.sbp <= 110 || v.sbp >= 180) score += 1;
    if (v.hr <= 40 || v.hr >= 131) score += 3; else if (v.hr <= 50 || v.hr >= 111) score += 2; else if (v.hr >= 91 && v.hr <= 110) score += 1;
    if (v.temp <= 35.0) score += 3; else if (v.temp <= 36.0 || v.temp >= 39.1) score += 2; else if (v.temp <= 36.0 || v.temp >= 38.1) score += 1;
    return score;
  };

  const handleRecord = () => {
    const time = new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
    const newObs = { time, rr: form.rr, spo2: form.spo2, sbp: form.sbp, hr: form.hr, temp: form.temp, news2: calcNews2(form) };
    setRecordedVitals(newObs);
    setShowRecordForm(false);
  };

  const allObs = recordedVitals ? [...patient.observations, recordedVitals] : patient.observations;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-slate-800 rounded-2xl p-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-slate-700 flex items-center justify-center">
          <Monitor className="w-5 h-5 text-clinical-teal" />
        </div>
        <div>
          <h2 className="font-heading font-bold text-white text-lg">Mock Electronic Patient Record</h2>
          <p className="text-xs text-slate-400">Simulated hospital EPR — practise navigating patient records, recording observations, and interpreting NEWS2 trends.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Patient selector */}
        <div className="lg:col-span-1 space-y-2">
          <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide px-1">Ward Patients</p>
          {EPR_PATIENTS.map(p => (
            <button key={p.id} onClick={() => { setSelectedId(p.id); setActiveTab("overview"); setRecordedVitals(null); }}
              className={`w-full text-left rounded-xl border p-3 transition-all ${selectedId === p.id ? "border-clinical-teal bg-clinical-teal/5" : "border-slate-200 bg-white hover:bg-slate-50"}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                    <User className="w-4 h-4 text-slate-500" />
                  </div>
                  <div>
                    <p className="font-heading font-bold text-sm text-slate-800">{p.name}</p>
                    <p className="text-[10px] text-slate-500">{p.mrn} · {p.ward.split("—")[1]}</p>
                  </div>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getNews2Color(p.observations[p.observations.length - 1].news2)}`}>
                  NEWS2 {p.observations[p.observations.length - 1].news2}
                </span>
              </div>
            </button>
          ))}
        </div>

        {/* Patient record */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            {/* Patient header */}
            <div className="bg-slate-50 border-b border-slate-200 px-4 py-3">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Stethoscope className="w-4 h-4 text-clinical-teal" />
                    <h3 className="font-heading font-bold text-slate-800">{patient.name}</h3>
                    {patient.allergies[0] !== "No known allergies" && (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-clinical-red bg-clinical-red/10 px-2 py-0.5 rounded-full">
                        <AlertCircle className="w-3 h-3" /> ALLERGY: {patient.allergies.join(", ")}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-3 text-xs text-slate-500">
                    <span><strong className="text-slate-700">MRN:</strong> {patient.mrn}</span>
                    <span><strong className="text-slate-700">Age:</strong> {patient.age} ({patient.gender})</span>
                    <span><strong className="text-slate-700">DoB:</strong> {patient.dob}</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-slate-500">{patient.ward}</p>
                  <p className="text-[10px] text-slate-500">Consultant: {patient.consultant}</p>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-200">
              {TABS.map(tab => {
                const Icon = tab.icon;
                return (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-heading font-semibold border-b-2 transition-colors ${activeTab === tab.id ? "border-clinical-teal text-clinical-teal bg-clinical-teal/5" : "border-transparent text-slate-500 hover:text-slate-700"}`}>
                    <Icon className="w-3.5 h-3.5" /> {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Tab content */}
            <div className="p-4">
              <AnimatePresence mode="wait">
                {activeTab === "overview" && (
                  <motion.div key="overview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                    <div>
                      <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-1">Admission Reason</p>
                      <p className="text-sm text-slate-700">{patient.admissionReason}</p>
                      <p className="text-[10px] text-slate-400 mt-1">Admitted: {patient.admissionDate}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-1">Past Medical History</p>
                      <div className="flex flex-wrap gap-1.5">
                        {patient.pastMedicalHistory.map(h => (
                          <span key={h} className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-md">{h}</span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-1">Allergies</p>
                      {patient.allergies[0] === "No known allergies" ? (
                        <span className="text-xs text-slate-500 bg-slate-50 px-2 py-1 rounded-md">No known allergies</span>
                      ) : (
                        patient.allergies.map(a => (
                          <span key={a} className="text-xs bg-clinical-red/10 text-clinical-red px-2 py-1 rounded-md border border-clinical-red/20">{a}</span>
                        ))
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <div className={`rounded-xl border p-3 ${getNews2Color(latestObs.news2)}`}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-semibold uppercase">Latest NEWS2</span>
                          {trend === "up" ? <TrendingUp className="w-3.5 h-3.5" /> : trend === "down" ? <TrendingDown className="w-3.5 h-3.5" /> : null}
                        </div>
                        <p className="text-2xl font-heading font-bold">{latestObs.news2}</p>
                        <p className="text-[10px]">{latestObs.news2 >= 7 ? "High — Emergency" : latestObs.news2 >= 5 ? "Medium — Urgent" : latestObs.news2 >= 1 ? "Low — Routine" : "Normal"}</p>
                      </div>
                      <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-semibold uppercase text-slate-500">Last Obs</span>
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                        </div>
                        <p className="text-sm font-heading font-bold text-slate-700">{latestObs.time}</p>
                        <p className="text-[10px] text-slate-500">{recordedVitals ? "Recorded by you" : "Previous shift"}</p>
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeTab === "meds" && (
                  <motion.div key="meds" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-2">
                    {patient.medications.map((med, idx) => {
                      const style = MED_STATUS_STYLES[med.status];
                      return (
                        <div key={idx} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center">
                              <Pill className="w-4 h-4 text-slate-600" />
                            </div>
                            <div>
                              <p className="font-heading font-bold text-sm text-slate-800">{med.name}</p>
                              <p className="text-[11px] text-slate-500">{med.dose} · {med.route} · {med.freq}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className={`text-[10px] font-bold px-2 py-1 rounded-full border ${style.bg} ${style.text} ${style.border}`}>{style.label}</span>
                            <p className="text-[10px] text-slate-400 mt-1">{med.time === "—" ? "As required" : `Due: ${med.time}`}</p>
                          </div>
                        </div>
                      );
                    })}
                    {patient.allergies[0] !== "No known allergies" && (
                      <div className="flex items-center gap-2 text-xs text-clinical-red bg-clinical-red/5 border border-clinical-red/20 rounded-xl p-3 mt-3">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span><strong>Check allergies before administration:</strong> {patient.allergies.join(", ")}</span>
                      </div>
                    )}
                  </motion.div>
                )}

                {activeTab === "obs" && (
                  <motion.div key="obs" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
                    {/* Record new vitals */}
                    <div className="rounded-xl border border-clinical-teal/30 bg-clinical-teal/5 p-3">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-xs font-heading font-bold text-slate-700">Record New Observations</p>
                        <button onClick={() => setShowRecordForm(!showRecordForm)}
                          className="text-[11px] font-semibold text-clinical-teal hover:underline">
                          {showRecordForm ? "Cancel" : "Record Now →"}
                        </button>
                      </div>
                      <AnimatePresence>
                        {showRecordForm && (
                          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                            <div className="grid grid-cols-5 gap-2 mb-3">
                              {[
                                { key: "rr", label: "RR", unit: "/min" },
                                { key: "spo2", label: "SpO₂", unit: "%" },
                                { key: "sbp", label: "SBP", unit: "mmHg" },
                                { key: "hr", label: "HR", unit: "bpm" },
                                { key: "temp", label: "Temp", unit: "°C" },
                              ].map(f => (
                                <div key={f.key}>
                                  <label className="text-[10px] text-slate-500 font-semibold">{f.label}</label>
                                  <input type="number" value={form[f.key]} onChange={e => setForm({ ...form, [f.key]: Number(e.target.value) })}
                                    className="w-full text-sm border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:border-clinical-teal" />
                                </div>
                              ))}
                            </div>
                            <button onClick={handleRecord}
                              className="w-full py-2 rounded-lg bg-clinical-teal text-white text-xs font-heading font-semibold hover:opacity-90">
                              Save & Calculate NEWS2
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Observation history */}
                    <div className="space-y-2">
                      <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Observation History</p>
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="border-b border-slate-200 text-slate-500">
                              <th className="text-left py-2 px-1 font-semibold">Time</th>
                              <th className="py-2 px-1 font-semibold">RR</th>
                              <th className="py-2 px-1 font-semibold">SpO₂</th>
                              <th className="py-2 px-1 font-semibold">SBP</th>
                              <th className="py-2 px-1 font-semibold">HR</th>
                              <th className="py-2 px-1 font-semibold">Temp</th>
                              <th className="py-2 px-1 font-semibold">NEWS2</th>
                            </tr>
                          </thead>
                          <tbody>
                            {allObs.map((o, i) => (
                              <tr key={i} className={`border-b border-slate-100 ${i === allObs.length - 1 && recordedVitals ? "bg-clinical-teal/5" : ""}`}>
                                <td className="py-2 px-1 text-slate-600 font-medium">{o.time}{i === allObs.length - 1 && recordedVitals ? " ★" : ""}</td>
                                <td className="py-2 px-1 text-center text-slate-700">{o.rr}</td>
                                <td className="py-2 px-1 text-center text-slate-700">{o.spo2}</td>
                                <td className="py-2 px-1 text-center text-slate-700">{o.sbp}</td>
                                <td className="py-2 px-1 text-center text-slate-700">{o.hr}</td>
                                <td className="py-2 px-1 text-center text-slate-700">{o.temp}</td>
                                <td className="py-2 px-1 text-center">
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getNews2Color(o.news2)}`}>{o.news2}</span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeTab === "notes" && (
                  <motion.div key="notes" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <FileText className="w-4 h-4 text-slate-500" />
                        <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Clinical Notes</p>
                      </div>
                      <p className="text-sm text-slate-700 leading-relaxed">{patient.clinicalNotes}</p>
                    </div>
                    <div className="mt-3 flex items-center gap-2 text-[11px] text-slate-400">
                      <Lock className="w-3 h-3" />
                      <span>All entries are audit-trailed per Caldicott Principles and Data Protection Act 2018.</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}