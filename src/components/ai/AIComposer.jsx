import { useEffect, useRef, useState } from "react";
import { ArrowUp, ChevronDown, FileText, Mic, Paperclip, Plus, Square, Stethoscope, X } from "lucide-react";
import "./AIComposer.css";

const DEFAULT_PLACEHOLDER = "Ask Pathfinder AI…";
const DIAGNOSTIC_PLACEHOLDER = "Describe the problem, or ask Pathfinder to run a diagnostic…";

export default function AIComposer({
  value,
  onChange,
  onSend,
  isProcessing = false,
  onStop,
  contextEnabled = true,
  onContextChange,
  diagnosticEnabled = false,
  onDiagnosticChange,
  isAdmin = false,
  leadingControls = null,
  inputMode = "text",
  onInputModeChange,
  isListening = false,
  onVoicePress,
  placeholder = DEFAULT_PLACEHOLDER,
  hint = "Ask a question, create something, or diagnose an issue.",
}) {
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [attachments, setAttachments] = useState([]);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(Math.max(textarea.scrollHeight, 52), 144)}px`;
  }, [value]);

  const send = () => {
    if (!value.trim() || isProcessing) return;
    onSend(value, attachments);
    setAttachments([]);
    setMobileMenuOpen(false);
  };

  const onKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      send();
    }
  };

  const addFiles = (event) => {
    const files = Array.from(event.target.files || []);
    setAttachments((current) => [...current, ...files].slice(0, 5));
    event.target.value = "";
  };

  const secondaryControls = (
    <>
      <button type="button" onClick={() => fileInputRef.current?.click()}
        className="ai-composer-control" aria-label="Attach files">
        <Paperclip className="h-3.5 w-3.5" /><span>Attach</span>
      </button>
      <button type="button" onClick={() => onContextChange?.(!contextEnabled)}
        className={`ai-composer-control ${contextEnabled ? "ai-composer-control-active" : ""}`}
        aria-pressed={contextEnabled} aria-label="Use current Pathfinder context">
        <FileText className="h-3.5 w-3.5" /><span>Context</span>
      </button>
      {isAdmin && (
        <button type="button" onClick={() => onDiagnosticChange?.(!diagnosticEnabled)}
          className={`ai-composer-control ${diagnosticEnabled ? "ai-composer-control-diagnostic" : ""}`}
          aria-pressed={diagnosticEnabled} aria-label="Diagnostic mode">
          <Stethoscope className="h-3.5 w-3.5" /><span>Diagnostic</span>
        </button>
      )}
    </>
  );

  return (
    <div className="ai-composer-shell">
      {diagnosticEnabled && isAdmin && (
        <div className="ai-composer-diagnostic-label">ADMIN • DIAGNOSTIC MODE</div>
      )}
      {isProcessing && (
        <div className="ai-composer-progress" role="status" aria-live="polite">
          <span className="ai-composer-pulse" />
          <span>Pathfinder is analysing…</span>
          <button type="button" onClick={onStop} className="ai-composer-stop">
            <Square className="h-3 w-3 fill-current" /> Stop
          </button>
        </div>
      )}
      {attachments.length > 0 && (
        <div className="ai-composer-attachments">
          {attachments.map((file, index) => (
            <span key={`${file.name}-${index}`} className="ai-composer-attachment">
              <Paperclip className="h-3 w-3" />
              <span className="max-w-[150px] truncate">{file.name}</span>
              <button type="button" onClick={() => setAttachments((current) => current.filter((_, i) => i !== index))}
                aria-label={`Remove ${file.name}`}><X className="h-3 w-3" /></button>
            </span>
          ))}
        </div>
      )}
      <div className="ai-composer-input-row">
        {inputMode === "voice" ? (
          <button type="button" onClick={onVoicePress}
            className={`ai-composer-voice-button ${isListening ? "ai-composer-voice-active" : ""}`}
            aria-label={isListening ? "Stop listening" : "Start voice input"}>
            <Mic className="h-5 w-5" />
            <span>{isListening ? "Listening… tap to stop" : "Tap to speak"}</span>
          </button>
        ) : (
          <textarea ref={textareaRef} rows={2} value={value} onChange={(event) => onChange(event.target.value)}
            onKeyDown={onKeyDown} placeholder={diagnosticEnabled ? DIAGNOSTIC_PLACEHOLDER : placeholder}
            className="ai-composer-textarea" aria-label="Message Pathfinder AI" />
        )}
        {inputMode === "text" && (
          <button type="button" onClick={send} disabled={!value.trim() || isProcessing}
            className="ai-composer-send" aria-label="Send message">
            <ArrowUp className="h-5 w-5" />
          </button>
        )}
      </div>
      <p className="ai-composer-hint">{hint}</p>
      <div className="ai-composer-toolbar">
        <div className="ai-composer-mode-toggle" role="group" aria-label="Input mode">
          <button type="button" onClick={() => onInputModeChange?.("text")}
            className={`ai-composer-mode-button ${inputMode === "text" ? "ai-composer-mode-active" : ""}`}
            aria-pressed={inputMode === "text"} aria-label="Text input">
            <span className="text-[10px] font-bold uppercase tracking-wide">Text</span>
          </button>
          <button type="button" onClick={() => onInputModeChange?.("voice")}
            className={`ai-composer-mode-button ${inputMode === "voice" ? "ai-composer-mode-active" : ""}`}
            aria-pressed={inputMode === "voice"} aria-label="Voice input">
            <Mic className="h-3 w-3" /><span className="text-[10px] font-bold uppercase tracking-wide">Voice</span>
          </button>
        </div>
        <div className="flex min-w-0 items-center gap-1.5">{leadingControls}</div>
        <div className="hidden items-center gap-1.5 sm:flex">{secondaryControls}</div>
        <div className="relative ml-auto sm:hidden">
          <button type="button" onClick={() => setMobileMenuOpen((open) => !open)}
            className="ai-composer-plus" aria-expanded={mobileMenuOpen} aria-label="More assistant controls">
            {mobileMenuOpen ? <ChevronDown className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          </button>
          {mobileMenuOpen && <div className="ai-composer-mobile-menu">{secondaryControls}</div>}
        </div>
      </div>
      <input ref={fileInputRef} type="file" multiple className="hidden" onChange={addFiles}
        accept="image/*,.pdf,.doc,.docx,.txt,.csv" />
    </div>
  );
}