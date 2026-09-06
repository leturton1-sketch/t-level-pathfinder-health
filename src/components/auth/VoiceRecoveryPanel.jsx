import { useEffect, useRef, useState } from "react";
import { Mic, MicOff, ShieldCheck, ShieldX, Waves, Save, RotateCcw } from "lucide-react";
import { base44 } from "@/api/base44Client";

const SpeechRecognitionCtor = () => window.SpeechRecognition || window.webkitSpeechRecognition;

export default function VoiceRecoveryPanel({
  mode = "verify",
  username = "",
  pin = "",
  user = null,
  onSuccess,
  onCancel,
}) {
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const rafRef = useRef(null);
  const recognitionRef = useRef(null);
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");
  const [personalMessage, setPersonalMessage] = useState("");
  const [setupPin, setSetupPin] = useState(pin || "");

  useEffect(() => () => stopListening(), []);

  const drawIdleWave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = Math.max(1, Math.floor(rect.width * dpr));
    const height = Math.max(1, Math.floor(rect.height * dpr));
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, width, height);
    const gradient = ctx.createLinearGradient(0, 0, width, 0);
    if (status === "matched") {
      gradient.addColorStop(0, "#16a34a");
      gradient.addColorStop(1, "#22c55e");
    } else if (status === "denied") {
      gradient.addColorStop(0, "#ef4444");
      gradient.addColorStop(1, "#f43f5e");
    } else {
      gradient.addColorStop(0, "#f43f5e");
      gradient.addColorStop(0.5, "#c026d3");
      gradient.addColorStop(1, "#6d28d9");
    }
    ctx.strokeStyle = gradient;
    ctx.lineWidth = 4 * dpr;
    ctx.lineCap = "round";
    const bars = 34;
    const centre = height / 2;
    const spacing = width / (bars + 1);
    for (let i = 1; i <= bars; i += 1) {
      const distance = Math.abs(i - (bars + 1) / 2) / (bars / 2);
      const envelope = Math.max(0.2, 1 - distance * 0.72);
      const variation = 0.45 + 0.55 * Math.abs(Math.sin(i * 1.37));
      const barHeight = Math.max(8 * dpr, height * 0.62 * envelope * variation);
      const x = spacing * i;
      ctx.beginPath();
      ctx.moveTo(x, centre - barHeight / 2);
      ctx.lineTo(x, centre + barHeight / 2);
      ctx.stroke();
    }
  };

  useEffect(() => {
    if (!listening) drawIdleWave();
  }, [listening, status]);

  const drawWave = () => {
    const canvas = canvasRef.current;
    const analyser = analyserRef.current;
    if (!canvas || !analyser) return;
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = Math.max(1, Math.floor(rect.width * dpr));
    const height = Math.max(1, Math.floor(rect.height * dpr));
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
    const ctx = canvas.getContext("2d");
    const data = new Uint8Array(analyser.fftSize);
    analyser.getByteTimeDomainData(data);
    ctx.clearRect(0, 0, width, height);
    ctx.lineWidth = 3 * dpr;
    const gradient = ctx.createLinearGradient(0, 0, width, 0);
    if (status === "matched") {
      gradient.addColorStop(0, "#16a34a");
      gradient.addColorStop(1, "#22c55e");
    } else if (status === "denied") {
      gradient.addColorStop(0, "#ef4444");
      gradient.addColorStop(1, "#f43f5e");
    } else {
      gradient.addColorStop(0, "#f43f5e");
      gradient.addColorStop(0.5, "#c026d3");
      gradient.addColorStop(1, "#6d28d9");
    }
    ctx.strokeStyle = gradient;
    ctx.beginPath();
    const slice = width / data.length;
    let x = 0;
    for (let i = 0; i < data.length; i += 1) {
      const v = data[i] / 128;
      const y = (v * height) / 2;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      x += slice;
    }
    ctx.stroke();
    rafRef.current = requestAnimationFrame(drawWave);
  };

  const stopListening = () => {
    try { recognitionRef.current?.stop?.(); } catch {}
    recognitionRef.current = null;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    analyserRef.current = null;
    setListening(false);
  };

  const speak = (text) => {
    try {
      window.speechSynthesis?.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95;
      utterance.pitch = 1;
      window.speechSynthesis?.speak(utterance);
    } catch {}
  };

  const submitTranscript = async (value) => {
    const phrase = String(value || "").trim();
    if (!phrase) return;
    setStatus("checking");
    setMessage("Checking spoken recovery phrase…");
    try {
      if (mode === "enrol") {
        const result = await base44.functions.invoke("enrolSpokenRecovery", {
          username: String(username || user?.username || "").trim().toLowerCase(),
          pin: (pin || setupPin).trim(),
          phrase,
          personal_message: personalMessage.trim(),
        });
        const data = result?.data ?? result;
        if (!data?.enrolled) throw new Error(data?.reason || "Unable to enrol spoken recovery.");
        setStatus("matched");
        setMessage("Spoken recovery setup complete.");
        speak(`Voice recovery setup complete. Welcome ${data.user?.full_name || user?.full_name || ""}. Your role is ${String(data.user?.role || user?.role || "user").replaceAll("_", " ")}. Access granted.`);
        setTimeout(() => onSuccess?.(data.user || user), 900);
      } else {
        const result = await base44.functions.invoke("verifySpokenRecovery", {
          username: String(username || "").trim().toLowerCase(),
          phrase,
        });
        const data = result?.data ?? result;
        if (!data?.granted) throw new Error(data?.reason || "Spoken recovery phrase did not match.");
        setStatus("matched");
        setMessage("Phrase matched. Access granted.");
        const role = String(data.user?.role || "user").replaceAll("_", " ");
        const personal = data.user?.voice_personal_message ? ` ${data.user.voice_personal_message}` : " Your Pathfinder workspace is ready.";
        speak(`Welcome ${data.user?.full_name || ""}. Your role is ${role}.${personal} Access granted.`);
        setTimeout(() => onSuccess?.(data.user), 1100);
      }
    } catch (error) {
      setStatus("denied");
      setMessage(error?.message || "Access denied.");
      speak("Access denied. The spoken recovery phrase did not match. Please use your standard sign in method or try again.");
    }
  };

  const startListening = async () => {
    const Recognition = SpeechRecognitionCtor();
    if (!Recognition) {
      setStatus("denied");
      setMessage("Speech recognition is not supported in this browser. Use Chrome or Edge, or use your PIN login.");
      return;
    }
    try {
      setTranscript("");
      setStatus("listening");
      setMessage(mode === "enrol" ? "Say your recovery phrase clearly." : "Say your recovery phrase.");
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
      const audioContext = new AudioContextCtor();
      audioContextRef.current = audioContext;
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 512;
      analyser.smoothingTimeConstant = 0.8;
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);
      analyserRef.current = analyser;
      setListening(true);
      drawWave();

      const recognition = new Recognition();
      recognition.lang = "en-GB";
      recognition.interimResults = true;
      recognition.continuous = false;
      recognition.maxAlternatives = 1;
      recognition.onresult = (event) => {
        let finalText = "";
        let interim = "";
        for (let i = event.resultIndex; i < event.results.length; i += 1) {
          const text = event.results[i][0]?.transcript || "";
          if (event.results[i].isFinal) finalText += text; else interim += text;
        }
        const next = (finalText || interim).trim();
        if (next) setTranscript(next);
        if (finalText.trim()) {
          stopListening();
          submitTranscript(finalText.trim());
        }
      };
      recognition.onerror = (event) => {
        stopListening();
        setStatus("denied");
        setMessage(event?.error === "not-allowed" ? "Microphone permission was denied." : "Voice capture failed. Please try again.");
      };
      recognition.onend = () => {
        if (listening) stopListening();
      };
      recognitionRef.current = recognition;
      recognition.start();
    } catch (error) {
      stopListening();
      setStatus("denied");
      setMessage(error?.message || "Microphone unavailable.");
    }
  };

  const waveClass = status === "matched"
    ? "border-emerald-300 bg-emerald-50 shadow-[0_16px_40px_-28px_rgba(16,185,129,.55)]"
    : status === "denied"
      ? "border-rose-300 bg-rose-50 shadow-[0_16px_40px_-28px_rgba(244,63,94,.5)]"
      : "border-fuchsia-200 bg-gradient-to-br from-rose-50 via-white to-fuchsia-50 shadow-[0_18px_45px_-30px_rgba(217,70,239,.45)]";

  return (
    <div className="space-y-4">
      <div className={`rounded-2xl border p-4 transition-colors ${waveClass}`}>
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-slate-900">
            <Waves className="h-5 w-5" />
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em]">{mode === "enrol" ? "Spoken Recovery Setup" : "Backup Voice Access"}</p>
              <p className="text-[11px] text-slate-500">No recording or biometric voiceprint is stored.</p>
            </div>
          </div>
          {status === "matched" && <ShieldCheck className="h-6 w-6 text-emerald-400" />}
          {status === "denied" && <ShieldX className="h-6 w-6 text-rose-400" />}
        </div>
        <canvas ref={canvasRef} className="h-28 w-full rounded-xl border border-fuchsia-100 bg-white/80 shadow-inner" aria-label="Voice recovery waveform" />
        <p className={`mt-3 min-h-5 text-center text-xs font-bold ${status === "matched" ? "text-emerald-600" : status === "denied" ? "text-rose-600" : "text-fuchsia-700"}`}>
          {message || "Ready"}
        </p>
        {transcript && <p className="mt-2 rounded-lg border border-fuchsia-100 bg-white/80 px-3 py-2 text-center text-xs text-slate-700">Heard: “{transcript}”</p>}
      </div>

      {mode === "enrol" && !pin && (
        <label className="block text-xs font-bold text-slate-700">
          Confirm your 4-digit PIN
          <input
            value={setupPin}
            onChange={(event) => setSetupPin(event.target.value.replace(/\D/g, "").slice(0, 4))}
            inputMode="numeric"
            type="password"
            placeholder="0000"
            className="mt-1 h-11 w-full rounded-xl border border-rose-200 bg-white px-3 text-sm outline-none shadow-sm focus:border-fuchsia-500 focus:ring-2 focus:ring-fuchsia-100"
          />
        </label>
      )}

      {mode === "enrol" && (
        <label className="block text-xs font-bold text-slate-700">
          Optional personalised greeting
          <input
            value={personalMessage}
            onChange={(event) => setPersonalMessage(event.target.value.slice(0, 240))}
            placeholder="e.g. Your clinical dashboard is ready for today."
            className="mt-1 h-11 w-full rounded-xl border border-rose-200 bg-white px-3 text-sm outline-none shadow-sm focus:border-fuchsia-500 focus:ring-2 focus:ring-fuchsia-100"
          />
        </label>
      )}

      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={listening ? stopListening : startListening} className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-rose-500 via-fuchsia-600 to-violet-700 px-4 py-2.5 text-sm font-black text-white shadow-[0_14px_30px_-18px_rgba(168,85,247,.8)] transition hover:brightness-105">
          {listening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          {listening ? "Stop listening" : mode === "enrol" ? "Record phrase" : "Speak recovery phrase"}
        </button>
        {status === "denied" && (
          <button type="button" onClick={() => { setStatus("idle"); setMessage(""); setTranscript(""); }} className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-fuchsia-200 bg-white px-4 py-2.5 text-sm font-bold text-fuchsia-700 hover:bg-fuchsia-50">
            <RotateCcw className="h-4 w-4" /> Retry
          </button>
        )}
        {onCancel && (
          <button type="button" onClick={onCancel} className="min-h-11 rounded-xl border border-rose-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-rose-50">Cancel</button>
        )}
      </div>
      {mode === "enrol" && <p className="text-center text-[11px] text-slate-500"><Save className="mr-1 inline h-3.5 w-3.5" />Choose a phrase that is memorable but difficult for someone else to guess.</p>}
    </div>
  );
}
