import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Download, QrCode, Copy, Check, Share2, Smartphone, Laptop, Globe, Info, ShieldCheck, Sparkles } from "lucide-react";

const PLATFORMS = [
  {
    id: "ios",
    label: "iPhone & iPad",
    icon: Smartphone,
    steps: [
      "Open the app link in Safari",
      "Tap the Share icon",
      "Tap Add to Home Screen",
      "Tap Add to finish",
    ],
  },
  {
    id: "android",
    label: "Android",
    icon: Smartphone,
    steps: [
      "Open the app link in Chrome",
      "Tap Install on the prompt (or menu → Install app)",
      "Confirm Add to Home Screen",
    ],
  },
  {
    id: "desktop",
    label: "Windows & macOS",
    icon: Laptop,
    steps: [
      "Open the app link in Chrome or Edge",
      "Click the Install icon in the address bar",
      "Or use the menu → Install this site as an app",
    ],
  },
  {
    id: "web",
    label: "Web browser",
    icon: Globe,
    steps: [
      "Open the app link in any modern browser",
      "Sign in and bookmark for quick access",
    ],
  },
];

function detectPlatform() {
  if (typeof navigator === "undefined") return "web";
  const ua = navigator.userAgent || "";
  if (/iphone|ipad|ipod/i.test(ua)) return "ios";
  if (/android/i.test(ua)) return "android";
  if (/windows|macintosh|mac os x|linux/i.test(ua)) return "desktop";
  return "web";
}

