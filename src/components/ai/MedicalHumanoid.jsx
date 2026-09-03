import React from "react";

const STATUS_LABEL = {
  speaking: "Speaking",
  listening: "Listening",
  working: "Processing",
  thinking: "Processing",
  complete: "Response ready",
  offline: "Offline",
  idle: "Clinical assistant online",
};

export default function MedicalHumanoid({ state = "idle", speaking = false, listening = false }) {
  const activeState = listening ? "listening" : speaking ? "speaking" : state;
  const statusLabel = STATUS_LABEL[activeState] || STATUS_LABEL.idle;

  return (
    <div className={`medical-humanoid medical-humanoid-${activeState}`} aria-label="Pathfinder humanoid clinical assistant">
      <div className="medical-humanoid-rim" aria-hidden="true" />
      <img
        className="medical-humanoid-art"
        src="/images/pathfinder-clinical-robot.png"
        alt="High-gloss white Pathfinder clinical robot with cyan face lights and red medical cross"
        draggable="false"
      />
      <div className="medical-hud medical-hud-left" aria-hidden="true">
        <span>PATHFINDER</span>
        <strong>CLINICAL AI</strong>
        <small>{activeState.toUpperCase()}</small>
      </div>
      <div className="medical-hud medical-hud-right" aria-label="Clinical status">
        <span>SpO₂ 98%</span>
        <span>HR 72</span>
        <span>NEWS2 0</span>
      </div>
      <div className="medical-status-pill" role="status" aria-live="polite">
        <span className="medical-status-dot" />
        {statusLabel}
      </div>
    </div>
  );
}
