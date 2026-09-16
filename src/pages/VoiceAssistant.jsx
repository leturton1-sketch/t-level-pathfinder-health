import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import { Mic, Square, Volume2, VolumeX, Settings2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { isLoggedIn, getCurrentUser, isAdmin } from "@/lib/clinicalAuth";
import { loadPrefs, routeChat } from "@/lib/aiRouter";
import { useVoiceSynthesis } from "@/hooks/useVoiceSynthesis";
import { getRegionalVoicePrompt } from "@/lib/voicePreferences";
import { base44 } from "@/api/base44Client";
import AIComposer from "@/components/ai/AIComposer";
import AIDiagnostic from "@/components/ai/AIDiagnostic";
import ClinicalEducatorVideo from "@/components/voice/ClinicalEducatorVideo";

import "@/components/ai/clinical-educator.css";

const EDUCATOR_TRANSPARENCY_KEY = "pathfinder-educator-text-transparency";

function loadEducatorTransparency() {
  if (typeof window === "undefined") return 10;
  const raw = window.localStorage.getItem(EDUCATOR_TRANSPARENCY_KEY);
  if (raw === null) return 10;
  const saved = Number(raw);
  return Number.isFinite(saved) ? Math.min(45, Math.max(0, saved)) : 10;
}

const STATUS = {
  idle: "Ready to help",
  listening: "Listening…",
  working: "Preparing your response…",
  complete: "Response ready",
  offline: "Unable to connect — please try again",
};

async function invokeRoutedAssistant(prompt, onStage) {
  const prefs = loadPrefs();
  const messages = prefs.systemPrompt.trim()
    ? [{ role: "system", content: prefs.systemPrompt.trim() }, { role: "user", content: prompt }]
    : [{ role: "user", content: prompt }];
  return routeChat({ mode: prefs.mode, prefs, messages, onStage });
}

export default function VoiceAssistant() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const synth = useVoiceSynthesis();
  const [user, setUser] = useState(null);
  const [admin, setAdmin] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [status, setStatus] = useState("idle");
  const [contextEnabled, setContextEnabled] = useState(true);
  const [diagnostic, setDiagnostic] = useState(false);
  const [educatorCue, setEducatorCue] = useState("neutral");
  const [educatorCueKey, setEducatorCueKey] = useState(0);
  const [conversationTransparency, setConversationTransparency] = useState(10);
  const [preferencesReady, setPreferencesReady] = useState(false);

  const [listening, setListening] = useState(false);
  const recognitionRef = useRef(null);
  const listeningRef = useRef(false);
  const educatorCueRef = useRef("neutral");
  const requestIdRef = useRef(0);
  const endRef = useRef(null);

  useEffect(() => {
    if (!isLoggedIn()) { navigate("/login"); return; }
    const currentUser = getCurrentUser();
    setUser(currentUser);
    setAdmin(isAdmin());
    setConversationTransparency(loadEducatorTransparency());
    setPreferencesReady(true);
    setMessages([{
      role: "assistant",
      content: `Hi ${currentUser?.full_name?.split(" ")[0] || "there"}! I'm Pathfinder AI, your clinical learning assistant. Ask me about a clinical skill, explore the theory behind it, or practise a care scenario. Type a question or use the microphone to begin.`,
    }]);
  }, [navigate]);

  useEffect(() => {
    if (preferencesReady) window.localStorage.setItem(EDUCATOR_TRANSPARENCY_KEY, String(conversationTransparency));
  }, [conversationTransparency, preferencesReady]);

  useEffect(() => {
    const conversation = endRef.current?.parentElement;
    if (conversation) conversation.scrollTop = conversation.scrollHeight;
  }, [messages, status]);
  useEffect(() => () => {
    requestIdRef.current += 1;
    listeningRef.current = false;
    recognitionRef.current?.abort();
  }, []);

  const showEducatorCue = (cue, force = false) => {
    if (!force && educatorCueRef.current === cue) return;
    educatorCueRef.current = cue;
    setEducatorCue(cue);
    setEducatorCueKey((value) => value + 1);
  };

  const speakCompletion = async (text, completionCue) => {
    setStatus("complete");
    if (synth.prefs.muted) showEducatorCue(completionCue, true);
    await synth.speak(text, {
      onStart: () => showEducatorCue(completionCue, true),
      onEnd: () => {
        setStatus(listeningRef.current ? "listening" : "idle");
        showEducatorCue("neutral");
      },
    });
  };

  const handleSend = async (overrideText, attachments = []) => {
    const text = (overrideText || input).trim();
    if (!text || status === "working") return;
    const requestId = ++requestIdRef.current;
    setMessages((p) => [...p, { role: "user", content: text }]);
    setInput("");
    setStatus("working");
    showEducatorCue("thinking");
    if (listeningRef.current) { try { recognitionRef.current?.stop(); } catch {} }
    try {
      const uploaded = await Promise.all(attachments.map(async (file) => {
        const result = await base44.integrations.Core.UploadFile({ file });
        return `${file.name}: ${result.file_url}`;
      }));
      const attachmentContext = uploaded.length ? `\n\nAttachments supplied by the user:\n${uploaded.join("\n")}` : "";
      const conversationContext = contextEnabled ? `\n\nConversation so far:\n${messages.map((m) => `${m.role}: ${m.content}`).join("\n")}` : "\n\nThe user has disabled current conversation context.";
      const result = await invokeRoutedAssistant(
        `You are the Clinical Educator, a warm, highly knowledgeable conversational clinical tutor for T Level Health students on Pathfinder Health. ${getRegionalVoicePrompt(synth.prefs.profileId)} Speak in natural British English with varied sentence length, gentle acknowledgement, and human conversational transitions. Answer the student directly, then ask at most one useful follow-up question when it genuinely helps learning. Avoid robotic headings, repeated disclaimers, and overly formal phrasing. Keep clinical guidance accurate and distinguish education from real-patient medical advice. The user's name is ${user?.full_name || "Student"}.${conversationContext}${attachmentContext}\nuser: ${text}\nassistant:`,
        () => showEducatorCue("working"));

      if (requestId !== requestIdRef.current) return;
      const reply = result.content || "Sorry, I didn't catch that.";

      setMessages((p) => [...p, { role: "assistant", content: reply }]);
      const positiveFeedback = /well done|good work|great job|excellent|correct|you got it|nice work/i.test(reply);
      await speakCompletion(reply, positiveFeedback ? "good_work" : "task_complete");
    } catch {
      if (requestId !== requestIdRef.current) return;
      const failureMessage = "I wasn't able to complete that task because the clinical assistant service is unavailable. Please try again.";
      setMessages((p) => [...p, { role: "assistant", content: failureMessage }]);
      setStatus("offline");
      showEducatorCue("neutral");
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
      showEducatorCue("neutral");
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
    r.onstart = () => { setListening(true); setStatus("listening"); showEducatorCue("hello"); };
    r.onresult = (e) => handleSend(e.results[0][0].transcript);
    r.onend = () => {
      listeningRef.current = false;
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
    showEducatorCue("neutral");
    setStatus(listeningRef.current ? "listening" : "idle");
  };

  return (
    <main className="clinical-educator">
      <header className="educator-heading">
        <div><p className="educator-eyebrow">Pathfinder Health · T-Level learning</p>
          <h1>Pathfinder AI</h1>
          <p>Explore clinical skills. Understand the theory. Practise with confidence.</p>
        </div>
        <div className="educator-heading-actions">
          <label className="educator-transparency">
            <span>Text transparency <strong>{conversationTransparency}%</strong></span>
            <input
              type="range"
              min="0"
              max="45"
              step="5"
              value={conversationTransparency}
              onChange={(event) => setConversationTransparency(Number(event.target.value))}
              aria-label="Clinical Educator text transparency"
            />
          </label>
          <button type="button" className="educator-settings" onClick={() => navigate("/ai-models")}>
            <Settings2 size={18} aria-hidden="true" /> AI settings
          </button>
        </div>
      </header>
      <div className="educator-workspace">
        <ClinicalEducatorVideo cue={educatorCue} cueKey={educatorCueKey} speaking={synth.speaking} />
        <section className="educator-conversation" style={{ opacity: 1 - conversationTransparency / 100 }} aria-labelledby="educator-conversation-title">
          <header className="educator-conversation-heading">
            <h2 id="educator-conversation-title">Your conversation</h2>
            <p role="status" aria-live="polite">{synth.speaking ? "Educator speaking…" : STATUS[status]}</p>
          </header>
          {diagnostic && admin ? <div className="educator-diagnostic"><AIDiagnostic /></div> : (
            <div className="educator-messages" role="log" aria-label="Conversation with the Clinical Educator" aria-live="polite" aria-relevant="additions text">
              {messages.map((message, index) => (
                <article key={index} className={`educator-message ${message.role === "user" ? "educator-message-user" : ""}`}>
                  <p className="educator-speaker">{message.role === "user" ? "You" : "Clinical Educator"}</p>
                  <ReactMarkdown className="prose prose-sm max-w-none">{message.content}</ReactMarkdown>
                </article>
              ))}
              <div ref={endRef} />
            </div>
          )}
          <footer className="educator-composer">
            <AIComposer
              value={input} onChange={setInput} onSend={handleSend}
              isProcessing={status === "working"} onStop={handleStop}
              contextEnabled={contextEnabled} onContextChange={setContextEnabled}
              diagnosticEnabled={diagnostic} onDiagnosticChange={setDiagnostic} isAdmin={admin}
              placeholder="Ask your Clinical Educator…"
              hint="Type a question or use the microphone. Shift + Enter adds a new line."
              leadingControls={<>
                <button type="button" onClick={toggleMic} className="ai-composer-plus"
                  aria-pressed={listening} aria-label={listening ? "Stop listening" : "Start voice input"} title={listening ? "Stop listening" : "Start voice input"}><Mic size={18} /></button>
                <button type="button" onClick={toggleMute} className="ai-composer-plus"
                  aria-pressed={synth.prefs.muted} aria-label={synth.prefs.muted ? "Enable educator speech" : "Mute educator speech"} title={synth.prefs.muted ? "Enable educator speech" : "Mute educator speech"}>
                  {synth.prefs.muted ? <VolumeX size={18} /> : <Volume2 size={18} />}</button>
                <button type="button" onClick={() => synth.stop()} disabled={!synth.speaking}
                  className="ai-composer-plus" aria-label="Stop educator speech" title="Stop educator speech"><Square size={16} /></button>
              </>}
            />
          </footer>
        </section>
      </div>
    </main>
  );
}