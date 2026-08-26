import React, { useEffect } from "react";
import { useVoiceSynthesis } from "@/hooks/useVoiceSynthesis";

export default function GlobalVoiceControl() {
  const synth = useVoiceSynthesis();

  useEffect(() => {
    const handleFeedback = (event) => {
      const message = event?.detail?.message;
      if (message) synth.speak(message);
    };
    window.addEventListener("clinicaledge:voice-feedback", handleFeedback);
    return () => window.removeEventListener("clinicaledge:voice-feedback", handleFeedback);
  }, [synth.speak]);

  // Voice feedback remains available globally, but configuration is intentionally
  // centralised in User Management rather than exposed as a floating app tab.
  return null;
}
