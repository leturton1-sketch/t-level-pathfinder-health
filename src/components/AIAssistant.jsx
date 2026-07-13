import { useState, useRef, useEffect } from "react";
import { Bot, X, Send, Mic, Volume2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { getCurrentUser } from "@/lib/clinicalAuth";
import { SK_CODES, PERFORMANCE_OUTCOMES } from "@/lib/specData";
import ReactMarkdown from "react-markdown";

const AI_STATES = {
  idle: { label: "Ready", color: "text-clinical-teal" },
  thinking: { label: "Thinking…", color: "text-clinical-amber" },
  speaking: { label: "Responding…", color: "text-clinical-green" },
  listening: { label: "Listening…", color: "text-clinical-teal" },
};

export default function AIAssistant({ context = "general" }) {
  const [expanded, setExpanded] = useState(false);
  const [state, setState] = useState("idle");
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [listening, setListening] = useState(false);
  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);
  const user = getCurrentUser();

  const systemPrompt = `You are the ClinicalEdge AI Clinical Assistant, supporting T Level Health students specialising in adult nursing. You help with learning, clinical skills, care planning, and simulation support. Use British English spelling. Be encouraging, clinically accurate, and reference the T Level specification, NHS England guidance, and clinicalskills.net where relevant. Keep responses concise and structured. The user's name is ${user?.full_name || "Student"}. Context: ${context}. Available Skill Codes: ${JSON.stringify(SK_CODES)}. Available Performance Outcomes: ${JSON.stringify(PERFORMANCE_OUTCOMES)}.`;

  useEffect(() => {
    if (expanded && messages.length === 0) {
      setMessages([
        {
          role: "assistant",
          content: `Hello ${user?.full_name?.split(" ")[0] || "there"}! I'm your AI Clinical Assistant. I can help you with:\n\n- **Theory & knowledge** — explaining clinical concepts\n- **Care planning** — ABCDE, NEWS2, SMART goals, risk assessments\n- **Ward simulation** — guiding you through scenarios\n- **Reflective practice** — supporting your learning\n\nAsk me anything, or use voice by tapping the microphone.`,
        },
      ]);
    }
  }, [expanded]);

  useEffect(() => {
    messagesEndRef?.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, state]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg = { role: "user", content: input.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setState("thinking");

    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `${systemPrompt}\n\nConversation so far:\n${messages.map((m) => `${m.role}: ${m.content}`).join("\n")}\nuser: ${userMsg.content}\nassistant:`,
        response_json_schema: {
          type: "object",
          properties: {
            reply: { type: "string" },
          },
        },
      });

      const reply = response.reply || response;
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
      setState("speaking");

      // TTS if enabled
      if ("speechSynthesis" in window) {
        const utterance = new SpeechSynthesisUtterance(reply.replace(/[*#`]/g, ""));
        utterance.rate = 0.95;
        utterance.pitch = user?.ai_persona === "male" ? 0.7 : 1.1;
        utterance.onend = () => setState("idle");
        speechSynthesis.speak(utterance);
      } else {
        setTimeout(() => setState("idle"), 2000);
      }
    } catch (err) {
      setMessages((prev) => [...prev, { role: "assistant", content: "I apologise — I'm having trouble connecting right now. Please try again." }]);
      setState("idle");
    }
  };

  const toggleVoice = () => {
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      setState("idle");
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice input is not supported on this device. Please type your question instead.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-GB";

    recognition.onstart = () => {
      setListening(true);
      setState("listening");
    };
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
      setListening(false);
      setState("idle");
    };
    recognition.onerror = () => {
      setListening(false);
      setState("idle");
    };
    recognition.onend = () => {
      setListening(false);
      if (state === "listening") setState("idle");
    };

    recognition.start();
  };

  const Waveform = ({ state }) => {
    const bars = 5;
    const isActive = state === "thinking" || state === "speaking" || state === "listening";
    return (
      <div className="flex items-end gap-0.5 h-4">
        {Array.from({ length: bars }).map((_, i) => (
          <div
            key={i}
            className={`w-1 rounded-full ${isActive ? "bg-clinical-teal waveform-bar" : "bg-muted-foreground/40"}`}
            style={{
              height: isActive ? "100%" : "30%",
              animationDelay: `${i * 0.1}s`,
              animationDuration: state === "thinking" ? "0.8s" : "0.5s",
            }}
          />
        ))}
      </div>
    );
  };

  if (!expanded) {
    return (
      <div className="fixed bottom-20 right-4 z-50">
        <button
          onClick={() => setExpanded(true)}
          className="group flex items-center gap-2 rounded-full border border-clinical-teal/40 bg-card/90 backdrop-blur-md px-4 py-2.5 shadow-lg hover:border-clinical-teal transition-all"
        >
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
    <div className="fixed bottom-20 right-4 z-50 w-[calc(100vw-2rem)] sm:w-96 max-h-[60vh] flex flex-col rounded-2xl border border-clinical-teal/30 bg-card/95 backdrop-blur-xl shadow-2xl animate-slide-up overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-border bg-background/50">
        <div className="flex items-center gap-2">
          <div className="relative">
            <div className="w-8 h-8 rounded-full bg-clinical-teal/20 flex items-center justify-center">
              <Bot className="w-5 h-5 text-clinical-teal" />
            </div>
          </div>
          <div>
            <div className="text-sm font-bold text-foreground">AI Clinical Assistant</div>
            <div className={`text-xs ${AI_STATES[state].color} flex items-center gap-1`}>
              <Waveform state={state} />
              {AI_STATES[state].label}
            </div>
          </div>
        </div>
        <button onClick={() => setExpanded(false)} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
          <X className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 scrollbar-thin min-h-[200px] max-h-[40vh]">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                msg.role === "user"
                  ? "bg-clinical-teal text-white rounded-br-sm"
                  : "bg-muted text-foreground rounded-bl-sm"
              }`}
            >
              {msg.role === "assistant" ? (
                <ReactMarkdown className="prose prose-sm prose-invert max-w-none [&_p]:my-1 [&_ul]:my-1 [&_li]:my-0.5 [&_strong]:text-clinical-teal">
                  {msg.content}
                </ReactMarkdown>
              ) : (
                <p>{msg.content}</p>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-border bg-background/50">
        <div className="flex items-center gap-2">
          <button
            onClick={toggleVoice}
            className={`p-2.5 rounded-xl transition-all ${
              listening ? "bg-clinical-red/20 text-clinical-red animate-pulse" : "bg-muted text-muted-foreground hover:text-clinical-teal"
            }`}
            title={listening ? "Stop listening" : "Voice input"}
          >
            <Mic className="w-4 h-4" />
          </button>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Ask about care planning, clinical skills…"
            className="flex-1 bg-muted/50 border border-border rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-clinical-teal/50"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className="p-2.5 rounded-xl bg-clinical-teal text-white disabled:opacity-40 hover:opacity-90 transition-opacity"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}