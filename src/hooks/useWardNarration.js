import { useState, useRef, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { getVoiceProfile, loadPrefs, prepareSpeechText } from "@/lib/voicePreferences";

/**
 * useWardNarration — reliable clinical narration during ward simulation.
 * Prefers Base44 GenerateSpeech (neural, no key needed) for natural voice,
 * falls back to Web Speech API. Includes the Chrome "paused" bug fix.
 */
export function useWardNarration() {
  const [speaking, setSpeaking] = useState(false);
  const [enabled, setEnabled] = useState(() => {
    try { return JSON.parse(localStorage.getItem("ward_narration_on") ?? "true"); }
    catch { return true; }
  });
  const audioRef = useRef(null);
  const resumeTimerRef = useRef(null);
  const supported = typeof window !== "undefined" && "speechSynthesis" in window;

  const toggle = useCallback(() => {
    setEnabled(prev => {
      const next = !prev;
      localStorage.setItem("ward_narration_on", JSON.stringify(next));
      if (!next) stop();
      return next;
    });
  }, []);

  const stop = useCallback(() => {
    if (resumeTimerRef.current) { clearInterval(resumeTimerRef.current); resumeTimerRef.current = null; }
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    if (supported) window.speechSynthesis.cancel();
    setSpeaking(false);
  }, [supported]);

  // Chrome bug: long utterances pause after ~15s — resume periodically.
  const startResumeGuard = useCallback(() => {
    if (!supported) return;
    if (resumeTimerRef.current) clearInterval(resumeTimerRef.current);
    resumeTimerRef.current = setInterval(() => {
      if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
        // no-op keeps the queue alive
      } else if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }
    }, 10000);
  }, [supported]);

  const speakBrowser = useCallback((clean, prefs, onEnd) => {
    if (!supported) { setSpeaking(false); onEnd?.(); return; }
    const profile = getVoiceProfile(prefs?.profileId);
    const u = new SpeechSynthesisUtterance(clean);
    u.rate = prefs?.rate ?? profile.rate;
    u.pitch = prefs?.pitch ?? profile.pitch;
    u.volume = prefs?.muted ? 0 : (prefs?.volume ?? 1);
    const voices = window.speechSynthesis.getVoices();
    const patterns = profile.browserVoicePatterns || [];
    const pattern = new RegExp(patterns.join("|"), "i");
    const match = voices.find((voice) => voice.voiceURI === prefs?.systemVoiceURI) ||
      voices.find((voice) => /^en-GB/i.test(voice.lang) && pattern.test(`${voice.name} ${voice.voiceURI}`)) ||
      voices.find((voice) => /^en/i.test(voice.lang) && pattern.test(`${voice.name} ${voice.voiceURI}`)) ||
      voices.find((voice) => /^en-GB/i.test(voice.lang)) ||
      voices.find((voice) => /^en/i.test(voice.lang));
    if (match) u.voice = match;
    u.onend = () => { setSpeaking(false); onEnd?.(); };
    u.onerror = () => { setSpeaking(false); onEnd?.(); };
    setSpeaking(true);
    startResumeGuard();
    window.speechSynthesis.speak(u);
  }, [supported, startResumeGuard]);

  const speak = useCallback(async (text, { onEnd } = {}) => {
    const clean = prepareSpeechText(String(text || "").replace(/[*#`🔔]/g, "").slice(0, 5000));
    if (!clean || !enabled) { onEnd?.(); return; }
    stop();

    const prefs = loadPrefs();

    // Cloud neural voice path (preferred when chosen in Voice Settings)
    if (prefs?.engine === "cloud") {
      const cloudVoice = getVoiceProfile(prefs.profileId).cloudVoice;
      let browserFallbackStarted = false;
      const fallbackToBrowser = () => {
        if (browserFallbackStarted) return;
        browserFallbackStarted = true;
        speakBrowser(clean, prefs, onEnd);
      };
      try {
        setSpeaking(true);
        const res = await base44.integrations.Core.GenerateSpeech({
          text: clean,
          voice: cloudVoice,
          language_code: "en",
        });
        const url = res?.url;
        if (!url) throw new Error("no url");
        const audio = new Audio(url);
        audioRef.current = audio;
        audio.volume = prefs.volume ?? 1;
        audio.onended = () => { audioRef.current = null; setSpeaking(false); onEnd?.(); };
        audio.onerror = () => {
          audioRef.current = null;
          fallbackToBrowser();
        };
        await audio.play();
        return;
      } catch {
        fallbackToBrowser();
        return;
      }
    }

    // Browser Web Speech API fallback
    speakBrowser(clean, prefs, onEnd);
  }, [enabled, stop, supported, speakBrowser]);

  useEffect(() => () => stop(), [stop]);

  return { speak, stop, speaking, enabled, toggle };
}