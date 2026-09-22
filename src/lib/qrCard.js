import { base44 } from "@/api/base44Client";

async function issueSecureQr(appUser) {
  if (!appUser?.id) throw new Error("Choose an account first.");
  const response = await base44.functions.invoke("manageQrAccess", {
    app_user_id: appUser.id,
    action: "issue",
  });
  const data = response?.data ?? response;
  if (!data?.qr) throw new Error("The server did not return a QR credential.");
  return data.qr;
}

/**
 * Secure QR credentials are random, hashed at rest, expire after 90 days and
 * revoke any previously issued credential for the same account.
 */
export function ensureQrToken(appUser) {
  return issueSecureQr(appUser);
}

export function reissueQrToken(appUser) {
  return issueSecureQr(appUser);
}
