import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { login, changePin, getCurrentUser } from "@/lib/clinicalAuth";
import TLevelLogo from "@/components/TLevelLogo";
import CentreLight from "@/components/CentreLight";
import { Lock, User as UserIcon, Delete, AlertCircle } from "lucide-react";

export default function Login() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [username, setUsername] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPinChange, setShowPinChange] = useState(false);
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [pendingUser, setPendingUser] = useState(null);

  useEffect(() => {
    const existing = getCurrentUser();
    if (existing) {
      navigate("/");
    } else {
      setChecking(false);
    }
  }, [navigate]);

  const handleLogin = async () => {
    if (!username.trim() || pin.length !== 4) return;
    setLoading(true);
    setError("");
    try {
      const user = await login(username, pin);
      if (user.first_login || pin === "0000") {
        setPendingUser({ ...user, pin });
        setShowPinChange(true);
      } else {
        navigate("/");
      }
    } catch (err) {
      setError(err.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handlePinChange = async () => {
    if (newPin.length !== 4 || newPin !== confirmPin) {
      setError("PINs must match and be 4 digits.");
      return;
    }
    try {
      await changePin(pendingUser.id, newPin);
      navigate("/");
    } catch (err) {
      setError("Failed to update PIN. Please try again.");
    }
  };

  const handlePinDigit = (digit) => {
    if (pin.length < 4) {
      setPin(pin + digit);
    }
  };

  const handlePinDelete = () => {
    setPin(pin.slice(0, -1));
  };

  if (checking) {
    return (
      <div className="fixed inset-0 bg-slate-100 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-clinical-teal/30 border-t-clinical-teal rounded-full animate-spin" />
      </div>
    );
  }

  if (showPinChange) {
    return (
      <div className="fixed inset-0 bg-slate-100 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="text-center mb-6 animate-fade-in">
            <div className="flex justify-center mb-4"><TLevelLogo size="md" /></div>
            <h1 className="text-xl font-heading font-bold text-slate-800">Change Your PIN</h1>
            <p className="text-sm text-slate-500 mt-2">For security, please set a new 4-digit PIN.</p>
          </div>

          <div className="space-y-4 bg-white rounded-xl border border-slate-200 p-6 shadow-lg">
            {error && (
              <div className="flex items-center gap-2 text-sm text-clinical-red bg-clinical-red/10 rounded-lg p-2">
                <AlertCircle className="w-4 h-4" /> {error}
              </div>
            )}
            <div>
              <label className="text-xs text-slate-500 mb-1 block font-heading">New PIN</label>
              <input
                type="password"
                inputMode="numeric"
                maxLength={4}
                value={newPin}
                onChange={(e) => setNewPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-center text-2xl tracking-[1em] text-slate-800 focus:outline-none focus:border-clinical-teal"
                placeholder="••••"
              />
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block font-heading">Confirm PIN</label>
              <input
                type="password"
                inputMode="numeric"
                maxLength={4}
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-center text-2xl tracking-[1em] text-slate-800 focus:outline-none focus:border-clinical-teal"
                placeholder="••••"
              />
            </div>
            <button
              onClick={handlePinChange}
              disabled={newPin.length !== 4 || newPin !== confirmPin}
              className="w-full py-3 rounded-lg bg-clinical-teal text-white font-heading font-semibold disabled:opacity-40 hover:opacity-90 transition-opacity"
            >
              Set New PIN & Continue
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-slate-100 flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        {/* Centre light + branding */}
        <div className="flex justify-center mb-3">
          <CentreLight />
        </div>
        <div className="text-center mb-6 animate-fade-in" style={{ animationDelay: "0.3s" }}>
          <div className="flex justify-center mb-3"><TLevelLogo size="md" /></div>
          <p className="text-sm text-slate-500 font-body">T Level Health Learning Platform</p>
        </div>

        <div className="space-y-4 bg-white rounded-xl border border-slate-200 p-6 shadow-lg animate-slide-up" style={{ animationDelay: "0.4s" }}>
          {error && (
            <div className="flex items-center gap-2 text-sm text-clinical-red bg-clinical-red/10 rounded-lg p-2">
              <AlertCircle className="w-4 h-4" /> {error}
            </div>
          )}

          <div>
            <label className="text-xs text-slate-500 mb-1 block font-heading">Username</label>
            <div className="relative">
              <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-4 py-3 text-slate-800 focus:outline-none focus:border-clinical-teal"
                placeholder="Enter your username"
                autoFocus
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-500 mb-1 block font-heading">PIN</label>
            <div className="flex justify-center gap-3 mb-3">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={`w-12 h-14 rounded-lg border-2 flex items-center justify-center text-2xl font-bold transition-all ${
                    pin.length > i
                      ? "border-clinical-teal bg-clinical-teal/10 text-clinical-teal"
                      : "border-slate-200 bg-slate-50 text-slate-300"
                  }`}
                >
                  {pin.length > i ? "•" : ""}
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => (
              <button
                key={digit}
                onClick={() => handlePinDigit(String(digit))}
                className="aspect-square rounded-xl border border-slate-200 bg-slate-50 text-xl font-heading font-bold text-slate-800 hover:bg-slate-100 hover:border-clinical-teal/40 transition-all active:scale-95"
              >
                {digit}
              </button>
            ))}
            <div />
            <button
              onClick={() => handlePinDigit("0")}
              className="aspect-square rounded-xl border border-slate-200 bg-slate-50 text-xl font-heading font-bold text-slate-800 hover:bg-slate-100 hover:border-clinical-teal/40 transition-all active:scale-95"
            >
              0
            </button>
            <button
              onClick={handlePinDelete}
              className="aspect-square rounded-xl border border-slate-200 bg-slate-50 text-slate-400 hover:bg-slate-100 transition-all active:scale-95 flex items-center justify-center"
            >
              <Delete className="w-5 h-5" />
            </button>
          </div>

          <button
            onClick={handleLogin}
            disabled={loading || !username.trim() || pin.length !== 4}
            className="w-full py-3 rounded-lg bg-clinical-teal text-white font-heading font-semibold disabled:opacity-40 hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Lock className="w-4 h-4" />
                Log In
              </>
            )}
          </button>

          <p className="text-center text-xs text-slate-400">
            Default PIN is 0000 — you'll be prompted to change it on first login.
          </p>
        </div>
      </div>
    </div>
  );
}