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

  const bgStyle = { background: "linear-gradient(135deg, #FBFAF7 0%, #F4F1EC 100%)" };

  if (checking) {
    return (
      <div className="fixed inset-0 flex items-center justify-center" style={bgStyle}>
        <div className="w-8 h-8 border-2 border-[#F4845F]/30 border-t-[#F4845F] rounded-full animate-spin" />
      </div>
    );
  }

  if (showPinChange) {
    return (
      <div className="fixed inset-0 flex items-center justify-center p-6" style={bgStyle}>
        <div className="w-full max-w-sm">
          <div className="text-center mb-6 animate-fade-in">
            <div className="flex justify-center mb-4"><TLevelLogo size="md" /></div>
            <h1 className="text-xl font-heading font-bold text-foreground">Change Your PIN</h1>
            <p className="text-sm text-muted-foreground mt-2">For security, please set a new 4-digit PIN.</p>
          </div>

          <div className="space-y-4 bg-card rounded-3xl border border-border shadow-xl p-6">
            {error && (
              <div className="flex items-center gap-2 text-sm text-[#F03D1C] bg-[#F03D1C]/10 rounded-lg p-2">
                <AlertCircle className="w-4 h-4" /> {error}
              </div>
            )}
            <div>
              <label className="text-xs text-muted-foreground mb-1 block font-heading">New PIN</label>
              <input
                type="password"
                inputMode="numeric"
                maxLength={4}
                value={newPin}
                onChange={(e) => setNewPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                className="w-full bg-muted border border-border rounded-xl px-4 py-3 text-center text-2xl tracking-[1em] text-foreground focus:outline-none focus:border-[#F4845F] focus:bg-card"
                placeholder="••••"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block font-heading">Confirm PIN</label>
              <input
                type="password"
                inputMode="numeric"
                maxLength={4}
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                className="w-full bg-muted border border-border rounded-xl px-4 py-3 text-center text-2xl tracking-[1em] text-foreground focus:outline-none focus:border-[#F4845F] focus:bg-card"
                placeholder="••••"
              />
            </div>
            <button
              onClick={handlePinChange}
              disabled={newPin.length !== 4 || newPin !== confirmPin}
              className="w-full py-3 rounded-xl text-white font-heading font-semibold disabled:opacity-40 hover:opacity-90 transition-opacity"
              style={{ background: "linear-gradient(135deg, #F4845F, #F03D1C)" }}
            >
              Set New PIN & Continue
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center p-6" style={bgStyle}>
      {/* Decorative BG mark */}
      <div className="absolute inset-0 flex items-center justify-center opacity-[0.04] pointer-events-none select-none">
        <img src="https://media.base44.com/images/public/6a4759cc86fe95039e31fd09/eb340c16e_TLevel-Logo-TLWhite.png" alt="" className="w-96 h-auto" />
      </div>

      <div className="w-full max-w-sm relative z-10">
        <div className="text-center mb-8 animate-fade-in">
          <div className="flex justify-center mb-4">
            <TLevelLogo size="lg" />
          </div>
          <p className="text-sm text-muted-foreground font-body">T Level Health Learning Platform</p>
        </div>

        <div className="space-y-4 bg-card rounded-3xl border border-border shadow-xl p-6 animate-slide-up" style={{ animationDelay: "0.2s" }}>
          {error && (
            <div className="flex items-center gap-2 text-sm text-[#F03D1C] bg-[#F03D1C]/10 rounded-lg p-2">
              <AlertCircle className="w-4 h-4" /> {error}
            </div>
          )}

          <div>
            <label className="text-xs text-muted-foreground mb-1 block font-heading">Username</label>
            <div className="relative">
              <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                className="w-full bg-muted border border-border rounded-xl pl-10 pr-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-[#F4845F] focus:bg-card"
                placeholder="Enter your username"
                autoFocus
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-1 block font-heading">PIN</label>
            <div className="flex justify-center gap-3 mb-3">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={`w-12 h-14 rounded-xl border-2 flex items-center justify-center text-2xl font-bold transition-all ${
                    pin.length > i
                      ? "border-[#F4845F] bg-[#F4845F]/20 text-[#F4845F]"
                      : "border-border bg-muted text-muted-foreground"
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
                className="aspect-square rounded-2xl border border-border bg-muted text-xl font-heading font-bold text-foreground hover:bg-secondary hover:border-[#F4845F]/50 transition-all active:scale-95"
              >
                {digit}
              </button>
            ))}
            <div />
            <button
              onClick={() => handlePinDigit("0")}
              className="aspect-square rounded-2xl border border-border bg-muted text-xl font-heading font-bold text-foreground hover:bg-secondary hover:border-[#F4845F]/50 transition-all active:scale-95"
            >
              0
            </button>
            <button
              onClick={handlePinDelete}
              className="aspect-square rounded-2xl border border-border bg-muted text-muted-foreground hover:bg-secondary transition-all active:scale-95 flex items-center justify-center"
            >
              <Delete className="w-5 h-5" />
            </button>
          </div>

          <button
            onClick={handleLogin}
            disabled={loading || !username.trim() || pin.length !== 4}
            className="w-full py-3 rounded-xl text-white font-heading font-semibold disabled:opacity-40 hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
            style={{ background: "linear-gradient(135deg, #F4845F, #F03D1C)" }}
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

          <p className="text-center text-xs text-muted-foreground">
            Default PIN is 0000 — you'll be prompted to change it on first login.
          </p>
        </div>
      </div>
    </div>
  );
}