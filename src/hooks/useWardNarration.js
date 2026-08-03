import { useState, useRef, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { loadPrefs } from "@/lib/voicePreferences";

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

  const speak = useCallback(async (text, { onEnd } = {}) => {
    const clean = String(text || "").replace(/[*#`🔔]/g, "").slice(0, 5000).trim();
    if (!clean || !enabled) { onEnd?.(); return; }
    stop();

    const prefs = loadPrefs();
    const profile = prefs?.profileId ? null : null; // placeholder — prefs carry engine

    // Cloud neural voice path (preferred when chosen in Voice Settings)
    if (prefs?.engine === "cloud") {
      const voices = { natural: "river", warm: "honey", expressive: "storm", bright: "sunny" };
      const cloudVoice = voices[prefs.profileId] || "river";
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
        audio.onerror = () => { audioRef.current = null; setSpeaking(false); onEnd?.(); };
        await audio.play();
        return;
      } catch {
        // fall back to browser TTS
      }
    }

    // Browser Web Speech API fallback
    if (!supported) { setSpeaking(false); onEnd?.(); return; }
    const u = new SpeechSynthesisUtterance(clean);
    u.rate = prefs?.rate ?? 0.95;
    u.pitch = prefs?.pitch ?? 1.0;
    u.volume = prefs?.muted ? 0 : (prefs?.volume ?? 1);
    const sv = window.speechSynthesis.getVoices();
    const match = sv.find(v => v.voiceURI === prefs?.systemVoiceURI) ||
                  sv.find(v => /en-GB/i.test(v.lang)) ||
                  sv.find(v => /^en/i.test(v.lang));
    if (match) u.voice = match;
    u.onend = () => { if (resumeTimerRef.current) { clearInterval(resumeTimerRef.current); resumeTimerRef.current = null; } setSpeaking(false); onEnd?.(); };
    u.onerror = () => { if (resumeTimerRef.current) { clearInterval(resumeTimerRef.current); resumeTimerRef.current = null; } setSpeaking(false); onEnd?.(); };
    setSpeaking(true);
    startResumeGuard();
    window.speechSynthesis.speak(u);
  }, [enabled, stop, supported, startResumeGuard]);

  useEffect(() => () => stop(), [stop]);

  return { speak, stop, speaking, enabled, toggle };
}