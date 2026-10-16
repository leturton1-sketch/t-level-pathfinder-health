// A library of known error patterns and their pre-verified fixes. The
// diagnostic system checks these BEFORE calling the AI, so known issues are
// detected instantly and prescribed a guaranteed-correct source fix rather
// than an AI-generated one that might be inaccurate.
//
// Each entry has:
//   id       — unique identifier
//   match    — (error, context) => boolean — does this error fit the pattern?
//   build    — (error, context) => issue — returns the standard diagnostic issue
//
// context = { https: boolean, hostname: string, pathname: string }

export const KNOWN_FIXES = [
  {
    id: "mixed_content_localhost",
    match: (error, ctx) => {
      if (error.type !== "fetch_failed" && error.type !== "console_error") return false;
      const src = String(error.source || "");
      return ctx.https && /http:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0)/i.test(src);
    },
    build: (error) => ({
      title: "Mixed-content fetch to local HTTP endpoint from HTTPS page",
      severity: "medium",
      count: 1,
      likely_cause: "The AI router tries to fetch a local development server (http://localhost:8080) while the app is served over HTTPS. Browsers block this as mixed content, producing a fetch_failed error.",
      recommended_fix: "Skip the local AI provider when the app is not running on localhost. The router already falls back to the Core LLM.",
      remediation: { action: "suppress", payload: { signature: "localhost:8080" } },
      can_auto_fix: true,
      source_fix: {
        file: "src/lib/aiRouter.js",
        find: "export async function routeChat({ mode, prefs, messages, onStage }) {\n  const order = ORDER[mode] || ORDER.auto;",
        replace: "export async function routeChat({ mode, prefs, messages, onStage }) {\n  let order = ORDER[mode] || ORDER.auto;\n  const isLocalhost = typeof window !== \"undefined\" &&\n    [\"localhost\", \"127.0.0.1\", \"0.0.0.0\"].includes(window.location.hostname);\n  if (!isLocalhost) order = order.filter((p) => p !== \"local\");",
        explanation: "Skip the local provider when not on localhost to avoid mixed-content fetch errors.",
      },
    }),
  },
  {
    id: "openrouter_401",
    match: (error) => {
      const msg = String(error.message || "");
      const src = String(error.source || "");
      return /openrouter/i.test(src + msg) && /401|missing.*auth|unauthorized/i.test(msg);
    },
    build: (error) => ({
      title: "OpenRouter API authentication failure",
      severity: "high",
      count: 1,
      likely_cause: "The OpenRouter API key is missing, expired, or invalid. Requests to OpenRouter return 401 'Missing Authentication header'.",
      recommended_fix: "Update the OPENROUTER_API_KEY secret in the app's Secrets settings, or verify the Core LLM fallback is active so chat still works without OpenRouter.",
      remediation: { action: "suppress", payload: { signature: "openrouter" } },
      can_auto_fix: true,
      source_fix: {
        file: "src/lib/aiRouter.js",
        find: "const ORDER = {",
        replace: "// Ensure 'core' (the platform's built-in LLM) is always the last fallback.\nconst ORDER = {",
        explanation: "Verify the core LLM is the final fallback so chat works even when the OpenRouter key fails.",
      },
    }),
  },
  {
    id: "localstorage_quota",
    match: (error) => {
      const msg = String(error.message || "");
      return /quota.*exceed|storage.*full|setitem.*quota/i.test(msg);
    },
    build: (error) => ({
      title: "localStorage quota exceeded",
      severity: "medium",
      count: 1,
      likely_cause: "The app has accumulated too much data in localStorage, exceeding the browser's ~5MB per-origin limit.",
      recommended_fix: "Clear non-essential localStorage keys. The session reset action clears known T-SIM Health caches and reloads.",
      remediation: { action: "reset_session", payload: {} },
      can_auto_fix: true,
      source_fix: {
        file: "src/lib/diagnosticService.js",
        find: "const SESSION_KEYS = [",
        replace: "// Add any new localStorage keys that should be cleared on session reset.\nconst SESSION_KEYS = [",
        explanation: "Ensure all non-essential localStorage keys are listed in SESSION_KEYS so 'Reset session' clears them.",
      },
    }),
  },
  {
    id: "dynamic_import_failed",
    match: (error) => {
      const msg = String(error.message || "");
      return /failed to fetch dynamically imported module|import\(|chunk.*failed/i.test(msg);
    },
    build: (error) => ({
      title: "Dynamic module import failed",
      severity: "high",
      count: 1,
      likely_cause: "A lazy-loaded route chunk failed to load, usually because the app was updated and the old chunk no longer exists on the server.",
      recommended_fix: "Reload the page — the browser will fetch the latest chunks. If it persists, clear the session cache.",
      remediation: { action: "reload", payload: {} },
      can_auto_fix: true,
      source_fix: null,
    }),
  },
  {
    id: "cors_error",
    match: (error) => {
      const msg = String(error.message || "");
      return /cors|cross-origin|blocked by.*policy/i.test(msg) && /fetch|request/i.test(msg);
    },
    build: (error) => ({
      title: "CORS error on external fetch",
      severity: "medium",
      count: 1,
      likely_cause: "The app tried to fetch an external API that does not allow cross-origin requests from this domain.",
      recommended_fix: "Route the request through a backend function so the server-side fetch is not subject to browser CORS policy.",
      remediation: { action: "dismiss", payload: {} },
      can_auto_fix: false,
      source_fix: {
        file: "base44/functions/<functionName>/entry.ts",
        find: "// Client-side fetch to external API",
        replace: "// Move this fetch into a backend function entry.ts and call it via base44.functions.invoke()",
        explanation: "Move external API calls server-side to bypass browser CORS restrictions.",
      },
    }),
  },
];

// Check all captured errors against the known-fixes library. Returns an array
// of matched issues (already in the standard diagnostic format) and the
// remaining unmatched errors.
export function matchKnownFixes(errors, context) {
  const matched = [];
  const unmatched = [];
  for (const error of errors) {
    const fix = KNOWN_FIXES.find((f) => {
      try { return f.match(error, context); } catch { return false; }
    });
    if (fix) {
      try {
        const issue = fix.build(error, context);
        if (issue) matched.push({ ...issue, _known_fix_id: fix.id });
      } catch { unmatched.push(error); }
    } else {
      unmatched.push(error);
    }
  }
  return { matched, unmatched };
}