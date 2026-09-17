import { useEffect } from "react";
import { useVoiceSynthesis } from "@/hooks/useVoiceSynthesis";
import { useToast } from "@/components/ui/use-toast";

export default function GlobalVoiceControl() {
  const synth = useVoiceSynthesis();
  const { toast } = useToast();

  useEffect(() => {
    const handleFeedback = (event) => {
      const message = event?.detail?.message;
      if (message) synth.speak(message);
    };
    window.addEventListener("clinicaledge:voice-feedback", handleFeedback);
    return () => window.removeEventListener("clinicaledge:voice-feedback", handleFeedback);
  }, [synth.speak]);

  useEffect(() => {
    const handleEducatorAnnouncement = (event) => {
      const message = event?.detail?.message;
      if (!message) return;
      toast({
        title: event.detail?.source || "Pathfinder AI Clinical Educator",
        description: message,
        variant: event.detail?.level === "warning" ? "destructive" : "default",
        duration: 5000,
      });
    };
    window.addEventListener("pathfinder:educator-announcement", handleEducatorAnnouncement);
    return () => window.removeEventListener("pathfinder:educator-announcement", handleEducatorAnnouncement);
  }, [toast]);

  // Voice feedback remains available globally, but configuration is intentionally
  // centralised in User Management rather than exposed as a floating app tab.
  return null;
}
