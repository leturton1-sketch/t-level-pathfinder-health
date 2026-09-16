const TRANSIENT_STATUS = new Set([408, 425, 429, 500, 502, 503, 504]);
const TRANSIENT_CODES = new Set([
  "ECONNABORTED", "ECONNRESET", "ETIMEDOUT", "ERR_NETWORK",
  "ERR_CONNECTION_RESET", "ERR_BAD_RESPONSE",
]);

export function isTransientNetworkError(error) {
  if (!error || error?.name === "AbortError") return false;
  const status = Number(error?.status ?? error?.response?.status ?? error?.data?.status);
  if (TRANSIENT_STATUS.has(status)) return true;
  const code = String(error?.code || "").toUpperCase();
  if (TRANSIENT_CODES.has(code)) return true;
  const message = String(error?.message || "").toLowerCase();
  return /timeout|timed out|network error|temporarily unavailable|connection reset|failed to fetch/.test(message);
}

function retryAfterMs(error) {
  const raw = error?.response?.headers?.get?.("retry-after")
    ?? error?.response?.headers?.["retry-after"];
  if (!raw) return 0;
  const seconds = Number(raw);
  if (Number.isFinite(seconds)) return Math.max(0, seconds * 1000);
  const at = Date.parse(raw);
  return Number.isFinite(at) ? Math.max(0, at - Date.now()) : 0;
}

const wait = (ms) => new Promise((resolve) => window.setTimeout(resolve, ms));

export async function withExponentialBackoff(
  operation,
  { retries = 3, baseDelayMs = 350, maxDelayMs = 3000, shouldRetry = isTransientNetworkError } = {}
) {
  let attempt = 0;
  while (true) {
    try {
      return await operation(attempt);
    } catch (error) {
      if (attempt >= retries || !shouldRetry(error)) throw error;
      const exponential = Math.min(maxDelayMs, baseDelayMs * (2 ** attempt));
      const jitter = exponential * (0.85 + Math.random() * 0.3);
      const delay = Math.max(retryAfterMs(error), jitter);
      await wait(delay);
      attempt += 1;
    }
  }
}
