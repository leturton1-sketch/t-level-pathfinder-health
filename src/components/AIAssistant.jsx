import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Bot, X, Send, Mic, Volume2, VolumeX, Square, GripVertical } from "lucide-react";
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

// Module-scope Waveform avoids re-creating the component on every parent render.
// `red` forces a red palette; `reactive` speeds up the bars while thinking/speaking.
function Waveform({ state: currentState, monitoring = false, red = false, reactive = false }) {
  const colour = red
    ? "bg-red-500"
    : currentState === "listening" ? "bg-red-500" : currentState === "thinking" ? "bg-amber-500" : currentState === "speaking" ? "bg-clinical-green" : "bg-clinical-teal";
  const active = reactive && (currentState === "thinking" || currentState === "speaking" || currentState === "listening");
  return (
    <div className="flex h-5 items-center gap-0.5" aria-label={currentState === "listening" ? "Microphone listening waveform" : monitoring ? "Voice monitoring enabled" : "Assistant idle"}>
      {Array.from({ length: 9 }).map((_, i) => (
        <span key={i} className={`w-0.5 rounded-full ${colour} waveform-bar`}
          style={{
            height: `${active ? 55 + ((i * 41) % 45) : 35 + ((i * 37) % 65)}%`,
            animationDelay: `${i * 0.07}s`,
            animationDuration: `${active ? 0.32 + (i % 4) * 0.06 : 0.55 + (i % 4) * 0.12}s`,
            opacity: active ? 1 : 0.6,
          }} />
      ))}
    </div>
  );
}

const POS_KEY = "clinicaledge-ai-pos";
const DEFAULT_POS = { x: -1, y: -1 }; // -1 = use default anchor (beside the toggle)

function loadPos() {
  try {
    const raw = window.localStorage.getItem(POS_KEY);
    if (!raw) return DEFAULT_POS;
    const p = JSON.parse(raw);
    return (p && typeof p.x === "number" && typeof p.y === "number") ? p : DEFAULT_POS;
  } catch { return DEFAULT_POS; }
}

