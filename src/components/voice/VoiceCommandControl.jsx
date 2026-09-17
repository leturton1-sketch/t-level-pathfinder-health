import { useEffect, useState } from "react";
import { Mic, MicOff } from "lucide-react";

/**
 * The header microphone is a remote control for the persistent Pathfinder
 * Clinical Educator. Both controls now share one recognition session and
 * one response path, avoiding competing microphones and duplicate notices.
 */
export default function VoiceCommandControl() {
  const [supported, setSupported] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [listening, setListening] = useState(false);

  useEffect(() => {
    setSupported(Boolean(window.SpeechRecognition || window.webkitSpeechRecognition));
    const handleState = (event) => {
      setEnabled(Boolean(event.detail?.enabled));
      setListening(Boolean(event.detail?.listening));
    };
    window.addEventListener("pathfinder:ai-voice-state", handleState);
    return () => window.removeEventListener("pathfinder:ai-voice-state", handleState);
  }, []);

  useEffect(() => {
    document.body.dataset.voiceControl = enabled ? (listening ? "listening" : "on") : "off";
  }, [enabled, listening]);

  if (!supported) return null;

  return (
    <button
      type="button"
      className="pf-icon-button pf-voice-control"
      aria-pressed={enabled}
      aria-label={enabled ? "Turn off Clinical Educator voice control" : "Turn on Clinical Educator voice control"}
      title={enabled ? (listening ? "Clinical Educator is listening" : "Clinical Educator voice control on") : "Start Clinical Educator voice control"}
      onClick={() => window.dispatchEvent(new CustomEvent("pathfinder:ai-voice-toggle"))}
    >
      {enabled ? <Mic size={20} /> : <MicOff size={20} />}
      <span aria-live="polite" className="sr-only">
        {enabled ? (listening ? "Clinical Educator voice control on, listening" : "Clinical Educator voice control on") : "Clinical Educator voice control off"}
      </span>
    </button>
  );
}
