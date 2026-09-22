import { useState, useRef, useEffect, useCallback } from "react";
import { loadPrefs, prepareSpeechText } from "@/lib/voicePreferences";

/**
 * useWardNarration — reliable clinical narration during ward simulation.
 * Uses the device Web Speech API so narration cannot consume cloud credits.
 * Includes the Chrome "paused" bug fix.
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
    const clean = prepareSpeechText(String(text || "").replace(/[*#`🔔]/g, "").slice(0, 5000));
    if (!clean || !enabled) { onEnd?.(); return; }
    stop();

    const prefs = loadPrefs();

    // Browser Web Speech API keeps narration local and avoids billable cloud calls.
    if (!supported) { setSpeaking(false); onEnd?.(); return; }
    const u = new SpeechSynthesisUtterance(clean);
    u.rate = prefs?.rate ?? 0.95;
    u.pitch = prefs?.pitch ?? 1.0;
    u.volume = prefs?.muted ? 0 : (prefs?.volume ?? 1);
    const sv = window.speechSynthesis.getVoices();
    const match = sv.find(v => v.voiceURI === prefs?.systemVoiceURI) ||
                  sv.find(v => /en-GB/i.test(v.lang) && /natural|neural|aria|sonia|ryan|libby/i.test(`${v.name} ${v.voiceURI}`)) ||
                  sv.find(v => /^en/i.test(v.lang) && /natural|neural/i.test(`${v.name} ${v.voiceURI}`)) ||
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