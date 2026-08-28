import React, { useState, useRef, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import { Send, Mic, Square, Volume2, VolumeX, ArrowLeft, Shield, Cpu, Sparkles, Radio, Activity, Bot } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { base44 } from "@/api/base44Client";
import { isLoggedIn, getCurrentUser } from "@/lib/clinicalAuth";
import { useVoiceSynthesis } from "@/hooks/useVoiceSynthesis";
import { getRegionalVoicePrompt } from "@/lib/voicePreferences";

const ASSISTANT_VIDEO_URL = "https://media.base44.com/videos/public/6a4759cc86fe95039e31fd09/28db769ba_generate_a_futuristic_wire_.mp4";

const STATUS = {
  idle: { label: "Idle · ready", color: "text-sky-400", dot: "bg-sky-500", mode: "IDLE" },
  listening: { label: "Listening", color: "text-red-400", dot: "bg-red-500 animate-pulse", mode: "SCAN" },
  working: { label: "Working on task", color: "text-violet-400", dot: "bg-violet-500 animate-pulse", mode: "THINK" },
  complete: { label: "Task complete", color: "text-emerald-400", dot: "bg-emerald-500", mode: "DONE" },
  offline: { label: "Not working", color: "text-slate-500", dot: "bg-slate-500", mode: "OFFLINE" },
};

// Speckled starfield background — pure decoration, no logic.
function Starfield() {
  const stars = useMemo(() => Array.from({ length: 80 }).map(() => ({
    top: Math.random() * 100,
    left: Math.random() * 100,
    size: Math.random() * 2 + 0.5,
    delay: Math.random() * 4,
    duration: 2 + Math.random() * 3,
  })), []);
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {stars.map((s, i) => (
        <span key={i} className="absolute rounded-full bg-white/60"
          style={{ top: `${s.top}%`, left: `${s.left}%`, width: s.size, height: s.size, animation: `twinkle ${s.duration}s ease-in-out ${s.delay}s infinite` }} />
      ))}
    </div>
  );
}

