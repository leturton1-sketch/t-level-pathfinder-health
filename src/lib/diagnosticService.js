import { base44 } from "@/api/base44Client";
import { isTransientNetworkError, withExponentialBackoff } from "@/lib/networkRetry";
import { SECURITY_ENTITIES, SECURITY_FUNCTIONS, SECURITY_RISK_AREAS, SECURITY_MANIFEST_VERSION } from "@/lib/securityManifest";

// Diagnostic mode — collects runtime errors from the live app, asks the AI for
// a structured remediation report, and applies safe runtime fixes. The
// published app cannot rewrite its own source at runtime, so every issue also
// carries a precise `source_fix` (file / find / replace) that the builder can
// implement for the permanent fix; the runtime remediation is applied
// automatically wherever it is safe to do so.

const MAX_ERRORS = 100;
const SAFE_ACTIONS = ["reload", "reset_session", "clear_storage", "suppress", "dismiss"];

// localStorage keys holding session/cache state. "reset_session" clears these
// and reloads to recover from corrupted local state.
const SESSION_KEYS = [
  "pathfinder-unlocked", "pathfinder-welcomed",
  "anatomy_admin_overrides", "anatomy_admin_hidden", "anatomy_admin_clipped",
  "anatomy_admin_custom", "anatomy_core_system_version", "anatomy_animations",
  "wardLayout_ward", "clinicaledge-auto-listen",
  "pathfinder-ai-panel-position", "pathfinder-ai-panel-transparency",
];

let errors = [];
let suppressions = [];
let remediationLog = [];
let installed = false;

function push(entry) {
  // Honour active suppressions so noisy non-critical errors stop flooding the
  // report once an admin has silenced them.
  if (suppressions.some((sig) => typeof entry.message === "string" && entry.message.includes(sig))) return;
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

export function getSuppressions() {
  return suppressions.slice();
}

export function getRemediationLog() {
  return remediationLog.slice();
}

export function clearRemediationLog() {
  remediationLog = [];
}

function logRemediation(title, action, result) {
  remediationLog.push({ title, action, at: Date.now(), applied: result.applied, message: result.message });
  if (remediationLog.length > 50) remediationLog.shift();
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
    const response = await base44.integrations.Core.InvokeLLM({
      prompt: `You are the Pathfinder diagnostic engine for a React + Vite single-page app on the Base44 platform (source under src/, entities under base44/entities/, backend functions under base44/functions/). Analyse the captured runtime errors and produce a structured remediation report.

For EACH distinct issue provide:
- title, severity (low/medium/high), count, likely_cause, recommended_fix.
- remediation: a SAFE runtime action chosen from ${JSON.stringify(SAFE_ACTIONS)}.
  • "reload" for a transient render/state glitch fixed by reloading.
  • "reset_session" for corrupted local/session state (clears Pathfinder caches + reloads).
  • "clear_storage" for a single bad localStorage key — supply payload.storageKey.
  • "suppress" for a noisy non-critical recurring error — supply payload.signature (a short substring of the message).
  • "dismiss" when no runtime fix applies.
- can_auto_fix: true when remediation.action is not "dismiss".
- source_fix: the PERMANENT fix the builder applies — { file, find, replace, explanation }. "file" is a real path (e.g. src/components/...). "find" is the exact existing code snippet to locate. "replace" is the corrected code. "explanation" is one sentence. If no source change is needed, use null.

Be concise, British English, and aggregate duplicate errors. Prefer the most specific runtime remediation that actually resolves the symptom.`,
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
                remediation: {
                  type: "object",
                  properties: {
                    action: { type: "string", enum: SAFE_ACTIONS },
                    payload: {
                      type: "object",
                      properties: {
                        storageKey: { type: "string" },
                        signature: { type: "string" },
                      },
                    },
                  },
                },
                can_auto_fix: { type: "boolean" },
                source_fix: {
                  type: ["object", "null"],
                  properties: {
                    file: { type: "string" },
                    find: { type: "string" },
                    replace: { type: "string" },
                    explanation: { type: "string" },
                  },
                },
              },
            },
          },
        },
      },
    });
    const res = response?.data ?? response;
    if (res?.error) throw new Error(res.error);
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
        remediation: { action: "dismiss", payload: {} },
        can_auto_fix: false,
        source_fix: null,
      })),
    };
  }
}

// Collect security-relevant signals from the live browser environment. These
// are facts the running app can observe about itself; the manifest supplies
// the structural review the browser cannot see.
function collectSecuritySignals() {
  const signals = {};
  try { signals.https = window.location?.protocol === "https:"; } catch { signals.https = "unknown"; }
  try { signals.cookieCount = document.cookie ? document.cookie.split(";").filter(Boolean).length : 0; } catch { signals.cookieCount = "unknown"; }
  try {
    const suspicious = [];
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);
      if (key && /secret|token|api[-_]?key|password|pin/i.test(key)) suspicious.push(key);
    }
    signals.suspiciousLocalStorage = suspicious;
  } catch { signals.suspiciousLocalStorage = "unknown"; }
  try {
    const exposed = [];
    ["OPENAI_API_KEY", "OPENROUTER_API_KEY", "apiKey", "api_key", "secret", "token", "password"].forEach((name) => {
      if (window[name] != null) exposed.push(name);
    });
    signals.exposedGlobals = exposed;
  } catch { signals.exposedGlobals = "unknown"; }
  return signals;
}

