import { useState, useRef, useEffect } from "react";
import { QrCode, KeyRound, ScanLine, Camera, CameraOff, LogIn } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { useVoiceSynthesis } from "@/hooks/useVoiceSynthesis";
import { setAppUser } from "@/lib/clinicalAuth";
import TLevelLogo from "@/components/TLevelLogo";
import "./LoginGate.css";

export default function LoginGate({ onUnlock }) {
  const { toast } = useToast();
  const synth = useVoiceSynthesis();
  const [mode, setMode] = useState("pin");
  const [username, setUsername] = useState("");
  const [pin, setPin] = useState("");
  const [busy, setBusy] = useState(false);
  const [scanning, setScanning] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const detectRef = useRef(false);

  useEffect(() => () => stopCamera(), []);

  const announce = async (text) => { try { await synth.speak(text); } catch {} };

  const grant = (user, method = "pin") => {
    setAppUser(user, method);
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
      const res = await base44.functions.invoke("verifyAccess", payload);
      const data = res?.data ?? res;
      if (data?.granted) grant(data.user, payload?.qr ? "qr" : "pin");
      else deny(data?.reason);
    } catch (e) {
      deny(e?.message);
    } finally {
      setBusy(false);
    }
  };

  const handlePin = (e) => {
    e?.preventDefault?.();
    if (!pin.trim() || busy) return;
    submit({ username: username.trim(), pin: pin.trim() });
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
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. lee"
                autoComplete="username"
              />
            </label>
            <label>
              <span>PIN</span>
              <input
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="0000"
                inputMode="numeric"
                type="password"
                autoComplete="current-password"
              />
            </label>
            <button type="submit" disabled={busy || !username.trim() || !/^\d{4,6}$/.test(pin.trim())} className="login-gate-unlock">
              <LogIn size={16} /> {busy ? "Verifying…" : "Unlock"}
            </button>
            <p className="login-gate-hint">Use your Pathfinder username and 4–6 digit PIN. Temporary PINs must be changed after first sign-in.</p>
          </form>
        ) : (
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
        )}

        <footer className="login-gate-footer">© {new Date().getFullYear()} Pathfinder T-Level Simulation</footer>
      </div>
    </div>
  );
}