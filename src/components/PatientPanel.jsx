import { X, ClipboardList, Stethoscope, Activity, Bell } from "lucide-react";
import { DEFAULT_PATIENTS, STATUS_CONFIG } from "@/lib/wardItems";
import NEWS2Badge from "@/components/NEWS2Badge";

export default function PatientPanel({ bedDesignation, onClose, onViewPatient, onRecordObservations, onBeginTask, hasScenario }) {
  const patient = DEFAULT_PATIENTS[bedDesignation];
  if (!patient) return null;
  const status = STATUS_CONFIG[patient.status] || STATUS_CONFIG.green;
  const isAvailable = patient.name === "Available Bed";

  return (
    <div className="absolute bottom-0 left-0 right-0 z-10 bg-white/95 backdrop-blur-xl rounded-t-2xl border-t border-clinical-teal/30 p-4 max-h-[65vh] overflow-y-auto scrollbar-thin animate-slide-up shadow-2xl">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${status.bg} ${status.border} border`}>
            <span className={`w-3 h-3 rounded-full ${status.dot}`} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-heading font-bold text-slate-800">{patient.name}</h2>
              <span className="text-xs font-heading font-bold text-clinical-teal bg-clinical-teal/10 px-2 py-0.5 rounded">{bedDesignation}</span>
            </div>
            {!isAvailable && (
              <p className="text-xs text-slate-500">{patient.age}y · {patient.pronouns}</p>
            )}
          </div>
        </div>
        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100" aria-label="Close panel">
          <X className="w-4 h-4 text-slate-400" />
        </button>
      </div>

      {!isAvailable && (
        <>
          {/* Status badge */}
          <div className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-semibold mb-3 ${status.bg} ${status.text} ${status.border} border`}>
            {status.label}
          </div>

          {/* Condition */}
          <div className="rounded-lg bg-slate-50 p-3 mb-3">
            <p className="text-[10px] font-semibold text-slate-400 uppercase mb-1">Presenting Condition</p>
            <p className="text-sm text-slate-700">{patient.condition}</p>
          </div>

          {/* NEWS2 + Observations */}
          <div className="grid grid-cols-2 gap-2 mb-3">
            <div className="rounded-lg bg-slate-50 p-2">
              <p className="text-[10px] text-slate-400">NEWS2 Score</p>
              <div className="mt-0.5"><NEWS2Badge score={patient.news2} size="sm" /></div>
            </div>
            {patient.observations && (
              <div className="rounded-lg bg-slate-50 p-2">
                <p className="text-[10px] text-slate-400 mb-1">Observations</p>
                <div className="grid grid-cols-3 gap-1 text-xs">
                  <div><span className="text-slate-400">RR</span> <span className="font-bold text-slate-800">{patient.observations.rr}</span></div>
                  <div><span className="text-slate-400">SpO₂</span> <span className="font-bold text-slate-800">{patient.observations.spo2}</span></div>
                  <div><span className="text-slate-400">HR</span> <span className="font-bold text-slate-800">{patient.observations.hr}</span></div>
                  <div><span className="text-slate-400">BP</span> <span className="font-bold text-slate-800">{patient.observations.sbp}</span></div>
                  <div><span className="text-slate-400">Temp</span> <span className="font-bold text-slate-800">{patient.observations.temp}°</span></div>
                </div>
              </div>
            )}
          </div>

          {/* Allergies */}
          <div className="rounded-lg bg-clinical-amber/5 border border-clinical-amber/20 p-3 mb-3">
            <p className="text-[10px] font-semibold text-slate-400 uppercase mb-1">Allergies</p>
            <p className="text-sm text-clinical-amber font-medium">{patient.allergies}</p>
          </div>

          {/* Clinical tasks */}
          <div className="rounded-lg bg-slate-50 p-3 mb-3">
            <p className="text-[10px] font-semibold text-slate-400 uppercase mb-2">Outstanding Clinical Tasks</p>
            <ul className="space-y-1.5">
              {patient.tasks.map((task, i) => (
                <li key={i} className="flex items-center gap-2 text-xs text-slate-600">
                  <Bell className="w-3 h-3 text-clinical-teal shrink-0" /> {task}
                </li>
              ))}
            </ul>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2">
            <button onClick={onViewPatient}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg border border-slate-300 text-slate-700 text-xs font-heading font-semibold hover:bg-slate-50">
              <ClipboardList className="w-3.5 h-3.5" /> View Patient
            </button>
            <button onClick={onRecordObservations}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg border border-slate-300 text-slate-700 text-xs font-heading font-semibold hover:bg-slate-50">
              <Activity className="w-3.5 h-3.5" /> Record Obs
            </button>
            {hasScenario && (
              <button onClick={onBeginTask}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg bg-clinical-teal text-white text-xs font-heading font-semibold hover:opacity-90">
                <Stethoscope className="w-3.5 h-3.5" /> Begin Task
              </button>
            )}
          </div>
        </>
      )}

      {isAvailable && (
        <div className="text-center py-4">
          <p className="text-sm text-slate-500">{patient.condition}</p>
        </div>
      )}
    </div>
  );
}