export async function runSecurityScan() {
  const signals = collectSecuritySignals();
  const manifest = {
    version: SECURITY_MANIFEST_VERSION,
    entities: SECURITY_ENTITIES,
    functions: SECURITY_FUNCTIONS,
    riskAreas: SECURITY_RISK_AREAS,
    runtimeSignals: signals,
  };

  try {
    const response = await base44.integrations.Core.InvokeLLM({
      prompt: `You are the Pathfinder security review engine for a React + Vite single-page app on the Base44 platform (source under src/, entities under base44/entities/, backend functions under base44/functions/). Systematically review the security manifest below and triage every finding by severity.

For EACH distinct security issue return:
- title, severity (critical/high/medium/low/info), category (rls/xss/auth/secrets/validation/exposure/deprecation), affected_resource (entity or function or file name), description, recommendation.
- remediation: a SAFE runtime action from ${JSON.stringify(SAFE_ACTIONS)} when a runtime fix applies (e.g. "clear_storage" to remove a leaked secret from localStorage, "suppress" otherwise), else "dismiss".
- can_auto_fix: true only when a runtime action genuinely helps; most security fixes are source-level so this is usually false.
- source_fix: the PERMANENT fix the builder applies — { file, find, replace, explanation }. "file" is a real path (e.g. base44/entities/HealthHubRecord.jsonc, base44/functions/verifyAccess/entry.ts, src/components/...). "find" is the exact existing code/config to locate. "replace" is the corrected code/config. If no source change is needed, use null.

Triage rules:
- critical: confirmed secret leakage to clients, broken auth on a sensitive function, or RLS missing on a high-sensitivity entity (HealthHubRecord, AppUser, AppSession, QRAccessCredential, CarePlanSubmission, ESPPortfolio, TalentCard).
- high: RLS allowing cross-user reads of high-sensitivity data, or a client-side-only guard on an admin action with no server enforcement.
- medium: public-read on sensitive-ish data, deprecated auth-bearing functions, markdown render sites without safeUrlTransform, profile_visibility not enforced.
- low: minor hardening, error-message wording, cookie/localStorage hygiene with no secret.
- info: intentional public-read of educational content flagged for confirmation.

Be concise, British English. Do not invent issues not supported by the manifest; if the manifest is clean, return an empty issues array.

MANIFEST:
${JSON.stringify(manifest, null, 2)}`,
      response_json_schema: {
        type: "object",
        properties: {
          summary: { type: "string" },
          overall_risk: { type: "string", enum: ["secure", "review", "at_risk"] },
          issues: {
            type: "array",
            items: {
              type: "object",
              properties: {
                title: { type: "string" },
                severity: { type: "string", enum: ["critical", "high", "medium", "low", "info"] },
                category: { type: "string", enum: ["rls", "xss", "auth", "secrets", "validation", "exposure", "deprecation"] },
                affected_resource: { type: "string" },
                description: { type: "string" },
                recommendation: { type: "string" },
                remediation: {
                  type: "object",
                  properties: {
                    action: { type: "string", enum: SAFE_ACTIONS },
                    payload: {
                      type: "object",
                      properties: {
                        storageKey: { type: "string" },
                        signature: { type: "string" },
                      },
                    },
                  },
                },
                can_auto_fix: { type: "boolean" },
                source_fix: {
                  type: ["object", "null"],
                  properties: {
                    file: { type: "string" },
                    find: { type: "string" },
                    replace: { type: "string" },
                    explanation: { type: "string" },
                  },
                },
              },
            },
          },
        },
      },
    });
    const res = response?.data ?? response;
    if (res?.error) throw new Error(res.error);
    return { ...res, scanType: "security", manifestVersion: SECURITY_MANIFEST_VERSION };
  } catch (err) {
    return {
      summary: "Security scan could not reach the AI service. Review the manifest manually.",
      overall_risk: "review",
      scanType: "security",
      error: err?.message || "AI service unavailable",
      issues: [],
    };
  }
}

const ACTION_LABELS = {
  reload: "Reload",
  reset_session: "Reset session",
  clear_storage: "Clear cache",
  suppress: "Suppress",
  dismiss: "Dismiss",
};

export function remediationLabel(action) {
  return ACTION_LABELS[action] || action || "Dismiss";
}

export function applyRemediation(issue) {
  const action = issue?.remediation?.action || issue?.workaround_action || "dismiss";
  const payload = issue?.remediation?.payload || {};
  const title = issue?.title || action;
  let result = { applied: true, message: "" };

  switch (action) {
    case "reload":
      try { window.location.reload(); result.message = "Reloading app…"; }
      catch { result = { applied: false, message: "Could not reload the page." }; }
      break;
    case "reset_session":
      try {
        SESSION_KEYS.forEach((key) => { try { localStorage.removeItem(key); } catch {} });
        window.location.reload();
        result.message = "Session and cache cleared — reloading…";
      } catch { result = { applied: false, message: "Could not reset the session." }; }
      break;
    case "clear_storage": {
      const key = payload.storageKey;
      if (!key) { result = { applied: false, message: "No storage key specified." }; break; }
      try { localStorage.removeItem(key); result.message = `Cleared "${key}".`; }
      catch { result = { applied: false, message: `Could not clear "${key}".` }; }
      break;
    }
    case "suppress": {
      const sig = payload.signature;
      if (!sig) { result = { applied: false, message: "No error signature specified." }; break; }
      if (!suppressions.includes(sig)) suppressions.push(sig);
      errors = errors.filter((e) => !(typeof e.message === "string" && e.message.includes(sig)));
      result.message = `Suppressing "${sig}" from future reports.`;
      break;
    }
    case "dismiss":
    default:
      result = { applied: true, message: "Issue noted for manual investigation." };
  }

  logRemediation(title, action, result);
  return result;
}

// Backward-compatible alias for any caller still using the old action-string API.
export function applyWorkaround(action) {
  return applyRemediation({ remediation: { action }, workaround_action: action });
}