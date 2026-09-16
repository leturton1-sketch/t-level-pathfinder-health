import React, { useEffect, useMemo, useRef, useState } from "react";

const INTRO_KEY = "pathfinder-clinical-educator-intro-seen-v1";
const CLIPS = {
  first_use: "/pathfinder-educator/first-use-welcome.mp4",
  hello: "/pathfinder-educator/hello-wave.mp4",
  thinking: "/pathfinder-educator/thinking.mp4",
  working: "/pathfinder-educator/working.mp4",
  good_work: "/pathfinder-educator/good-work.mp4",
  task_complete: "/pathfinder-educator/task-complete.mp4",
  neutral: "/pathfinder-educator/neutral.mp4",
};
const LABELS = {
  first_use: "Welcome to Pathfinder AI",
  hello: "Hello — I’m listening",
  thinking: "Thinking through your question",
  working: "Preparing your clinical learning response",
  good_work: "Good work",
  task_complete: "Task complete",
  neutral: "Clinical Educator ready",
};

export default function ClinicalEducatorVideo({ cue = "neutral", cueKey = 0 }) {
  const videoRef = useRef(null);
  const [introActive, setIntroActive] = useState(false);
  const [activeCue, setActiveCue] = useState("neutral");

  useEffect(() => {
    const firstUse = window.localStorage.getItem(INTRO_KEY) !== "true";
    if (firstUse) {
      window.localStorage.setItem(INTRO_KEY, "true");
      setIntroActive(true);
      setActiveCue("first_use");
    }
  }, []);

  useEffect(() => {
    if (!introActive) setActiveCue(CLIPS[cue] ? cue : "neutral");
  }, [cue, cueKey, introActive]);

  const src = useMemo(() => CLIPS[activeCue] || CLIPS.neutral, [activeCue]);
  const loops = activeCue === "neutral" || activeCue === "thinking" || activeCue === "working";

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = 0;
    video.play().catch(() => {});
  }, [src, cueKey]);

  const handleEnded = () => {
    if (introActive) {
      setIntroActive(false);
      setActiveCue(CLIPS[cue] ? cue : "neutral");
      return;
    }
    if (!loops) setActiveCue("neutral");
  };

  return (
    <section className="educator-stage" aria-label="Clinical Educator">
      <div className="educator-video">
        <video
          ref={videoRef}
          key={src}
          src={src}
          autoPlay
          muted
          playsInline
          loop={loops}
          preload="auto"
          onEnded={handleEnded}
          aria-label={LABELS[activeCue]}
        />
        <div className="educator-video-status" role="status" aria-live="polite">
          <span className="educator-video-live" aria-hidden="true" />
          <div><strong>Clinical Educator</strong><p>{LABELS[activeCue]}</p></div>
        </div>
      </div>
    </section>
  );
}
