import { base44 } from "@/api/base44Client";

/**
 * AI Model Router — seamless offline-to-cloud switching.
 * Providers, tried in configured order:
 *   - "local"  : LocalAI (OpenAI-compatible server running on the user's machine)
 *   - "puter"  : puter.js (free browser runtime, no API key)
 *   - "openrouter" : OpenRouter free cloud models (server-side API key)
 */

export const OPENROUTER_AUTO_FREE_MODEL = "openrouter/free";

export const FREE_OPENROUTER_MODELS = [
  OPENROUTER_AUTO_FREE_MODEL,
  "deepseek/deepseek-r1:free",
];

const OPENROUTER_TIMEOUT_MS = 25000;
const OPENROUTER_RETRY_COUNT = 2;
const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));
const isRetryableOpenRouterError = (error) => {
  const message = String(error?.message || error || "");
  return error?.name === "AbortError"
    || /timed out|fetch failed|HTTP (408|409|429|5\d{2})|request failed \((408|409|429|5\d{2})\)/i.test(message);
};

const withTimeout = (task, timeoutMs) => Promise.race([
  task(),
  new Promise((_, reject) => setTimeout(() => reject(new Error("OpenRouter request timed out")), timeoutMs)),
]);

export async function fetchFreeOpenRouterModels() {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch("https://openrouter.ai/api/v1/models", {
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`OpenRouter model scan failed (HTTP ${response.status})`);
    const payload = await response.json();
    const models = Array.isArray(payload?.data) ? payload.data : [];
    return models
      .filter((model) => {
        const promptPrice = Number.parseFloat(model?.pricing?.prompt ?? "0");
        const completionPrice = Number.parseFloat(model?.pricing?.completion ?? "0");
        return model?.id?.endsWith(":free") || (promptPrice === 0 && completionPrice === 0);
      })
      .map((model) => ({ id: model.id, name: model.name || model.id }))
      .filter((model) => model.id)
      .sort((a, b) => a.name.localeCompare(b.name));
  } finally {
    clearTimeout(timer);
  }
}

export const PUTER_MODELS = [
  "gpt-4o-mini",
  "claude-3.5-sonnet",
  "meta-llama/llama-3.2-3b-instruct",
];

const STORAGE_KEY = "pathfinder_ai_router";

export const DEFAULT_PREFS = {
  mode: "auto", // auto | local | puter | openrouter
  localBaseURL: "http://localhost:8080",
  localModel: "gpt-3.5-turbo",
  puterModel: "gpt-4o-mini",
  openrouterModel: OPENROUTER_AUTO_FREE_MODEL,
  systemPrompt: "",
};

export function loadPrefs() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...DEFAULT_PREFS, ...JSON.parse(raw) } : { ...DEFAULT_PREFS };
  } catch {
    return { ...DEFAULT_PREFS };
  }
}

export function savePrefs(prefs) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs)); } catch { /* ignore */ }
}

let puterPromise = null;
export function ensurePuter() {
  if (typeof window !== "undefined" && window.puter) return Promise.resolve(window.puter);
  if (puterPromise) return puterPromise;
  puterPromise = new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://js.puter.com/v2/";
    s.async = true;
    s.onload = () => (window.puter ? resolve(window.puter) : reject(new Error("puter.js failed to initialise")));
    s.onerror = () => { puterPromise = null; reject(new Error("Unable to load puter.js runtime")); };
    document.head.appendChild(s);
  });
  return puterPromise;
}

export async function localAIChat({ baseURL, messages, model }) {
  const url = `${(baseURL || "").replace(/\/$/, "")}/v1/chat/completions`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 4000);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: model || "gpt-3.5-turbo", messages }),
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`LocalAI HTTP ${res.status}`);
    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content;
    if (!content) throw new Error("LocalAI returned an empty response");
    return { content, provider: "local", model: model || "local" };
  } finally {
    clearTimeout(timer);
  }
}

export async function puterChat({ messages, model }) {
  const puter = await ensurePuter();
  const prompt = messages.map((m) => `${m.role === "assistant" ? "Assistant" : "User"}: ${m.content}`).join("\n");
  const response = await puter.ai.chat(prompt, model ? { model } : undefined);
  let content = "";
  if (typeof response === "string") content = response;
  else if (response?.message?.content) content = response.message.content;
  else if (response?.text) content = response.text;
  else content = String(response ?? "");
  if (!content.trim()) throw new Error("puter.js returned an empty response");
  return { content, provider: "puter", model: model || "puter" };
}

export async function openrouterChat({ messages, model }) {
  let lastError;
  for (let attempt = 0; attempt <= OPENROUTER_RETRY_COUNT; attempt += 1) {
    try {
      const res = await withTimeout(
        () => base44.functions.invoke("openrouterChat", { messages, model }),
        OPENROUTER_TIMEOUT_MS
      );
      const data = res?.data ?? res;
      if (data?.error) throw new Error(data.error);
      if (!data?.content) throw new Error("OpenRouter returned an empty response");
      return { content: data.content, provider: "openrouter", model: data.model || model };
    } catch (error) {
      lastError = error;
      if (attempt < OPENROUTER_RETRY_COUNT && isRetryableOpenRouterError(error)) {
        await wait(500 * (2 ** attempt));
      } else {
        break;
      }
    }
  }
  throw lastError || new Error("OpenRouter request failed");
}

const ORDER = { auto: ["local", "puter", "openrouter"], local: ["local"], puter: ["puter"], openrouter: ["openrouter"] };

export async function routeChat({ mode, prefs, messages, onStage }) {
  const order = ORDER[mode] || ORDER.auto;
  const runners = {
    local: () => localAIChat({ baseURL: prefs.localBaseURL, messages, model: prefs.localModel }),
    puter: () => puterChat({ messages, model: prefs.puterModel }),
    openrouter: () => openrouterChat({ messages, model: prefs.openrouterModel }),
  };
  let lastErr;
  for (const p of order) {
    try {
      onStage?.(p, "running");
      const result = await runners[p]();
      onStage?.(p, "ok");
      return { ...result, attempted: p, fallback: p !== order[0] };
    } catch (err) {
      lastErr = err;
      onStage?.(p, "fail");
    }
  }
  throw lastErr || new Error("All AI providers failed");
}

export async function probeProvider(prefs, providerKey) {
  const ping = [{ role: "user", content: "ping" }];
  if (providerKey === "local") return localAIChat({ baseURL: prefs.localBaseURL, messages: ping, model: prefs.localModel });
  if (providerKey === "puter") return puterChat({ messages: ping, model: prefs.puterModel });
  if (providerKey === "openrouter") return openrouterChat({ messages: ping, model: prefs.openrouterModel });
  throw new Error("Unknown provider");
}