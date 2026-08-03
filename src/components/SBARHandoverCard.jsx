import { useState, useEffect, useRef } from "react";
import { speakAsCharacter, stopCharacterSpeech } from "@/lib/sbarDatabase";
import { Volume2, Square, User, FileText } from "lucide-react";

const SECTIONS = [
  { key: "situation", label: "S — Situation", color: "clinical-teal" },
  { key: "background", label: "B — Background", color: "clinical-amber" },
  { key: "assessment", label: "A — Assessment", color: "clinical-red" },
  { key: "recommendation", label: "R — Recommendation", color: "clinical-green" },
];

const ACCENT = {
  "clinical-teal": "border-l-clinical-teal",
  "clinical-amber": "border-l-clinical-amber",
  "clinical-red": "border-l-clinical-red",
  "clinical-green": "border-l-clinical-green",
};

/**
 * SBARHandoverCard
 * Renders a single celebrity patient's SBAR handover card with per-section
 * Play controls that speak using the character's custom Web Speech API voice
 * profile.
 */
export default function SBARHandoverCard({ patient, voiceOn, onToggleVoice }) {
  const [playing, setPlaying] = useState(null); // section key currently speaking
  const cancelRef = useRef(false);

  useEffect(() => {
    return () => { cancelRef.current = true; stopCharacterSpeech(); };
  }, []);

  const play = (sectionKey) => {
    if (!voiceOn) { onToggleVoice?.(); return; }
    if (playing === sectionKey) { stop(); return; }
    cancelRef.current = false;
    setPlaying(sectionKey);
    speakAsCharacter(patient, patient.sbar[sectionKey], { onEnd: () => {
      if (!cancelRef.current) setPlaying(null);
    }});
  };

  const stop = () => {
    cancelRef.current = true;
    stopCharacterSpeech();
    setPlaying(null);
  };

  const stopAll = () => stop();

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-200">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-full bg-clinical-teal/15 flex items-center justify-center shrink-0">
            <User className="w-5 h-5 text-clinical-teal" />
          </div>
          <div className="min-w-0">
            <h3 className="font-heading font-bold text-sm text-slate-800 truncate">{patient.name}</h3>
            <p className="text-[11px] text-slate-500 truncate">{patient.age} yrs · {patient.pronouns} · Bed {patient.bed}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => onToggleVoice?.()}
            className={`flex items-center gap-1 rounded-lg px-2 py-1.5 text-[11px] font-heading font-semibold border transition-colors ${voiceOn ? "bg-clinical-teal text-white border-clinical-teal" : "bg-white border-slate-300 text-slate-500 hover:bg-slate-50"}`}
          >
            {voiceOn ? <Volume2 className="w-3.5 h-3.5" /> : <Square className="w-3.5 h-3.5" />}
            {voiceOn ? "VOICE ON" : "VOICE OFF"}
          </button>
        </div>
      </div>

      {/* Condition */}
      <div className="px-4 py-2 bg-white border-b border-slate-100">
        <p className="text-xs text-slate-600 leading-snug">
          <span className="font-semibold text-slate-700">Condition: </span>{patient.condition}
        </p>
        <p className="text-[10px] text-slate-400 mt-1 italic">Voice profile: {patient.voice.label}</p>
      </div>

      {/* SBAR sections */}
      <div className="divide-y divide-slate-100">
        {SECTIONS.map((sec) => (
          <div key={sec.key} className="px-4 py-2.5">
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className={`text-[11px] font-heading font-bold px-2 py-0.5 rounded border-l-4 ${ACCENT[sec.color]} bg-slate-50 text-slate-700`}>
                {sec.label}
              </span>
              <button
                onClick={() => play(sec.key)}
                disabled={!voiceOn && false}
                className={`flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-heading font-semibold border transition-colors ${playing === sec.key ? "bg-clinical-red text-white border-clinical-red" : "bg-white border-slate-300 text-slate-500 hover:bg-slate-50 hover:text-clinical-teal"}`}
              >
                {playing === sec.key ? <><Square className="w-3 h-3" /> Stop</> : <><Volume2 className="w-3 h-3" /> Play</>}
              </button>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed pl-1">{patient.sbar[sec.key]}</p>
          </div>
        ))}
      </div>

      {playing && (
        <div className="px-4 py-2 bg-clinical-teal/5 border-t border-slate-100">
          <button onClick={stopAll} className="flex items-center gap-1.5 text-[11px] font-heading font-semibold text-clinical-red">
            <Square className="w-3 h-3" /> Stop all narration
          </button>
        </div>
      )}
    </div>
  );
}