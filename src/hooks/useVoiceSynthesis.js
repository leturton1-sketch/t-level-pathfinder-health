import { useState, useEffect, useRef, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { VOICE_PROFILES, loadPrefs, savePrefs, applyProfile, prepareSpeechText } from "@/lib/voicePreferences";

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

  const speakBrowser = useCallback((text, prefs, onEnd) => {
    if (!supported) { onEnd?.(); return; }
    const u = new SpeechSynthesisUtterance(text);
    u.rate = prefs.rate;
    u.pitch = prefs.pitch;
    u.volume = prefs.muted ? 0 : prefs.volume;
    const match =
      voices.find((v) => v.voiceURI === prefs.systemVoiceURI) ||
      voices.find((v) => /en-GB/i.test(v.lang) && /natural|neural|aria|sonia|ryan|libby/i.test(`${v.name} ${v.voiceURI}`)) ||
      voices.find((v) => /^en/i.test(v.lang) && /natural|neural/i.test(`${v.name} ${v.voiceURI}`)) ||
      voices.find((v) => /en-GB/i.test(v.lang)) ||
      voices.find((v) => /^en/i.test(v.lang));
    if (match) u.voice = match;
    u.onend = () => { setSpeaking(false); onEnd?.(); };
    u.onerror = () => { setSpeaking(false); onEnd?.(); };
    setSpeaking(true);
    window.speechSynthesis.speak(u);
  }, [supported, voices]);

  const speak = useCallback(async (text, { onEnd } = {}) => {
    const clean = prepareSpeechText(String(text || "").replace(/[*#`🔔]/g, "").slice(0, 5000));
    if (!clean) { onEnd?.(); return; }
    stop();
    if (prefs.muted) { onEnd?.(); return; }

    const profile = VOICE_PROFILES.find((p) => p.id === prefs.profileId) || VOICE_PROFILES[0];

    if (prefs.engine === "cloud") {
      try {
        setSpeaking(true);
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
        audio.onended = () => { audioRef.current = null; setSpeaking(false); onEnd?.(); };
        audio.onerror = () => { audioRef.current = null; setSpeaking(false); onEnd?.(); };
        await audio.play();
        return;
      } catch {
        // fall back to browser TTS
      }
    }
    speakBrowser(clean, prefs, onEnd);
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