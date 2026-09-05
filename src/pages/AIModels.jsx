import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import { Send, Settings2, Cpu, Wifi, Cloud, HardDrive, Sparkles, RotateCw, AlertCircle, CheckCircle2, XCircle } from "lucide-react";
import {
  loadPrefs, savePrefs, routeChat, probeProvider, fetchFreeOpenRouterModels,
  FREE_OPENROUTER_MODELS, OPENROUTER_AUTO_FREE_MODEL, PUTER_MODELS,
} from "@/lib/aiRouter";

const PURPLE = "#765AB0";

const MODES = [
  { key: "auto", label: "Auto", detail: "Local → Puter → OpenRouter", icon: RotateCw },
  { key: "local", label: "LocalAI", detail: "On-device server", icon: HardDrive },
  { key: "puter", label: "puter.js", detail: "Browser runtime", icon: Cpu },
  { key: "openrouter", label: "OpenRouter", detail: "Free cloud models", icon: Cloud },
];

const PROVIDER_META = {
  local: { label: "LocalAI", icon: HardDrive },
  puter: { label: "puter.js", icon: Cpu },
  openrouter: { label: "OpenRouter", icon: Cloud },
};

function ModelSelect({ value, onChange, options }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
    >
      {options.map((opt) => {
        const optionValue = typeof opt === "string" ? opt : opt.id;
        const optionLabel = typeof opt === "string" ? opt : opt.name;
        return <option key={optionValue} value={optionValue}>{optionLabel}</option>;
      })}
    </select>
  );
}

