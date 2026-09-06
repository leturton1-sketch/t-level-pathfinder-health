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

  useEffect(() => () => stopListening(), []);

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
    ctx.strokeStyle = status === "matched" ? "#22c55e" : status === "denied" ? "#ef4444" : "#38bdf8";
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
          pin,
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
    ? "border-emerald-400/70 bg-emerald-950/45"
    : status === "denied"
      ? "border-rose-400/70 bg-rose-950/45"
      : "border-cyan-400/30 bg-slate-950/80";

  return (
    <div className="space-y-4">
      <div className={`rounded-2xl border p-4 transition-colors ${waveClass}`}>
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-white">
            <Waves className="h-5 w-5" />
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em]">{mode === "enrol" ? "Spoken Recovery Setup" : "Backup Voice Access"}</p>
              <p className="text-[11px] text-slate-300">No recording or biometric voiceprint is stored.</p>
            </div>
          </div>
          {status === "matched" && <ShieldCheck className="h-6 w-6 text-emerald-400" />}
          {status === "denied" && <ShieldX className="h-6 w-6 text-rose-400" />}
        </div>
        <canvas ref={canvasRef} className="h-28 w-full rounded-xl bg-black/20" aria-label="Live microphone waveform" />
        <p className={`mt-3 min-h-5 text-center text-xs font-bold ${status === "matched" ? "text-emerald-300" : status === "denied" ? "text-rose-300" : "text-cyan-200"}`}>
          {message || "Ready"}
        </p>
        {transcript && <p className="mt-2 rounded-lg bg-black/20 px-3 py-2 text-center text-xs text-slate-200">Heard: “{transcript}”</p>}
      </div>

      {mode === "enrol" && (
        <label className="block text-xs font-bold text-slate-700">
          Optional personalised greeting
          <input
            value={personalMessage}
            onChange={(event) => setPersonalMessage(event.target.value.slice(0, 240))}
            placeholder="e.g. Your clinical dashboard is ready for today."
            className="mt-1 h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
          />
        </label>
      )}

      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={listening ? stopListening : startListening} className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-black text-white hover:bg-slate-800">
          {listening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          {listening ? "Stop listening" : mode === "enrol" ? "Record phrase" : "Speak recovery phrase"}
        </button>
        {status === "denied" && (
          <button type="button" onClick={() => { setStatus("idle"); setMessage(""); setTranscript(""); }} className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-700">
            <RotateCcw className="h-4 w-4" /> Retry
          </button>
        )}
        {onCancel && (
          <button type="button" onClick={onCancel} className="min-h-11 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-700">Cancel</button>
        )}
      </div>
      {mode === "enrol" && <p className="text-center text-[11px] text-slate-500"><Save className="mr-1 inline h-3.5 w-3.5" />Choose a phrase that is memorable but difficult for someone else to guess.</p>}
    </div>
  );
}
