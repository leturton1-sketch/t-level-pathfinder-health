import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { login, changePin, getCurrentUser, startGoogleLogin, completeGoogleLogin } from "@/lib/clinicalAuth";
import TLevelLogo from "@/components/TLevelLogo";
import GoogleIcon from "@/components/GoogleIcon";
import { Lock, User as UserIcon, Delete, AlertCircle, ShieldCheck } from "lucide-react";
import { ukVoiceService } from "@/utils/ukVoiceSynthesizer";

export default function Login() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [username, setUsername] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPinChange, setShowPinChange] = useState(false);
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [pendingUser, setPendingUser] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const restoreSession = async () => {
      const existing = getCurrentUser();
      if (existing) {
        navigate("/");
        return;
      }

      try {
        const googleUser = await completeGoogleLogin();
        if (googleUser && !cancelled) {
          void ukVoiceService.speak(`Welcome, ${googleUser.full_name?.split(" ")[0] || "there"}. Google sign-in successful.`);
          navigate("/");
          return;
        }
      } catch (err) {
        if (!cancelled && new URLSearchParams(window.location.search).get("auth") === "google") {
          setError(err.message || "Google sign-in could not be completed. Please try again.");
        }
      }

      if (!cancelled) setChecking(false);
    };

    void restoreSession();
    return () => { cancelled = true; };
  }, [navigate]);

  const handleGoogleLogin = () => {
    setError("");
    setGoogleLoading(true);
    startGoogleLogin();
  };

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
        void ukVoiceService.speak(`Welcome back, ${user.full_name?.split(" ")[0] || "there"}. Login successful.`);
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
      void ukVoiceService.speak("Your PIN has been updated successfully. Welcome to Pathfinder Health.");
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

  const bgStyle = { background: "radial-gradient(circle at 20% 10%, #FFFFFF 0%, transparent 34%), linear-gradient(135deg, #FAF9FB 0%, #F2EEF7 100%)" };

  if (checking) {
    return (
      <div className="fixed inset-0 flex items-center justify-center" style={bgStyle}>
        <div className="w-8 h-8 border-2 border-[#765AB0]/30 border-t-[#765AB0] rounded-full animate-spin" />
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

          <div className="space-y-4 bg-white rounded-3xl border border-border shadow-xl p-6">
            {error && (
              <div className="flex items-center gap-2 text-sm text-[#B42318] bg-[#FC4421]/10 rounded-lg p-2">
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
                className="w-full bg-muted border border-border rounded-xl px-4 py-3 text-center text-2xl tracking-[1em] text-foreground focus:outline-none focus:border-[#765AB0] focus:bg-white"
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
                className="w-full bg-muted border border-border rounded-xl px-4 py-3 text-center text-2xl tracking-[1em] text-foreground focus:outline-none focus:border-[#765AB0] focus:bg-white"
                placeholder="••••"
              />
            </div>
            <button
              onClick={handlePinChange}
              disabled={newPin.length !== 4 || newPin !== confirmPin}
              className="w-full py-3 rounded-xl text-white font-heading font-semibold disabled:opacity-40 hover:opacity-90 transition-opacity"
              style={{ background: "linear-gradient(135deg, #866BC0, #63479D)" }}
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
      <div className="absolute inset-0 flex items-center justify-center opacity-[0.035] pointer-events-none select-none">
        <img src="https://media.base44.com/images/public/6a4759cc86fe95039e31fd09/8acde0e8c_TLevel-Logo-BlackWithStrapline.png" alt="" className="w-96 h-auto" />
      </div>

      <div className="w-full max-w-sm relative z-10">
        <div className="text-center mb-8 animate-fade-in">
          <div className="flex justify-center mb-4">
            <TLevelLogo size="lg" />
          </div>
          <p className="text-sm text-muted-foreground font-body">Clinical Skills Academy (RNN Group)</p>
        </div>

        <div className="space-y-4 bg-white rounded-3xl border border-border shadow-xl p-6 animate-slide-up" style={{ animationDelay: "0.2s" }}>
          {error && (
            <div className="flex items-center gap-2 text-sm text-[#B42318] bg-[#FC4421]/10 rounded-lg p-2">
              <AlertCircle className="w-4 h-4" /> {error}
            </div>
          )}

          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={googleLoading || loading}
            className="tlevel-3d-panel w-full min-h-12 rounded-xl border border-[#765AB0]/30 bg-white px-4 py-3 text-sm font-heading font-semibold text-foreground hover:-translate-y-0.5 hover:border-[#765AB0]/60 hover:shadow-lg transition-all disabled:opacity-50 disabled:transform-none flex items-center justify-center gap-3"
          >
            {googleLoading ? (
              <div className="w-5 h-5 border-2 border-[#765AB0]/25 border-t-[#765AB0] rounded-full animate-spin" />
            ) : (
              <GoogleIcon className="w-5 h-5" />
            )}
            Continue with Google
          </button>

          <div className="flex items-center justify-center gap-2 rounded-xl border border-[#765AB0]/15 bg-[#F6F4F8] px-3 py-2 text-[11px] text-[#625D69]">
            <ShieldCheck className="h-4 w-4 shrink-0 text-[#765AB0]" />
            <span>Secure account sign-in — recommended for normal use.</span>
          </div>

          <div className="flex items-center gap-3 py-1" aria-hidden="true">
            <div className="h-px flex-1 bg-border" />
            <span className="text-[10px] font-heading font-bold uppercase tracking-[0.16em] text-muted-foreground">Staff & student sign-in</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-1 block font-heading">Username</label>
            <div className="relative">
              <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                className="w-full bg-muted border border-border rounded-xl pl-10 pr-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-[#765AB0] focus:bg-white"
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
                      ? "border-[#765AB0] bg-[#765AB0]/15 text-[#63479D]"
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
                className="aspect-square rounded-2xl border border-border bg-muted text-xl font-heading font-bold text-foreground hover:bg-secondary hover:border-[#765AB0]/50 transition-all active:scale-95"
              >
                {digit}
              </button>
            ))}
            <div />
            <button
              onClick={() => handlePinDigit("0")}
              className="aspect-square rounded-2xl border border-border bg-muted text-xl font-heading font-bold text-foreground hover:bg-secondary hover:border-[#765AB0]/50 transition-all active:scale-95"
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
            style={{ background: "linear-gradient(135deg, #866BC0, #63479D)" }}
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

        </div>
      </div>
    </div>
  );
}