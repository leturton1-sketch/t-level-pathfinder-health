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
  const turnRef = useRef({ active: false, startX: 0, startRotation: 0 });
  const [distorting, setDistorting] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [isTurning, setIsTurning] = useState(false);
  const normalisedVoiceState = voiceState === "offline" ? "unresponsive" : voiceState;
  const connectedState = speaking ? "speaking" : normalisedVoiceState;
  const activeCue = LABELS[cue] ? cue : "neutral";
  const stateLabel = connectedState === "speaking"
    ? "Speaking with you"
    : connectedState === "listening"
      ? "Listening to your question"
      : connectedState === "unresponsive"
        ? "Connection interrupted — awaiting recovery"
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

  const beginTurn = (event) => {
    turnRef.current = { active: true, startX: event.clientX, startRotation: rotation };
    setIsTurning(true);
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };

  const continueTurn = (event) => {
    if (!turnRef.current.active) return;
    const nextRotation = turnRef.current.startRotation + ((event.clientX - turnRef.current.startX) * 0.8);
    setRotation(((nextRotation % 360) + 360) % 360);
  };

  const finishTurn = (event) => {
    turnRef.current.active = false;
    setIsTurning(false);
    try { event.currentTarget.releasePointerCapture?.(event.pointerId); } catch {}
  };

  const handleTurnKey = (event) => {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      setRotation((value) => (value + 345) % 360);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      setRotation((value) => (value + 15) % 360);
    } else if (event.key === "Home") {
      event.preventDefault();
      setRotation(0);
    }
  };

  return (
    <section
      className={`educator-stage educator-cartoon-stage is-${connectedState} cue-${activeCue} ${speaking ? "is-speaking" : ""} ${distorting ? "is-distorting" : ""}`}
      aria-label="Clinical Educator"
    >
      <div className="educator-video">
        <div className="educator-video-viewport">
          <div className="educator-character-platform" aria-hidden="true" />
          <div
            className={`educator-character-turntable ${isTurning ? "is-turning" : ""}`}
            style={{ "--educator-rotation": `${rotation}deg` }}
            onPointerDown={beginTurn}
            onPointerMove={continueTurn}
            onPointerUp={finishTurn}
            onPointerCancel={finishTurn}
            onKeyDown={handleTurnKey}
            role="slider"
            tabIndex={0}
            aria-label="Rotate the Clinical Educator"
            aria-valuemin={0}
            aria-valuemax={359}
            aria-valuenow={Math.round(rotation)}
            aria-valuetext={`${Math.round(rotation)} degrees`}
          >
            <img
              key={`${activeCue}-${cueKey}`}
              className="educator-character-model"
              src="/pathfinder-educator/clinical-educator-cartoon.webp"
              alt="Cartoon Clinical Educator standing ready in blue scrubs with facial, finger rune and owl tattoos"
              draggable={false}
            />
            <img
              className="educator-character-echo"
              src="/pathfinder-educator/clinical-educator-cartoon.webp"
              alt=""
              aria-hidden="true"
              draggable={false}
            />
            <div className="educator-eye-lights" aria-hidden="true"><span /><span /></div>
            <div className="educator-voice-aura" aria-hidden="true" />
            <div className="educator-hologram-noise" aria-hidden="true" />
            <div className="educator-hologram-slice educator-hologram-slice-a" aria-hidden="true" />
            <div className="educator-hologram-slice educator-hologram-slice-b" aria-hidden="true" />
            <div className="educator-tattoo-lights" aria-hidden="true">
              <span className="tattoo-light tattoo-light-neck" />
              <span className="tattoo-light tattoo-light-left" />
              <span className="tattoo-light tattoo-light-right" />
              <span className="tattoo-light tattoo-light-owl" />
            </div>
          </div>
          <button type="button" className="educator-turn-reset" onClick={() => setRotation(0)}>
            <span aria-hidden="true">↻</span> Drag to rotate · {Math.round(rotation)}°
          </button>
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
