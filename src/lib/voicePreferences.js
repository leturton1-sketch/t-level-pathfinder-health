/**
 * Voice Assistant preferences — persisted to localStorage.
 * Voice profiles are pre-tuned presets; engine selects browser (Web Speech API)
 * or cloud (neural TTS via Base44 GenerateSpeech, no API key needed).
 */

const STORAGE_KEY = "voice_assistant_prefs";

export const VOICE_PROFILES = [
  {
    id: "natural",
    name: "Natural Conversational",
    desc: "Calm, neutral, everyday pace",
    cloudVoice: "river",
    rate: 1.0,
    pitch: 1.0,
    stability: 0.5,
  },
  {
    id: "warm",
    name: "Warm & Professional",
    desc: "Soft, supportive, clinical tone",
    cloudVoice: "honey",
    rate: 0.95,
    pitch: 1.0,
    stability: 0.65,
  },
  {
    id: "expressive",
    name: "Expressive Narrator",
    desc: "Formal, authoritative delivery",
    cloudVoice: "storm",
    rate: 0.92,
    pitch: 0.95,
    stability: 0.4,
  },
  {
    id: "bright",
    name: "Bright & Upbeat",
    desc: "Energetic, quick, friendly",
    cloudVoice: "sunny",
    rate: 1.05,
    pitch: 1.1,
    stability: 0.45,
  },
];

export const DEFAULT_PREFS = {
  profileId: "natural",
  engine: "browser",
  rate: 1.0,
  pitch: 1.0,
  stability: 0.5,
  volume: 1,
  systemVoiceURI: null,
  muted: false,
};

export function loadPrefs() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_PREFS };
    return { ...DEFAULT_PREFS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_PREFS };
  }
}

export function savePrefs(prefs) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    /* storage unavailable — ignore */
  }
}

export function applyProfile(profileId) {
  const profile = VOICE_PROFILES.find((p) => p.id === profileId);
  if (!profile) return null;
  return { rate: profile.rate, pitch: profile.pitch, stability: profile.stability };
}