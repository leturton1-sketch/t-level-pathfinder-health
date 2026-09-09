import { base44 } from "@/api/base44Client";

/**
 * Industry Academy ID card QR tokens.
 * Each card carries a long random token stored on AppUser.qr_token — never
 * the user's PIN — so the card keeps working even if the PIN is changed,
 * and a lost/reissued card can be revoked independently of sign-in.
 */
function randomToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(24));
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

/** Returns the user's existing QR token, minting and persisting one if absent. */
export async function ensureQrToken(appUser) {
  if (appUser?.qr_token) return appUser.qr_token;
  const token = randomToken();
  await base44.entities.AppUser.update(appUser.id, { qr_token: token });
  return token;
}

/** Issues a brand-new token, invalidating any previously printed card. */
export async function reissueQrToken(appUser) {
  const token = randomToken();
  await base44.entities.AppUser.update(appUser.id, { qr_token: token });
  return token;
}
