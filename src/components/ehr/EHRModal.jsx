import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import {
  X, Pill, ClipboardList, FlaskConical, CheckCircle, AlertTriangle,
  Stethoscope, ChevronDown, Rocket, ShieldAlert,
} from "lucide-react";
import { getMergedEHR } from "@/lib/ehrData";
import { getEhrReadState, markTabRead, getReadCount, setActiveEhrPatient } from "@/lib/ehrCompliance";
import DrugChartTab from "./DrugChartTab";
import NursingNotesTab from "./NursingNotesTab";
import LabResultsTab from "./LabResultsTab";

const TABS = [
  { key: "drugChart", label: "Drug Chart", icon: Pill },
  { key: "nursingNotes", label: "Nursing Notes", icon: ClipboardList },
  { key: "labResults", label: "Lab Results", icon: FlaskConical },
];

const CARE_PLANNING_TOOLS = [
  { label: "ABCDE Assessment", path: "/care-planning/abcde" },
  { label: "NEWS2 Scoring", path: "/care-planning/news2" },
  { label: "SMART Goals", path: "/care-planning/smart-goals" },
  { label: "SBAR Handover Workspace", path: "/care-planning/shared" },
];

export default function EHRModal({ patient, ehrOverrides, onClose, onLaunchTool }) {
  const [activeTab, setActiveTab] = useState("drugChart");
  const [readState, setReadState] = useState(() => getEhrReadState(patient?.id));
  const [showTools, setShowTools] = useState(false);
  const scrollRef = useRef(null);

  const ehr = getMergedEHR(patient?.id, ehrOverrides);
  const readCount = getReadCount(patient?.id);
  const hasAllergy = patient?.allergies && patient.allergies !== "NKDA";

  const handleReachBottom = () => {
    if (!patient?.id) return;
    markTabRead(patient.id, activeTab);
    setReadState(getEhrReadState(patient.id));
  };

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 30) {
      handleReachBottom();
    }
  };

  // If content is too short to scroll, mark as read on mount/tab change
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const timer = setTimeout(() => {
      if (el.scrollHeight <= el.clientHeight + 5) handleReachBottom();
    }, 100);
    return () => clearTimeout(timer);
  }, [activeTab]);

  const handleLaunch = (path) => {
    setActiveEhrPatient(patient?.id);
    onLaunchTool?.(path);
  };

  const tabContent = {
    drugChart: <DrugChartTab drugChart={ehr.drugChart} />,
    nursingNotes: <NursingNotesTab nursingNotes={ehr.nursingNotes} />,
    labResults: <LabResultsTab labResults={ehr.labResults} />,
  };

  return (
    <div className="fixed inset-0 z-[90] bg-[#F6F4F8] flex flex-col animate-fade-in">
      {/* Top bar — patient info + allergy banner */}
      <div className="bg-white border-b border-slate-200 shrink-0">
        <div className="px-3 sm:px-4 py-2.5 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="tlevel-3d-panel w-9 h-9 rounded-xl flex items-center justify-center shrink-0">
              <Stethoscope className="w-5 h-5 text-clinical-teal" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-heading font-bold text-slate-800 truncate">{patient?.name}</h2>
              <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono">
                <span>NHS {patient?.nhs_number}</span>
                <span>·</span>
                <span>DOB {patient?.dob}</span>
                <span>·</span>
                <span>Bed {patient?.bedDesignation}</span>
              </div>
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label="Close electronic health record" className="flex items-center gap-1 rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-heading font-semibold text-slate-600 hover:bg-slate-50 shrink-0">
            <X className="w-3.5 h-3.5" /> Close
          </button>
        </div>
        {/* Allergy banner */}
        {hasAllergy && (
          <div className="bg-clinical-red px-3 sm:px-4 py-1.5 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-white shrink-0" />
            <span className="text-xs font-heading font-bold text-white uppercase tracking-wide">ALLERGY ALERT: {patient.allergies}</span>
          </div>
        )}
        {/* Tab navigation */}
        <div className="flex border-t border-slate-100">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isRead = readState[tab.key];
            const isActive = activeTab === tab.key;
            return (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-heading font-semibold transition-all border-b-2 ${isActive ? "border-clinical-teal text-clinical-teal bg-clinical-teal/5" : "border-transparent text-slate-500 hover:bg-slate-50"}`}>
                <Icon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.label.split(" ")[0]}</span>
                {isRead ? (
                  <CheckCircle className="w-3.5 h-3.5 text-clinical-green" />
                ) : (
                  <span className="w-2 h-2 rounded-full bg-slate-300" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab content — scrollable */}
      <div ref={scrollRef} onScroll={handleScroll} className="flex-1 overflow-y-auto scrollbar-thin bg-slate-50">
        <motion.div key={activeTab} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.15 }}>
          {tabContent[activeTab]}
        </motion.div>
        {/* Scroll hint when not read */}
        {!readState[activeTab] && (
          <div className="text-center py-2 text-[10px] text-slate-400 italic">
            ↓ Scroll to bottom to mark as reviewed ↓
          </div>
        )}
        {readState[activeTab] && (
          <div className="text-center py-2 text-[10px] text-clinical-green font-semibold">
            ✓ {TABS.find((t) => t.key === activeTab)?.label} reviewed
          </div>
        )}
      </div>

      {/* Footer — read progress + launch */}
      <div className="bg-white border-t border-slate-200 px-3 sm:px-4 py-2.5 shrink-0">
        <div className="flex items-center justify-between gap-2">
          {/* Read progress */}
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              {TABS.map((t) => (
                <span key={t.key} className={`w-2 h-2 rounded-full transition-colors ${readState[t.key] ? "bg-clinical-green" : "bg-slate-300"}`} />
              ))}
            </div>
            <span className="text-[11px] font-heading font-semibold text-slate-600">{readCount}/3 reviewed</span>
            {readCount < 3 && (
              <span className="hidden sm:flex items-center gap-1 text-[10px] text-clinical-amber">
                <AlertTriangle className="w-3 h-3" /> Reading all records improves your score
              </span>
            )}
          </div>

          {/* Launch care planning */}
          <div className="relative">
            {showTools && (
              <div className="absolute bottom-full right-0 mb-1 w-56 rounded-lg border border-slate-200 bg-white shadow-xl overflow-hidden z-10">
                <div className="px-3 py-1.5 bg-slate-50 border-b border-slate-100">
                  <span className="text-[10px] font-heading font-bold text-slate-500 uppercase tracking-wide">Launch Care Planning Tool</span>
                </div>
                {CARE_PLANNING_TOOLS.map((tool) => (
                  <button key={tool.path} onClick={() => { setShowTools(false); handleLaunch(tool.path); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-clinical-teal/5 hover:text-clinical-teal transition-colors text-left">
                    <ChevronDown className="w-3 h-3 -rotate-90 text-slate-400" /> {tool.label}
                  </button>
                ))}
              </div>
            )}
            <button onClick={() => setShowTools(!showTools)}
              className="flex items-center gap-1.5 rounded-lg bg-clinical-teal text-white px-3 py-2 text-xs font-heading font-semibold hover:opacity-90">
              <Rocket className="w-3.5 h-3.5" /> Launch Care Planning
              <ChevronDown className={`w-3 h-3 transition-transform ${showTools ? "rotate-180" : ""}`} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}