export default function AIAssistant({ context = "general" }) {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);
  const [state, setState] = useState("idle");
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [listening, setListening] = useState(false);
  const [autoListen, setAutoListen] = useState(() => typeof window !== "undefined" && window.localStorage.getItem("clinicaledge-auto-listen") === "true");
  const [pos, setPos] = useState(loadPos);
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
  const panelRef = useRef(null);
  const dragRef = useRef({ active: false, dx: 0, dy: 0, moved: false });

  useEffect(() => { mutedRef.current = muted; }, [muted]);
  useEffect(() => { autoListenRef.current = autoListen; }, [autoListen]);
  useEffect(() => { assistantStateRef.current = state; }, [state]);

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
    if (listeningRef.current && recognitionRef.current) { try { recognitionRef.current.stop(); } catch {} }

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
      if (listeningRef.current) { try { recognitionRef.current?.start(); } catch {} }
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

  useEffect(() => {
    if (autoListen) scheduleNextListen();
    else window.clearTimeout(listenTimerRef.current);
    return () => window.clearTimeout(listenTimerRef.current);
  }, [autoListen]);

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

  // --- Dragging (pointer events, persisted) ---
  const onPointerDown = (e) => {
    const panel = panelRef.current;
    if (!panel) return;
    const rect = panel.getBoundingClientRect();
    dragRef.current = { active: true, dx: e.clientX - rect.left, dy: e.clientY - rect.top, moved: false };
    panel.setPointerCapture?.(e.pointerId);
    e.preventDefault();
  };

  const onPointerMove = (e) => {
    if (!dragRef.current.active) return;
    const panel = panelRef.current;
    if (!panel) return;
    let x = e.clientX - dragRef.current.dx;
    let y = e.clientY - dragRef.current.dy;
    const w = panel.offsetWidth;
    const h = panel.offsetHeight;
    x = Math.max(8, Math.min(x, window.innerWidth - w - 8));
    y = Math.max(8, Math.min(y, window.innerHeight - h - 8));
    dragRef.current.moved = true;
    setPos({ x, y });
  };

  const endDrag = (e) => {
    if (!dragRef.current.active) return;
    dragRef.current.active = false;
    try { panelRef.current?.releasePointerCapture?.(e?.pointerId); } catch {}
    const { x, y } = pos;
    if (x >= 0 && y >= 0) window.localStorage.setItem(POS_KEY, JSON.stringify({ x, y }));
  };

  const resetPos = useCallback(() => {
    setPos(DEFAULT_POS);
    window.localStorage.removeItem(POS_KEY);
  }, []);

  const anchored = pos.x < 0 || pos.y < 0;
  const panelStyle = anchored ? {} : { left: pos.x, top: pos.y };
  const panelClass = anchored
    ? "fixed bottom-[136px] right-4 z-50"
    : "fixed z-50";

  return (
    <>
      {/* Toggle — always visible so the panel opens beside it */}
      <div className="fixed bottom-20 right-4 z-50">
        <div className="flex items-center overflow-hidden rounded-full border border-clinical-teal/35 bg-white/80 shadow-lg backdrop-blur-xl">
          <button type="button" onClick={() => setExpanded((v) => !v)}
            className="group flex items-center gap-2 px-3.5 py-2 transition-all hover:bg-white" aria-label="Open AI Clinical Assistant">
            <video
              src="https://media.base44.com/videos/public/6a4759cc86fe95039e31fd09/28db769ba_generate_a_futuristic_wire_.mp4"
              className="h-8 w-8 rounded-full object-cover"
              autoPlay
              loop
              muted
              playsInline
            />
            <span className="text-[11px] font-bold text-red-600">A.R.T.I.E</span>
          </button>
          <button type="button" onClick={toggleAutoListen}
            className={`mr-1 grid h-8 w-8 place-items-center rounded-full border transition ${autoListen ? "border-emerald-200 bg-emerald-100 text-emerald-700" : "border-slate-200 bg-slate-100 text-slate-500"}`}
            title={autoListen ? "Turn off periodic command listening" : "Turn on periodic command listening"}
            aria-label={autoListen ? "Voice command monitoring on" : "Voice command monitoring off"}
            aria-pressed={autoListen}>
            {autoListen ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>

      {/* Expanded panel — translucent, 10% smaller, draggable */}
      {expanded && (
        <div
          ref={panelRef}
          style={panelStyle}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          className={`${panelClass} w-[calc(100vw-2rem)] sm:w-[345px] max-h-[54vh] flex flex-col rounded-2xl border border-clinical-teal/30 bg-white/70 backdrop-blur-xl shadow-2xl animate-slide-up overflow-hidden`}
        >
          {/* Header = drag handle */}
          <div
            onPointerDown={onPointerDown}
            onDoubleClick={resetPos}
            className="flex cursor-grab active:cursor-grabbing items-center justify-between px-2.5 py-2 border-b border-white/40 bg-white/40 touch-none"
          >
            <div className="flex items-center gap-1.5">
              <GripVertical className="w-3.5 h-3.5 text-slate-400" />
              <div className="w-7 h-7 rounded-full bg-clinical-teal/20 flex items-center justify-center">
                <Bot className="w-4 h-4 text-clinical-teal" />
              </div>
              <div>
                <div className="text-[13px] font-heading font-bold text-slate-800">AI Clinical Assistant</div>
                <div className={`text-[11px] ${AI_STATES[state].color} flex items-center gap-1`}>
                  <Waveform state={state} monitoring={autoListen} /> {AI_STATES[state].label}
                  {muted && <span className="text-clinical-red">(muted)</span>}
                </div>
              </div>
            </div>
            <button onClick={() => setExpanded(false)} className="p-1.5 rounded-lg hover:bg-white/50"><X className="w-4 h-4 text-slate-400" /></button>
          </div>

          <div className="flex-1 overflow-y-auto p-2.5 space-y-2.5 scrollbar-thin min-h-[180px] max-h-[36vh]">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] rounded-2xl px-2.5 py-1.5 text-[13px] ${msg.role === "user" ? "bg-clinical-teal text-white rounded-br-sm" : "bg-white/70 text-slate-800 rounded-bl-sm backdrop-blur-sm"}`}>
                  {msg.role === "assistant" ? <ReactMarkdown className="prose prose-sm max-w-none [&_p]:my-1 [&_strong]:text-clinical-teal">{msg.content}</ReactMarkdown> : <p>{msg.content}</p>}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <div className="px-2.5 py-2 border-t border-white/40 bg-white/40">
            <div className="flex items-center gap-1.5">
              <button onClick={toggleVoice}
                className={`p-2 rounded-lg transition-all ${listening ? "bg-clinical-red/20 text-clinical-red animate-pulse" : "bg-white/60 text-slate-500 hover:text-clinical-teal"}`}
                title={listening ? "Stop listening" : "Start voice input"} aria-label="Microphone">
                <Mic className="w-3.5 h-3.5" />
              </button>
              <button onClick={toggleAutoListen}
                className={`p-2 rounded-lg transition-all ${autoListen ? "bg-emerald-100 text-emerald-700" : "bg-white/60 text-slate-500 hover:text-clinical-teal"}`}
                title={autoListen ? "Turn off periodic command listening" : "Turn on periodic command listening"}
                aria-label="Periodic voice command monitoring" aria-pressed={autoListen}>
                {autoListen ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
              </button>
              <button onClick={toggleMute}
                className={`p-2 rounded-lg transition-all ${muted ? "bg-clinical-red/10 text-clinical-red" : "bg-white/60 text-slate-500 hover:text-clinical-teal"}`}
                title={muted ? "Enable assistant speech" : "Mute assistant speech"} aria-label="Assistant speech output">
                {muted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
              </button>
              <button onClick={handleStopSpeaking} disabled={state !== "speaking"}
                className="p-2 rounded-lg bg-white/60 text-slate-500 hover:text-clinical-red disabled:opacity-30 transition-all"
                title="Stop speaking" aria-label="Stop speaking">
                <Square className="w-3.5 h-3.5" />
              </button>
              <input type="text" value={input} onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder="Ask about care, place items…"
                className="flex-1 bg-white/60 border border-white/60 rounded-lg px-2.5 py-2 text-[13px] text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-clinical-teal/50" />
              <button onClick={() => handleSend()} disabled={!input.trim()}
                className="p-2 rounded-lg bg-clinical-teal text-white disabled:opacity-40 hover:opacity-90 transition-opacity" aria-label="Send">
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
            {listening ? <p className="mt-1.5 text-center text-[10px] font-bold text-red-600">● Microphone active — listening for a command</p> : autoListen && <p className="mt-1.5 text-center text-[10px] text-emerald-700">Voice monitoring is on — the assistant will listen again at intervals</p>}
          </div>
        </div>
      )}
    </>
  );
}