export default function VoiceAssistant() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const user = getCurrentUser();
  const synth = useVoiceSynthesis();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [status, setStatus] = useState("idle");
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef(null);
  const listeningRef = useRef(false);
  const endRef = useRef(null);

  useEffect(() => {
    if (!isLoggedIn()) { base44.auth.redirectToLogin(); return; }
    setMessages([{
      role: "assistant",
      content: `Hi ${user?.full_name?.split(" ")[0] || "there"}! I'm your AI Clinical Assistant. We can talk naturally about clinical theory, care planning or ward simulation. Ask a question, or tap the microphone to begin.`,
    }]);
  }, [navigate]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, status]);

  const speakCompletion = async (text) => {
    setStatus("complete");
    await synth.speak(text, { onEnd: () => setStatus(listeningRef.current ? "listening" : "idle") });
  };

  const handleSend = async (overrideText) => {
    const text = (overrideText || input).trim();
    if (!text) return;
    setMessages((p) => [...p, { role: "user", content: text }]);
    if (!overrideText) setInput("");
    setStatus("working");
    if (listeningRef.current) { try { recognitionRef.current?.stop(); } catch {} }
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a warm, highly knowledgeable conversational clinical tutor for T Level Health students on ClinicalEdge. ${getRegionalVoicePrompt(synth.prefs.profileId)} Speak in natural British English with varied sentence length, gentle acknowledgement, and human conversational transitions. Answer the student directly, then ask at most one useful follow-up question when it genuinely helps learning. Avoid robotic headings, repeated disclaimers, and overly formal phrasing. Keep clinical guidance accurate and distinguish education from real-patient medical advice. The user's name is ${user?.full_name || "Student"}.\n\nConversation so far:\n${messages.map((m) => `${m.role}: ${m.content}`).join("\n")}\nuser: ${text}\nassistant:`,
      });
      const reply = typeof res === "string" ? res : res?.reply || "Sorry, I didn't catch that.";
      setMessages((p) => [...p, { role: "assistant", content: reply }]);
      await speakCompletion(reply);
    } catch {
      const failureMessage = "I wasn't able to complete that task because the clinical assistant service is unavailable. Please try again.";
      setMessages((p) => [...p, { role: "assistant", content: failureMessage }]);
      setStatus("offline");
      await synth.speak(failureMessage);
      if (listeningRef.current) { try { recognitionRef.current?.start(); } catch {} }
    }
  };

  const toggleMic = () => {
    if (listening) {
      listeningRef.current = false;
      try { recognitionRef.current?.stop(); } catch {}
      setListening(false);
      setStatus("idle");
      return;
    }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      toast({ title: "Voice input unsupported", description: "Your browser doesn't support speech recognition.", variant: "destructive" });
      return;
    }
    synth.stop();
    const r = new SR();
    recognitionRef.current = r;
    r.continuous = false;
    r.interimResults = false;
    r.lang = "en-GB";
    r.onstart = () => { setListening(true); setStatus("listening"); };
    r.onresult = (e) => handleSend(e.results[0][0].transcript);
    r.onend = () => {
      setListening(false);
      setStatus((current) => current === "listening" ? "idle" : current);
    };
    r.onerror = () => { setListening(false); setStatus("idle"); };
    listeningRef.current = true;
    try { r.start(); } catch {}
  };

  const toggleMute = () => {
    const next = !synth.prefs.muted;
    synth.updatePrefs({ muted: next });
    if (next) synth.stop();
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0f0b18] text-slate-100">
      <Starfield />
      {/* Ambient glow orbs */}
      <div className="pointer-events-none absolute -top-32 -left-24 h-80 w-80 rounded-full bg-[#9b5de5]/20 blur-[90px]" />
      <div className="pointer-events-none absolute top-1/3 -right-24 h-80 w-80 rounded-full bg-[#4cc9f0]/15 blur-[90px]" />

      <div className="relative z-10 mx-auto max-w-3xl px-4 py-4 pb-44 sm:px-6">
        {/* Top header bar */}
        <div className="mb-4 flex items-center justify-between gap-3 rounded-2xl border border-[#1d162b] bg-[#1d162b]/60 px-4 py-2.5 backdrop-blur-xl">
          <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[.14em]">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
            <span className="text-slate-400">Persona:</span>
            <span className="font-bold text-cyan-300">Clinical &amp; Formal</span>
          </div>
          <div className="hidden items-center gap-4 font-mono text-[11px] uppercase tracking-[.14em] text-slate-400 sm:flex">
            <span>Mode: <span className="font-bold text-cyan-300">{STATUS[status].mode}</span></span>
            <span>Render: <span className="font-bold text-violet-300">MP4 LOOP</span></span>
          </div>
          <button onClick={() => navigate("/")} className="grid h-8 w-8 place-items-center rounded-lg border border-[#2a2340] bg-[#15101f] text-slate-400 transition hover:text-cyan-300" aria-label="Back">
            <ArrowLeft className="h-4 w-4" />
          </button>
        </div>

        {/* Status + Neural load stream pills */}
        <div className="mb-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-[#1d162b] bg-[#1d162b]/60 p-3 backdrop-blur-xl">
            <div className="flex items-center gap-2">
              <span className={`h-2 w-2 rounded-full ${STATUS[status].dot}`} />
              <p className="font-mono text-[11px] font-bold uppercase tracking-[.14em] text-emerald-300">Neural Hub Ready</p>
            </div>
            <p className="mt-1.5 text-xs text-slate-400">Awaiting clinician or student query...</p>
          </div>
          <div className="rounded-2xl border border-[#1d162b] bg-[#1d162b]/60 p-3 backdrop-blur-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="h-3.5 w-3.5 text-violet-400" />
                <span className="font-mono text-[11px] font-bold uppercase tracking-[.14em] text-slate-300">Neural Load Stream</span>
              </div>
              <div className="flex items-center gap-2 font-mono text-[10px] text-slate-400">
                <span className="flex items-center gap-1"><Shield className="h-3 w-3 text-emerald-400" />99.9%</span>
                <span className="flex items-center gap-1"><Cpu className="h-3 w-3 text-cyan-400" />12ms</span>
              </div>
            </div>
            <div className="mt-2 flex items-center gap-3">
              <video src={ASSISTANT_VIDEO_URL} className="h-12 w-20 rounded-lg border border-[#2a2340] object-cover" autoPlay loop muted playsInline />
              <div>
                <p className="font-mono text-sm font-bold text-violet-300">24.6%</p>
                <p className="font-mono text-[10px] text-slate-400">Idle Baseline</p>
              </div>
            </div>
          </div>
        </div>

        {/* Central hero video — replaces the 3D robot animation */}
        <div className="relative mb-4 overflow-hidden rounded-3xl border border-[#2a2340] bg-[#0a0712]">
          <video src={ASSISTANT_VIDEO_URL} className="aspect-video w-full object-cover" autoPlay loop muted playsInline />
          <div className="pointer-events-none absolute inset-0 rounded-3xl ring-1 ring-inset ring-[#4cc9f0]/20" />
          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
            <div className="flex items-center gap-2 rounded-full border border-[#1d162b] bg-[#0f0b18]/80 px-3 py-1.5 backdrop-blur-xl">
              <Bot className="h-3.5 w-3.5 text-cyan-300" />
              <span className="font-mono text-[10px] font-bold uppercase tracking-[.14em] text-slate-300">A.R.T.I.E Core</span>
            </div>
            <span className="rounded-full border border-[#1d162b] bg-[#0f0b18]/80 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[.14em] text-violet-300 backdrop-blur-xl">
              {STATUS[status].label}
            </span>
          </div>
        </div>

        {/* Chat messages */}
        <div className="mb-4 max-h-[32vh] space-y-3 overflow-y-auto pr-1 scrollbar-thin">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${m.role === "user" ? "rounded-br-sm bg-[#3a0ca3] text-white" : "rounded-bl-sm border border-[#1d162b] bg-[#1d162b]/70 text-slate-100"}`}>
                {m.role === "assistant"
                  ? <ReactMarkdown className="prose prose-sm prose-invert max-w-none [&_p]:my-0">{m.content}</ReactMarkdown>
                  : <p>{m.content}</p>}
              </div>
            </div>
          ))}
          <div ref={endRef} />
        </div>
      </div>

      {/* Bottom footer pill: gallery label + action buttons + input */}
      <div className="fixed bottom-0 left-0 right-0 z-20 border-t border-[#1d162b] bg-[#0f0b18]/90 backdrop-blur-xl">
        <div className="mx-auto max-w-3xl px-4 py-3 sm:px-6">
          <div className="mb-2 flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2">
              <Cpu className="h-3.5 w-3.5 shrink-0 text-cyan-400" />
              <div className="min-w-0">
                <p className="truncate font-mono text-[11px] font-bold uppercase tracking-[.12em] text-slate-200">AI Clinician Gallery — Active Persona Loaded</p>
                <p className="hidden font-mono text-[10px] text-slate-500 sm:block">Precision Governance &amp; Ofsted Compliance</p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-1.5">
              <button onClick={() => setStatus((s) => s === "working" ? "idle" : "working")}
                className="flex items-center gap-1 rounded-lg border border-[#f77f00]/60 px-2.5 py-1.5 font-mono text-[11px] font-bold text-[#f77f00] transition hover:bg-[#f77f00]/10">
                <Sparkles className="h-3 w-3" /> <span className="hidden sm:inline">Thinking</span>
              </button>
              <button onClick={toggleMic}
                className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 font-mono text-[11px] font-bold transition ${listening ? "bg-red-500/20 text-red-300" : "bg-[#3a0ca3] text-white hover:bg-[#4a0fc3]"}`}>
                <Radio className="h-3 w-3" /> <span className="hidden sm:inline">Scan</span>
              </button>
              <button onClick={toggleMute}
                className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 font-mono text-[11px] font-bold transition ${synth.prefs.muted ? "border border-red-500/40 text-red-300" : "bg-[#3a0ca3] text-white hover:bg-[#4a0fc3]"}`}>
                <Volume2 className="h-3 w-3" /> <span className="hidden sm:inline">Speak</span>
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-2xl border border-[#1d162b] bg-[#15101f] px-3 py-2">
            <button onClick={toggleMic} className={`rounded-xl p-2 transition ${listening ? "animate-pulse bg-red-500/20 text-red-300" : "text-slate-400 hover:text-cyan-300"}`} aria-label="Microphone">
              <Mic className="h-4 w-4" />
            </button>
            <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Type or speak…"
              className="flex-1 bg-transparent text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none" />
            <button onClick={toggleMute} className="rounded-xl p-2 text-slate-400 transition hover:text-cyan-300" aria-label="Mute">
              {synth.prefs.muted ? <VolumeX className="h-4 w-4 text-red-400" /> : <Volume2 className="h-4 w-4" />}
            </button>
            <button onClick={() => synth.stop()} disabled={status !== "speaking"} className="rounded-xl p-2 text-slate-400 transition hover:text-red-300 disabled:opacity-30" aria-label="Stop speaking">
              <Square className="h-4 w-4" />
            </button>
            <button onClick={() => handleSend()} disabled={!input.trim()} className="rounded-xl bg-cyan-500 p-2 text-[#0f0b18] transition disabled:opacity-40 hover:opacity-90" aria-label="Send">
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}