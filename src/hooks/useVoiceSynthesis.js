import { useState, useEffect, useRef, useCallback } from "react";
import { DEFAULT_PREFS, VOICE_PROFILES, loadPrefs, savePrefs, applyProfile, prepareSpeechText } from "@/lib/voicePreferences";
import { ukVoiceService } from "@/utils/ukVoiceSynthesizer";

/**
 * useVoiceSynthesis — speech synthesis hook.
 * Uses the device Web Speech API for every voice profile so speech cannot
 * consume cloud credits or be triggered anonymously.
 */
export function useVoiceSynthesis() {
  const [prefs, setPrefs] = useState(() => ({ ...DEFAULT_PREFS }));
  const [speaking, setSpeaking] = useState(false);
  const [supported, setSupported] = useState(false);
  const [voices, setVoices] = useState([]);
  const audioRef = useRef(null);

  useEffect(() => {
    setPrefs(loadPrefs());
    setSupported("speechSynthesis" in window);
  }, []);

  useEffect(() => {
    if (!supported) return;
    const load = () => setVoices(window.speechSynthesis.getVoices());
    load();
    window.speechSynthesis.onvoiceschanged = load;
    return () => {
      window.speechSynthesis.onvoiceschanged = null;
      if (audioRef.current) audioRef.current.pause();
      window.speechSynthesis.cancel();
    };
  }, [supported]);

  const updatePrefs = useCallback((patch) => {
    setPrefs((prev) => {
      const next = { ...prev, ...patch };
      savePrefs(next);
      return next;
    });
  }, []);

  const stop = useCallback(() => {
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    if (supported) window.speechSynthesis.cancel();
    setSpeaking(false);
  }, [supported]);

  const speakBrowser = useCallback((text, currentPrefs, profile, onStart, onEnd) => {
    if (!supported) { onEnd?.(); return; }
    setSpeaking(true);
    onStart?.();
    ukVoiceService.updateSettings({
      dialect: "london_rp",
      gender: profile.gender === "male" ? "male" : "female",
      personaId: profile.id,
      voiceName: currentPrefs.systemVoiceURI || "auto",
      rate: currentPrefs.rate,
      pitch: currentPrefs.pitch,
      volume: currentPrefs.muted ? 0 : currentPrefs.volume,
      useNeuralGeminiTts: currentPrefs.engine === "cloud",
    });
    ukVoiceService.speak(text).finally(() => {
      setSpeaking(false);
      onEnd?.();
    });
  }, [supported]);

  const speak = useCallback(async (text, { onStart, onEnd } = {}) => {
    const clean = prepareSpeechText(String(text || "").replace(/[*#`🔔]/g, "").slice(0, 5000));
    if (!clean) { onEnd?.(); return; }
    stop();
    if (prefs.muted) { onEnd?.(); return; }

    const profile = VOICE_PROFILES.find((p) => p.id === prefs.profileId) || VOICE_PROFILES[0];

    speakBrowser(clean, prefs, profile, onStart, onEnd);
  }, [prefs, stop, speakBrowser]);

  const testVoice = useCallback((sampleText) => {
    speak(sampleText || "Hello, I'm your AI voice assistant. This is how I'll sound with your current settings.");
  }, [speak]);

  const selectProfile = useCallback((profileId) => {
    const tuned = applyProfile(profileId);
    if (tuned) updatePrefs({ profileId, ...tuned });
    else updatePrefs({ profileId });
  }, [updatePrefs]);

  return { prefs, updatePrefs, selectProfile, speak, stop, speaking, voices, supported, testVoice };
}