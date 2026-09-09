import { NAVIGATION_GROUPS } from "@/components/dashboard/PathfinderNavigation";

// Extra spoken synonyms for destinations, keyed by route path. The navigation
// label itself is always matched too, so this only needs the shorter/likelier
// things a student or tutor would actually say.
const PATH_SYNONYMS = {
  "/": ["home", "overview", "dashboard", "start page"],
  "/ward-simulation": ["ward", "the ward", "ward round"],
  "/care-planning": ["care plan", "care plans", "careplanning"],
  "/esp-practice": ["esp", "esp practice", "practice hub", "assessment prep", "assessment preparation"],
  "/esp-tutor-review": ["tutor review", "review my students", "marking"],
  "/performance": ["progress", "my progress", "my results", "how am i doing"],
  "/voice-assistant": ["pathfinder ai", "ai educator", "clinical educator", "the educator", "ai assistant", "educator"],
  "/theory": ["theory", "theory modules", "the theory"],
  "/knowledge-library": ["library", "knowledge library"],
  "/anatomy-physiology": ["anatomy", "physiology", "anatomy and physiology"],
  "/reflection": ["reflection", "my reflections", "reflect"],
  "/profile": ["my profile", "account", "my account"],
  "/ai-models": ["ai settings", "model router", "ai model router"],
};

// Utility commands that do not navigate anywhere. Ordered so more specific
// phrases are tried before short/ambiguous ones (e.g. "stop reading" before
// a bare "stop", which would otherwise also match "stop the ward").
const UTILITY_COMMANDS = [
  { type: "read", phrases: ["read this page", "read the page", "read page aloud", "read this aloud", "read aloud"] },
  { type: "stop", phrases: ["stop reading", "stop talking", "be quiet", "stop speaking"] },
  { type: "mute", value: true, phrases: ["mute the educator", "mute voice", "turn off voice", "turn off speech"] },
  { type: "mute", value: false, phrases: ["unmute the educator", "unmute voice", "turn on voice", "turn on speech"] },
  { type: "toggle-nav", phrases: ["collapse the navigation", "collapse navigation", "collapse the menu", "hide the menu", "expand the navigation", "expand navigation", "show the menu", "open the menu", "close the menu"] },
  { type: "back", phrases: ["go back", "previous page", "take me back", "back a page"] },
  { type: "scroll", direction: 1, phrases: ["scroll down", "page down"] },
  { type: "scroll", direction: -1, phrases: ["scroll up", "page up"] },
  { type: "help", phrases: ["help", "what can i say", "voice commands", "what are the voice commands", "list commands"] },
  { type: "stop", phrases: ["stop"] },
];

const NAV_TRIGGER_PHRASES = ["navigate to", "go to", "open", "show me", "take me to", "show"];

function normalise(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function buildDestinations() {
  const destinations = [];
  for (const group of NAVIGATION_GROUPS) {
    for (const item of group.items) {
      const synonyms = PATH_SYNONYMS[item.path] || [];
      destinations.push({ path: item.path, label: item.label, terms: [normalise(item.label), ...synonyms.map(normalise)] });
    }
  }
  return destinations;
}

// Cached once — NAVIGATION_GROUPS is a static module-level constant.
const DESTINATIONS = buildDestinations();

function matchDestination(phrase) {
  const clean = normalise(phrase);
  if (!clean) return null;
  // Prefer an exact term match, then fall back to "contains" in either
  // direction so "ward" matches "ward simulation" and vice versa.
  let best = null;
  for (const destination of DESTINATIONS) {
    for (const term of destination.terms) {
      if (!term) continue;
      if (clean === term) return destination;
      if ((clean.includes(term) || term.includes(clean)) && (!best || term.length > best.termLength)) {
        best = { ...destination, termLength: term.length };
      }
    }
  }
  return best;
}

/**
 * Matches a spoken transcript against the app's global voice command set.
 * Returns a plain action descriptor for the caller to execute, or null if
 * nothing recognisable was said.
 */
export function matchVoiceCommand(transcript) {
  const clean = normalise(transcript);
  if (!clean) return null;

  for (const command of UTILITY_COMMANDS) {
    if (command.phrases.some((phrase) => clean === phrase || clean.startsWith(`${phrase} `))) {
      return { type: command.type, value: command.value, direction: command.direction };
    }
  }

  for (const trigger of NAV_TRIGGER_PHRASES) {
    if (clean.startsWith(`${trigger} `)) {
      const destination = matchDestination(clean.slice(trigger.length + 1));
      if (destination) return { type: "navigate", path: destination.path, label: destination.label };
    }
  }

  // Allow a bare destination name with no trigger phrase, e.g. "ward simulation".
  const destination = matchDestination(clean);
  if (destination) return { type: "navigate", path: destination.path, label: destination.label };

  return null;
}

export function listVoiceCommandExamples() {
  return [
    "\"Go to my progress\"",
    "\"Open ward simulation\"",
    "\"Show care planning\"",
    "\"Open Pathfinder AI\"",
    "\"Read this page\"",
    "\"Stop reading\"",
    "\"Go back\"",
    "\"Collapse the navigation\"",
  ];
}
