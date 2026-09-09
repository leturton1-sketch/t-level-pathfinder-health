import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import html2canvas from "html2canvas";
import { Download, RefreshCcw, X, IdCard } from "lucide-react";
import TLevelLogo from "@/components/TLevelLogo";
import { ensureQrToken, reissueQrToken } from "@/lib/qrCard";

const ROLE_LABELS = {
  super_admin: "System Architect",
  admin: "Admin",
  tutor: "Lecturer",
  student: "Student",
  guest: "Guest",
};

/** Modal showing a printable/downloadable Industry Academy ID card with a login QR code. */
export default function QrIdCard({ user, onClose }) {
  const [qrDataUrl, setQrDataUrl] = useState(null);
  const [busy, setBusy] = useState(false);
  const cardRef = useRef(null);

  const generate = async (reissue = false) => {
    setBusy(true);
    try {
      const token = reissue ? await reissueQrToken(user) : await ensureQrToken(user);
      const url = await QRCode.toDataURL(token, { width: 320, margin: 1, color: { dark: "#4c1d95", light: "#ffffff" } });
      setQrDataUrl(url);
    } catch {
      setQrDataUrl(null);
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => { generate(false); }, [user?.id]);

  const handleDownload = async () => {
    if (!cardRef.current) return;
    const canvas = await html2canvas(cardRef.current, { scale: 3, backgroundColor: "#ffffff" });
    const link = document.createElement("a");
    link.download = `${(user.username || "id-card").replace(/[^a-z0-9-_]/gi, "_")}-academy-id.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in" onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-foreground flex items-center gap-2"><IdCard className="w-5 h-5 text-clinical-teal" /> Academy ID Card</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="p-1 rounded-lg hover:bg-muted">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        <div ref={cardRef} className="rounded-xl border border-border bg-white p-5 flex flex-col items-center gap-3">
          <TLevelLogo variant="emblem" size="sm" />
          <p className="text-[10px] font-semibold uppercase tracking-[.14em] text-purple-700">Industry Academy ID Card</p>
          {qrDataUrl ? (
            <img src={qrDataUrl} alt={`QR sign-in code for ${user.full_name}`} className="w-40 h-40" />
          ) : (
            <div className="w-40 h-40 flex items-center justify-center text-xs text-muted-foreground">Generating…</div>
          )}
          <div className="text-center">
            <p className="text-sm font-bold text-slate-900">{user.full_name}</p>
            <p className="text-xs text-slate-600">{user.title || ROLE_LABELS[user.role] || user.role}</p>
            {user.cohort && <p className="text-xs text-slate-500">{user.cohort}</p>}
            <p className="text-[10px] text-slate-400 mt-1">@{user.username}</p>
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          <button type="button" onClick={handleDownload} disabled={!qrDataUrl || busy}
            className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-clinical-teal text-white px-4 py-2.5 text-sm font-semibold hover:opacity-90 disabled:opacity-40">
            <Download className="w-4 h-4" /> Download
          </button>
          <button type="button" onClick={() => generate(true)} disabled={busy}
            className="flex items-center justify-center gap-1.5 rounded-lg border border-border px-3 py-2.5 text-sm font-semibold text-muted-foreground hover:bg-muted disabled:opacity-40"
            title="Issue a new QR code, invalidating any previously printed card">
            <RefreshCcw className="w-4 h-4" /> Reissue
          </button>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">Scan this code on the sign-in screen to log in instantly — no username or PIN needed. The card is stored against this account and can be reprinted at any time.</p>
      </div>
    </div>
  );
}
