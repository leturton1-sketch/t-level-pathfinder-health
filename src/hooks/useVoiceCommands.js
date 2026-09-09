import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { useVoiceSynthesis } from "@/hooks/useVoiceSynthesis";
import { matchVoiceCommand, listVoiceCommandExamples } from "@/lib/voiceCommands";

const STORAGE_KEY = "pathfinder-voice-control-enabled";

/**
 * Global, app-wide "voice control" listener. Separate from the one-shot
 * dictation mic on the Pathfinder AI chat page: this one listens
 * continuously for short command phrases ("open ward simulation", "read
 * this page", "go back"...) and turns them into navigation/utility actions
 * anywhere in the app.
 */
export function useVoiceCommands({ onToggleNav } = {}) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const synth = useVoiceSynthesis();

  const [supported] = useState(
    () => typeof window !== "undefined" && !!(window.SpeechRecognition || window.webkitSpeechRecognition)
  );
  const [enabled, setEnabled] = useState(() => {
    try { return localStorage.getItem(STORAGE_KEY) === "true"; } catch { return false; }
  });
  const [listening, setListening] = useState(false);
  const [lastHeard, setLastHeard] = useState("");

  const recognitionRef = useRef(null);
  const enabledRef = useRef(enabled);
  const onToggleNavRef = useRef(onToggleNav);
  onToggleNavRef.current = onToggleNav;

  useEffect(() => {
    enabledRef.current = enabled;
    try { localStorage.setItem(STORAGE_KEY, String(enabled)); } catch { /* voice control still works without storage */ }
  }, [enabled]);

  const announce = useCallback((message) => {
    toast({ title: "Voice control", description: message });
  }, [toast]);

  const execute = useCallback((command) => {
    if (!command) return;
    switch (command.type) {
      case "navigate":
        navigate(command.path);
        announce(`Opening ${command.label}`);
        break;
      case "back":
        navigate(-1);
        break;
      case "scroll":
        window.scrollBy({ top: command.direction * window.innerHeight * 0.8, behavior: "smooth" });
        break;
      case "read": {
        const main = document.getElementById("pf-module-content");
        const text = main?.innerText?.trim();
        if (text) synth.speak(text.slice(0, 4000));
        else announce("There's nothing on this page to read yet.");
        break;
      }
      case "stop":
        synth.stop();
        break;
      case "mute":
        synth.updatePrefs({ muted: command.value });
        if (command.value) synth.stop();
        announce(command.value ? "Educator voice muted" : "Educator voice unmuted");
        break;
      case "toggle-nav":
        onToggleNavRef.current?.();
        break;
      case "help":
        announce(`Try saying: ${listVoiceCommandExamples().join(", ")}`);
        break;
      default:
        break;
    }
  }, [navigate, announce, synth]);

  // Kept in a ref so the recognition effect below only depends on
  // enabled/supported, not on `execute` (which changes identity often).
  const executeRef = useRef(execute);
  executeRef.current = execute;

  useEffect(() => {
    if (!supported || !enabled) return undefined;
    const SpeechRecognitionCtor = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognitionCtor();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = "en-GB";
    recognition.onstart = () => setListening(true);
    recognition.onresult = (event) => {
      const transcript = event.results[event.results.length - 1][0].transcript;
      setLastHeard(transcript);
      const command = matchVoiceCommand(transcript);
      if (command) executeRef.current(command);
    };
    recognition.onerror = (event) => {
      // "no-speech"/"aborted" happen routinely during continuous listening
      // and should just retry via onend; anything else stops the feature so
      // it doesn't loop on a real error (e.g. blocked microphone).
      if (event.error !== "no-speech" && event.error !== "aborted") {
        setEnabled(false);
        announce("Voice control stopped: microphone unavailable.");
      }
    };
    recognition.onend = () => {
      setListening(false);
      if (enabledRef.current) {
        try { recognition.start(); } catch { /* already starting */ }
      }
    };
    recognitionRef.current = recognition;
    try { recognition.start(); } catch { /* ignore double-start */ }
    return () => {
      recognition.onend = null;
      recognition.onerror = null;
      recognition.stop();
    };
  }, [enabled, supported]);

  const toggle = useCallback(() => {
    setEnabled((value) => {
      const next = !value;
      if (next) announce('Voice control on. Say "help" to hear what you can say.');
      return next;
    });
  }, [announce]);

  return { supported, enabled, listening, lastHeard, toggle };
}
