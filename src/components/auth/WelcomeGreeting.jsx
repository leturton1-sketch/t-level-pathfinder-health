import { useState, useEffect, useRef } from "react";
import { Sparkles, GraduationCap, ClipboardCheck, MessageSquareText, Volume2, Loader2, RotateCcw } from "lucide-react";
import { useVoiceSynthesis } from "@/hooks/useVoiceSynthesis";
import TLevelLogo from "@/components/TLevelLogo";
import { getUserRecognition } from "@/lib/aiAssistantIdentity";

const HELP_POINTS = [
  {
    icon: GraduationCap,
    text: "Learn the theory, then practise it in the ward simulation with the same case.",
  },
  {
    icon: ClipboardCheck,
    text: "Complete care plans and Employer Set Project evidence, then reflect on what happened.",
  },
  {
    icon: MessageSquareText,
    text: "Ask me questions any time — I can also read this app aloud and follow spoken commands.",
  },
];

/**
 * WelcomeGreeting — shown once per session immediately after sign-in.
 * Greets the user by name and role, introduces LEE, and auto-plays a
 * spoken welcome message. The Continue button stays disabled until the
 * message has finished playing so every user hears the orientation.
 */
export default function WelcomeGreeting({ user, onContinue }) {
  const synth = useVoiceSynthesis();
  const recognition = getUserRecognition(user);
  const { firstName, roleTitle } = recognition;
  const isStaff = user?.role === "tutor" || user?.role === "admin" || user?.role === "super_admin";

  const purposeText = isStaff
    ? "LEE is where students learn clinical theory, practise it in a ward simulation, and build evidence for their T Level. You can review progress, feedback and readiness from My progress."
    : "LEE is where you learn clinical theory, practise it in a ward simulation, complete care plans, reflect, and get feedback — all building towards your T Level.";

  const welcomeMessage = `Hello, ${firstName}. I'm LEE — your Clinical Educator and AI companion. Welcome to the Leading Educational Electronic Patient Record System. This is your interactive clinical learning environment for your T Level in Health. ${purposeText} I'm here to help at every step. You can ask me questions, have me read pages aloud, or use voice commands. Let's get started.`;

  const [hasPlayed, setHasPlayed] = useState(false);
  const [minTimeElapsed, setMinTimeElapsed] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    const minTimer = setTimeout(() => setMinTimeElapsed(true), 3000);

    const playTimer = setTimeout(() => {
      synth.speak(welcomeMessage, {
        ignoreMute: true,
        onStart: () => setIsSpeaking(true),
        onEnd: () => {
          setIsSpeaking(false);
          setHasPlayed(true);
        },
      });
    }, 400);

    return () => {
      clearTimeout(minTimer);
      clearTimeout(playTimer);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const replay = () => {
    setHasPlayed(false);
    synth.speak(welcomeMessage, {
      ignoreMute: true,
      onStart: () => setIsSpeaking(true),
      onEnd: () => {
        setIsSpeaking(false);
        setHasPlayed(true);
      },
    });
  };

  const handleContinue = () => {
    synth.stop();
    onContinue?.();
  };

  const canContinue = hasPlayed && minTimeElapsed && !isSpeaking;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-[#15131a]/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-2xl border border-[#0f75d8]/30 bg-white shadow-xl">
        <div className="flex flex-col items-center gap-3 border-b border-[#0f75d8]/15 px-6 pb-5 pt-7 text-center">
          <TLevelLogo variant="emblem" size="xl" className="h-24 w-24 drop-shadow-md" />
          <TLevelLogo variant="black" size="sm" />
          <h1 className="mt-1 text-xl font-semibold text-[#15131a]">Welcome, {firstName}</h1>
          <p className="text-sm text-slate-500">Signed in as {roleTitle}</p>
        </div>

        <div className="px-6 py-5">
          <div className="mb-4 flex items-start gap-3 rounded-xl border border-[#0f75d8]/20 bg-[#0f75d8]/5 p-4">
            <Sparkles size={20} className="mt-0.5 shrink-0 text-[#0f75d8]" aria-hidden="true" />
            <p className="text-sm text-[#15131a]">
              <strong>LEE:</strong> {welcomeMessage}
            </p>
          </div>

          <ul className="space-y-3">
            {HELP_POINTS.map(({ icon: Icon, text }, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-slate-700">
                <Icon size={18} className="mt-0.5 shrink-0 text-[#0f75d8]" aria-hidden="true" />
                <span>{text}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-[#0f75d8]/15 px-6 py-4">
          <div className="flex items-center gap-2 text-sm text-slate-500" aria-live="polite">
            {isSpeaking ? (
              <>
                <Volume2 size={16} className="animate-pulse text-[#0f75d8]" />
                <span>LEE is speaking…</span>
              </>
            ) : !hasPlayed ? (
              <>
                <Loader2 size={16} className="animate-spin text-[#0f75d8]" />
                <span>Preparing welcome…</span>
              </>
            ) : (
              <button type="button" onClick={replay} className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold text-blue-800 hover:bg-blue-50">
                <RotateCcw size={14} /> Replay
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={handleContinue}
            disabled={!canContinue}
            className={`rounded-lg px-5 py-2 text-sm font-semibold text-white transition ${canContinue ? "bg-[#0f75d8] hover:bg-[#0759b6]" : "bg-slate-300 cursor-not-allowed"}`}
          >
            {isSpeaking ? "Listening…" : "Continue"}
          </button>
        </div>
      </div>
    </div>
  );
}