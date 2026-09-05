export type UKDialect = "yorkshire" | "mancunian" | "london_rp" | "scottish" | "west_midlands";
export type UKGender = "male" | "female";
export type SlangLevel = "authentic" | "standard";

export interface UKVoiceSettings {
  dialect: UKDialect;
  gender: UKGender;
  personaId?: string;
  voiceName?: string;
  rate: number;
  pitch: number;
  volume: number;
  slangLevel: SlangLevel;
  fanfareIntro: boolean;
  naturalCadence: boolean;
  warmthFilter: boolean;
  useNeuralGeminiTts: boolean;
}

export interface DialectMeta {
  id: UKDialect;
  name: string;
  region: string;
  badge: string;
  description: string;
  sampleGreeting: string;
  defaultMalePitch: number;
  defaultFemalePitch: number;
  defaultMaleRate: number;
  defaultFemaleRate: number;
}

export const UK_DIALECTS: DialectMeta[] = [
  { id: "yorkshire", name: "South Yorkshire & Rotherham", region: "Local RNN Region", badge: "Local RNN Dialect", description: "Warm, grounded South Yorkshire cadence with restrained local phrasing.", sampleGreeting: "Ey up! Welcome to the academy.", defaultMalePitch: 0.74, defaultFemalePitch: 1.14, defaultMaleRate: 0.94, defaultFemaleRate: 0.98 },
  { id: "mancunian", name: "Greater Manchester & Lancashire", region: "North West", badge: "North West Accent", description: "Energetic, friendly Mancunian rhythm and intonation.", sampleGreeting: "Hello! Brilliant to connect.", defaultMalePitch: 0.76, defaultFemalePitch: 1.16, defaultMaleRate: 1.02, defaultFemaleRate: 1.05 },
  { id: "london_rp", name: "London & British RP", region: "London & South East", badge: "Formal & Refined", description: "Polished British broadcast tone with crisp clinical diction.", sampleGreeting: "Welcome. Delighted to assist you.", defaultMalePitch: 0.72, defaultFemalePitch: 1.12, defaultMaleRate: 0.92, defaultFemaleRate: 0.96 },
  { id: "scottish", name: "Scottish (Glasgow & Edinburgh)", region: "Scotland", badge: "Caledonian Cadence", description: "Warm Scottish lilt with clear, professional delivery.", sampleGreeting: "Hello! Welcome to the academy.", defaultMalePitch: 0.75, defaultFemalePitch: 1.18, defaultMaleRate: 0.96, defaultFemaleRate: 1.0 },
  { id: "west_midlands", name: "West Midlands & Brummie", region: "Birmingham", badge: "Midlands Dialect", description: "Friendly West Midlands intonation and warmth.", sampleGreeting: "Hello! Really pleased to connect.", defaultMalePitch: 0.73, defaultFemalePitch: 1.14, defaultMaleRate: 0.94, defaultFemaleRate: 0.97 },
];

const STORAGE_KEY = "clinicaledge_uk_voice_settings";

const DEFAULT_SETTINGS: UKVoiceSettings = {
  dialect: "yorkshire",
  gender: "female",
  personaId: "sarah_yorkshire",
  voiceName: "auto",
  rate: 0.98,
  pitch: 1.14,
  volume: 1,
  slangLevel: "standard",
  fanfareIntro: false,
  naturalCadence: true,
  warmthFilter: true,
  useNeuralGeminiTts: true,
};

function loadSettings(): UKVoiceSettings {
  if (typeof window === "undefined") return { ...DEFAULT_SETTINGS };
  try {
    return { ...DEFAULT_SETTINGS, ...JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}") };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

function prepareRegionalSpeech(text: string, settings: UKVoiceSettings) {
  let spoken = String(text || "")
    .replace(/\bNHS\b/g, "en aych ess")
    .replace(/\bNEWS\s*2\b/gi, "news two")
    .replace(/\bSBAR\b/g, "ess bar")
    .replace(/\s+/g, " ")
    .trim();

  if (settings.slangLevel === "authentic" && settings.dialect === "yorkshire" && spoken && !/^ey up\b/i.test(spoken)) {
    spoken = `Ey up! ${spoken}`;
  }
  return spoken;
}

class UKVoiceService {
  private settings: UKVoiceSettings = loadSettings();
  private voices: SpeechSynthesisVoice[] = [];

  constructor() {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      this.loadVoices();
      window.speechSynthesis.addEventListener("voiceschanged", this.loadVoices);
    }
  }

  private loadVoices = () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      this.voices = window.speechSynthesis.getVoices();
    }
  };

  public getSettings(): UKVoiceSettings {
    return { ...this.settings };
  }

  public updateSettings(newSettings: Partial<UKVoiceSettings>) {
    this.settings = { ...this.settings, ...newSettings };
    if (typeof window !== "undefined") {
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(this.settings)); } catch { /* unavailable */ }
      window.dispatchEvent(new CustomEvent("clinicaledge:voice-settings", { detail: this.getSettings() }));
    }
  }

  public stop() {
    if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
  }

  public speak(text: string, customSettings?: Partial<UKVoiceSettings>): Promise<void> {
    const settings = { ...this.settings, ...customSettings };
    const spokenText = prepareRegionalSpeech(text, settings);
    if (!spokenText || typeof window === "undefined" || !("speechSynthesis" in window)) return Promise.resolve();

    this.stop();
    return new Promise((resolve) => {
      const utterance = new SpeechSynthesisUtterance(spokenText);
      utterance.lang = "en-GB";
      utterance.rate = settings.rate;
      utterance.pitch = settings.pitch;
      utterance.volume = settings.volume;

      const english = this.voices.filter((voice) => /^en(?:-|_)/i.test(voice.lang));
      const genderNames = settings.gender === "female"
        ? /female|hazel|serena|sonia|libby|aria|susan|natural|neural/i
        : /male|oliver|george|ryan|daniel|thomas|natural|neural/i;
      utterance.voice =
        english.find((voice) => voice.voiceURI === settings.voiceName) ||
        english.find((voice) => /en-GB/i.test(voice.lang) && genderNames.test(voice.name)) ||
        english.find((voice) => genderNames.test(`${voice.name} ${voice.voiceURI}`)) ||
        english.find((voice) => /en-GB/i.test(voice.lang)) ||
        english[0] ||
        null;

      utterance.onend = () => resolve();
      utterance.onerror = () => resolve();
      window.speechSynthesis.speak(utterance);
    });
  }
}

export const ukVoiceService = new UKVoiceService();

export function announceVoiceFeedback(message: string) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("clinicaledge:voice-feedback", { detail: { message } }));
  }
}