function StatusChip({ state }) {
  const map = {
    idle: { icon: Wifi, cls: "text-muted-foreground bg-muted", text: "Idle" },
    running: { icon: RotateCw, cls: "text-amber-600 bg-amber-50", text: "Trying…" },
    ok: { icon: CheckCircle2, cls: "text-emerald-600 bg-emerald-50", text: "Online" },
    fail: { icon: XCircle, cls: "text-clinical-red bg-red-50", text: "Unavailable" },
  };
  const m = map[state] || map.idle;
  const Icon = m.icon;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${m.cls}`}>
      <Icon className={`h-3 w-3 ${state === "running" ? "animate-spin" : ""}`} /> {m.text}
    </span>
  );
}

export default function AIModels() {
  const [prefs, setPrefs] = useState(loadPrefs);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [status, setStatus] = useState({ local: "idle", puter: "idle", openrouter: "idle" });
  const [testing, setTesting] = useState(null);
  const [openRouterModels, setOpenRouterModels] = useState([]);
  const [modelScan, setModelScan] = useState({ state: "idle", message: "" });
  const endRef = useRef(null);

  useEffect(() => { savePrefs(prefs); }, [prefs]);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, busy]);

  const update = (patch) => setPrefs((p) => ({ ...p, ...patch }));

  const scanOpenRouterModels = useCallback(async () => {
    setModelScan({ state: "loading", message: "Scanning OpenRouter…" });
    try {
      const models = await fetchFreeOpenRouterModels();
      setOpenRouterModels(models);
      setModelScan({
        state: "success",
        message: models.length ? `${models.length} free models available now.` : "No free models were returned; Auto Free remains available.",
      });
    } catch (scanError) {
      setModelScan({
        state: "error",
        message: scanError?.name === "AbortError" ? "The model scan timed out. Try again." : (scanError?.message || "Unable to scan OpenRouter models."),
      });
    }
  }, []);

  useEffect(() => {
    if (prefs.mode === "openrouter" && modelScan.state === "idle") scanOpenRouterModels();
  }, [prefs.mode, modelScan.state, scanOpenRouterModels]);

  const openRouterOptions = useMemo(() => {
    const liveOptions = openRouterModels.filter((model) => model.id !== OPENROUTER_AUTO_FREE_MODEL);
    const options = [{ id: OPENROUTER_AUTO_FREE_MODEL, name: "Auto Free — best available free model" }, ...liveOptions];
    if (prefs.openrouterModel && !options.some((model) => model.id === prefs.openrouterModel)) {
      options.push({ id: prefs.openrouterModel, name: `${prefs.openrouterModel} (saved)` });
    }
    return options;
  }, [openRouterModels, prefs.openrouterModel]);

  const runStage = (provider, state) => {
    setStatus((s) => ({ ...s, [provider]: state }));
  };

  const buildMessages = (text) => {
    const sys = prefs.systemPrompt.trim();
    const core = [...messages, { role: "user", content: text }];
    return sys ? [{ role: "system", content: sys }, ...core] : core;
  };

  const handleSend = async (overrideText) => {
    const text = (overrideText ?? input).trim();
    if (!text || busy) return;
    setInput("");
    setError("");
    const userMsg = { role: "user", content: text };
    setMessages((m) => [...m, userMsg]);
    setBusy(true);
    try {
      const result = await routeChat({
        mode: prefs.mode,
        prefs,
        messages: buildMessages(text),
        onStage: runStage,
      });
      setMessages((m) => [...m, {
        role: "assistant",
        content: result.content,
        provider: result.provider,
        model: result.model,
        fallback: !!result.fallback,
      }]);
    } catch (err) {
      setError(err.message || "All AI providers failed. Check your connection settings.");
      setMessages((m) => [...m, { role: "assistant", content: `⚠️ ${err.message || "All providers failed."}`, provider: "error", model: "", fallback: false }]);
    } finally {
      setBusy(false);
    }
  };

  const handleTest = async (providerKey) => {
    setTesting(providerKey);
    runStage(providerKey, "running");
    try {
      await probeProvider(prefs, providerKey);
      runStage(providerKey, "ok");
    } catch (err) {
      runStage(providerKey, "fail");
    } finally {
      setTesting(null);
    }
  };

  const reset = () => { setMessages([]); setError(""); };

  const activeMode = useMemo(() => MODES.find((m) => m.key === prefs.mode), [prefs.mode]);

  return (
    <div className="clinical-page-shell clinical-page-shell--wide min-h-screen bg-background">
      {/* Header */}
      <header className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-2xl text-white shadow-lg" style={{ background: `linear-gradient(145deg, #866BC0, #63479D)` }}>
            <Sparkles className="h-6 w-6" />
          </span>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[.2em] text-muted-foreground">Pathfinder · AI Model Router</p>
            <h1 className="text-xl font-heading font-bold text-foreground">Offline-to-Cloud AI Switching</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={reset} className="rounded-xl border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground hover:bg-muted transition-colors flex items-center gap-1.5">
            <RotateCw className="h-3.5 w-3.5" /> Clear chat
          </button>
          <button onClick={() => setShowSettings((v) => !v)} className="rounded-xl border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground hover:bg-muted transition-colors flex items-center gap-1.5">
            <Settings2 className="h-3.5 w-3.5" /> Settings
          </button>
        </div>
      </header>

      {/* Mode switcher */}
      <section className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {MODES.map((m) => {
          const active = prefs.mode === m.key;
          const Icon = m.icon;
          return (
            <button
              key={m.key}
              onClick={() => update({ mode: m.key })}
              className={`rounded-2xl border p-3 text-left transition-all ${active ? "border-transparent text-white shadow-lg" : "border-border bg-card hover:-translate-y-0.5 hover:shadow-md"}`}
              style={active ? { background: `linear-gradient(145deg, #866BC0, #63479D)` } : {}}
            >
              <Icon className={`mb-1.5 h-5 w-5 ${active ? "text-white" : "text-clinical-teal"}`} />
              <p className="text-sm font-heading font-bold">{m.label}</p>
              <p className={`text-[10px] ${active ? "text-white/80" : "text-muted-foreground"}`}>{m.detail}</p>
            </button>
          );
        })}
      </section>

      {/* Provider status */}
      <section className="mb-4 rounded-2xl border border-border bg-card p-3">
        <div className="grid gap-2 sm:grid-cols-3">
          {Object.entries(PROVIDER_META).map(([key, meta]) => {
            const Icon = meta.icon;
            return (
              <div key={key} className="flex items-center justify-between gap-2 rounded-xl bg-muted/60 px-3 py-2">
                <div className="flex items-center gap-2 min-w-0">
                  <Icon className="h-4 w-4 shrink-0 text-clinical-teal" />
                  <span className="text-xs font-semibold text-foreground truncate">{meta.label}</span>
                  <StatusChip state={status[key]} />
                </div>
                <button
                  onClick={() => handleTest(key)}
                  disabled={testing === key}
                  className="rounded-lg border border-border bg-card px-2 py-1 text-[10px] font-bold text-foreground hover:bg-muted transition-colors disabled:opacity-50 flex items-center gap-1"
                >
                  <Wifi className={`h-3 w-3 ${testing === key ? "animate-spin" : ""}`} /> Test
                </button>
              </div>
            );
          })}
        </div>
        {activeMode && prefs.mode === "auto" && (
          <p className="mt-2 text-[11px] text-muted-foreground">Auto mode tries LocalAI first, then falls back to puter.js, then OpenRouter cloud models.</p>
        )}
      </section>

      {/* OpenRouter live model directory */}
      {prefs.mode === "openrouter" && (
        <section className="mb-4 rounded-2xl border border-border bg-card p-4 animate-slide-up">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[.18em] text-clinical-teal">OpenRouter free models</p>
              <h2 className="mt-1 text-sm font-heading font-bold text-foreground">Live model directory</h2>
              <p className="mt-1 max-w-2xl text-xs text-muted-foreground">
                Auto Free lets OpenRouter choose a currently available free model. Scan the public directory to select a specific free model.
              </p>
            </div>
            <button
              onClick={scanOpenRouterModels}
              disabled={modelScan.state === "loading"}
              className="rounded-xl border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground hover:bg-muted transition-colors disabled:opacity-50 flex items-center gap-1.5"
            >
              <RotateCw className={`h-3.5 w-3.5 ${modelScan.state === "loading" ? "animate-spin" : ""}`} />
              {modelScan.state === "loading" ? "Scanning…" : "Scan free models"}
            </button>
          </div>
          <div className="mt-4">
            <label className="text-xs font-semibold text-muted-foreground">Active OpenRouter model</label>
            <div className="mt-1">
              <ModelSelect value={prefs.openrouterModel} onChange={(value) => update({ openrouterModel: value })} options={openRouterOptions} />
            </div>
            {modelScan.message && (
              <p className={`mt-2 text-[11px] ${modelScan.state === "error" ? "text-clinical-red" : "text-muted-foreground"}`}>
                {modelScan.message}
              </p>
            )}
          </div>
        </section>
      )}

      {/* Settings panel */}
      {showSettings && (
        <section className="mb-4 rounded-2xl border border-border bg-card p-4 animate-slide-up">
          <h2 className="mb-3 text-sm font-heading font-bold text-foreground">Provider configuration</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-xs font-semibold text-muted-foreground">LocalAI server URL</label>
              <input
                type="text"
                value={prefs.localBaseURL}
                onChange={(e) => update({ localBaseURL: e.target.value })}
                placeholder="http://localhost:8080"
                className="mt-1 w-full rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
              <p className="mt-1 text-[10px] text-muted-foreground">OpenAI-compatible endpoint running on your machine.</p>
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground">LocalAI model</label>
              <input
                type="text"
                value={prefs.localModel}
                onChange={(e) => update({ localModel: e.target.value })}
                className="mt-1 w-full rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground">puter.js model</label>
              <div className="mt-1"><ModelSelect value={prefs.puterModel} onChange={(v) => update({ puterModel: v })} options={PUTER_MODELS} /></div>
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground">OpenRouter model (free)</label>
              <div className="mt-1"><ModelSelect value={prefs.openrouterModel} onChange={(v) => update({ openrouterModel: v })} options={openRouterOptions.length ? openRouterOptions : FREE_OPENROUTER_MODELS} /></div>
            </div>
            <div className="md:col-span-2">
              <label className="text-xs font-semibold text-muted-foreground">System prompt (optional)</label>
              <textarea
                value={prefs.systemPrompt}
                onChange={(e) => update({ systemPrompt: e.target.value })}
                rows={2}
                placeholder="e.g. You are a concise T Level Health tutor."
                className="mt-1 w-full rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
          </div>
        </section>
      )}

      {/* Chat */}
      <section className="rounded-2xl border border-border bg-card p-4">
        <div className="mb-3 max-h-[48vh] min-h-[200px] space-y-3 overflow-y-auto pr-1 scrollbar-thin">
          {messages.length === 0 && (
            <div className="flex h-full flex-col items-center justify-center text-center text-sm text-muted-foreground">
              <Sparkles className="mb-2 h-8 w-8 text-clinical-teal/60" />
              <p className="font-semibold text-foreground">Ready when you are</p>
              <p className="text-xs">Ask anything — Pathfinder routes your prompt across {prefs.mode === "auto" ? "LocalAI, puter.js and OpenRouter" : activeMode.label}.</p>
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 ${m.role === "user" ? "bg-primary text-primary-foreground rounded-br-sm" : m.provider === "error" ? "bg-red-50 text-clinical-red border border-clinical-red/30 rounded-bl-sm" : "bg-muted text-foreground rounded-bl-sm"}`}>
                {m.role === "assistant" && m.provider !== "error" && (
                  <div className="mb-1 flex items-center gap-1.5 text-[10px] font-bold text-clinical-teal">
                    <Cpu className="h-3 w-3" /> {PROVIDER_META[m.provider]?.label || m.provider}
                    {m.fallback && <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[9px] text-amber-700">fallback</span>}
                  </div>
                )}
                {m.role === "assistant"
                  ? <ReactMarkdown className="prose prose-sm max-w-none [&_p]:my-0.5">{m.content}</ReactMarkdown>
                  : <p className="text-sm whitespace-pre-wrap">{m.content}</p>}
              </div>
            </div>
          ))}
          {busy && (
            <div className="flex justify-start">
              <div className="rounded-2xl bg-muted px-3.5 py-2.5">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <RotateCw className="h-3.5 w-3.5 animate-spin" /> Routing across providers…
                </div>
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>

        {error && (
          <div className="mb-2 flex items-center gap-2 rounded-xl bg-red-50 px-3 py-2 text-xs text-clinical-red">
            <AlertCircle className="h-4 w-4 shrink-0" /> {error}
          </div>
        )}

        <div className="flex items-center gap-2 rounded-2xl border border-border bg-card p-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Ask the AI…"
            className="flex-1 bg-transparent px-2 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
          <button
            onClick={() => handleSend()}
            disabled={busy || !input.trim()}
            className="rounded-xl px-3 py-2 text-sm font-semibold text-white disabled:opacity-40 transition-opacity flex items-center gap-1.5"
            style={{ background: `linear-gradient(145deg, #866BC0, #63479D)` }}
          >
            <Send className="h-4 w-4" /> Send
          </button>
        </div>
      </section>
    </div>
  );
}