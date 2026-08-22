import React, { useEffect, useState } from "react";
import { Settings2, Volume2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useVoiceSynthesis } from "@/hooks/useVoiceSynthesis";
import VoiceSettings from "@/components/voice/VoiceSettings";

export default function GlobalVoiceControl() {
  const synth = useVoiceSynthesis();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handleFeedback = (event) => {
      const message = event?.detail?.message;
      if (message) synth.speak(message);
    };
    window.addEventListener("clinicaledge:voice-feedback", handleFeedback);
    return () => window.removeEventListener("clinicaledge:voice-feedback", handleFeedback);
  }, [synth.speak]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="polished-glass-edge fixed right-4 top-4 z-40 flex items-center gap-2 rounded-2xl border border-white/90 bg-slate-100/80 px-3 py-2 text-[11px] font-bold text-slate-700 shadow-[0_7px_0_-4px_rgba(100,116,139,.38),0_18px_34px_-20px_rgba(15,23,42,.7),inset_1px_1px_1px_white] backdrop-blur-2xl transition hover:-translate-y-0.5 hover:text-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-500"
        title="UK regional voice settings"
        aria-label="Open UK regional voice settings"
      >
        <span className="grid h-7 w-7 place-items-center rounded-xl bg-gradient-to-br from-cyan-400 to-teal-700 text-white shadow-md">
          <Volume2 className="h-4 w-4" />
        </span>
        <span className="hidden sm:inline">UK Voice</span>
        <Settings2 className="h-3.5 w-3.5" />
      </button>

      <VoiceSettings
        open={open}
        onClose={() => setOpen(false)}
        synth={synth}
        onSaved={() => toast({ title: "Voice settings saved", description: "Your UK regional voice is ready." })}
      />
    </>
  );
}
