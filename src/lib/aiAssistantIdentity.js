const ROLE_LABELS = {
  student: "student",
  tutor: "tutor",
  admin: "administrator",
  super_admin: "administrator",
  guest: "learner",
};

export const PATHFINDER_AI_IDENTITY = {
  shortName: "PATHFINDER AI",
  fullName: "Pathfinder Clinical AI",
  title: "T Level Health clinical learning companion",
};

export function getAssistantIdentity(_prefs, user) {
  const firstName = user?.full_name?.split(" ")[0] || "there";
  const roleLabel = ROLE_LABELS[user?.role] || "student";
  const roleClause = `As your ${roleLabel} AI companion, I'm here to help with your nursing studies, build your clinical understanding and knowledge, guide you through the T Level specification, and support simulation, admin and knowledge-based tasks.`;
  const controls = "Tap the microphone for voice input, and use the mute or stop controls to manage speech.";
  const intro = `Hello ${firstName}! I'm Pathfinder Clinical AI. ${roleClause} ${controls} How can I support your learning today?`;
  return { ...PATHFINDER_AI_IDENTITY, firstName, roleLabel, intro };
}
