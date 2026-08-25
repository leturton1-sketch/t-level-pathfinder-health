/**
 * Voice Assistant preferences — persisted to localStorage.
 * Voice profiles are pre-tuned presets; engine selects browser (Web Speech API)
 * or cloud (neural TTS via Base44 GenerateSpeech, no API key needed).
 */

const STORAGE_KEY = "voice_assistant_prefs";

export const VOICE_PROFILES = [
  {
    id: "natural",
    name: "Natural Clinical Voice",
    desc: "Natural, expressive British clinical conversation",
    cloudVoice: "river",
    rate: 0.94,
    pitch: 1,
    stability: 0.62,
    dialect: "neutral_uk",
    gender: "neutral",
  },
  {
    id: "sarah_yorkshire",
    name: "Sarah · South Yorkshire",
    desc: "Warm, grounded Rotherham and Sheffield cadence",
    cloudVoice: "Kore",
    rate: 0.98,
    pitch: 1.14,
    stability: 0.66,
    dialect: "yorkshire",
    gender: "female",
  },
  {
    id: "liam_yorkshire",
    name: "Liam · South Yorkshire",
    desc: "Warm, grounded Rotherham and Sheffield cadence",
    cloudVoice: "Charon",
    rate: 0.98,
    pitch: 0.74,
    stability: 0.66,
    dialect: "yorkshire",
    gender: "male",
  },
  {
    id: "chloe_manchester",
    name: "Chloe · Greater Manchester",
    desc: "Energetic, rhythmic northern delivery",
    cloudVoice: "Aoede",
    rate: 1.05,
    pitch: 1.16,
    stability: 0.58,
    dialect: "mancunian",
    gender: "female",
  },
  {
    id: "jack_manchester",
    name: "Jack · Greater Manchester",
    desc: "Energetic, rhythmic northern delivery",
    cloudVoice: "Puck",
    rate: 1.05,
    pitch: 0.76,
    stability: 0.58,
    dialect: "mancunian",
    gender: "male",
  },
  {
    id: "charlotte_rp",
    name: "Charlotte · British RP",
    desc: "Polished, distinguished British broadcast tone",
    cloudVoice: "Leda",
    rate: 0.92,
    pitch: 1.12,
    stability: 0.74,
    dialect: "london_rp",
    gender: "female",
  },
  {
    id: "george_rp",
    name: "George · British RP",
    desc: "Polished, distinguished British broadcast tone",
    cloudVoice: "Fenrir",
    rate: 0.92,
    pitch: 0.72,
    stability: 0.74,
    dialect: "london_rp",
    gender: "male",
  },
  {
    id: "fiona_scottish",
    name: "Fiona · Scotland",
    desc: "Warm, confident Scottish lilt",
    cloudVoice: "Kore",
    rate: 1,
    pitch: 1.18,
    stability: 0.64,
    dialect: "scottish",
    gender: "female",
  },
  {
    id: "callum_scottish",
    name: "Callum · Scotland",
    desc: "Warm, confident Scottish lilt",
    cloudVoice: "Charon",
    rate: 1,
    pitch: 0.75,
    stability: 0.64,
    dialect: "scottish",
    gender: "male",
  },
  {
    id: "emma_midlands",
    name: "Emma · West Midlands",
    desc: "Friendly West Midlands warmth",
    cloudVoice: "Aoede",
    rate: 0.97,
    pitch: 1.14,
    stability: 0.62,
    dialect: "west_midlands",
    gender: "female",
  },
  {
    id: "oliver_midlands",
    name: "Oliver · West Midlands",
    desc: "Friendly West Midlands warmth",
    cloudVoice: "Puck",
    rate: 0.97,
    pitch: 0.73,
    stability: 0.62,
    dialect: "west_midlands",
    gender: "male",
  },
];

const CURRENT_PREFS_VERSION = 2;

export const DEFAULT_PREFS = {
  version: CURRENT_PREFS_VERSION,
  profileId: "natural",
  engine: "cloud",
  rate: 0.94,
  pitch: 1,
  stability: 0.62,
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

export function getRegionalVoicePrompt(profileId) {
  const profile = getVoiceProfile(profileId);
  const prompts = {
    yorkshire: "Use subtle South Yorkshire warmth and cadence. Keep regional phrasing natural and never caricatured.",
    mancunian: "Use an upbeat Greater Manchester cadence with restrained, natural regional warmth.",
    london_rp: "Use polished British Received Pronunciation with crisp, professional diction.",
    scottish: "Use a warm Scottish cadence with clear, professional clinical diction.",
    west_midlands: "Use friendly West Midlands warmth with natural, professional phrasing.",
    neutral_uk: "Use natural conversational British English with clear clinical diction.",
  };
  return prompts[profile.dialect] || prompts.neutral_uk;
}

export function applyProfile(profileId) {
  const profile = getVoiceProfile(profileId);
  return { rate: profile.rate, pitch: profile.pitch, stability: profile.stability };
}