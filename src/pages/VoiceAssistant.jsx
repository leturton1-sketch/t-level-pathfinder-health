import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import { Bot, Send, Mic, Settings2, Square, Volume2, VolumeX, ArrowLeft } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { base44 } from "@/api/base44Client";
import { isLoggedIn, getCurrentUser } from "@/lib/clinicalAuth";
import { useVoiceSynthesis } from "@/hooks/useVoiceSynthesis";
import AudioVisualizer from "@/components/voice/AudioVisualizer";
import VoiceSettings from "@/components/voice/VoiceSettings";
import ClinicianHead3D from "@/components/voice/ClinicianHead3D";
import { getRegionalVoicePrompt } from "@/lib/voicePreferences";

const STATUS = {
  idle: { label: "Idle", color: "text-muted-foreground", dot: "bg-muted-foreground" },
  listening: { label: "Listening", color: "text-clinical-teal", dot: "bg-clinical-teal animate-pulse" },
  thinking: { label: "Thinking", color: "text-clinical-amber", dot: "bg-clinical-amber animate-pulse" },
  speaking: { label: "Speaking", color: "text-clinical-green", dot: "bg-clinical-green animate-pulse" },
};

export default function VoiceAssistant() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const user = getCurrentUser();
  const synth = useVoiceSynthesis();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [status, setStatus] = useState("idle");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef(null);
  const listeningRef = useRef(false);
  const endRef = useRef(null);

  useEffect(() => {
    if (!isLoggedIn()) { navigate("/login"); return; }
    setMessages([{
      role: "assistant",
      content: `Hi ${user?.full_name?.split(" ")[0] || "there"}! I'm your AI Clinical Assistant. We can talk naturally about clinical theory, care planning or ward simulation. Ask a question, or tap the microphone to begin.`,
    }]);
  }, [navigate]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, status]);

  const speak = async (text) => {
    setStatus("speaking");
    await synth.speak(text, { onEnd: () => setStatus(listeningRef.current ? "listening" : "idle") });
  };

  const handleSend = async (overrideText) => {
    const text = (overrideText || input).trim();
    if (!text) return;
    setMessages((p) => [...p, { role: "user", content: text }]);
    if (!overrideText) setInput("");
    setStatus("thinking");
    if (listeningRef.current) { try { recognitionRef.current?.stop(); } catch {} }
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a warm, highly knowledgeable conversational clinical tutor for T Level Health students on ClinicalEdge. ${getRegionalVoicePrompt(synth.prefs.profileId)} Speak in natural British English with varied sentence length, gentle acknowledgement, and human conversational transitions. Answer the student directly, then ask at most one useful follow-up question when it genuinely helps learning. Avoid robotic headings, repeated disclaimers, and overly formal phrasing. Keep clinical guidance accurate and distinguish education from real-patient medical advice. The user's name is ${user?.full_name || "Student"}.\n\nConversation so far:\n${messages.map((m) => `${m.role}: ${m.content}`).join("\n")}\nuser: ${text}\nassistant:`,
      });
      const reply = typeof res === "string" ? res : res?.reply || "Sorry, I didn't catch that.";
      setMessages((p) => [...p, { role: "assistant", content: reply }]);
      await speak(reply);
    } catch {
      setMessages((p) => [...p, { role: "assistant", content: "I'm having trouble connecting right now. Please try again." }]);
      setStatus("idle");
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
    r.onend = () => { setListening(false); if (!synth.speaking) setStatus("idle"); };
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
    <div className="min-h-screen bg-[radial-gradient(circle_at_50%_0%,rgba(220,210,238,.58),transparent_34%),linear-gradient(145deg,#faf9fb,#f2eef7)] pb-28">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-card/80 backdrop-blur-md border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate("/")} className="p-1.5 rounded-lg hover:bg-muted" aria-label="Back">
            <ArrowLeft className="w-5 h-5 text-muted-foreground" />
          </button>
          <div className="w-10 h-10 rounded-full bg-clinical-teal/15 flex items-center justify-center shrink-0">
            <Bot className="w-5 h-5 text-clinical-teal" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-sm font-heading font-bold text-foreground">AI Voice Assistant</h1>
            <div className="flex items-center gap-1.5 text-xs">
              <span className={`w-2 h-2 rounded-full ${STATUS[status].dot}`} />
              <span className={STATUS[status].color}>{STATUS[status].label}</span>
            </div>
          </div>
          <button onClick={toggleMute} className="p-2 rounded-lg hover:bg-muted" title="Mute" aria-label="Mute">
            {synth.prefs.muted ? <VolumeX className="w-5 h-5 text-clinical-red" /> : <Volume2 className="w-5 h-5 text-muted-foreground" />}
          </button>
          <button onClick={() => setSettingsOpen(true)} className="p-2 rounded-lg hover:bg-muted" title="Voice settings" aria-label="Voice settings">
            <Settings2 className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-4">
        {/* Interactive holographic clinician */}
        <div className="polished-glass-edge relative mb-4 overflow-hidden rounded-[32px] border border-white/90 bg-white/55 p-2 shadow-[0_18px_55px_-28px_rgba(15,23,42,.55),inset_1px_1px_2px_white] backdrop-blur-2xl">
          <ClinicianHead3D status={status} />
          <div className="absolute bottom-4 left-4 rounded-2xl border border-white/80 bg-white/65 px-3 py-2 shadow-lg backdrop-blur-xl">
            <AudioVisualizer state={status} />
            <p className={`mt-1 text-[10px] font-bold uppercase tracking-[.16em] ${STATUS[status].color}`}>{STATUS[status].label}</p>
          </div>
        </div>

        {/* Messages */}
        <div className="space-y-3">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${m.role === "user" ? "bg-clinical-teal text-white rounded-br-sm" : "bg-card border border-border text-foreground rounded-bl-sm"}`}>
                {m.role === "assistant"
                  ? <ReactMarkdown className="prose prose-sm max-w-none [&_p]:my-0">{m.content}</ReactMarkdown>
                  : <p>{m.content}</p>}
              </div>
            </div>
          ))}
          <div ref={endRef} />
        </div>
      </div>

      {/* Input bar */}
      <div className="fixed bottom-0 left-0 right-0 z-20 bg-card/90 backdrop-blur-md border-t border-border">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-2">
          <button onClick={toggleMic}
            className={`p-2.5 rounded-xl transition-all ${listening ? "bg-clinical-red/20 text-clinical-red animate-pulse" : "bg-muted text-muted-foreground hover:text-clinical-teal"}`}
            aria-label="Microphone">
            <Mic className="w-5 h-5" />
          </button>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Type or speak…"
            className="flex-1 bg-muted border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-clinical-teal/50"
          />
          <button onClick={() => synth.stop()} disabled={status !== "speaking"}
            className="p-2.5 rounded-xl bg-muted text-muted-foreground disabled:opacity-30" aria-label="Stop speaking">
            <Square className="w-5 h-5" />
          </button>
          <button onClick={() => handleSend()} disabled={!input.trim()}
            className="p-2.5 rounded-xl bg-clinical-teal text-white disabled:opacity-40 hover:opacity-90 transition-opacity" aria-label="Send">
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>

      <VoiceSettings
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onSaved={() => toast({ title: "Voice settings saved", description: "Your voice preferences have been saved." })}
        synth={synth}
      />
    </div>
  );
}