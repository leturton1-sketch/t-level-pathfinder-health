import { useState, useRef, useEffect } from "react";
import { QrCode, KeyRound, ScanLine, Camera, CameraOff, LogIn } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { useVoiceSynthesis } from "@/hooks/useVoiceSynthesis";
import { setAppUser } from "@/lib/clinicalAuth";
import { decodeQrImage } from "@/lib/qrScanner";
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
  const generationRef = useRef(0);
  const frameRef = useRef(null);
  const busyRef = useRef(false);
  const mountedRef = useRef(true);
  const [starting, setStarting] = useState(false);
  const [scanMessage, setScanMessage] = useState("");
  const fileRef = useRef(null);

  useEffect(() => { mountedRef.current = true; return () => { mountedRef.current = false; stopCamera(); }; }, []);

  const announce = async (text) => { try { await synth.speak(text); } catch {} };

  const grant = (user, method = "pin") => {
    setAppUser(user, method);
    toast({ title: "Access granted", description: `Welcome, ${user.full_name}.` });
    // The richer personalised welcome (spoken + visual) is shown next, by WelcomeGreeting.
    onUnlock?.();
  };

  const deny = (reason) => {
    toast({ title: "Access denied", description: reason || "Please check your credentials.", variant: "destructive" });
    announce("Access denied. Please check your credentials and try again.");
  };

  const submit = async (payload) => {
    if (busyRef.current || !mountedRef.current) return;
    busyRef.current = true;
    setBusy(true);
    try {
      const res = await base44.functions.invoke("verifyAccess", payload);
      const data = res?.data ?? res;
      if (!mountedRef.current) return;
      setScanMessage(data?.granted ? "Access granted." : data?.reason || "Code not recognised. Try again or use PIN sign-in.");
      if (data?.granted) grant(data.user, payload?.qr ? "qr" : "pin");
      else deny(data?.reason);
    } catch (e) {
      if (mountedRef.current) deny(e?.response?.data?.reason || "Unable to verify. Please try again.");
    } finally {
      busyRef.current = false;
      if (mountedRef.current) setBusy(false);
    }
  };

  const handlePin = (e) => {
    e?.preventDefault?.();
    if (!pin.trim() || busy) return;
    submit({ username: username.trim(), pin: pin.trim() });
  };

  const stopCamera = () => {
    generationRef.current += 1;
    detectRef.current = false;
    if (frameRef.current) cancelAnimationFrame(frameRef.current);
    frameRef.current = null;
    streamRef.current?.getTracks().forEach(track => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    if (mountedRef.current) { setScanning(false); setStarting(false); }
  };

  const startCamera = async () => {
    if (starting || scanning || busyRef.current) return;
    stopCamera();
    const generation = generationRef.current;
    setStarting(true); setScanMessage("");
    try {
      if (!navigator.mediaDevices?.getUserMedia) throw new Error("Camera access needs a supported browser and a secure connection. Choose a QR image or use PIN sign-in.");
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" } }, audio: false });
      if (!mountedRef.current || generation !== generationRef.current) { stream.getTracks().forEach(track => track.stop()); return; }
      streamRef.current = stream;
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
      if (!mountedRef.current || generation !== generationRef.current) return;
      setStarting(false); setScanning(true); detectRef.current = true;
      setScanMessage("Hold your QR card steady in the frame.");
      let lastScan = 0;
      const tick = async now => {
        if (!detectRef.current || generation !== generationRef.current) return;
        if (now - lastScan >= 180 && videoRef.current?.readyState >= 2) {
          lastScan = now;
          try {
            const value = await decodeQrImage(videoRef.current);
            if (!detectRef.current || generation !== generationRef.current) return;
            if (value) { stopCamera(); setScanMessage("Code detected. Verifying…"); await submit({ qr: value }); return; }
          } catch {
            if (generation === generationRef.current) { stopCamera(); setScanMessage("Unable to read the camera. Choose a QR image or use PIN sign-in."); }
            return;
          }
        }
        frameRef.current = requestAnimationFrame(tick);
      };
      frameRef.current = requestAnimationFrame(tick);
    } catch (error) {
      if (!mountedRef.current || generation !== generationRef.current) return;
      stopCamera();
      setScanMessage(error?.name === "NotAllowedError" ? "Camera permission was denied. Allow camera access, choose a QR image or use PIN sign-in." : error?.message || "Camera unavailable. Use PIN sign-in.");
    }
  };

  const scanFile = async event => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || busyRef.current) return;
    stopCamera();
    const generation = generationRef.current;
    setStarting(true); setScanMessage("Reading QR image…");
    let bitmap;
    try {
      if (file.size > 10 * 1024 * 1024) throw new Error("Choose an image smaller than 10 MB.");
      bitmap = await createImageBitmap(file);
      const value = await decodeQrImage(bitmap);
      if (!mountedRef.current || generation !== generationRef.current) return;
      if (!value) throw new Error("No QR code found. Try a clearer image or use PIN sign-in.");
      setScanMessage("Code detected. Verifying…");
      await submit({ qr: value });
    } catch (error) {
      if (mountedRef.current && generation === generationRef.current) setScanMessage(error?.message || "Unable to read this image.");
    } finally {
      bitmap?.close();
      if (mountedRef.current && generation === generationRef.current) setStarting(false);
    }
  };

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
      </div>

      <div className="login-gate-card">
        <header className="login-gate-header">
          <p className="login-gate-welcome">Welcome to</p>
          <TLevelLogo variant="black" size="lg" className="login-gate-logo" />
          <p className="login-gate-tagline">Learn | Practice | Prepare | Progress</p>
          <h1>Sign in to your account</h1>
          <p>Access your personalised learning, resources and tools.</p>
        </header>

        <div className="login-gate-tabs" role="tablist" aria-label="Sign-in method">
          <button type="button" role="tab" aria-selected={mode === "pin"} disabled={busy} onClick={() => { setMode("pin"); stopCamera(); }} className={mode === "pin" ? "active" : ""}>
            <KeyRound size={16} /> PIN
          </button>
          <button type="button" role="tab" aria-selected={mode === "qr"} disabled={busy} onClick={() => setMode("qr")} className={mode === "qr" ? "active" : ""}>
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
              <button type="button" onClick={startCamera} disabled={busy || starting} className="login-gate-unlock">
                <Camera size={16} /> {starting ? "Preparing scanner…" : busy ? "Verifying…" : "Start camera"}
              </button>
            ) : (
              <button type="button" onClick={stopCamera} className="login-gate-unlock secondary">
                <CameraOff size={16} /> Stop camera
              </button>
            )}
            <input ref={fileRef} type="file" accept="image/*" hidden onChange={scanFile} />
            <button type="button" className="login-gate-unlock secondary" disabled={busy || starting} onClick={() => fileRef.current?.click()}>Choose a QR image</button>
            <p className="login-gate-hint" role="status" aria-live="polite">{scanMessage || "Point the camera at your personal Pathfinder QR code. Images are read on this device."}</p>
          </div>
        )}

        <footer className="login-gate-footer">© {new Date().getFullYear()} Pathfinder T-Level Simulation</footer>
      </div>
    </div>
  );
}