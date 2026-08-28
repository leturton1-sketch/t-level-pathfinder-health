/**
 * Voice Assistant preferences — persisted to localStorage.
 * Two distinct voices: Male and Female. Engine selects browser (Web Speech API)
 * or cloud (neural TTS via Base44 GenerateSpeech, no API key needed).
 */

const STORAGE_KEY = "voice_assistant_prefs";

export const VOICE_PROFILES = [
  {
    id: "female",
    name: "Female Voice",
    desc: "Warm, clear British female clinical voice",
    cloudVoice: "honey",
    rate: 0.98,
    pitch: 1.12,
    stability: 0.64,
    gender: "female",
  },
  {
    id: "male",
    name: "Male Voice",
    desc: "Warm, clear British male clinical voice",
    cloudVoice: "storm",
    rate: 0.96,
    pitch: 0.74,
    stability: 0.64,
    gender: "male",
  },
];

const CURRENT_PREFS_VERSION = 3;

export const DEFAULT_PREFS = {
  version: CURRENT_PREFS_VERSION,
  profileId: "female",
  engine: "cloud",
  rate: 0.98,
  pitch: 1.12,
  stability: 0.64,
  volume: 1,
  systemVoiceURI: null,
  muted: false,
};

export function loadPrefs() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_PREFS };
    const saved = JSON.parse(raw);
    if (saved.version !== CURRENT_PREFS_VERSION) {
      const migrated = { ...DEFAULT_PREFS, volume: saved.volume ?? DEFAULT_PREFS.volume, muted: saved.muted ?? false };
      savePrefs(migrated);
      return migrated;
    }
    return { ...DEFAULT_PREFS, ...saved };
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

export function prepareSpeechText(text) {
  return String(text || "")
    .replace(/\bNHS\b/g, "en aych ess")
    .replace(/\bNEWS\s*2\b/gi, "news two")
    .replace(/\bSBAR\b/g, "ess bar")
    .replace(/\bT[- ]?Levels?\b/gi, "T Levels")
    .replace(/\s+/g, " ")
    .trim();
}

export function getVoiceProfile(profileId) {
  return VOICE_PROFILES.find((profile) => profile.id === profileId) || VOICE_PROFILES[0];
}

export function getRegionalVoicePrompt() {
  return "Use natural conversational British English with clear clinical diction.";
}

export function applyProfile(profileId) {
  const profile = getVoiceProfile(profileId);
  return { rate: profile.rate, pitch: profile.pitch, stability: profile.stability };
}