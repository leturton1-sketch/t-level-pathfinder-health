import { useState, useRef, useEffect } from "react";
import { Bot, X, Send, Mic, Volume2, VolumeX, Square } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { getCurrentUser } from "@/lib/clinicalAuth";
import { SK_CODES, PERFORMANCE_OUTCOMES } from "@/lib/specData";
import { useVoiceSynthesis } from "@/hooks/useVoiceSynthesis";
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
  const [autoListen, setAutoListen] = useState(() => typeof window !== "undefined" && window.localStorage.getItem("clinicaledge-auto-listen") === "true");
  const synth = useVoiceSynthesis();
  const muted = synth.prefs.muted;
  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);
  const listeningRef = useRef(false);
  const autoListenRef = useRef(autoListen);
  const listenTimerRef = useRef(null);
  const assistantStateRef = useRef(state);
  const mutedRef = useRef(muted);
  const wardStateRef = useRef(null);
  const user = getCurrentUser();

  useEffect(() => {
    mutedRef.current = muted;
  }, [muted]);

  useEffect(() => {
    autoListenRef.current = autoListen;
  }, [autoListen]);

  useEffect(() => {
    assistantStateRef.current = state;
  }, [state]);

  useEffect(() => () => {
    window.clearTimeout(listenTimerRef.current);
    listeningRef.current = false;
    try { recognitionRef.current?.stop(); } catch {}
  }, []);

  const systemPrompt = `You are the ClinicalEdge AI Clinical Assistant, supporting T Level Health students specialising in adult nursing. Use British English. Be encouraging, clinically accurate, and concise. The user's name is ${user?.full_name || "Student"}. Context: ${context}. Skill Codes: ${JSON.stringify(SK_CODES)}. Performance Outcomes: ${JSON.stringify(PERFORMANCE_OUTCOMES)}.

WARD MANAGEMENT: In edit mode you can help place items (bed, bedside_cabinet, observation_monitor, iv_stand, curtain, chair, overbed_table, waste_bin, sink). Bed designations: A1-A4 (Suite A), B1-B4 (Suite B).
Include a ward_action object for ward commands, otherwise set action to "none".`;

  useEffect(() => {
    const handler = (e) => { wardStateRef.current = e.detail; };
    window.addEventListener("ward-state-update", handler);
    return () => window.removeEventListener("ward-state-update", handler);
  }, []);



  useEffect(() => {
    if (expanded && messages.length === 0) {
      setMessages([{
        role: "assistant",
        content: `Hello ${user?.full_name?.split(" ")[0] || "there"}! I'm your AI Clinical Assistant. I can help with theory, care planning, and ward simulation.\n\nTap the microphone for continuous voice input. Use the mute and stop controls to manage speech output.`,
      }]);
    }
  }, [expanded]);

  useEffect(() => { messagesEndRef?.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, state]);

  const speak = async (text) => {
    if (mutedRef.current) { setState("idle"); return; }
    setState("speaking");
    await synth.speak(text, {
      onEnd: () => setState(listeningRef.current ? "listening" : "idle"),
    });
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
      const wardContext = wardState ? `\n\nWARD STATE:\n- Edit Mode: ${wardState.editMode}\n- Suite: ${wardState.suite}\n- Placed Items: ${JSON.stringify(wardState.placedItems)}\n- Available Types: ${JSON.stringify(wardState.availableItemTypes)}\n` : "";
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `${systemPrompt}${wardContext}\n\nConversation:\n${messages.map(m => `${m.role}: ${m.content}`).join("\n")}\nuser: ${userMsg.content}\nassistant:`,
        response_json_schema: {
          type: "object",
          properties: {
            reply: { type: "string" },
            ward_action: {
              type: "object",
              properties: {
                action: { type: "string", enum: ["place", "delete", "rotate", "none"] },
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

  const scheduleNextListen = () => {
    window.clearTimeout(listenTimerRef.current);
    if (!autoListenRef.current) return;
    listenTimerRef.current = window.setTimeout(() => {
      const currentState = assistantStateRef.current;
      if (autoListenRef.current && !listeningRef.current && currentState !== "speaking" && currentState !== "thinking") startRecognition();
      else scheduleNextListen();
    }, 8000);
  };

  const startRecognition = () => {
    if (listeningRef.current) return;
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setAutoListen(false);
      autoListenRef.current = false;
      window.localStorage.setItem("clinicaledge-auto-listen", "false");
      alert("Voice input is not supported on this device.");
      return;
    }
    synth.stop();
    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "en-GB";
    recognition.onstart = () => {
      listeningRef.current = true;
      setListening(true);
      setState("listening");
    };
    recognition.onresult = (event) => {
      const result = event.results[event.results.length - 1];
      if (!result.isFinal) return;
      const transcript = result[0].transcript.trim();
      if (transcript) handleSend(transcript);
    };
    recognition.onerror = () => {};
    recognition.onend = () => {
      listeningRef.current = false;
      setListening(false);
      setState((current) => current === "listening" ? "idle" : current);
      scheduleNextListen();
    };
    try { recognition.start(); } catch {
      listeningRef.current = false;
      setListening(false);
      setState("idle");
      scheduleNextListen();
    }
  };

  const toggleVoice = () => {
    if (listeningRef.current) {
      listeningRef.current = false;
      recognitionRef.current?.stop();
      setListening(false);
      setState("idle");
      return;
    }
    startRecognition();
  };

  const toggleAutoListen = () => {
    const enabled = !autoListenRef.current;
    autoListenRef.current = enabled;
    setAutoListen(enabled);
    window.localStorage.setItem("clinicaledge-auto-listen", String(enabled));
    window.clearTimeout(listenTimerRef.current);
    if (enabled) startRecognition();
    else {
      listeningRef.current = false;
      try { recognitionRef.current?.stop(); } catch {}
      setListening(false);
      setState("idle");
    }
  };

  const toggleMute = () => {
    const newMuted = !muted;
    mutedRef.current = newMuted;
    synth.updatePrefs({ muted: newMuted });
    if (newMuted) synth.stop();
  };

  const handleStopSpeaking = () => {
    synth.stop();
    if (listeningRef.current) setState("listening"); else setState("idle");
  };

  const Waveform = ({ state: currentState, monitoring = false }) => {
    const isActive = monitoring || ["thinking", "speaking", "listening"].includes(currentState);
    const colour = currentState === "listening" ? "bg-red-500" : currentState === "thinking" ? "bg-amber-500" : "bg-clinical-teal";
    return (
      <div className="flex h-5 items-center gap-0.5" aria-label={currentState === "listening" ? "Microphone listening waveform" : monitoring ? "Voice monitoring enabled" : "Assistant idle"}>
        {Array.from({ length: 9 }).map((_, i) => (
          <span key={i} className={`w-0.5 rounded-full transition-all ${isActive ? `${colour} waveform-bar` : "bg-slate-300"}`}
            style={{ height: isActive ? `${35 + ((i * 37) % 65)}%` : `${20 + ((i * 13) % 25)}%`, animationDelay: `${i * 0.07}s`, animationDuration: `${0.55 + (i % 4) * 0.12}s` }} />
        ))}
      </div>
    );
  };

  if (!expanded) {
    return (
      <div className="fixed bottom-20 right-4 z-50">
        <div className="flex items-center overflow-hidden rounded-full border border-clinical-teal/35 bg-white/90 shadow-lg backdrop-blur-xl">
          <button type="button" onClick={() => setExpanded(true)}
            className="group flex items-center gap-2 px-4 py-2.5 transition-all hover:bg-white" aria-label="Open AI Clinical Assistant">
            <span className="relative">
              {listening ? <Mic className="h-5 w-5 animate-pulse text-red-600" /> : <Bot className="h-5 w-5 text-clinical-teal" />}
              <span className={`absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full ${listening ? "bg-red-500" : autoListen ? "bg-emerald-500 animate-pulse" : "bg-slate-300"}`} />
            </span>
            <Waveform state={state} monitoring={autoListen} />
            <span className={`text-xs font-bold ${listening ? "text-red-600" : autoListen ? "text-emerald-700" : AI_STATES[state].color}`}>
              {listening ? "Listening…" : autoListen ? "Voice on" : AI_STATES[state].label}
            </span>
          </button>
          <button type="button" onClick={toggleAutoListen}
            className={`mr-1 grid h-9 w-9 place-items-center rounded-full border transition ${autoListen ? "border-emerald-200 bg-emerald-100 text-emerald-700" : "border-slate-200 bg-slate-100 text-slate-500"}`}
            title={autoListen ? "Turn off periodic command listening" : "Turn on periodic command listening"}
            aria-label={autoListen ? "Voice command monitoring on" : "Voice command monitoring off"}
            aria-pressed={autoListen}>
            {autoListen ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          </button>
        </div>
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
              <Waveform state={state} monitoring={autoListen} /> {AI_STATES[state].label}
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