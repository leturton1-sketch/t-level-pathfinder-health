import { useState, useEffect, useRef, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { VOICE_PROFILES, loadPrefs, savePrefs, applyProfile, prepareSpeechText } from "@/lib/voicePreferences";
import { ukVoiceService } from "@/utils/ukVoiceSynthesizer";

/**
 * useVoiceSynthesis — speech synthesis hook.
 * Engine "cloud" uses Base44 GenerateSpeech (neural voices, no API key).
 * Engine "browser" uses the Web Speech API with the chosen system voice.
 * Cloud failures fall back to browser TTS automatically.
 */
export function useVoiceSynthesis() {
  const [prefs, setPrefs] = useState(loadPrefs);
  const [speaking, setSpeaking] = useState(false);
  const [supported] = useState(() => typeof window !== "undefined" && "speechSynthesis" in window);
  const [voices, setVoices] = useState([]);
  const audioRef = useRef(null);

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

    if (prefs.engine === "cloud") {
      try {
        const res = await base44.integrations.Core.GenerateSpeech({
          text: clean,
          voice: profile.cloudVoice,
          language_code: "en",
        });
        const url = res?.url;
        if (!url) throw new Error("no audio url");
        const audio = new Audio(url);
        audioRef.current = audio;
        audio.volume = prefs.volume;
        // Fire onStart only when audio actually begins playing, so the
        // waveform animation aligns to real playback duration (not the
        // cloud-generation latency).
        audio.onplay = () => { setSpeaking(true); onStart?.(); };
        audio.onended = () => { audioRef.current = null; setSpeaking(false); onEnd?.(); };
        audio.onerror = () => { audioRef.current = null; setSpeaking(false); onEnd?.(); };
        await audio.play();
        return;
      } catch {
        // fall back to browser TTS
      }
    }
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