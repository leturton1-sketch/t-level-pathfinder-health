import { useState } from "react";
import QRCode from "qrcode";
import { base44 } from "@/api/base44Client";

export default function QRAccessPanel({ users }) {
  const [selected, setSelected] = useState("");
  const [busy, setBusy] = useState(false);
  const [card, setCard] = useState(null);
  const [message, setMessage] = useState("");
  const eligible = users.filter(user => user.active !== false && !user.is_protected && !["admin", "super_admin"].includes(user.role));
  const user = eligible.find(item => item.id === selected);
  const manage = async action => {
    if (!user || busy) return;
    setBusy(true); setMessage(""); setCard(null);
    try {
      const response = await base44.functions.invoke("manageQrAccess", { app_user_id: user.id, action });
      const data = response.data;
      if (action === "revoke") {
        if (!data?.revoked) throw new Error("The code could not be revoked.");
        setMessage("Personal QR codes revoked. PIN sign-in is unchanged.");
      } else {
        if (!data?.qr || !data?.expires_at) throw new Error("The server did not return a QR code.");
        const image = await QRCode.toDataURL(data.qr, { width: 640, margin: 4, errorCorrectionLevel: "M", color: { dark: "#000000", light: "#ffffff" } });
        setCard({ image, expires: data.expires_at, name: user.full_name, username: user.username });
        setMessage("QR code ready. Previous personal QR codes for this account are now revoked.");
      }
    } catch (error) {
      setMessage(error?.response?.data?.error || error?.message || "Unable to manage the QR code. Please try again.");
    } finally { setBusy(false); }
  };
  return <section className="rounded-2xl border border-border bg-card p-5">
    <h2 className="text-xl font-bold">Personal QR login codes</h2>
    <p className="mt-2 text-sm text-muted-foreground">Generate a login card for an active learner or lecturer. A Pathfinder administrator session is required. Protected and administrator accounts continue to use PIN sign-in.</p>
    <label className="mt-5 block font-semibold" htmlFor="qr-account">Account</label>
    <select id="qr-account" className="mt-2 w-full rounded-lg border border-border bg-background p-3" disabled={busy} value={selected} onChange={e => { setSelected(e.target.value); setCard(null); setMessage(""); }}>
      <option value="">Choose an account</option>
      {eligible.map(item => <option key={item.id} value={item.id}>{item.full_name} (@{item.username})</option>)}
    </select>
    {!eligible.length && <p className="mt-3 text-sm">No eligible accounts are available. Add or activate a learner account in Users.</p>}
    <p className="mt-3 text-sm text-muted-foreground">Generating a replacement invalidates previous personal QR codes. New cards expire after 90 days. Keep each card private: anyone holding it can use it to identify that account.</p>
    <div className="mt-4 flex flex-wrap gap-3">
      <button type="button" className="pf-primary-button" disabled={!user || busy} onClick={() => manage("issue")}>{busy ? "Working…" : "Generate / replace QR code"}</button>
      <button type="button" className="pf-secondary-button" disabled={!user || busy} onClick={() => manage("revoke")}>Revoke personal QR codes</button>
    </div>
    <p role="status" aria-live="polite" className="mt-3 text-sm">{message}</p>
    {card && <>
      <div className="qr-access-card mt-5 rounded-xl border border-border bg-white p-5 text-center text-slate-950">
        <h3 className="text-lg font-bold">Pathfinder Health</h3>
        <p className="mt-1 font-semibold">{card.name}</p><p className="text-sm">@{card.username}</p>
        <img src={card.image} width="320" height="320" className="mx-auto max-w-full" alt={"Personal login QR code for " + card.name} />
        <p className="text-sm">Expires {new Date(card.expires).toLocaleDateString("en-GB")}</p>
        <p className="mt-2 text-xs">Open Pathfinder → QR Scan → Start camera.</p>
      </div>
      <div className="mt-4 flex flex-wrap gap-3">
        <a className="pf-primary-button" href={card.image} download={"pathfinder-qr-" + card.username.replace(/[^a-zA-Z0-9_-]/g, "_") + ".png"}>Download QR image</a>
        <button type="button" className="pf-secondary-button" onClick={() => window.print()}>Print QR card</button>
      </div>
      <p className="mt-3 text-xs text-muted-foreground">Save or print this card before leaving this tab. Its secret is not stored in your browser.</p>
      <style>{`@media print { body * { visibility:hidden!important; } .qr-access-card,.qr-access-card * { visibility:visible!important; } .qr-access-card { position:absolute; top:0; left:0; width:360px; margin:0!important; } }`}</style>
    </>}
  </section>;
}
