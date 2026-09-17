const SOUND_PREF_KEY = "pathfinder-ui-sound-enabled";

let audioContext = null;
let lastButtonAt = 0;

function isEnabled() {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(SOUND_PREF_KEY) !== "false";
}

function context() {
  if (!isEnabled()) return null;
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return null;
  if (!audioContext || audioContext.state === "closed") audioContext = new AudioContext();
  if (audioContext.state === "suspended") audioContext.resume().catch(() => {});
  return audioContext;
}

const PROFILES = {
  button: [{ frequency: 520, endFrequency: 610, duration: .055, volume: .025 }],
  confirm: [
    { frequency: 620, endFrequency: 760, duration: .10, volume: .045 },
    { frequency: 820, endFrequency: 980, delay: .09, duration: .13, volume: .04 },
  ],
  error: [
    { frequency: 240, endFrequency: 175, duration: .16, volume: .055, type: "sawtooth" },
    { frequency: 190, endFrequency: 145, delay: .14, duration: .18, volume: .045, type: "sawtooth" },
  ],
  warning: [
    { frequency: 420, endFrequency: 420, duration: .09, volume: .04 },
    { frequency: 420, endFrequency: 420, delay: .15, duration: .09, volume: .04 },
  ],
  notification: [{ frequency: 720, endFrequency: 860, duration: .12, volume: .035 }],
  task: [
    { frequency: 740, endFrequency: 660, duration: .16, volume: .055 },
    { frequency: 740, endFrequency: 660, delay: .25, duration: .16, volume: .055 },
  ],
};

export function playUISound(name = "button") {
  try {
    const ctx = context();
    if (!ctx) return;
    const profile = PROFILES[name] || PROFILES.button;
    profile.forEach(({ frequency, endFrequency, delay = 0, duration, volume, type = "sine" }) => {
      const start = ctx.currentTime + delay;
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      oscillator.type = type;
      oscillator.frequency.setValueAtTime(frequency, start);
      oscillator.frequency.exponentialRampToValueAtTime(Math.max(1, endFrequency), start + duration);
      gain.gain.setValueAtTime(.0001, start);
      gain.gain.exponentialRampToValueAtTime(volume, start + .012);
      gain.gain.exponentialRampToValueAtTime(.0001, start + duration);
      oscillator.connect(gain).connect(ctx.destination);
      oscillator.start(start);
      oscillator.stop(start + duration + .02);
    });
  } catch {
    // Sound feedback is an enhancement; controls must always remain functional.
  }
}

export function installGlobalUISounds() {
  if (typeof document === "undefined") return () => {};

  const onClick = (event) => {
    const control = event.target.closest?.("button, a[href], [role='button'], input[type='button'], input[type='submit']");
    if (!control || control.dataset.sound === "off" || control.disabled || control.getAttribute("aria-disabled") === "true") return;
    const now = performance.now();
    if (now - lastButtonAt < 35) return;
    lastButtonAt = now;
    playUISound(control.dataset.sound || "button");
  };
  const onInvalid = () => playUISound("error");
  const onSound = (event) => playUISound(event.detail?.type || "notification");

  document.addEventListener("click", onClick, true);
  document.addEventListener("invalid", onInvalid, true);
  window.addEventListener("pathfinder:sound", onSound);
  return () => {
    document.removeEventListener("click", onClick, true);
    document.removeEventListener("invalid", onInvalid, true);
    window.removeEventListener("pathfinder:sound", onSound);
  };
}

export function setUISoundsEnabled(enabled) {
  window.localStorage.setItem(SOUND_PREF_KEY, String(Boolean(enabled)));
  if (!enabled && audioContext && audioContext.state !== "closed") {
    audioContext.close().catch(() => {});
    audioContext = null;
  }
}
