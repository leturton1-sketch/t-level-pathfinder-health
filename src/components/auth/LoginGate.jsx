import { useState, useRef, useEffect } from "react";
import { QrCode, KeyRound, ScanLine, Camera, CameraOff, LogIn, Mic } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { useVoiceSynthesis } from "@/hooks/useVoiceSynthesis";
import TLevelLogo from "@/components/TLevelLogo";
import VoiceRecoveryPanel from "@/components/auth/VoiceRecoveryPanel";
import "./LoginGate.css";

export default function LoginGate({ onUnlock }) {
  const { toast } = useToast();
  const synth = useVoiceSynthesis();
  const [mode, setMode] = useState("pin");
  const [username, setUsername] = useState("");
  const [pin, setPin] = useState("");
  const [enrolUser, setEnrolUser] = useState(null);
  const [busy, setBusy] = useState(false);
  const [scanning, setScanning] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const detectRef = useRef(false);

  useEffect(() => () => stopCamera(), []);

  const announce = async (text) => { try { await synth.speak(text); } catch {} };

  const grant = (user) => {
    if (user?.voice_recovery_enrolled === false) {
      setEnrolUser(user);
      toast({ title: "Voice setup required", description: "Set up your spoken recovery phrase before continuing." });
      return;
    }
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

  const handlePin = (e) => {
    e?.preventDefault?.();
    const normalizedUsername = username.trim().toLowerCase();
    const normalizedPin = pin.trim();
    if (!normalizedUsername || !/^\d{4}$/.test(normalizedPin) || busy) return;
    submit({ username: normalizedUsername, pin: normalizedPin });
  };

  const stopCamera = () => {
    detectRef.current = false;
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
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
          if (codes && codes.length) {
            const value = codes[0].rawValue;
            stopCamera();
            submit({ qr: value });
            return;
          }
        } catch {}
        requestAnimationFrame(tick);
      };
      tick();
    } catch (e) {
      toast({ title: "Camera unavailable", description: e?.message || "Check camera permissions.", variant: "destructive" });
      setScanning(false);
    }
  };

  return (
    <div className="login-gate">
      <div className="login-gate-backdrop" aria-hidden="true">
        <div className="login-gate-blur" />
        <TLevelLogo variant="white" size="xl" className="login-gate-mark" />
        <div className="login-gate-silhouette" />
      </div>

      <div className="login-gate-card">
        <header className="login-gate-header">
          <div className="login-gate-logo"><TLevelLogo variant="salmon" size="md" /></div>
          <div>
            <h1>Pathfinder Health</h1>
            <p>T-Level Clinical Skills Academy</p>
          </div>
        </header>

        {enrolUser ? (
          <VoiceRecoveryPanel
            mode="enrol"
            username={enrolUser.username}
            pin={pin}
            user={enrolUser}
            onSuccess={() => {
              const readyUser = { ...enrolUser, voice_recovery_enrolled: true };
              setEnrolUser(null);
              toast({ title: "Access granted", description: `Welcome, ${readyUser.full_name}.` });
              announce(`Welcome, ${readyUser.full_name}. Your role is ${String(readyUser.role || "user").replaceAll("_", " ")}. Access granted.`);
              onUnlock?.();
            }}
          />
        ) : <>
        <div className="login-gate-tabs" role="tablist" aria-label="Sign-in method">
          <button type="button" role="tab" aria-selected={mode === "pin"} onClick={() => { setMode("pin"); stopCamera(); }} className={mode === "pin" ? "active" : ""}>
            <KeyRound size={16} /> PIN
          </button>
          <button type="button" role="tab" aria-selected={mode === "qr"} onClick={() => setMode("qr")} className={mode === "qr" ? "active" : ""}>
            <QrCode size={16} /> QR Scan
          </button>
        </div>

        {mode === "pin" ? (
          <form className="login-gate-form" onSubmit={handlePin}>
            <label>
              <span>Username</span>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase())}
                placeholder="e.g. lee"
                autoComplete="username"
              />
            </label>
            <label>
              <span>PIN</span>
              <input
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                placeholder="0000"
                inputMode="numeric"
                type="password"
                autoComplete="current-password"
              />
            </label>
            <button type="submit" disabled={busy || !username.trim() || !/^\d{4}$/.test(pin.trim())} className="login-gate-unlock">
              <LogIn size={16} /> {busy ? "Verifying…" : "Unlock"}
            </button>
            <p className="login-gate-hint">Enter your Pathfinder username and 4-digit PIN.</p>
            <button
              type="button"
              onClick={() => { setMode("voice"); setPin(""); stopCamera(); }}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-fuchsia-200 bg-white px-4 py-2.5 text-sm font-bold text-fuchsia-700 transition hover:bg-fuchsia-50"
            >
              <Mic size={16} /> Forgot PIN? Use voice recovery
            </button>
          </form>
        ) : mode === "qr" ? (
          <div className="login-gate-qr">
            <div className="login-gate-qr-stage">
              <video ref={videoRef} muted playsInline className={scanning ? "active" : ""} />
              {!scanning && <div className="login-gate-qr-idle"><ScanLine size={28} /></div>}
              <div className="login-gate-qr-reticle" />
            </div>
            {!scanning ? (
              <button type="button" onClick={startCamera} className="login-gate-unlock">
                <Camera size={16} /> Start camera
              </button>
            ) : (
              <button type="button" onClick={stopCamera} className="login-gate-unlock secondary">
                <CameraOff size={16} /> Stop camera
              </button>
            )}
            <p className="login-gate-hint">Point the camera at your personal Pathfinder QR code.</p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="rounded-2xl border border-fuchsia-100 bg-gradient-to-br from-rose-50 via-white to-violet-50 p-3 text-center">
              <p className="text-sm font-black text-slate-900">PIN recovery</p>
              <p className="mt-1 text-xs text-slate-600">Use your enrolled spoken recovery phrase only if you cannot remember your PIN.</p>
            </div>
            <label className="login-gate-form">
              <span className="text-xs font-bold text-slate-700">Username</span>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase())}
                placeholder="e.g. lee"
                autoComplete="username"
              />
            </label>
            <VoiceRecoveryPanel
              mode="verify"
              username={username}
              onSuccess={(voiceUser) => grant(voiceUser)}
            />
            <button
              type="button"
              onClick={() => setMode("pin")}
              className="flex w-full items-center justify-center rounded-xl border border-rose-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-rose-50"
            >
              Back to username + PIN
            </button>
          </div>
        )}
        </>}

        <footer className="login-gate-footer">© {new Date().getFullYear()} Pathfinder T-Level Simulation</footer>
      </div>
    </div>
  );
}