export default function AppInstallerPanel() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [canInstall, setCanInstall] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [installing, setInstalling] = useState(false);
  const [copied, setCopied] = useState(false);
  const [platform] = useState(detectPlatform);
  const [appUrl] = useState(() => (typeof window !== "undefined" ? window.location.origin : ""));

  useEffect(() => {
    const isStandalone =
      window.matchMedia?.("(display-mode: standalone)")?.matches || window.navigator.standalone === true;
    if (isStandalone) {
      setInstalled(true);
      return;
    }
    const onPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setCanInstall(true);
    };
    const onInstalled = () => {
      setInstalled(true);
      setCanInstall(false);
      setDeferredPrompt(null);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    setInstalling(true);
    try {
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
    } catch {
      /* user dismissed */
    }
    setDeferredPrompt(null);
    setCanInstall(false);
    setInstalling(false);
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(appUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable */
    }
  };

  const [qrSrc, setQrSrc] = useState("");
  useEffect(() => {
    let alive = true;
    setQrSrc("");
    QRCode.toDataURL(appUrl, { width: 320, margin: 4, errorCorrectionLevel: "M" })
      .then(image => { if (alive) setQrSrc(image); })
      .catch(() => { if (alive) setQrSrc(""); });
    return () => { alive = false; };
  }, [appUrl]);
  const current = PLATFORMS.find((p) => p.id === platform) || PLATFORMS[3];

  return (
    <section className="polished-glass-edge overflow-hidden rounded-[28px] border border-white/90 bg-white/70 shadow-[0_20px_55px_-34px_rgba(15,23,42,.65),inset_1px_1px_2px_white] backdrop-blur-2xl">
      <div className="border-b border-slate-200/70 bg-gradient-to-r from-cyan-50/80 via-white/70 to-purple-50/70 p-6">
        <div className="flex items-start gap-3">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-cyan-400 to-sky-700 text-white shadow-[0_9px_18px_-10px_rgba(8,145,178,.9),inset_1px_1px_1px_rgba(255,255,255,.7)]">
            <Download className="h-6 w-6" />
          </span>
          <div>
            <h2 className="text-base font-bold text-slate-900">Install Pathfinder Health</h2>
            <p className="mt-1 text-sm leading-5 text-slate-600">
              Install the app on any device — iOS, Android, Windows or macOS — or scan the QR code to install on another device. It installs as a lightweight web app and updates automatically.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-5 p-6">
        <div className="rounded-xl border border-amber-200 bg-amber-50/70 px-3 py-2 text-[11px] leading-5 text-amber-800">
          <span className="flex items-start gap-2">
            <Info className="mt-0.5 h-4 w-4 shrink-0" />
            Publish the app for the link and QR code to install on other devices. In preview, the link opens this version only.
          </span>
        </div>

        {/* Primary install action */}
        <div className="rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-[.16em] text-slate-500">This device · {current.label}</p>
          {installed ? (
            <div className="mt-2 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50/80 px-3 py-2.5 text-sm font-semibold text-emerald-800">
              <ShieldCheck className="h-4 w-4" /> Pathfinder Health is installed on this device
            </div>
          ) : canInstall ? (
            <button
              type="button"
              onClick={handleInstall}
              disabled={installing}
              className="mt-2 inline-flex items-center gap-2 rounded-xl bg-clinical-teal px-4 py-2.5 text-sm font-semibold text-white shadow-md transition hover:-translate-y-0.5 hover:opacity-90 disabled:opacity-60"
            >
              <Download className="h-4 w-4" /> {installing ? "Installing…" : "Install on this device"}
            </button>
          ) : platform === "ios" ? (
            <div className="mt-2 rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2.5 text-sm text-slate-700">
              <p className="font-semibold text-slate-800">Install via Safari:</p>
              <ol className="mt-1 list-decimal space-y-0.5 pl-5 text-[13px]">
                <li>Tap the <Share2 className="inline h-3.5 w-3.5 align-text-bottom" /> Share icon</li>
                <li>Tap <strong>Add to Home Screen</strong></li>
                <li>Tap <strong>Add</strong></li>
              </ol>
            </div>
          ) : (
            <p className="mt-2 text-sm text-slate-600">
              One-tap install isn't available in this browser. Open the link in Chrome or Edge to install, or follow the steps below.
            </p>
          )}
        </div>

        {/* QR + link */}
        <div className="grid gap-4 sm:grid-cols-[auto_1fr] sm:items-center">
          <div className="flex justify-center rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
            {qrSrc ? <img src={qrSrc} alt="QR code to install Pathfinder Health" className="h-40 w-40" /> : <p className="text-sm">Use the app link below.</p>}
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[.16em] text-slate-500">Install on another device</p>
            <p className="mt-1 text-sm text-slate-600">Scan the QR code with a phone camera, or copy the link below.</p>
            <div className="mt-2 flex items-center gap-2">
              <code className="flex-1 truncate rounded-lg border border-slate-200 bg-slate-50/80 px-3 py-2 text-xs text-slate-700">{appUrl}</code>
              <button
                type="button"
                onClick={copyLink}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
            <p className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-500">
              <QrCode className="h-3.5 w-3.5" /> The app opens like a native app with its own icon.
            </p>
          </div>
        </div>

        {/* Platform steps */}
        <div>
          <p className="mb-2 text-[10px] font-bold uppercase tracking-[.16em] text-slate-500">Step-by-step guides</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {PLATFORMS.map((p) => {
              const Icon = p.icon;
              const active = p.id === platform;
              return (
                <div
                  key={p.id}
                  className={`rounded-2xl border p-4 transition ${active ? "border-clinical-teal bg-clinical-teal/5" : "border-slate-200 bg-white/80"}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                      <Icon className="h-4 w-4 text-slate-500" /> {p.label}
                    </span>
                    {active && (
                      <span className="flex items-center gap-1 rounded-full bg-clinical-teal/15 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-clinical-teal">
                        <Sparkles className="h-3 w-3" /> This device
                      </span>
                    )}
                  </div>
                  <ol className="mt-2 list-decimal space-y-1 pl-5 text-[12px] leading-5 text-slate-600">
                    {p.steps.map((s) => (
                      <li key={s}>{s}</li>
                    ))}
                  </ol>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}