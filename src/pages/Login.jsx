import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { login, changePin, getCurrentUser, startGoogleLogin, completeGoogleLogin } from "@/lib/clinicalAuth";
import TLevelLogo from "@/components/TLevelLogo";
import GoogleIcon from "@/components/GoogleIcon";
import { Lock, User as UserIcon, Delete, AlertCircle, ShieldCheck, ArrowRight } from "lucide-react";
import { ukVoiceService } from "@/utils/ukVoiceSynthesizer";

const PURPLE = "#765AB0";
const PURPLE_DARK = "#63479D";
const PURPLE_LIGHT = "#866BC0";
const SALMON = "#FF9567";

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

  const bgStyle = {
    background:
      "radial-gradient(circle at 18% 8%, rgba(255,255,255,.98), transparent 32%), radial-gradient(circle at 84% 16%, rgba(220,210,238,.55), transparent 34%), linear-gradient(145deg, #faf9fb 0%, #f2eef7 48%, #f8f6fa 100%)",
  };

  if (checking) {
    return (
      <div className="fixed inset-0 flex items-center justify-center" style={bgStyle}>
        <div className="w-8 h-8 border-2 rounded-full animate-spin" style={{ borderColor: `${PURPLE}30`, borderTopColor: PURPLE }} />
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

          <div className="polished-glass-edge space-y-4 rounded-3xl border border-white/90 p-6 shadow-[0_22px_55px_-30px_rgba(36,27,58,.55),inset_1px_1px_2px_rgba(255,255,255,.9)] backdrop-blur-2xl">
            {error && (
              <div className="flex items-center gap-2 text-sm rounded-xl p-2.5" style={{ color: "#B42318", background: "#FC44211A" }}>
                <AlertCircle className="w-4 h-4 shrink-0" /> {error}
              </div>
            )}
            <div>
              <label className="text-xs font-heading font-semibold mb-1.5 block" style={{ color: "#625D69" }}>New PIN</label>
              <input
                type="password"
                inputMode="numeric"
                maxLength={4}
                value={newPin}
                onChange={(e) => setNewPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                className="w-full rounded-xl px-4 py-3 text-center text-2xl tracking-[1em] text-foreground focus:outline-none transition-colors"
                style={{ background: "#F6F4F8", border: `1px solid ${PURPLE}33` }}
                placeholder="••••"
              />
            </div>
            <div>
              <label className="text-xs font-heading font-semibold mb-1.5 block" style={{ color: "#625D69" }}>Confirm PIN</label>
              <input
                type="password"
                inputMode="numeric"
                maxLength={4}
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                className="w-full rounded-xl px-4 py-3 text-center text-2xl tracking-[1em] text-foreground focus:outline-none transition-colors"
                style={{ background: "#F6F4F8", border: `1px solid ${PURPLE}33` }}
                placeholder="••••"
              />
            </div>
            <button
              onClick={handlePinChange}
              disabled={newPin.length !== 4 || newPin !== confirmPin}
              className="w-full py-3 rounded-xl text-white font-heading font-semibold disabled:opacity-40 hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
              style={{ background: `linear-gradient(135deg, ${PURPLE_LIGHT}, ${PURPLE_DARK})` }}
            >
              Set New PIN & Continue <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center p-6" style={bgStyle}>
      {/* Decorative watermark */}
      <div className="absolute inset-0 flex items-center justify-center opacity-[0.035] pointer-events-none select-none">
        <img src="https://media.base44.com/images/public/6a4759cc86fe95039e31fd09/8acde0e8c_TLevel-Logo-BlackWithStrapline.png" alt="" className="w-96 h-auto" />
      </div>

      <div className="w-full max-w-sm relative z-10">
        {/* Brand header */}
        <div className="text-center mb-6 animate-fade-in">
          <div className="flex justify-center mb-4">
            <TLevelLogo size="lg" />
          </div>
          <h1 className="font-display text-2xl tracking-tight text-foreground">Pathfinder Health</h1>
          <p className="text-sm text-muted-foreground font-body mt-1">Clinical Skills Academy · RNN Group</p>
        </div>

        <div className="polished-glass-edge space-y-4 rounded-3xl border border-white/90 p-6 shadow-[0_24px_60px_-32px_rgba(36,27,58,.6),inset_1px_1px_2px_rgba(255,255,255,.95)] backdrop-blur-2xl animate-slide-up" style={{ animationDelay: "0.15s" }}>
          {error && (
            <div className="flex items-center gap-2 text-sm rounded-xl p-2.5" style={{ color: "#B42318", background: "#FC44211A" }}>
              <AlertCircle className="w-4 h-4 shrink-0" /> {error}
            </div>
          )}

          {/* Google sign-in */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={googleLoading || loading}
            className="tlevel-3d-panel w-full min-h-12 rounded-xl px-4 py-3 text-sm font-heading font-semibold text-foreground hover:-translate-y-0.5 hover:shadow-lg transition-all disabled:opacity-50 disabled:transform-none flex items-center justify-center gap-3"
            style={{ border: `1px solid ${PURPLE}4D`, background: "linear-gradient(145deg, #ffffff, #f6f4f8)" }}
          >
            {googleLoading ? (
              <div className="w-5 h-5 rounded-full animate-spin" style={{ border: `2px solid ${PURPLE}40`, borderTopColor: PURPLE }} />
            ) : (
              <GoogleIcon className="w-5 h-5" />
            )}
            Continue with Google
          </button>

          <div className="flex items-center gap-2 rounded-xl px-3 py-2 text-[11px]" style={{ border: `1px solid ${PURPLE}26`, background: "#F6F4F8", color: "#625D69" }}>
            <ShieldCheck className="h-4 w-4 shrink-0" style={{ color: PURPLE }} />
            <span>Secure account sign-in — recommended for staff.</span>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3 py-0.5" aria-hidden="true">
            <div className="h-px flex-1" style={{ background: `${PURPLE}22` }} />
            <span className="text-[10px] font-heading font-bold uppercase tracking-[0.16em] text-muted-foreground">Staff &amp; student sign-in</span>
            <div className="h-px flex-1" style={{ background: `${PURPLE}22` }} />
          </div>

          {/* Username */}
          <div>
            <label className="text-xs font-heading font-semibold mb-1.5 block" style={{ color: "#625D69" }}>Username</label>
            <div className="relative">
              <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                className="w-full rounded-xl pl-10 pr-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none transition-colors"
                style={{ background: "#F6F4F8", border: `1px solid ${PURPLE}33` }}
                placeholder="Enter your username"
                autoFocus
              />
            </div>
          </div>

          {/* PIN dots */}
          <div>
            <label className="text-xs font-heading font-semibold mb-1.5 block" style={{ color: "#625D69" }}>4-digit PIN</label>
            <div className="flex justify-center gap-3">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="w-12 h-14 rounded-xl border-2 flex items-center justify-center text-2xl font-bold transition-all"
                  style={pin.length > i
                    ? { borderColor: PURPLE, background: `${PURPLE}26`, color: PURPLE_DARK }
                    : { borderColor: `${PURPLE}26`, background: "#F6F4F8", color: "#625D69" }}
                >
                  {pin.length > i ? "•" : ""}
                </div>
              ))}
            </div>
          </div>

          {/* Keypad */}
          <div className="grid grid-cols-3 gap-2">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => (
              <button
                key={digit}
                onClick={() => handlePinDigit(String(digit))}
                className="aspect-square rounded-2xl text-xl font-heading font-bold text-foreground hover:border-[var(--ring)] transition-all active:scale-95"
                style={{ border: `1px solid ${PURPLE}26`, background: "#ffffff" }}
              >
                {digit}
              </button>
            ))}
            <div />
            <button
              onClick={() => handlePinDigit("0")}
              className="aspect-square rounded-2xl text-xl font-heading font-bold text-foreground hover:border-[var(--ring)] transition-all active:scale-95"
              style={{ border: `1px solid ${PURPLE}26`, background: "#ffffff" }}
            >
              0
            </button>
            <button
              onClick={handlePinDelete}
              className="aspect-square rounded-2xl text-muted-foreground hover:text-[var(--ring)] transition-all active:scale-95 flex items-center justify-center"
              style={{ border: `1px solid ${PURPLE}26`, background: "#F6F4F8" }}
            >
              <Delete className="w-5 h-5" />
            </button>
          </div>

          {/* Login button */}
          <button
            onClick={handleLogin}
            disabled={loading || !username.trim() || pin.length !== 4}
            className="w-full py-3 rounded-xl text-white font-heading font-semibold disabled:opacity-40 hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
            style={{ background: `linear-gradient(135deg, ${PURPLE_LIGHT}, ${PURPLE_DARK})` }}
          >
            {loading ? (
              <div className="w-5 h-5 rounded-full animate-spin" style={{ border: "2px solid rgba(255,255,255,.35)", borderTopColor: "#fff" }} />
            ) : (
              <>
                <Lock className="w-4 h-4" />
                Log In
              </>
            )}
          </button>
        </div>

        <p className="mt-4 text-center text-[10px] text-muted-foreground">
          By signing in you agree to the Pathfinder Health acceptable use policy.
        </p>
      </div>
    </div>
  );
}