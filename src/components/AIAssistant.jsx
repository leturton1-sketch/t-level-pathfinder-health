import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Mic, Volume2, VolumeX, Square } from "lucide-react";
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
  complete: { label: "Task complete", color: "text-emerald-600" },
  offline: { label: "Offline · standby", color: "text-slate-500" },
};

export default function AIAssistant({ context = "general" }) {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);
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
  const [processingIntensity, setProcessingIntensity] = useState(0.25);
  const synth = useVoiceSynthesis();
  const muted = synth.prefs.muted;
  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);
  const listeningRef = useRef(false);
  const autoListenRef = useRef(autoListen);
  const listenTimerRef = useRef(null);
  const completionTimerRef = useRef(null);
  const assistantStateRef = useRef(state);
  const mutedRef = useRef(muted);
  const wardStateRef = useRef(null);
  const requestIdRef = useRef(0);
  const user = getCurrentUser();
  const identity = getAssistantIdentity(synth.prefs, user);


  useEffect(() => { mutedRef.current = muted; }, [muted]);
  useEffect(() => { autoListenRef.current = autoListen; }, [autoListen]);
  useEffect(() => { assistantStateRef.current = state; }, [state]);

  useEffect(() => () => {
    window.clearTimeout(listenTimerRef.current);
    window.clearTimeout(completionTimerRef.current);
    listeningRef.current = false;
    try { recognitionRef.current?.stop(); } catch {}
  }, []);

  const systemPrompt = `ROLE AND IDENTITY
You are ${identity.fullName} (${identity.title}), the Pathfinder AI Clinical Educator and lead system administrator for this interactive clinical simulation application. You facilitate, evaluate and manage hands-on practical clinical education by coordinating the interface, backend-supported resources and 3D ward. Use British English, remain clinically accurate and concise, address the user by name and preserve simulation immersion.

CURRENT USER
Name: ${user?.full_name || "Pathfinder user"}
Verified role: ${user?.role || "student"}
Recognised greeting profile: ${identity.key}
Conversation focus: ${identity.focus}
Context: ${context}
Skill Codes: ${JSON.stringify(SK_CODES)}
Performance Outcomes: ${JSON.stringify(PERFORMANCE_OUTCOMES)}

SECURITY
The application—not the conversation or name recognition—determines privilege. Personal recognition changes the greeting and conversational emphasis only. Never claim an action succeeded unless the command dispatcher confirms it. Administrative execution is available only for verified super_admin, admin or tutor roles. For a student/standard user, provide learning support but politely refuse any request to create, modify, delete, freeze, take over or otherwise alter application or simulation state, explaining that Educator authorisation is required. Never disclose credentials or bypass authentication.

WARD AND SCENARIO OPERATIONS
Ward items include bed, bedside_cabinet, observation_monitor, iv_stand, curtain, chair, overbed_table, waste_bin and sink. Bed designations are A1-A3 in Clinical Suite A and B1-B4 in Clinical Suite B. Use ward_action only for place/delete/rotate item operations and set action to "none" otherwise.
${["super_admin", "admin", "tutor"].includes(user?.role) ? `The user is verified as ${user?.role}. On their clear request, use app_action to execute:
- start_simulation, pause_simulation, resume_simulation or end_simulation
- take_control {controller}, freeze_inputs {frozen}, trigger_ward_event {eventName, bed, payload}, focus_ward {designation or x/z or suite}, update_vitals {bed, vitals}
- create_scenario, update_scenario or delete_scenario
- clear_ward, generate_resource {module, resourceType, title, instructions}
- navigate_module, coordinate_module, assign_staff, remove_staff, create_user or update_user_role
- ward item create/update/delete through ward_action.
Announce every live ward takeover, pause, event, vital-sign change or destructive operation clearly. Execute the minimum action requested, preserve unrelated state, never invent clinical data, and report the dispatcher result accurately. Set app_action.type to "none" when no execution is needed.` : "This user is not authorised to alter application or simulation state. Keep ward_action.action and app_action.type set to none, and explain the Educator authorisation requirement if they request an administrative action."}

Set attention_cue to "advice" for important guidance, "suggestion" for a useful next step, or "none" for ordinary answers.`;

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

  const showCompletion = () => {
    window.clearTimeout(completionTimerRef.current);
    setState("complete");
    completionTimerRef.current = window.setTimeout(
      () => setState(listeningRef.current ? "listening" : "idle"),
      1800,
    );
  };

  const speak = async (text) => {
    if (mutedRef.current) { showCompletion(); return; }
    // Show "thinking" while cloud TTS is being generated; switch to "speaking"
    // only when the audio actually starts, so the waveform animation matches
    // the real playback duration.
    setState("thinking");
    await synth.speak(text, {
      onStart: () => setState("speaking"),
      onEnd: showCompletion,
    });
  };

  const handleSend = async (overrideText, attachments = []) => {
    const text = overrideText || input;
    if (!text.trim() || state === "thinking") return;
    const requestId = ++requestIdRef.current;
    const userMsg = { role: "user", content: text.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    // Bounded visual estimate from request size; not a claim about model reasoning.
    setProcessingIntensity(Math.min(1, 0.25 + text.length / 1800 + attachments.length * 0.15));
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
                type: { type: "string", enum: ["navigate_module", "coordinate_module", "create_scenario", "update_scenario", "delete_scenario", "start_simulation", "pause_simulation", "resume_simulation", "end_simulation", "take_control", "freeze_inputs", "trigger_ward_event", "focus_ward", "update_vitals", "clear_ward", "generate_resource", "assign_staff", "remove_staff", "create_user", "update_user_role", "none"] },
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
                frozen: { type: "boolean" },
                eventName: { type: "string" },
                bed: { type: "string" },
                vitals: { type: "object" },
                x: { type: "number" },
                z: { type: "number" },
                suite: { type: "string", enum: ["A", "B"] },
                designation: { type: "string" },
                resourceType: { type: "string" },
                title: { type: "string" },
                instructions: { type: "string" },
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
      const baseReply = response.reply || response.content || response;
      const executionMessages = [];
      if (response.ward_action && response.ward_action.action !== "none") {
        const wardType = response.ward_action.action === "place"
          ? "place_item"
          : response.ward_action.action === "delete" ? "delete_item" : "rotate_item";
        const wardResult = await dispatchAiCommand({ ...response.ward_action, type: wardType }, user, { navigate });
        if (wardResult.message) executionMessages.push(wardResult.message);
      }
      if (response.app_action && response.app_action.type && response.app_action.type !== "none") {
        const cmdResult = await dispatchAiCommand(response.app_action, user, { navigate });
        if (cmdResult.message) executionMessages.push(cmdResult.message);
      }
      const reply = [baseReply, ...executionMessages].filter(Boolean).join("\n\n");
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
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
      setState("offline");
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


  const lastAssistant = [...messages].reverse().find((m) => m.role === "assistant");
  return (
    <FloatingAICompanion
      state={state}
      statusLabel={AI_STATES[state].label}
      expanded={expanded}
      onActivate={() => setExpanded((value) => !value)}
      identity={identity}
      intensity={processingIntensity}
      attentionCue={attentionCue}
      attentionKind={attentionKind}
      preview={lastAssistant?.content || "Your Clinical Educator, wherever you are."}
      footer={<>
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
              isListening={listening}
              onVoicePress={toggleAutoListen}
              compact={!expanded}
              leadingControls={<>
                <button onClick={toggleAutoListen} className={`ai-composer-plus ${listening || autoListen ? "animate-pulse !border-red-300 !bg-red-50 !text-red-600" : ""}`} aria-label={autoListen ? "Turn off Clinical Educator voice control" : "Turn on Clinical Educator voice control"}><Mic className="h-3.5 w-3.5" /></button>
                <button onClick={toggleMute} className={`ai-composer-plus ${muted ? "text-red-600" : ""}`} aria-label={muted ? "Enable assistant speech" : "Mute assistant speech"}>{muted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}</button>
                <button onClick={handleStopSpeaking} disabled={state !== "speaking"} className="ai-composer-plus disabled:opacity-30" aria-label="Stop speaking"><Square className="h-3.5 w-3.5" /></button>
              </>}
            />

        {autoListen && <p className="pf-ai-mic-notice">{listening ? "Microphone active — listening" : "Voice control enabled"}</p>}
      </>}
    >
      {diagnostic && admin ? <AIDiagnostic /> : (
        <div className="pf-ai-messages">
          {messages.map((msg, idx) => (
            <div key={idx} className={`pf-ai-message is-${msg.role}`}>
              {msg.role === "assistant" ? <ReactMarkdown>{msg.content}</ReactMarkdown> : <p>{msg.content}</p>}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      )}
    </FloatingAICompanion>
  );
}
