import { base44 } from "@/api/base44Client";
import { isTransientNetworkError, withExponentialBackoff } from "@/lib/networkRetry";

// Diagnostic mode — collects runtime errors from the live app, asks the AI for
// a structured report, and applies a small set of safe runtime workarounds.
// The published app cannot rewrite its own source at runtime, so "fixes" that
// require code edits are flagged for manual builder action; only state-level
// recovery (reload) or acknowledgement (dismiss) is applied automatically.

const MAX_ERRORS = 100;
const SAFE_ACTIONS = ["reload", "dismiss"];

let errors = [];
let installed = false;
let restoreFns = [];

function push(entry) {
  if (errors.length >= MAX_ERRORS) errors.shift();
  errors.push({ time: Date.now(), ...entry });
}

export function captureError(entry) {
  push(entry);
}

export function getErrors() {
  return errors.slice(-MAX_ERRORS);
}

export function clearErrors() {
  errors = [];
}

export function installErrorCollector() {
  if (installed) return () => {};
  installed = true;

  const onError = (e) => {
    push({
      type: "js_error",
      message: e.message || "Unknown error",
      source: e.error?.stack ? String(e.error.stack).slice(0, 400) : (e.filename ? `${e.filename}:${e.lineno}` : ""),
    });
  };
  const onRejection = (e) => {
    const reason = e.reason;
    push({
      type: "promise_rejection",
      message: reason?.message || String(reason).slice(0, 300),
    });
  };
  window.addEventListener("error", onError);
  window.addEventListener("unhandledrejection", onRejection);

  const origConsoleError = console.error.bind(console);
  console.error = (...args) => {
    try {
      const msg = args
        .map((a) =>
          a instanceof Error ? a.message : typeof a === "string" ? a : (() => { try { return JSON.stringify(a); } catch { return String(a); } })()
        )
        .join(" ")
        .slice(0, 300);
      if (msg) push({ type: "console_error", message: msg });
    } catch { /* never let the wrapper itself throw */ }
    origConsoleError(...args);
  };

  const origFetch = window.fetch.bind(window);
  window.fetch = async (input, init) => {
    const method = String(init?.method || input?.method || "GET").toUpperCase();
    const retryableMethod = ["GET", "HEAD", "OPTIONS", "PUT", "PATCH", "DELETE"].includes(method);
    const url = typeof input === "string" ? input : input?.url || "unknown";
    try {
      return await withExponentialBackoff(async () => {
        const response = await origFetch(input, init);
        if (retryableMethod && [408, 425, 429, 500, 502, 503, 504].includes(response.status)) {
          const transient = new Error(`HTTP ${response.status} ${response.statusText || ""}`.trim());
          transient.status = response.status;
          transient.response = response;
          throw transient;
        }
        if (!response.ok) {
          push({ type: "fetch_failed", message: `HTTP ${response.status} ${response.statusText || ""}`.trim(), source: String(url).slice(0, 200) });
        }
        return response;
      }, {
        retries: retryableMethod ? 3 : 0,
        baseDelayMs: 350,
        shouldRetry: isTransientNetworkError,
      });
    } catch (err) {
      if (err?.response instanceof Response) {
        push({ type: "fetch_failed", message: err.message, source: String(url).slice(0, 200) });
        return err.response;
      }
      push({ type: "fetch_failed", message: err?.message || "Network error", source: String(url).slice(0, 200) });
      throw err;
    }
  };

  return () => {
    installed = false;
    window.removeEventListener("error", onError);
    window.removeEventListener("unhandledrejection", onRejection);
    console.error = origConsoleError;
    window.fetch = origFetch;
  };
}

export async function runDiagnostic() {
  const raw = getErrors();
  if (raw.length === 0) {
    return {
      summary: "No runtime errors detected in the current session.",
      overall_health: "healthy",
      issues: [],
      rawCount: 0,
    };
  }

  const compact = raw
    .slice(-50)
    .map((e, i) => `${i + 1}. [${e.type}] ${e.message}${e.source ? " @ " + e.source : ""}`)
    .join("\n");

  try {
    const res = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a diagnostic AI for the Pathfinder T-Level Simulation web app (React + Vite single-page app, Base44 backend). Analyse the following runtime errors captured during the session and produce a structured diagnostic report. For each distinct issue, give a short title, a severity (low/medium/high), the number of occurrences, a likely_cause, a recommended_fix aimed at a developer applying it in the builder (the running app CANNOT rewrite its source at runtime), and a workaround_action limited EXACTLY to one of ${JSON.stringify(SAFE_ACTIONS)} — use "dismiss" when no safe runtime workaround exists. Set can_auto_fix true only when workaround_action is "reload". Aggregate duplicate errors. Be concise and British English.`,
      response_json_schema: {
        type: "object",
        properties: {
          summary: { type: "string" },
          overall_health: { type: "string", enum: ["healthy", "degraded", "unstable"] },
          issues: {
            type: "array",
            items: {
              type: "object",
              properties: {
                title: { type: "string" },
                severity: { type: "string", enum: ["low", "medium", "high"] },
                count: { type: "number" },
                likely_cause: { type: "string" },
                recommended_fix: { type: "string" },
                workaround_action: { type: "string", enum: SAFE_ACTIONS },
                can_auto_fix: { type: "boolean" },
              },
            },
          },
        },
      },
    });
    return { ...res, rawCount: raw.length };
  } catch (err) {
    return {
      summary: "Diagnostic scan could not reach the AI service. Showing raw captured errors instead.",
      overall_health: "degraded",
      rawCount: raw.length,
      error: err?.message || "AI service unavailable",
      issues: raw.slice(-10).map((e) => ({
        title: e.type,
        severity: "medium",
        count: 1,
        likely_cause: e.message,
        recommended_fix: "Inspect the browser console for full details and apply a fix in the builder.",
        workaround_action: "dismiss",
        can_auto_fix: false,
      })),
    };
  }
}

export function applyWorkaround(action) {
  switch (action) {
    case "reload":
      try {
        window.location.reload();
        return { applied: true, message: "Reloading app…" };
      } catch {
        return { applied: false, message: "Could not reload the page." };
      }
    case "dismiss":
    default:
      return { applied: true, message: "Issue noted for manual investigation." };
  }
}