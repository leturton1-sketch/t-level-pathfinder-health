import { Sparkles, GraduationCap, ClipboardCheck, MessageSquareText } from "lucide-react";
import { useVoiceSynthesis } from "@/hooks/useVoiceSynthesis";
import TLevelLogo from "@/components/TLevelLogo";

const ROLE_TITLES = {
  student: "Student",
  tutor: "Tutor",
  admin: "Institution Administrator",
  super_admin: "Administrator",
  guest: "Learner",
};

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
 * Greets the user by name and role, introduces Pathfinder AI, and
 * explains the app's purpose so new and returning users share the
 * same starting point. Speech requires the Listen action.
 */
export default function WelcomeGreeting({ user, onContinue }) {
  const synth = useVoiceSynthesis();
  const firstName = user?.full_name?.split(" ")[0] || "there";
  const roleTitle = ROLE_TITLES[user?.role] || "Learner";
  const isStaff = user?.role === "tutor" || user?.role === "admin" || user?.role === "super_admin";

  const purposeText = isStaff
    ? "Pathfinder Health is where students learn clinical theory, practise it in a ward simulation, and build evidence for their T Level. You can review progress, feedback and readiness from My progress."
    : "Pathfinder Health is where you learn clinical theory, practise it in a ward simulation, complete care plans, reflect, and get feedback — all building towards your T Level.";

  const spokenGreeting = `Welcome, ${firstName}. I'm Pathfinder AI, your curriculum-to-industry AI tutor. ${purposeText}`;


  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-[#15131a]/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-2xl border border-[#0f75d8]/30 bg-white shadow-xl">
        <div className="flex flex-col items-center gap-3 border-b border-[#0f75d8]/15 px-6 pb-5 pt-7 text-center">
          <img src="/branding/tl-emblem.png" alt="T Level Industry Academy" className="h-16 w-16 object-contain" draggable={false} />
          <TLevelLogo variant="black" size="sm" />
          <h1 className="mt-1 text-xl font-semibold text-[#15131a]">Welcome, {firstName}</h1>
          <p className="text-sm text-slate-500">Signed in as {roleTitle}</p>
        </div>

        <div className="px-6 py-5">
          <div className="mb-4 flex items-start gap-3 rounded-xl border border-[#0f75d8]/20 bg-[#0f75d8]/5 p-4">
            <Sparkles size={20} className="mt-0.5 shrink-0 text-[#0f75d8]" aria-hidden="true" />
            <p className="text-sm text-[#15131a]">
              I'm <strong>Pathfinder AI</strong>, your curriculum-to-industry AI tutor. {purposeText}
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

        <div className="flex justify-end gap-3 border-t border-[#0f75d8]/15 px-6 py-4">
          <button type="button" onClick={() => synth.speak(spokenGreeting)} className="rounded-lg px-4 py-2 text-sm font-semibold text-blue-800">Listen to welcome</button>
          <button
            type="button"
            onClick={() => { synth.stop(); onContinue?.(); }}
            className="rounded-lg bg-[#0f75d8] px-5 py-2 text-sm font-semibold text-white transition hover:bg-[#0759b6]"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}
