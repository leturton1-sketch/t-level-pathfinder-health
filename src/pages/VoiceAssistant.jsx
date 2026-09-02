import React, { useState, useRef, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import { Mic, Square, Volume2, VolumeX, ArrowLeft, Shield, Cpu, Activity, Bot, Settings2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { isLoggedIn, getCurrentUser, isAdmin } from "@/lib/clinicalAuth";
import { loadPrefs, routeChat } from "@/lib/aiRouter";
import { useVoiceSynthesis } from "@/hooks/useVoiceSynthesis";
import { getRegionalVoicePrompt } from "@/lib/voicePreferences";
import { base44 } from "@/api/base44Client";
import AIComposer from "@/components/ai/AIComposer";
import AIDiagnostic from "@/components/ai/AIDiagnostic";

const ASSISTANT_VIDEO_URL = "https://media.base44.com/videos/public/6a4759cc86fe95039e31fd09/28db769ba_generate_a_futuristic_wire_.mp4";

const STATUS = {
  idle: { label: "Idle · ready", color: "text-sky-400", dot: "bg-sky-500", mode: "IDLE" },
  listening: { label: "Listening", color: "text-red-400", dot: "bg-red-500 animate-pulse", mode: "SCAN" },
  working: { label: "Working on task", color: "text-violet-400", dot: "bg-violet-500 animate-pulse", mode: "THINK" },
  complete: { label: "Task complete", color: "text-emerald-400", dot: "bg-emerald-500", mode: "DONE" },
  offline: { label: "Not working", color: "text-slate-500", dot: "bg-slate-500", mode: "OFFLINE" },
};

async function invokeRoutedAssistant(prompt, onStage) {
  const prefs = loadPrefs();
  const messages = prefs.systemPrompt.trim()
    ? [{ role: "system", content: prefs.systemPrompt.trim() }, { role: "user", content: prompt }]
    : [{ role: "user", content: prompt }];
  return routeChat({ mode: prefs.mode, prefs, messages, onStage });
}

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
  const [contextEnabled, setContextEnabled] = useState(true);
  const [diagnostic, setDiagnostic] = useState(false);
  const admin = isAdmin();
  const [routerInfo, setRouterInfo] = useState({ provider: "auto", model: "", fallback: false });
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef(null);
  const listeningRef = useRef(false);
  const requestIdRef = useRef(0);
  const endRef = useRef(null);

  useEffect(() => {
    if (!isLoggedIn()) { navigate("/login"); return; }
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

  const handleSend = async (overrideText, attachments = []) => {
    const text = (overrideText || input).trim();
    if (!text || status === "working") return;
    const requestId = ++requestIdRef.current;
    setMessages((p) => [...p, { role: "user", content: text }]);
    if (!overrideText) setInput("");
    setStatus("working");
    if (listeningRef.current) { try { recognitionRef.current?.stop(); } catch {} }
    try {
      const uploaded = await Promise.all(attachments.map(async (file) => {
        const result = await base44.integrations.Core.UploadFile({ file });
        return `${file.name}: ${result.file_url}`;
      }));
      const attachmentContext = uploaded.length ? `\n\nAttachments supplied by the user:\n${uploaded.join("\n")}` : "";
      const conversationContext = contextEnabled ? `\n\nConversation so far:\n${messages.map((m) => `${m.role}: ${m.content}`).join("\n")}` : "\n\nThe user has disabled current conversation context.";
      const result = await invokeRoutedAssistant(
        `You are a warm, highly knowledgeable conversational clinical tutor for T Level Health students on ClinicalEdge. ${getRegionalVoicePrompt(synth.prefs.profileId)} Speak in natural British English with varied sentence length, gentle acknowledgement, and human conversational transitions. Answer the student directly, then ask at most one useful follow-up question when it genuinely helps learning. Avoid robotic headings, repeated disclaimers, and overly formal phrasing. Keep clinical guidance accurate and distinguish education from real-patient medical advice. The user's name is ${user?.full_name || "Student"}.${conversationContext}${attachmentContext}\nuser: ${text}\nassistant:`,
        (provider, stage) => {
        if (stage === "running") setRouterInfo({ provider, model: "", fallback: false });
      });
      if (requestId !== requestIdRef.current) return;
      const reply = result.content || "Sorry, I didn't catch that.";
      setRouterInfo({ provider: result.provider, model: result.model || "", fallback: !!result.fallback });
      setMessages((p) => [...p, { role: "assistant", content: reply }]);
      await speakCompletion(reply);
    } catch {
      if (requestId !== requestIdRef.current) return;
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

  const handleStop = () => {
    requestIdRef.current += 1;
    synth.stop();
    setStatus(listeningRef.current ? "listening" : "idle");
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0f0b18] text-slate-100">
      <Starfield />
      {/* Ambient glow orbs */}
      <div className="pointer-events-none absolute -top-32 -left-24 h-80 w-80 rounded-full bg-[#9b5de5]/20 blur-[90px]" />
      <div className="pointer-events-none absolute top-1/3 -right-24 h-80 w-80 rounded-full bg-[#4cc9f0]/15 blur-[90px]" />

      <div className="relative z-10 mx-auto max-w-3xl px-4 py-4 pb-64 sm:px-6">
        {/* Top header bar */}
        <div className="mb-4 flex items-center justify-between gap-3 rounded-2xl border border-[#1d162b] bg-[#1d162b]/60 px-4 py-2.5 backdrop-blur-xl">
          <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[.14em]">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
            <span className="text-slate-400">Persona:</span>
            <span className="font-bold text-cyan-300">Clinical &amp; Formal</span>
          </div>
          <div className="hidden items-center gap-4 font-mono text-[11px] uppercase tracking-[.14em] text-slate-400 sm:flex">
            <span>Mode: <span className="font-bold text-cyan-300">{STATUS[status].mode}</span></span>
            <span>Router: <span className="font-bold text-violet-300">{routerInfo.provider}{routerInfo.fallback ? " · fallback" : ""}</span></span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => navigate("/ai-models")} className="flex h-8 items-center gap-1.5 rounded-lg border border-[#2a2340] bg-[#15101f] px-2.5 text-[10px] font-bold text-violet-300 transition hover:text-cyan-300" aria-label="Open AI model router settings">
              <Settings2 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Models</span>
            </button>
            <button onClick={() => navigate("/")} className="grid h-8 w-8 place-items-center rounded-lg border border-[#2a2340] bg-[#15101f] text-slate-400 transition hover:text-cyan-300" aria-label="Back">
              <ArrowLeft className="h-4 w-4" />
            </button>
          </div>
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
        {diagnostic && admin ? (
          <div className="mb-4 overflow-hidden rounded-3xl border border-white/80 bg-slate-100 text-slate-800 shadow-xl"><AIDiagnostic /></div>
        ) : (
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
        )
      </div>

      {/* Shared soft-3D composer stays fixed while the conversation scrolls. */}
      <div className="fixed bottom-0 left-0 right-0 z-20 border-t border-white/60 bg-slate-100/95 backdrop-blur-xl">
        <div className="mx-auto max-w-3xl px-3 py-3 sm:px-6">
          <AIComposer
            value={input}
            onChange={setInput}
            onSend={handleSend}
            isProcessing={status === "working"}
            onStop={handleStop}
            contextEnabled={contextEnabled}
            onContextChange={setContextEnabled}
            diagnosticEnabled={diagnostic}
            onDiagnosticChange={setDiagnostic}
            isAdmin={admin}
            leadingControls={<>
              <button onClick={toggleMic} className={`ai-composer-plus ${listening ? "animate-pulse text-red-600" : ""}`} aria-label={listening ? "Stop listening" : "Start voice input"}><Mic className="h-3.5 w-3.5" /></button>
              <button onClick={toggleMute} className={`ai-composer-plus ${synth.prefs.muted ? "text-red-600" : ""}`} aria-label={synth.prefs.muted ? "Enable assistant speech" : "Mute assistant speech"}>{synth.prefs.muted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}</button>
              <button onClick={() => synth.stop()} disabled={status !== "speaking" && status !== "complete"} className="ai-composer-plus disabled:opacity-30" aria-label="Stop speaking"><Square className="h-3.5 w-3.5" /></button>
            </>}
          />
        </div>
      </div>
    </div>
  );
}