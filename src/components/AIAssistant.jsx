import { useState, useRef, useEffect } from "react";
import { Bot, X, Send, Mic, Volume2, VolumeX, Square } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { getCurrentUser } from "@/lib/clinicalAuth";
import { SK_CODES, PERFORMANCE_OUTCOMES } from "@/lib/specData";
import { playElevenLabs, stopSpeaking } from "@/lib/elevenLabs";
import ReactMarkdown from "react-markdown";

const AI_STATES = {
  idle: { label: "Ready", color: "text-clinical-teal" },
  thinking: { label: "Thinking…", color: "text-clinical-amber" },
  speaking: { label: "Speaking…", color: "text-clinical-green" },
  listening: { label: "Listening…", color: "text-clinical-teal" },
};

export default function AIAssistant({ context = "general" }) {
  const [expanded, setExpanded] = useState(false);
  const [state, setState] = useState("idle");
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [listening, setListening] = useState(false);
  const [muted, setMuted] = useState(false);
  const [ttsVolume, setTtsVolume] = useState(1);
  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);
  const listeningRef = useRef(false);
  const mutedRef = useRef(false);
  const settingsRef = useRef({ apiKey: "", voiceId: "", volume: 1 });
  const wardStateRef = useRef(null);
  const callBellTimersRef = useRef({});
  const user = getCurrentUser();

  // Load ElevenLabs settings
  useEffect(() => {
    base44.auth.me().then(u => {
      settingsRef.current = {
        apiKey: u.elevenlabs_api_key || "",
        voiceId: u.elevenlabs_voice_id || "",
        volume: u.tts_volume ?? 1,
      };
      setTtsVolume(u.tts_volume ?? 1);
      setMuted(u.tts_muted || false);
      mutedRef.current = u.tts_muted || false;
    }).catch(() => {});
  }, []);

  const systemPrompt = `You are the ClinicalEdge AI Clinical Assistant, supporting T Level Health students specialising in adult nursing. Use British English. Be encouraging, clinically accurate, and concise. The user's name is ${user?.full_name || "Student"}. Context: ${context}. Skill Codes: ${JSON.stringify(SK_CODES)}. Performance Outcomes: ${JSON.stringify(PERFORMANCE_OUTCOMES)}.

WARD MANAGEMENT: In edit mode you can help place items (bed, bedside_cabinet, observation_monitor, iv_stand, curtain, chair, overbed_table, waste_bin, sink). Bed designations: A1-A4 (Suite A), B1-B4 (Suite B).
CALL BELLS: You can activate/reset call bells. When active, you announce periodically until reset.
Include a ward_action object for ward commands, otherwise set action to "none".`;

  useEffect(() => {
    const handler = (e) => { wardStateRef.current = e.detail; };
    window.addEventListener("ward-state-update", handler);
    return () => window.removeEventListener("ward-state-update", handler);
  }, []);

  useEffect(() => {
    const handler = (e) => {
      const { bedDesignation, active } = e.detail;
      if (active) {
        const announce = async () => {
          const text = `Assistance is required at bed ${bedDesignation}.`;
          if (!mutedRef.current) {
            const { apiKey, voiceId, volume } = settingsRef.current;
            const success = await playElevenLabs(text, apiKey, voiceId, volume);
            if (!success && "speechSynthesis" in window) {
              await new Promise(r => setTimeout(r, 150));
              const u = new SpeechSynthesisUtterance(text);
              u.rate = 0.95;
              u.pitch = user?.ai_persona === "male" ? 0.7 : 1.1;
              u.volume = volume;
              window.speechSynthesis.speak(u);
            }
          }
          setMessages((prev) => [...prev, { role: "assistant", content: `🔔 **${text}**` }]);
        };
        announce();
        callBellTimersRef.current[bedDesignation] = setInterval(announce, 15000);
      } else {
        if (callBellTimersRef.current[bedDesignation]) {
          clearInterval(callBellTimersRef.current[bedDesignation]);
          delete callBellTimersRef.current[bedDesignation];
          setMessages((prev) => [...prev, { role: "assistant", content: `Call bell at bed ${bedDesignation} has been reset.` }]);
        }
      }
    };
    window.addEventListener("callbell-status", handler);
    return () => { window.removeEventListener("callbell-status", handler); Object.values(callBellTimersRef.current).forEach(clearInterval); };
  }, []);

  useEffect(() => {
    if (expanded && messages.length === 0) {
      setMessages([{
        role: "assistant",
        content: `Hello ${user?.full_name?.split(" ")[0] || "there"}! I'm your AI Clinical Assistant. I can help with theory, care planning, ward simulation, and call bell management.\n\nTap the microphone for continuous voice input. Use the mute and stop controls to manage speech output.`,
      }]);
    }
  }, [expanded]);

  useEffect(() => { messagesEndRef?.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, state]);

  const speak = async (text) => {
    if (mutedRef.current) { setState("idle"); return; }
    setState("speaking");
    const cleanText = text.replace(/[*#`🔔]/g, "");
    const { apiKey, voiceId, volume } = settingsRef.current;
    // Try ElevenLabs first
    if (apiKey && voiceId) {
      const success = await playElevenLabs(cleanText, apiKey, voiceId, volume, () => {
        if (listeningRef.current) setState("listening"); else setState("idle");
      });
      if (success) return;
      // ElevenLabs failed — brief delay so speechSynthesis recovers after cancel()
      await new Promise(r => setTimeout(r, 150));
    }
    // Fallback to browser TTS
    if ("speechSynthesis" in window) {
      const u = new SpeechSynthesisUtterance(cleanText);
      u.rate = 0.95;
      u.pitch = user?.ai_persona === "male" ? 0.7 : 1.1;
      u.volume = volume;
      u.onend = () => { if (listeningRef.current) setState("listening"); else setState("idle"); };
      window.speechSynthesis.speak(u);
    } else {
      setTimeout(() => setState(listeningRef.current ? "listening" : "idle"), 2000);
    }
  };

  const handleSend = async (overrideText) => {
    const text = overrideText || input;
    if (!text.trim()) return;
    const userMsg = { role: "user", content: text.trim() };
    setMessages((prev) => [...prev, userMsg]);
    if (!overrideText) setInput("");
    setState("thinking");
    if (listeningRef.current && recognitionRef.current) { try { recognitionRef.current.stop(); } catch (e) {} }

    try {
      const wardState = wardStateRef.current;
      const wardContext = wardState ? `\n\nWARD STATE:\n- Edit Mode: ${wardState.editMode}\n- Suite: ${wardState.suite}\n- Placed Items: ${JSON.stringify(wardState.placedItems)}\n- Active Call Bells: ${JSON.stringify(wardState.callBells)}\n- Available Types: ${JSON.stringify(wardState.availableItemTypes)}\n` : "";
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `${systemPrompt}${wardContext}\n\nConversation:\n${messages.map(m => `${m.role}: ${m.content}`).join("\n")}\nuser: ${userMsg.content}\nassistant:`,
        response_json_schema: {
          type: "object",
          properties: {
            reply: { type: "string" },
            ward_action: {
              type: "object",
              properties: {
                action: { type: "string", enum: ["place", "delete", "rotate", "activate_callbell", "reset_callbell", "none"] },
                itemType: { type: "string" },
                designation: { type: "string" },
                x: { type: "number" },
                z: { type: "number" },
                direction: { type: "string", enum: ["left", "right"] },
              },
            },
          },
        },
      });
      const reply = response.reply || response;
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
      if (response.ward_action && response.ward_action.action !== "none") {
        window.dispatchEvent(new CustomEvent("ward-ai-command", { detail: response.ward_action }));
      }
      await speak(reply);
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "I apologise — I'm having trouble connecting right now. Please try again." }]);
      setState("idle");
      if (listeningRef.current) { try { recognitionRef.current?.start(); } catch (e) {} }
    }
  };

  const toggleVoice = () => {
    if (listening) {
      listeningRef.current = false;
      recognitionRef.current?.stop();
      setListening(false);
      setState("idle");
      return;
    }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) { alert("Voice input is not supported on this device."); return; }
    // Interrupt current speech when starting to listen
    stopSpeaking();
    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = "en-GB";
    recognition.onstart = () => { setListening(true); setState("listening"); };
    recognition.onresult = (event) => {
      const last = event.results.length - 1;
      const transcript = event.results[last][0].transcript;
      handleSend(transcript);
    };
    recognition.onerror = () => {};
    recognition.onend = () => {
      if (listeningRef.current) { try { recognition.start(); } catch (e) { setListening(false); setState("idle"); } }
      else setListening(false);
    };
    listeningRef.current = true;
    recognition.start();
  };

  const toggleMute = () => {
    const newMuted = !muted;
    setMuted(newMuted);
    mutedRef.current = newMuted;
    if (newMuted) stopSpeaking();
    base44.auth.updateMe({ tts_muted: newMuted }).catch(() => {});
  };

  const handleStopSpeaking = () => {
    stopSpeaking();
    if (listeningRef.current) setState("listening"); else setState("idle");
  };

  const Waveform = ({ state }) => {
    const isActive = ["thinking", "speaking", "listening"].includes(state);
    return (
      <div className="flex items-end gap-0.5 h-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className={`w-1 rounded-full ${isActive ? "bg-clinical-teal waveform-bar" : "bg-slate-400/40"}`}
            style={{ height: isActive ? "100%" : "30%", animationDelay: `${i * 0.1}s` }} />
        ))}
      </div>
    );
  };

  if (!expanded) {
    return (
      <div className="fixed bottom-20 right-4 z-50">
        <button onClick={() => setExpanded(true)}
          className="group flex items-center gap-2 rounded-full border border-clinical-teal/40 bg-white/90 backdrop-blur-md px-4 py-2.5 shadow-lg hover:border-clinical-teal transition-all">
          <div className="relative">
            <Bot className="w-5 h-5 text-clinical-teal" />
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-clinical-green animate-pulse" />
          </div>
          <Waveform state={state} />
          <span className={`text-xs font-medium ${AI_STATES[state].color}`}>{AI_STATES[state].label}</span>
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-20 right-4 z-50 w-[calc(100vw-2rem)] sm:w-96 max-h-[60vh] flex flex-col rounded-2xl border border-clinical-teal/30 bg-white/95 backdrop-blur-xl shadow-2xl animate-slide-up overflow-hidden">
      <div className="flex items-center justify-between p-3 border-b border-slate-200 bg-slate-50/50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-clinical-teal/20 flex items-center justify-center">
            <Bot className="w-5 h-5 text-clinical-teal" />
          </div>
          <div>
            <div className="text-sm font-heading font-bold text-slate-800">AI Clinical Assistant</div>
            <div className={`text-xs ${AI_STATES[state].color} flex items-center gap-1`}>
              <Waveform state={state} /> {AI_STATES[state].label}
              {muted && <span className="text-clinical-red">(muted)</span>}
            </div>
          </div>
        </div>
        <button onClick={() => setExpanded(false)} className="p-1.5 rounded-lg hover:bg-slate-100"><X className="w-4 h-4 text-slate-400" /></button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3 scrollbar-thin min-h-[200px] max-h-[40vh]">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${msg.role === "user" ? "bg-clinical-teal text-white rounded-br-sm" : "bg-slate-100 text-slate-800 rounded-bl-sm"}`}>
              {msg.role === "assistant" ? <ReactMarkdown className="prose prose-sm max-w-none [&_p]:my-1 [&_strong]:text-clinical-teal">{msg.content}</ReactMarkdown> : <p>{msg.content}</p>}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-3 border-t border-slate-200 bg-slate-50/50">
        <div className="flex items-center gap-1.5">
          {/* Microphone */}
          <button onClick={toggleVoice}
            className={`p-2.5 rounded-xl transition-all ${listening ? "bg-clinical-red/20 text-clinical-red animate-pulse" : "bg-slate-100 text-slate-500 hover:text-clinical-teal"}`}
            title={listening ? "Stop listening" : "Start voice input"} aria-label="Microphone">
            <Mic className="w-4 h-4" />
          </button>
          {/* Mute toggle */}
          <button onClick={toggleMute}
            className={`p-2.5 rounded-xl transition-all ${muted ? "bg-clinical-red/10 text-clinical-red" : "bg-slate-100 text-slate-500 hover:text-clinical-teal"}`}
            title={muted ? "Unmute" : "Mute"} aria-label="Mute toggle">
            {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
          {/* Stop speaking / Interrupt */}
          <button onClick={handleStopSpeaking} disabled={state !== "speaking"}
            className="p-2.5 rounded-xl bg-slate-100 text-slate-500 hover:text-clinical-red disabled:opacity-30 transition-all"
            title="Stop speaking" aria-label="Stop speaking">
            <Square className="w-4 h-4" />
          </button>
          {/* Text input */}
          <input type="text" value={input} onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Ask about care, place items…"
            className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-clinical-teal/50" />
          {/* Send */}
          <button onClick={() => handleSend()} disabled={!input.trim()}
            className="p-2.5 rounded-xl bg-clinical-teal text-white disabled:opacity-40 hover:opacity-90 transition-opacity" aria-label="Send">
            <Send className="w-4 h-4" />
          </button>
        </div>
        {listening && <p className="text-[10px] text-clinical-teal mt-1.5 text-center">● Continuously listening — tap mic to stop</p>}
      </div>
    </div>
  );
}