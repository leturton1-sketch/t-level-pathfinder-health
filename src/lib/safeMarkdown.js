// Safe URL transform for react-markdown. react-markdown v9's default
// defaultUrlTransform only strips control characters, angle brackets and
// quotes — it does NOT block dangerous protocols such as `javascript:`,
// `data:text/html` or `vbscript:`. When markdown content comes from a
// user-controlled store (e.g. KnowledgeArticle) or an LLM, a crafted link
// like `[x](javascript:alert(document.cookie))` would otherwise render as
// an <a href="javascript:..."> anchor and execute attacker-supplied
// JavaScript in another user's session when clicked.
//
// Allow only web, mailto, tel, protocol-relative/root-relative URLs, in-page
// anchors, and inline non-HTML image data URIs. Everything else is blanked.
const SAFE_URL = /^(https?:|mailto:|tel:|data:image\/|\/|#|\.\/|\.\.\/)/i;

export function safeUrlTransform(url) {
  if (typeof url !== "string") return "";
  const trimmed = url.trim();
  if (!trimmed) return "";
  // Reject any encoded control chars / whitespace immediately.
  if (/[\u0000-\u001f\u007f]/.test(trimmed)) return "";
  return SAFE_URL.test(trimmed) ? trimmed : "";
}