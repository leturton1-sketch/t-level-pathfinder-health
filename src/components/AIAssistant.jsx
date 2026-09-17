import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Bot, X, Mic, Volume2, VolumeX, Square, GripVertical, Maximize2, Minimize2 } from "lucide-react";
import FloatingAICompanion from "@/components/ai/FloatingAICompanion";
import { base44 } from "@/api/base44Client";
import { getCurrentUser, isAdmin } from "@/lib/clinicalAuth";
import { SK_CODES, PERFORMANCE_OUTCOMES } from "@/lib/specData";
import { useVoiceSynthesis } from "@/hooks/useVoiceSynthesis";
import { getAssistantIdentity } from "@/lib/aiAssistantIdentity";
import AIDiagnostic from "@/components/ai/AIDiagnostic";
import AIComposer from "@/components/ai/AIComposer";
import ReactMarkdown from "react-markdown";
import { dispatchAiCommand } from "@/lib/aiTutorControl";

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

const POS_KEY = "pathfinder-ai-panel-position";
const TRANSPARENCY_KEY = "pathfinder-ai-panel-transparency";
const DEFAULT_POS = { x: -1, y: -1 }; // -1 = use default anchor (beside the toggle)

function loadTransparency() {
  if (typeof window === "undefined") return 15;
  const raw = window.localStorage.getItem(TRANSPARENCY_KEY);
  if (raw === null) return 15;
  const saved = Number(raw);
  return Number.isFinite(saved) ? Math.min(45, Math.max(0, saved)) : 15;
}

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
  const [fullChat, setFullChat] = useState(false);
  const [state, setState] = useState("idle");
  const [attentionCue, setAttentionCue] = useState(0);
  const [attentionKind, setAttentionKind] = useState("none");
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [diagnostic, setDiagnostic] = useState(false);
  const [contextEnabled, setContextEnabled] = useState(true);
  const admin = isAdmin();
  const [listening, setListening] = useState(false);
  const [inputMode, setInputMode] = useState("text");
  const [autoListen, setAutoListen] = useState(false);
  const [pos, setPos] = useState(loadPos);
  const [panelTransparency, setPanelTransparency] = useState(loadTransparency);
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
  const requestIdRef = useRef(0);
  const user = getCurrentUser();
  const identity = getAssistantIdentity(synth.prefs, user);
  const panelRef = useRef(null);
  const dragRef = useRef({ active: false, dx: 0, dy: 0, moved: false });

  useEffect(() => { mutedRef.current = muted; }, [muted]);
  useEffect(() => { autoListenRef.current = autoListen; }, [autoListen]);
  useEffect(() => { assistantStateRef.current = state; }, [state]);
  useEffect(() => {
    window.localStorage.setItem(TRANSPARENCY_KEY, String(panelTransparency));
  }, [panelTransparency]);

  useEffect(() => () => {
    window.clearTimeout(listenTimerRef.current);
    listeningRef.current = false;
    try { recognitionRef.current?.stop(); } catch {}
  }, []);

  const systemPrompt = `You are ${identity.fullName} (${identity.title}), the Pathfinder AI Clinical Assistant supporting T Level Health students specialising in adult nursing. Use British English. Be encouraging, clinically accurate, and concise. Address the user by name and tailor your support to their role. The user is ${user?.full_name || "a student"} (role: ${user?.role || "student"}). Your role is to help with nursing studies, understanding and knowledge, the T Level specification, simulation, admin and knowledge-based tasks. Context: ${context}. Skill Codes: ${JSON.stringify(SK_CODES)}. Performance Outcomes: ${JSON.stringify(PERFORMANCE_OUTCOMES)}.

WARD MANAGEMENT: In edit mode you can help place items (bed, bedside_cabinet, observation_monitor, iv_stand, curtain, chair, overbed_table, waste_bin, sink). Bed designations: A1-A4 (Suite A), B1-B4 (Suite B).
Include a ward_action object for ward commands, otherwise set action to "none".
${["super_admin", "admin", "tutor"].includes(user?.role) ? `APP CONTROL: As this user is a ${user?.role}, you may coordinate Pathfinder on their behalf using app_action. You can navigate or coordinate these modules: dashboard, theory, care_planning, ward_simulation, knowledge_library, interactive_learning, anatomy_physiology, health_hub, clinical_skills, ai_models, performance, reflection, esp_practice, scenario_authoring, scenario_templates, profile, voice_assistant, curriculum_readiness, employer_portal, talent_card. Supported types: navigate_module {module}; coordinate_module {module, moduleAction, payload}; create_scenario {scenarioName, patientName, patientCondition and optional clinical fields}; update_scenario {scenarioId and only the fields requested}; start_simulation {scenarioId, scenarioName}; end_simulation {}; take_control {controller: "user"|"ai"}; assign_staff {name, dutyRole, status}; remove_staff {staffId}; create_user {username, fullName, role, cohort}; update_user_role {userId, role}. Use an action only after a clear request. Never invent clinical facts, never delete a scenario or user, and do not take AI ward control unless the user explicitly asks. Set app_action.type to "none" otherwise.` : "This user is a student, so do not offer or attempt app_action commands — only tutors and admins can direct simulations, staffing or accounts."}
Set attention_cue to "advice" when giving important guidance, "suggestion" when proposing a helpful next step, or "none" for ordinary answers.`;

  useEffect(() => {
    const handler = (e) => { wardStateRef.current = e.detail; };
    window.addEventListener("ward-state-update", handler);
    return () => window.removeEventListener("ward-state-update", handler);
  }, []);

  useEffect(() => {
    if (expanded && messages.length === 0) {
      setMessages([{
        role: "assistant",
        content: identity.intro,
      }]);
    }
  }, [expanded]);

  useEffect(() => { messagesEndRef?.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, state]);

  const playVoiceControlAlert = () => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const audioContext = new AudioContext();
      const gain = audioContext.createGain();
      const oscillator = audioContext.createOscillator();
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(740, audioContext.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(1040, audioContext.currentTime + 0.16);
      gain.gain.setValueAtTime(0.0001, audioContext.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.12, audioContext.currentTime + 0.025);
      gain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 0.28);
      oscillator.connect(gain);
      gain.connect(audioContext.destination);
      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.3);
      oscillator.addEventListener("ended", () => audioContext.close());
    } catch {
      // Voice control still works when a browser blocks non-essential alert audio.
    }
  };

  const speak = async (text) => {
    if (mutedRef.current) { setState("idle"); return; }
    // Show "thinking" while cloud TTS is being generated; switch to "speaking"
    // only when the audio actually starts, so the waveform animation matches
    // the real playback duration.
    setState("thinking");
    await synth.speak(text, {
      onStart: () => setState("speaking"),
      onEnd: () => setState(listeningRef.current ? "listening" : "idle"),
    });
  };

  const handleSend = async (overrideText, attachments = []) => {
    const text = overrideText || input;
    if (!text.trim() || state === "thinking") return;
    const requestId = ++requestIdRef.current;
    const userMsg = { role: "user", content: text.trim() };
    setMessages((prev) => [...prev, userMsg]);
    if (!overrideText) setInput("");
    setState("thinking");
    if (listeningRef.current && recognitionRef.current) { try { recognitionRef.current.stop(); } catch {} }

    try {
      const wardState = wardStateRef.current;
      const wardContext = contextEnabled && wardState ? `\n\nWARD STATE:\n- Edit Mode: ${wardState.editMode}\n- Suite: ${wardState.suite}\n- Placed Items: ${JSON.stringify(wardState.placedItems)}\n- Available Types: ${JSON.stringify(wardState.availableItemTypes)}\n` : "";
      const uploaded = await Promise.all(attachments.map(async (file) => {
        const result = await base44.integrations.Core.UploadFile({ file });
        return `${file.name}: ${result.file_url}`;
      }));
      const attachmentContext = uploaded.length ? `\n\nATTACHMENTS:\n${uploaded.join("\n")}` : "";
      const result = await base44.functions.invoke("openaiChat", {
        prompt: `${systemPrompt}${contextEnabled ? wardContext : "\n\nThe user has disabled current-page context."}${attachmentContext}\n\nConversation:\n${messages.map(m => `${m.role}: ${m.content}`).join("\n")}\nuser: ${userMsg.content}\nassistant:`,
        response_json_schema: {
          type: "object",
          properties: {
            reply: { type: "string" },
            attention_cue: { type: "string", enum: ["advice", "suggestion", "none"] },
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
            app_action: {
              type: "object",
              properties: {
                type: { type: "string", enum: ["navigate_module", "coordinate_module", "create_scenario", "update_scenario", "start_simulation", "end_simulation", "take_control", "assign_staff", "remove_staff", "create_user", "update_user_role", "none"] },
                module: { type: "string", enum: ["dashboard", "theory", "care_planning", "ward_simulation", "knowledge_library", "interactive_learning", "anatomy_physiology", "health_hub", "clinical_skills", "ai_models", "performance", "reflection", "esp_practice", "scenario_authoring", "scenario_templates", "profile", "voice_assistant", "curriculum_readiness", "employer_portal", "talent_card"] },
                moduleAction: { type: "string" },
                openModule: { type: "boolean" },
                payload: { type: "object" },
                scenarioId: { type: "string" },
                scenarioName: { type: "string" },
                description: { type: "string" },
                difficulty: { type: "string", enum: ["guided", "intermediate", "independent"] },
                estimatedDuration: { type: "number" },
                patientName: { type: "string" },
                patientAge: { type: "number" },
                patientCondition: { type: "string" },
                comorbidities: { type: "string" },
                medications: { type: "string" },
                allergies: { type: "string" },
                bedNumber: { type: "string" },
                initialVitals: { type: "object" },
                initialNews2: { type: "number" },
                decisionTree: { type: "string" },
                skCodes: { type: "array", items: { type: "string" } },
                performanceOutcomes: { type: "array", items: { type: "string" } },
                debriefRationale: { type: "string" },
                assignedCohorts: { type: "array", items: { type: "string" } },
                category: { type: "string", enum: ["acute_care", "long_term_conditions", "mental_health", "end_of_life", "emergency", "community", "other"] },
                controller: { type: "string", enum: ["user", "ai"] },
                name: { type: "string" },
                dutyRole: { type: "string" },
                status: { type: "string" },
                staffId: { type: "string" },
                username: { type: "string" },
                fullName: { type: "string" },
                role: { type: "string" },
                cohort: { type: "string" },
                userId: { type: "string" },
              },
            },
          },
        },
      });
      if (requestId !== requestIdRef.current) return;
      const response = result?.data ?? result;
      if (response?.error) throw new Error(response.error);
      const reply = response.reply || response.content || response;
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
      if (response.ward_action && response.ward_action.action !== "none") {
        window.dispatchEvent(new CustomEvent("ward-ai-command", { detail: response.ward_action }));
      }
      if (response.app_action && response.app_action.type && response.app_action.type !== "none") {
        const cmdResult = await dispatchAiCommand(response.app_action, user, { navigate });
        if (!cmdResult.ok) {
          setMessages((prev) => [...prev, { role: "assistant", content: cmdResult.message }]);
        }
      }
      const responseCue = response?.attention_cue;
      const inferredCue = /\b(i (?:recommend|suggest|advise)|my (?:advice|suggestion)|you should|consider)\b/i.test(String(reply))
        ? "suggestion"
        : "none";
      const cue = ["advice", "suggestion"].includes(responseCue) ? responseCue : inferredCue;
      if (cue !== "none") {
        setAttentionKind(cue);
        setAttentionCue((current) => current + 1);
      }
      const spokenReply = cue === "advice"
        ? `I have some advice for you. ${reply}`
        : cue === "suggestion"
          ? `I have a suggestion for you. ${reply}`
          : reply;
      await speak(spokenReply);
    } catch {
      if (requestId !== requestIdRef.current) return;
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
      playVoiceControlAlert();
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

  const toggleAutoListen = () => {
    const enabled = !autoListenRef.current;
    autoListenRef.current = enabled;
    setAutoListen(enabled);
    window.localStorage.setItem("clinicaledge-auto-listen", String(enabled));
    window.clearTimeout(listenTimerRef.current);

    if (enabled) {
      setState("speaking");
      synth.speak("Voice control is on. I am your Pathfinder Clinical Educator and I am listening.", {
        onStart: () => setState("speaking"),
        onEnd: () => {
          if (autoListenRef.current) startRecognition();
          else setState("idle");
        },
      });
    } else {
      synth.stop();
      listeningRef.current = false;
      try { recognitionRef.current?.stop(); } catch {}
      setListening(false);
      setState("idle");
    }
  };

  useEffect(() => {
    const handleVoiceToggle = () => toggleAutoListen();
    window.addEventListener("pathfinder:ai-voice-toggle", handleVoiceToggle);
    return () => window.removeEventListener("pathfinder:ai-voice-toggle", handleVoiceToggle);
  });

  useEffect(() => {
    window.dispatchEvent(new CustomEvent("pathfinder:ai-voice-state", {
      detail: { enabled: autoListen, listening },
    }));
    document.body.dataset.voiceControl = autoListen ? (listening ? "listening" : "on") : "off";
  }, [autoListen, listening]);

  useEffect(() => {
    if (autoListen && !listening && state !== "speaking" && state !== "thinking") scheduleNextListen();
    else if (!autoListen) window.clearTimeout(listenTimerRef.current);
    return () => window.clearTimeout(listenTimerRef.current);
  }, [autoListen, listening, state]);

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

  const handleStop = () => {
    requestIdRef.current += 1;
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
  const textOpacity = 1 - panelTransparency / 100;
  const panelStyle = {
    opacity: textOpacity,
    resize: "both",
    overflow: "auto",
    minWidth: fullChat ? 292 : 260,
    minHeight: fullChat ? 330 : 132,
    maxWidth: "calc(100vw - 16px)",
    maxHeight: "calc(100vh - 16px)",
    ...(anchored ? {} : { left: pos.x, top: pos.y }),
  };
  const lastAssistant = [...messages].reverse().find((m) => m.role === "assistant");
  const cleanLast = lastAssistant ? lastAssistant.content.replace(/[*#`]/g, "").replace(/\s+/g, " ").trim() : "";
  const bubbleText =
    state === "thinking" ? "Thinking…"
      : state === "listening" ? "Listening…"
      : state === "speaking" ? (cleanLast ? (cleanLast.length > 110 ? cleanLast.slice(0, 110) + "…" : cleanLast) : "Speaking…")
      : "";
  const panelClass = anchored
    ? "fixed bottom-[238px] right-4 z-[2147483646]"
    : "fixed z-[2147483646]";

  return (
    <>
      <FloatingAICompanion state={state} expanded={expanded} attentionCue={attentionCue} attentionKind={attentionKind} onActivate={() => setExpanded((value) => !value)} />
      {bubbleText && (
        <div style={{ opacity: textOpacity }} className="pointer-events-none fixed bottom-[194px] right-6 z-[2147483645] max-w-[230px] rounded-2xl border border-white/70 bg-white/70 px-3 py-1.5 text-[11px] leading-snug text-slate-700 shadow-lg backdrop-blur-md animate-fade-in">
          <span className="mr-1 font-bold text-clinical-teal">Pathfinder AI:</span>{bubbleText}
        </div>
      )}

      {/* Expanded panel — translucent, 10% smaller, draggable */}
      {expanded && (
        <div
          ref={panelRef}
          style={panelStyle}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          className={`${panelClass} ${fullChat ? "w-[calc(100vw-2rem)] sm:w-[330px] max-h-[50vh]" : "w-[calc(100vw-2rem)] sm:w-[292px]"} flex flex-col rounded-2xl border border-clinical-teal/30 bg-white/80 backdrop-blur-xl shadow-2xl animate-slide-up overflow-hidden transition-[width,max-height] duration-300`}
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
                <div className="text-[13px] font-heading font-bold text-slate-800 leading-tight">{identity.fullName}</div>
                <div className="text-[9px] font-semibold leading-tight text-slate-400">{identity.title}</div>
                <div className={`text-[11px] ${AI_STATES[state].color} flex items-center gap-1`}>
                  <Waveform state={state} monitoring={autoListen} /> {AI_STATES[state].label}
                  {muted && <span className="text-clinical-red">(muted)</span>}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2" onPointerDown={(event) => event.stopPropagation()}>
              {fullChat && (
                <label className="flex items-center gap-1 text-[9px] font-semibold text-slate-500" title="Adjust chat transparency">
                  <span className="hidden sm:inline">Opacity</span>
                  <input type="range" min="0" max="45" step="5" value={panelTransparency}
                    onChange={(event) => setPanelTransparency(Number(event.target.value))}
                    aria-label="Pathfinder chat transparency" className="w-12 accent-teal-600" />
                </label>
              )}
              <button type="button" onClick={() => setFullChat((value) => !value)}
                aria-label={fullChat ? "Use compact chat" : "Expand chat history"}
                title={fullChat ? "Compact chat" : "Expand chat"}
                className="p-1.5 rounded-lg hover:bg-white/50">
                {fullChat ? <Minimize2 className="w-4 h-4 text-slate-500" /> : <Maximize2 className="w-4 h-4 text-slate-500" />}
              </button>
              <button type="button" onPointerDown={(event) => event.stopPropagation()} onClick={() => setExpanded(false)} aria-label="Close Pathfinder Clinical AI chat" title="Close chat" className="p-1.5 rounded-lg hover:bg-white/50"><X className="w-4 h-4 text-slate-400" /></button>
            </div>
          </div>

          {fullChat && (diagnostic && admin ? (
            <AIDiagnostic />
          ) : (
          <div className="flex-1 overflow-y-auto p-2.5 space-y-2.5 scrollbar-thin min-h-[120px] max-h-[30vh]">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] rounded-2xl px-2.5 py-1.5 text-[13px] ${msg.role === "user" ? "bg-clinical-teal text-white rounded-br-sm" : "bg-white/70 text-slate-800 rounded-bl-sm backdrop-blur-sm"}`}>
                  {msg.role === "assistant" ? <ReactMarkdown className="prose prose-sm max-w-none [&_p]:my-1 [&_strong]:text-clinical-teal">{msg.content}</ReactMarkdown> : <p>{msg.content}</p>}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
          ))}

          <div className={`shrink-0 ${fullChat ? "border-t border-white/50 bg-slate-100/85 p-2.5" : "bg-transparent p-2"}`}>
            <AIComposer
              value={input}
              onChange={setInput}
              onSend={handleSend}
              isProcessing={state === "thinking"}
              onStop={handleStop}
              contextEnabled={contextEnabled}
              onContextChange={setContextEnabled}
              diagnosticEnabled={diagnostic}
              onDiagnosticChange={setDiagnostic}
              isAdmin={admin}
              inputMode={inputMode}
              onInputModeChange={(mode) => {
                setInputMode(mode);
                if (mode === "voice" && !autoListenRef.current) toggleAutoListen();
                else if (mode === "text" && autoListenRef.current) toggleAutoListen();
              }}
              isListening={listening || autoListen}
              onVoicePress={toggleAutoListen}
              compact={!fullChat}
              leadingControls={<>
                <button onClick={toggleAutoListen} className={`ai-composer-plus ${listening || autoListen ? "animate-pulse !border-red-300 !bg-red-50 !text-red-600" : ""}`} aria-label={autoListen ? "Turn off Clinical Educator voice control" : "Turn on Clinical Educator voice control"}><Mic className="h-3.5 w-3.5" /></button>
                <button onClick={toggleMute} className={`ai-composer-plus ${muted ? "text-red-600" : ""}`} aria-label={muted ? "Enable assistant speech" : "Mute assistant speech"}>{muted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}</button>
                <button onClick={handleStopSpeaking} disabled={state !== "speaking"} className="ai-composer-plus disabled:opacity-30" aria-label="Stop speaking"><Square className="h-3.5 w-3.5" /></button>
              </>}
            />
            {autoListen && <p className="mt-1.5 text-center text-[10px] font-bold text-red-600">{listening ? "● Microphone active — Clinical Educator is listening" : "● Voice control active — awaiting your command"}</p>}
          </div>
        </div>
      )}
    </>
  );
}