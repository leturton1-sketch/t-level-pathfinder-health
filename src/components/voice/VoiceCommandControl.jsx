import { useEffect } from "react";
import { Mic, MicOff } from "lucide-react";
import { useVoiceCommands } from "@/hooks/useVoiceCommands";

/**
 * Global "voice control" toggle for the app header. Deliberately generic
 * (mic icon, plain "Voice control" label) rather than another Pathfinder AI
 * entry point — the two are separate features that happen to share speech
 * infrastructure.
 */
export default function VoiceCommandControl({ onToggleNav }) {
  const { supported, enabled, listening, toggle } = useVoiceCommands({ onToggleNav });

  // Surface listening state to assistive tech without a visible layout shift.
  useEffect(() => {
    document.body.dataset.voiceControl = enabled ? (listening ? "listening" : "on") : "off";
  }, [enabled, listening]);

  if (!supported) return null;

  return (
    <button
      type="button"
      className="pf-icon-button pf-voice-control"
      aria-pressed={enabled}
      aria-label={enabled ? "Turn off voice control" : "Turn on voice control"}
      title={enabled ? (listening ? "Voice control on – listening" : "Voice control on") : "Voice control"}
      onClick={toggle}
    >
      {enabled ? <Mic size={20} /> : <MicOff size={20} />}
      <span aria-live="polite" className="sr-only">
        {enabled ? (listening ? "Voice control on, listening" : "Voice control on") : "Voice control off"}
      </span>
    </button>
  );
}
