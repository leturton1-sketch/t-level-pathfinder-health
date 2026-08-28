import { getVoiceProfile } from "@/lib/voicePreferences";

// AI assistant personas — the name is matched to the active voice model's
// gender so the assistant's identity follows the voice the learner hears.
export const ASSISTANT_PERSONAS = {
  male: {
    shortName: "A.R.C.H.I.E",
    fullName: "A.R.C.H.I.E",
    title: "Automated Record, Charting & Health Intelligence Engine",
  },
  female: {
    shortName: "F.L.O",
    fullName: "F.L.O",
    title: "Formative Learning Outcomes AI Clinical Assistant",
  },
};

const ROLE_LABELS = {
  student: "student",
  tutor: "tutor",
  admin: "administrator",
  super_admin: "administrator",
  guest: "learner",
};

// Resolve the assistant gender from the active voice profile. When the voice
// model is gender-neutral (e.g. the default profile), fall back to the user's
// configured ai_persona, defaulting to female.
export function getAssistantGender(prefs, user) {
  const profile = getVoiceProfile(prefs?.profileId);
  if (profile?.gender === "male") return "male";
  if (profile?.gender === "female") return "female";
  return user?.ai_persona === "male" ? "male" : "female";
}

export function getAssistantIdentity(prefs, user) {
  const gender = getAssistantGender(prefs, user);
  const persona = ASSISTANT_PERSONAS[gender];
  const firstName = user?.full_name?.split(" ")[0] || "there";
  const roleLabel = ROLE_LABELS[user?.role] || "student";
  const roleClause = `As your ${roleLabel} AI companion, I'm here to help with your nursing studies, build your clinical understanding and knowledge, guide you through the T Level specification, and support simulation, admin and knowledge-based tasks.`;
  const controls = "Tap the microphone for voice input, and use the mute or stop controls to manage my speech.";
  const intro = gender === "male"
    ? `Hello ${firstName}! I'm A.R.C.H.I.E — your Automated Record, Charting & Health Intelligence Engine. ${roleClause} ${controls} How can I support your learning today?`
    : `Hello ${firstName}! I'm F.L.O — your Formative Learning Outcomes AI Clinical Assistant. ${roleClause} ${controls} How can I support your learning today?`;
  return { ...persona, gender, firstName, roleLabel, intro };
}