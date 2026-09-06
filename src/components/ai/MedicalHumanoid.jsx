import React from "react";

const STATUS_LABEL = {
  speaking: "Clinical educator speaking",
  listening: "Listening",
  working: "Processing",
  thinking: "Processing",
  complete: "Response ready",
  offline: "Assistant offline",
  idle: "Clinical educator online",
};

export default function MedicalHumanoid({ state = "idle", speaking = false, listening = false }) {
  const activeState = listening ? "listening" : speaking ? "speaking" : state;
  const statusLabel = STATUS_LABEL[activeState] || STATUS_LABEL.idle;

  return (
    <div className={`medical-humanoid medical-humanoid-${activeState}`} aria-label="Pathfinder humanoid clinical assistant">
      <div className="medical-humanoid-rim" aria-hidden="true" />
      <img
        className="medical-humanoid-art"
        src="/images/pathfinder-clinical-robot-refined.jpg"
        alt="Friendly high-gloss white Pathfinder clinical robot with integrated shoulders, sensor panels and illuminated cyan face"
        draggable="false"
      />

      <div className="medical-hud medical-hud-left">
        <span>PATHFINDER</span>
        <strong>CLINICAL AI</strong>
        <small>{activeState.toUpperCase()}</small>
      </div>

      <div className="medical-hud medical-hud-vitals" aria-label="Current simulated clinical observations">
        <div><span className="medical-vital-pip" /><small>SpO₂</small><strong>98%</strong></div>
        <div><span className="medical-vital-pip" /><small>HR</small><strong>72</strong></div>
        <div><span className="medical-vital-pip" /><small>NEWS2</small><strong>0</strong></div>
        <svg className="medical-waveform" viewBox="0 0 180 30" role="img" aria-label="Live clinical waveform">
          <path className="medical-waveform-guide" d="M0 16 H180" />
          <path className="medical-waveform-trace" pathLength="1" d="M0 16 H36 L43 14 L49 17 L56 4 L64 25 L72 11 L80 16 H118 L125 14 L131 17 L138 4 L146 25 L154 11 L162 16 H180" />
        </svg>
      </div>

      <div className="medical-status-pill" role="status" aria-live="polite">
        <span className="medical-status-dot" />
        {statusLabel}
        <span className="medical-audio-bars" aria-hidden="true"><i /><i /><i /><i /></span>
      </div>
    </div>
  );
}
