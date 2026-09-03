import React from "react";

export default function MedicalHumanoid({ state = "idle", speaking = false, listening = false }) {
  const activeState = listening ? "listening" : speaking ? "speaking" : state;

  return (
    <div
      className={`medical-humanoid medical-humanoid-${activeState}`}
      aria-label="Pathfinder humanoid clinical assistant"
    >
      <div className="medical-humanoid-rim" aria-hidden="true" />
      <img
        className="medical-humanoid-art"
        src="/images/pathfinder-clinical-robot.png"
        alt="High-gloss white Pathfinder clinical robot with its head joined to the torso by a brushed-metal neck"
        draggable="false"
      />
    </div>
  );
}
