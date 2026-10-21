import { useRef, useEffect, useState } from "react";
import { GraduationCap, Users, HeartPulse, ShieldCheck, ChartNoAxesColumnIncreasing, RotateCcw } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { useVoiceSynthesis } from "@/hooks/useVoiceSynthesis";
import { setAppUser } from "@/lib/clinicalAuth";
import { setSessionToken, clearSession } from "@/lib/authSession";
import TLevelLogo from "@/components/TLevelLogo";
import "./LoginGate.css";

export default function LoginGate({ onUnlock }) {
  const { toast } = useToast();
  const synth = useVoiceSynthesis();
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const mountedRef = useRef(true);

  useEffect(() => { mountedRef.current = true; return () => { mountedRef.current = false; }; }, []);

  const announce = async (text) => { try { await synth.speak(text); } catch {} };

  const grant = (user, method = "role") => {
    setAppUser(user, method);
    toast({ title: "Access granted", description: `Welcome, ${user.full_name}.` });
    // The richer personalised welcome (spoken + visual) is shown next, by WelcomeGreeting.
    onUnlock?.();
  };

  const deny = (reason, isNetwork = false) => {
    // Sanitize stale session state so the client isn't left broken
    // after a failed login attempt.
    clearSession();
    try {
      sessionStorage.removeItem("pathfinder-unlocked");
      sessionStorage.removeItem("pathfinder-welcomed");
      sessionStorage.removeItem("pathfinder-app-user-v2");
    } catch {}
    const message = isNetwork
      ? "Unable to connect. Please check your internet connection and try again."
      : reason || "Unable to sign in with this role. Please try again.";
    toast({ title: "Access denied", description: message, variant: "destructive" });
    announce(`Access denied. ${message}`);
  };

  const emergencyReset = () => {
    clearSession();
    try {
      sessionStorage.removeItem("pathfinder-unlocked");
      sessionStorage.removeItem("pathfinder-welcomed");
      sessionStorage.removeItem("pathfinder-app-user-v2");
      localStorage.removeItem("pathfinder-app-user-v2");
      Object.keys(sessionStorage).forEach(k => { if (k.startsWith("pathfinder-")) sessionStorage.removeItem(k); });
    } catch {}
    window.location.reload();
  };

  const submit = async (payload) => {
    if (busyRef.current || !mountedRef.current) return;
    busyRef.current = true;
    setBusy(true);
    try {
      const res = await base44.functions.invoke("verifyAccess", payload);
      const data = res?.data ?? res;
      if (!mountedRef.current) return;
      if (data?.granted) { setSessionToken(data.session_token); grant(data.user, "role"); }
      else deny(data?.reason);
    } catch (e) {
      if (mountedRef.current) {
        const isNetwork = !e?.status && !e?.response?.status;
        deny(e?.data?.reason || e?.response?.data?.reason, isNetwork);
      }
    } finally {
      busyRef.current = false;
      if (mountedRef.current) setBusy(false);
    }
  };

  const ROLES = [
    { key: "student", label: "T-Level Student Login", Icon: GraduationCap },
    { key: "tutor", label: "T-Level Curriculum Tutor", Icon: Users },
    { key: "admin", label: "System Administrator", Icon: ShieldCheck },
  ];

  return (
    <div className="login-gate">
      <div className="login-gate-backdrop" aria-hidden="true">
        <div className="login-gate-blur" />
        <div className="login-gate-ribbon login-gate-ribbon--top" />
        <div className="login-gate-ribbon login-gate-ribbon--bottom" />
        <div className="login-gate-cross" />
        <div className="login-gate-brand">
          <TLevelLogo variant="black" size="xl" />
          <span>Learn | Practice | Prepare | Progress</span>
        </div>
        <p className="login-gate-message">Explore<br />understand<br />apply<strong>The next level</strong></p>
        <p className="login-gate-promise">Real<br />skills<br />real<br />careers<br />a healthier<br />tomorrow</p>
        <div className="login-gate-values" aria-hidden="true">
          <span><GraduationCap />Real skills</span>
          <span><Users />Real careers</span>
          <span><HeartPulse />A healthier tomorrow</span>
        </div>
        <div className="login-gate-trust" aria-hidden="true">
          <span><ShieldCheck />Safe</span>
          <span><Users />Supportive</span>
          <span><ChartNoAxesColumnIncreasing />Progressive</span>
        </div>
      </div>

      <div className="login-gate-card">
        <header className="login-gate-header">
          <p className="login-gate-welcome">The Interactive Ward & AI Clinical Preceptor</p>
          <TLevelLogo variant="black" size="lg" className="login-gate-logo" />
          <p className="login-gate-tagline">T-Sim Health · Learn | Practice | Prepare | Progress</p>
          <h1>Choose how you want to sign in</h1>
          <p>Access your personalised learning, resources and tools.</p>
        </header>

        <div className="login-gate-form">
          {ROLES.map(({ key, label, Icon }) => (
            <button key={key} type="button" disabled={busy} onClick={() => submit({ role_login: key })} className="login-gate-unlock">
              <Icon size={16} /> {busy ? "Signing in…" : label}
            </button>
          ))}
          <p className="login-gate-hint">Choose your role to continue. No password is required.</p>
        </div>

        <button type="button" className="login-gate-emergency-reset" onClick={emergencyReset}>
          <RotateCcw size={13} /> Emergency Login Reset
        </button>
        <footer className="login-gate-footer">© {new Date().getFullYear()} T-Sim Health · The Interactive Ward & AI Clinical Preceptor</footer>
      </div>
    </div>
  );
}