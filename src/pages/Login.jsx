import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { completeGoogleLogin, getCurrentUser, startGoogleLogin } from "@/lib/clinicalAuth";
import TLevelLogo from "@/components/TLevelLogo";
import GoogleIcon from "@/components/GoogleIcon";
import { AlertCircle, ArrowRight, ShieldCheck, Sparkles } from "lucide-react";
import { ukVoiceService } from "@/utils/ukVoiceSynthesizer";

const PURPLE = "#765AB0";
const PURPLE_DARK = "#63479D";
const PURPLE_LIGHT = "#866BC0";
const SALMON = "#FF9567";

const bgStyle = {
  background:
    "radial-gradient(circle at 18% 8%, rgba(255,255,255,.98), transparent 32%), radial-gradient(circle at 84% 16%, rgba(220,210,238,.55), transparent 34%), linear-gradient(145deg, #faf9fb 0%, #f2eef7 48%, #f8f6fa 100%)",
};

export default function Login() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const restoreSession = async () => {
      const existing = getCurrentUser();
      if (existing) {
        navigate("/");
        return;
      }

      if (new URLSearchParams(window.location.search).get("auth") === "google") {
        try {
          const user = await completeGoogleLogin();
          if (cancelled) return;
          if (user) {
            const firstName = user.full_name?.split(" ")[0] || "there";
            if (user.role === "super_admin" || user.role === "admin") {
              void ukVoiceService.speak(`Welcome ${firstName}. Administrator access granted. Pathfinder is ready.`);
            } else {
              void ukVoiceService.speak(`Welcome ${firstName}. Google sign-in successful.`);
            }
            navigate("/");
            return;
          }
          setError("Google sign-in could not be completed. Please try again.");
        } catch (err) {
          if (!cancelled) setError(err.message || "Google sign-in could not be completed. Please try again.");
        }
      }

      if (!cancelled) setChecking(false);
    };

    void restoreSession();
    return () => { cancelled = true; };
  }, [navigate]);

  const handleGoogleLogin = () => {
    setError("");
    setLoading(true);
    startGoogleLogin();
  };

  if (checking) {
    return (
      <div className="fixed inset-0 flex items-center justify-center" style={bgStyle}>
        <div className="flex flex-col items-center gap-3">
          <div className="w-9 h-9 border-2 rounded-full animate-spin" style={{ borderColor: `${PURPLE}30`, borderTopColor: PURPLE }} />
          <p className="text-xs font-heading font-semibold text-muted-foreground">Connecting to Pathfinder…</p>
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
          <h1 className="font-display text-2xl tracking-tight text-foreground">Pathfinder</h1>
          <p className="text-xs font-heading font-bold uppercase tracking-[0.18em] mt-1" style={{ color: PURPLE_DARK }}>T-Level Simulation</p>
          <p className="text-sm text-muted-foreground font-body mt-2">Clinical Skills Academy · RNN Group</p>
        </div>

        <div className="polished-glass-edge space-y-4 rounded-3xl border border-white/90 p-6 backdrop-blur-2xl animate-slide-up" style={{ animationDelay: "0.15s", boxShadow: "0 24px 60px -32px rgba(36,27,58,.6), inset 1px 1px 2px rgba(255,255,255,.95)" }}>
          {error && (
            <div className="flex items-center gap-2 text-sm rounded-xl p-2.5" style={{ color: "#B42318", background: "#FC44211A" }}>
              <AlertCircle className="w-4 h-4 shrink-0" /> {error}
            </div>
          )}

          <div className="text-center">
            <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-2xl" style={{ background: `linear-gradient(145deg, ${PURPLE_LIGHT}, ${PURPLE_DARK})`, boxShadow: "0 9px 0 -4px rgba(76,53,126,.34), inset 1px 1px 2px rgba(255,255,255,.5)" }}>
              <ShieldCheck className="h-6 w-6 text-white" />
            </div>
            <h2 className="text-base font-heading font-bold text-foreground">Secure sign-in</h2>
            <p className="mt-1.5 text-[12px] leading-relaxed text-muted-foreground">
              Pathfinder uses your institution Google account for secure access. Staff and students sign in with Google — no username or PIN required.
            </p>
          </div>

          {/* Google sign-in */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="tlevel-3d-panel w-full min-h-12 rounded-xl px-4 py-3 text-sm font-heading font-semibold text-foreground hover:-translate-y-0.5 hover:shadow-lg transition-all disabled:opacity-60 disabled:transform-none flex items-center justify-center gap-3"
            style={{ border: `1px solid ${PURPLE}4D`, background: "linear-gradient(145deg, #ffffff, #f6f4f8)" }}
          >
            {loading ? (
              <div className="w-5 h-5 rounded-full animate-spin" style={{ border: `2px solid ${PURPLE}40`, borderTopColor: PURPLE }} />
            ) : (
              <GoogleIcon className="w-5 h-5" />
            )}
            Continue with Google
          </button>

          <div className="flex items-center gap-2 rounded-xl px-3 py-2 text-[11px]" style={{ border: `1px solid ${PURPLE}26`, background: "#F6F4F8", color: "#625D69" }}>
            <Sparkles className="h-4 w-4 shrink-0" style={{ color: PURPLE }} />
            <span>Authorised staff accounts are granted full admin access automatically.</span>
          </div>

          <div className="flex items-center justify-center gap-2 pt-1 text-[11px] text-muted-foreground">
            <span>Protected by Pathfinder secure access</span>
            <ArrowRight className="w-3 h-3" style={{ color: SALMON }} />
          </div>
        </div>

        <p className="mt-4 text-center text-[10px] text-muted-foreground">
          By signing in you agree to the Pathfinder acceptable use policy.
        </p>
      </div>
    </div>
  );
}