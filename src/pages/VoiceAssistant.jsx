import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import { Bot, Send, Mic, Settings2, Square, Volume2, VolumeX, ArrowLeft, Sparkles } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { base44 } from "@/api/base44Client";
import { isLoggedIn, getCurrentUser } from "@/lib/clinicalAuth";
import { useVoiceSynthesis } from "@/hooks/useVoiceSynthesis";
import AudioVisualizer from "@/components/voice/AudioVisualizer";
import VoiceSettings from "@/components/voice/VoiceSettings";

const STATUS = {
  idle: { label: "Idle", color: "text-slate-400", dot: "bg-slate-400" },
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
      content: `Hi ${user?.full_name?.split(" ")[0] || "there"}! I'm your AI Voice Assistant. Ask me anything, tap the mic to talk, or open settings to customise how I sound.`,
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
        prompt: `You are a friendly, knowledgeable AI voice assistant for nursing students on the ClinicalEdge platform. Use British English. Be warm, concise, and helpful. The user's name is ${user?.full_name || "Student"}.\n\nConversation so far:\n${messages.map((m) => `${m.role}: ${m.content}`).join("\n")}\nuser: ${text}\nassistant:`,
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
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 pb-28">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate("/")} className="p-1.5 rounded-lg hover:bg-slate-100" aria-label="Back">
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div className="w-10 h-10 rounded-full bg-clinical-teal/15 flex items-center justify-center shrink-0">
            <Bot className="w-5 h-5 text-clinical-teal" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-sm font-heading font-bold text-slate-800">AI Voice Assistant</h1>
            <div className="flex items-center gap-1.5 text-xs">
              <span className={`w-2 h-2 rounded-full ${STATUS[status].dot}`} />
              <span className={STATUS[status].color}>{STATUS[status].label}</span>
            </div>
          </div>
          <button onClick={toggleMute} className="p-2 rounded-lg hover:bg-slate-100" title="Mute" aria-label="Mute">
            {synth.prefs.muted ? <VolumeX className="w-5 h-5 text-clinical-red" /> : <Volume2 className="w-5 h-5 text-slate-600" />}
          </button>
          <button onClick={() => setSettingsOpen(true)} className="p-2 rounded-lg hover:bg-slate-100" title="Voice settings" aria-label="Voice settings">
            <Settings2 className="w-5 h-5 text-slate-600" />
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-4">
        {/* Visualizer panel */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-4 text-center">
          <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-clinical-teal/20 to-clinical-teal/5 flex items-center justify-center mb-3">
            <Sparkles className="w-9 h-9 text-clinical-teal" />
          </div>
          <AudioVisualizer state={status} />
          <p className="text-xs text-slate-500 mt-2">{STATUS[status].label}</p>
        </div>

        {/* Messages */}
        <div className="space-y-3">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${m.role === "user" ? "bg-clinical-teal text-white rounded-br-sm" : "bg-white border border-slate-200 text-slate-800 rounded-bl-sm"}`}>
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
      <div className="fixed bottom-0 left-0 right-0 z-20 bg-white/90 backdrop-blur-md border-t border-slate-200">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-2">
          <button onClick={toggleMic}
            className={`p-2.5 rounded-xl transition-all ${listening ? "bg-clinical-red/20 text-clinical-red animate-pulse" : "bg-slate-100 text-slate-500 hover:text-clinical-teal"}`}
            aria-label="Microphone">
            <Mic className="w-5 h-5" />
          </button>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Type or speak…"
            className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-clinical-teal/50"
          />
          <button onClick={() => synth.stop()} disabled={status !== "speaking"}
            className="p-2.5 rounded-xl bg-slate-100 text-slate-500 disabled:opacity-30" aria-label="Stop speaking">
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