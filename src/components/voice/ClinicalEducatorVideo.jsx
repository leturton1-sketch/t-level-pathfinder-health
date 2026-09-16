import React, { useEffect, useRef, useState } from "react";
import AudioVisualizer from "@/components/voice/AudioVisualizer";

const LABELS = {
  first_use: "Welcome to Pathfinder AI",
  hello: "Hello — I’m listening",
  thinking: "Thinking through your question",
  working: "Preparing your clinical learning response",
  good_work: "Good work",
  task_complete: "Task complete",
  neutral: "Clinical Educator ready",
};

export default function ClinicalEducatorVideo({ cue = "neutral", cueKey = 0, speaking = false, voiceState = "idle" }) {
  const distortionTimerRef = useRef(null);
  const [distorting, setDistorting] = useState(false);
  const connectedState = speaking ? "speaking" : voiceState;
  const activeCue = LABELS[cue] ? cue : "neutral";
  const stateLabel = connectedState === "speaking"
    ? "Speaking with you"
    : connectedState === "listening"
      ? "Listening to your question"
      : connectedState === "working" || connectedState === "voicing"
        ? "Preparing your clinical learning response"
        : LABELS[activeCue];

  useEffect(() => {
    if (activeCue === "neutral") return undefined;
    window.clearTimeout(distortionTimerRef.current);
    setDistorting(true);
    distortionTimerRef.current = window.setTimeout(() => setDistorting(false), 760);
    return () => window.clearTimeout(distortionTimerRef.current);
  }, [activeCue, cueKey]);

  useEffect(() => () => window.clearTimeout(distortionTimerRef.current), []);

  return (
    <section
      className={`educator-stage educator-cartoon-stage is-${connectedState} cue-${activeCue} ${speaking ? "is-speaking" : ""} ${distorting ? "is-distorting" : ""}`}
      aria-label="Clinical Educator"
    >
      <div className="educator-video">
        <div className="educator-video-viewport">
          <div className="educator-character-platform" aria-hidden="true" />
          <img
            key={`${activeCue}-${cueKey}`}
            className="educator-character-model"
            src="/pathfinder-educator/clinical-educator-cartoon.webp"
            alt="Cartoon Clinical Educator standing ready in blue scrubs"
            draggable={false}
          />
          <div className="educator-voice-aura" aria-hidden="true" />
          <div className="educator-hologram-noise" aria-hidden="true" />
          <div className="educator-hologram-slice educator-hologram-slice-a" aria-hidden="true" />
          <div className="educator-hologram-slice educator-hologram-slice-b" aria-hidden="true" />
          <div className="educator-tattoo-lights" aria-hidden="true">
            <span className="tattoo-light tattoo-light-neck" />
            <span className="tattoo-light tattoo-light-left" />
            <span className="tattoo-light tattoo-light-right" />
          </div>
          <div className="educator-voice-visualizer">
            <AudioVisualizer state={connectedState} bars={18} />
          </div>
        </div>
        <div className="educator-video-status" role="status" aria-live="polite">
          <span className="educator-video-live" aria-hidden="true" />
          <div>
            <strong>Clinical Educator <span className="educator-voice-linked">Voice linked</span></strong>
            <p>{stateLabel}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
