import React from "react";

export default function MedicalHumanoid({ state = "idle", speaking = false, listening = false }) {
  const activeState = listening ? "listening" : speaking ? "speaking" : state;
  return (
    <div className={`medical-humanoid medical-humanoid-${activeState}`} aria-label="Pathfinder humanoid clinical assistant">
      <div className="medical-hud medical-hud-left">
        <span>PATHFINDER</span>
        <strong>CLINICAL AI</strong>
        <small>{activeState.toUpperCase()}</small>
      </div>
      <div className="medical-hud medical-hud-right">
        <span>SpO₂ 98%</span>
        <span>HR 72</span>
        <span>NEWS2 0</span>
      </div>
      <div className="medical-humanoid-rim" />
      <div className="medical-head-wrap">
        <div className="medical-neck-joint medical-neck-joint-left" />
        <div className="medical-neck-joint medical-neck-joint-right" />
        <div className="medical-head">
          <div className="medical-helmet-highlight" />
          <div className="medical-visor">
            <span className="medical-eye medical-eye-left" />
            <span className="medical-eye medical-eye-right" />
            <span className="medical-mouth" />
          </div>
        </div>
      </div>
      <div className="medical-torso">
        <div className="medical-shoulder medical-shoulder-left"><span /></div>
        <div className="medical-shoulder medical-shoulder-right"><span /></div>
        <div className="medical-chest">
          <div className="medical-chest-panel medical-chest-panel-left" />
          <div className="medical-chest-panel medical-chest-panel-right" />
          <div className="medical-cross" aria-hidden="true"><span /><span /></div>
          <div className="medical-core-line" />
        </div>
      </div>
      <div className="medical-status-pill">
        <span className="medical-status-dot" />
        {activeState === "speaking" ? "Speaking" : activeState === "listening" ? "Listening" : activeState === "working" || activeState === "thinking" ? "Processing" : "Clinical assistant online"}
      </div>
    </div>
  );
}
