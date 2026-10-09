import { useState } from "react";
import { KeyRound, LogOut } from "lucide-react";
import { changePin, logout } from "@/lib/clinicalAuth";

// Forced PIN change shown after first sign-in for accounts still on a
// temporary (random) PIN. The server blocks all app data until this completes.
export default function FirstLoginChangePin({ user, onDone }) {
  const [pin, setPin] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e?.preventDefault?.();
    setError("");
    if (!/^\d{4,6}$/.test(pin)) { setError("PIN must be 4 to 6 digits."); return; }
    if (pin !== confirm) { setError("PINs do not match."); return; }
    setBusy(true);
    try {
      await changePin(user.id, pin);
      onDone?.();
    } catch (err) {
      setError(err?.message || "Could not update PIN. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center gap-2">
          <KeyRound className="h-5 w-5 text-clinical-teal" />
          <h1 className="text-lg font-bold text-slate-900">Change your temporary PIN</h1>
        </div>
        <p className="mb-4 text-sm text-slate-600">
          Welcome, {user?.full_name || "LEE user"}. For security, please set a new PIN before continuing.
          Your temporary PIN was issued by your tutor or administrator.
        </p>
        <form onSubmit={submit} className="space-y-3">
          <label className="block">
            <span className="text-xs font-semibold text-slate-700">New PIN (4–6 digits)</span>
            <input
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
              inputMode="numeric"
              type="password"
              autoComplete="new-password"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              placeholder="New PIN"
            />
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-slate-700">Confirm PIN</span>
            <input
              value={confirm}
              onChange={(e) => setConfirm(e.target.value.replace(/\D/g, "").slice(0, 6))}
              inputMode="numeric"
              type="password"
              autoComplete="new-password"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              placeholder="Confirm PIN"
            />
          </label>
          {error && <p className="text-sm font-medium text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={busy || !/^\d{4,6}$/.test(pin) || pin !== confirm}
            className="w-full rounded-lg bg-clinical-teal px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
          >
            {busy ? "Saving…" : "Set new PIN"}
          </button>
        </form>
        <button
          type="button"
          onClick={() => logout()}
          className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-700"
        >
          <LogOut className="h-3.5 w-3.5" /> Cancel and sign out
        </button>
      </div>
    </div>
  );
}