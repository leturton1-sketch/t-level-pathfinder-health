import { useState, useRef, useEffect } from "react";
import { QrCode, ScanLine, Camera, CameraOff, Mic, User, LockKeyhole, Eye, EyeOff, ArrowRight, ShieldCheck, GraduationCap, Users, HeartPulse } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { useVoiceSynthesis } from "@/hooks/useVoiceSynthesis";
import { setPathfinderUser } from "@/lib/clinicalAuth";
import TLevelLogo from "@/components/TLevelLogo";
import VoiceRecoveryPanel from "@/components/auth/VoiceRecoveryPanel";
import "./LoginGate.css";

const REMEMBERED_USERNAME_KEY = "pathfinder-remembered-username";

function MiniWaveform() {
  return (
    <span className="login-mini-wave" aria-hidden="true">
      {[7, 13, 20, 28, 18, 11, 22, 34, 24, 15, 9].map((height, index) => (
        <i key={index} style={{ height: `${height}px`, animationDelay: `${index * 65}ms` }} />
      ))}
    </span>
  );
}

export default function LoginGate({ onUnlock }) {
  const { toast } = useToast();
  const synth = useVoiceSynthesis();
  const [mode, setMode] = useState("pin");
  const [username, setUsername] = useState("");
  const [pin, setPin] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [rememberUsername, setRememberUsername] = useState(false);
  const [busy, setBusy] = useState(false);
  const [scanning, setScanning] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const detectRef = useRef(false);

  useEffect(() => {
    try {
      const remembered = localStorage.getItem(REMEMBERED_USERNAME_KEY) || "";
      if (remembered) {
        setUsername(remembered);
        setRememberUsername(true);
      }
    } catch {}
    return () => stopCamera();
  }, []);

  const announce = async (text) => { try { await synth.speak(text); } catch {} };

  const grant = (user) => {
    setPathfinderUser(user);
    try {
      if (rememberUsername) localStorage.setItem(REMEMBERED_USERNAME_KEY, user?.username || username.trim().toLowerCase());
      else localStorage.removeItem(REMEMBERED_USERNAME_KEY);
    } catch {}
    toast({ title: "Access granted", description: `Welcome, ${user.full_name}.` });
    announce(`Access granted. Welcome, ${user.full_name}. Your role is ${String(user.role || "user").replaceAll("_", " ")}.`);
    onUnlock?.();
  };

  const deny = (reason) => {
    toast({ title: "Access denied", description: reason || "Please check your credentials.", variant: "destructive" });
    announce("Access denied. Please check your credentials and try again.");
  };

  const submit = async (payload) => {
    setBusy(true);
    try {
      let lastError = null;
      for (let attempt = 0; attempt < 2; attempt += 1) {
        try {
          const res = await base44.functions.invoke("verifyAccess", payload);
          const data = res?.data ?? res;
          if (data?.granted) {
            grant(data.user);
            return;
          }
          deny(data?.reason);
          return;
        } catch (error) {
          lastError = error;
          if (attempt === 0) await new Promise((resolve) => setTimeout(resolve, 250));
        }
      }
      deny(lastError?.message || "Unable to verify access. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const handlePin = (event) => {
    event?.preventDefault?.();
    const normalizedUsername = username.trim().toLowerCase();
    const normalizedPin = pin.trim();
    if (!normalizedUsername || !/^\d{4}$/.test(normalizedPin) || busy) return;
    submit({ username: normalizedUsername, pin: normalizedPin });
  };

  const stopCamera = () => {
    detectRef.current = false;
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setScanning(false);
  };

  const startCamera = async () => {
    if (!window.BarcodeDetector) {
      toast({ title: "QR scan unsupported", description: "Use PIN login instead.", variant: "destructive" });
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setScanning(true);
      detectRef.current = true;
      const detector = new window.BarcodeDetector({ formats: ["qr_code"] });
      const tick = async () => {
        if (!detectRef.current) return;
        try {
          const codes = await detector.detect(videoRef.current);
          if (codes?.length) {
            const value = codes[0].rawValue;
            stopCamera();
            submit({ qr: value });
            return;
          }
        } catch {}
        requestAnimationFrame(tick);
      };
      tick();
    } catch (error) {
      toast({ title: "Camera unavailable", description: error?.message || "Check camera permissions.", variant: "destructive" });
      setScanning(false);
    }
  };

  return (
    <div className="login-gate">
      <div className="login-gate-backdrop" aria-hidden="true">
        <div className="login-diagonal login-diagonal-one" />
        <div className="login-diagonal login-diagonal-two" />
        <div className="login-diagonal login-diagonal-three" />
        <div className="login-medical-cross"><span /><span /></div>
      </div>

      <aside className="login-brand-panel" aria-hidden="true">
        <div className="login-brand-lockup">
          <TLevelLogo variant="black" size="xl" />
          <strong>PATHFINDER <em>HEALTH</em></strong>
          <small>LEARN <b>|</b> PRACTICE <b>|</b> PREPARE <b>|</b> PROGRESS</small>
        </div>
        <div className="login-left-message">
          <span>EXPLORE</span>
          <span>UNDERSTAND</span>
          <span>APPLY</span>
          <strong>THE NEXT LEVEL</strong>
        </div>
        <div className="login-benefits">
          <div><GraduationCap /><span>REAL<br />SKILLS</span></div>
          <div><Users /><span>REAL<br />CAREERS</span></div>
          <div><HeartPulse /><span>A HEALTHIER<br />TOMORROW</span></div>
        </div>
      </aside>

      <aside className="login-right-message" aria-hidden="true">
        <span>REAL</span><span>SKILLS</span><span>REAL</span><span>CAREERS</span><span>A HEALTHIER</span><span>TOMORROW</span>
      </aside>

      <main className="login-gate-card" aria-label="Pathfinder Health sign in">
        <header className="login-card-brand">
          <p className="login-welcome">WELCOME TO</p>
          <TLevelLogo variant="black" size="xl" />
          <div className="login-pathfinder-wordmark">PATHFINDER <em>HEALTH</em></div>
          <div className="login-brand-strapline">LEARN <b>|</b> PRACTICE <b>|</b> PREPARE <b>|</b> PROGRESS</div>
        </header>

        {mode === "pin" && (
          <form className="login-primary-form" onSubmit={handlePin}>
            <div className="login-intro">
              <h1>Sign in to your account</h1>
              <p>Access your personalised learning, resources and tools.</p>
            </div>

            <label className="login-field">
              <span className="login-field-icon"><User size={20} /></span>
              <span className="login-field-copy"><strong>Username</strong><small>Enter your username</small></span>
              <input value={username} onChange={(event) => setUsername(event.target.value.toLowerCase())} autoComplete="username" aria-label="Username" />
            </label>

            <label className="login-field">
              <span className="login-field-icon"><LockKeyhole size={20} /></span>
              <span className="login-field-copy"><strong>4-digit PIN</strong><small>Enter your 4-digit PIN</small></span>
              <input value={pin} onChange={(event) => setPin(event.target.value.replace(/\D/g, "").slice(0, 4))} inputMode="numeric" type={showPin ? "text" : "password"} autoComplete="current-password" aria-label="4-digit PIN" />
              <button type="button" className="login-pin-visibility" onClick={() => setShowPin((value) => !value)} aria-label={showPin ? "Hide PIN" : "Show PIN"}>{showPin ? <EyeOff size={18} /> : <Eye size={18} />}</button>
            </label>

            <div className="login-options-row">
              <label className="login-remember"><input type="checkbox" checked={rememberUsername} onChange={(event) => setRememberUsername(event.target.checked)} /><span>Remember my username</span></label>
              <button type="button" className="login-forgot" onClick={() => { setMode("voice"); setPin(""); }}>Forgot your PIN?</button>
            </div>

            <button type="submit" disabled={busy || !username.trim() || !/^\d{4}$/.test(pin.trim())} className="login-signin-button">
              <span>{busy ? "Verifying…" : "Sign In"}</span><span className="login-signin-arrow"><ArrowRight size={21} /></span>
            </button>

            <div className="login-or"><span />OR<span /></div>

            <button type="button" className="login-voice-recovery-button" onClick={() => { setMode("voice"); setPin(""); }}>
              <span className="login-voice-icon"><Mic size={22} /></span>
              <span className="login-voice-copy"><strong>Use voice recovery instead</strong><small>Forgot your PIN? Use your registered voice phrase.</small></span>
              <MiniWaveform />
              <ArrowRight className="login-voice-arrow" size={20} />
            </button>

            <div className="login-alt-access">
              <ShieldCheck size={15} /><span>Secure Access</span><b>|</b><span>Your Data. Your Future.</span>
              <button type="button" onClick={() => setMode("qr")}><QrCode size={14} /> QR access</button>
            </div>
          </form>
        )}

        {mode === "voice" && (
          <section className="login-recovery-panel">
            <div className="login-recovery-heading">
              <p>PIN RECOVERY</p>
              <h1>Voice recovery access</h1>
              <span>Use your registered spoken recovery phrase.</span>
            </div>
            <label className="login-field login-field-voice">
              <span className="login-field-icon"><User size={20} /></span>
              <span className="login-field-copy"><strong>Username</strong><small>Enter your username</small></span>
              <input value={username} onChange={(event) => setUsername(event.target.value.toLowerCase())} autoComplete="username" aria-label="Username" />
            </label>
            <VoiceRecoveryPanel mode="verify" username={username} onSuccess={(voiceUser) => grant(voiceUser)} />
            <button type="button" className="login-back-button" onClick={() => setMode("pin")}>Back to username + PIN</button>
          </section>
        )}

        {mode === "qr" && (
          <section className="login-recovery-panel">
            <div className="login-recovery-heading"><p>QR ACCESS</p><h1>Scan your Pathfinder ID</h1><span>Use the QR code issued to your account.</span></div>
            <div className="login-gate-qr-stage">
              <video ref={videoRef} muted playsInline className={scanning ? "active" : ""} />
              {!scanning && <div className="login-gate-qr-idle"><ScanLine size={34} /></div>}
              <div className="login-gate-qr-reticle" />
            </div>
            {!scanning ? <button type="button" onClick={startCamera} className="login-signin-button"><span><Camera size={17} /> Start camera</span><span className="login-signin-arrow"><ArrowRight size={21} /></span></button> : <button type="button" onClick={stopCamera} className="login-back-button"><CameraOff size={16} /> Stop camera</button>}
            <button type="button" className="login-back-button" onClick={() => { stopCamera(); setMode("pin"); }}>Back to username + PIN</button>
          </section>
        )}
      </main>

      <footer className="login-screen-footer" aria-hidden="true">
        <div className="login-footer-brand">T-LEVELS <b>|</b> PATHFINDER HEALTH</div>
        <div className="login-footer-values"><span>SAFE</span><b>|</b><span>SUPPORTIVE</span><b>|</b><span>PROGRESSIVE</span></div>
        <div className="login-footer-future">BUILT FOR A BRIGHTER, HEALTHIER FUTURE <i /><i /><i /></div>
      </footer>
    </div>
  );
}
