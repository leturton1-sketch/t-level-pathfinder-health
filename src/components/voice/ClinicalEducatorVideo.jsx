import React, { useEffect, useMemo, useRef, useState } from "react";

const INTRO_KEY = "pathfinder-clinical-educator-intro-seen-v1";
const REST_FRAME_SECONDS = 0.62;
const PLAYBACK_RATE = 0.68;

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

export default function ClinicalEducatorVideo({ cue = "neutral", cueKey = 0, speaking = false }) {
  const videoRef = useRef(null);
  const distortionTimerRef = useRef(null);
  const firstVisitRef = useRef(false);
  const [introActive, setIntroActive] = useState(false);
  const [activeCue, setActiveCue] = useState("neutral");
  const [resting, setResting] = useState(true);
  const [clientReady, setClientReady] = useState(false);
  const [distorting, setDistorting] = useState(false);

  const src = useMemo(() => CLIPS[activeCue] || CLIPS.neutral, [activeCue]);
  const performing = activeCue !== "neutral" && !resting;

  const triggerDistortion = () => {
    window.clearTimeout(distortionTimerRef.current);
    setDistorting(true);
    distortionTimerRef.current = window.setTimeout(() => setDistorting(false), 820);
  };

  const enterRestMode = () => {
    setIntroActive(false);
    setResting(true);
    setActiveCue("neutral");
  };

  useEffect(() => {
    const firstVisit = window.localStorage.getItem(INTRO_KEY) !== "true";
    firstVisitRef.current = firstVisit;
    if (firstVisit) {
      window.localStorage.setItem(INTRO_KEY, "true");
      setIntroActive(true);
      setResting(false);
      setActiveCue("first_use");
      triggerDistortion();
    }
    setClientReady(true);
    return () => window.clearTimeout(distortionTimerRef.current);
  }, []);

  useEffect(() => {
    if (!clientReady || introActive) return;
    const nextCue = CLIPS[cue] ? cue : "neutral";
    if (nextCue === "neutral") {
      enterRestMode();
      return;
    }
    setResting(false);
    setActiveCue(nextCue);
    triggerDistortion();
  }, [cue, cueKey, clientReady, introActive]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const preparePlayback = () => {
      video.playbackRate = PLAYBACK_RATE;
      if (activeCue === "neutral" || resting) {
        video.currentTime = Math.min(REST_FRAME_SECONDS, Math.max(0, (video.duration || 1) - 0.05));
        video.pause();
      } else {
        video.currentTime = 0;
        video.play().catch(() => {});
      }
    };

    if (video.readyState >= 1) preparePlayback();
    else video.addEventListener("loadedmetadata", preparePlayback, { once: true });

    return () => video.removeEventListener("loadedmetadata", preparePlayback);
  }, [src, activeCue, resting, cueKey]);

  return (
    <section
      className={`educator-stage ${performing ? "is-performing" : "is-resting"} ${speaking ? "is-speaking" : ""} ${distorting ? "is-distorting" : ""}`}
      aria-label="Clinical Educator"
    >
      <div className="educator-video">
        <div className="educator-video-viewport">
          <video
            ref={videoRef}
            key={src}
            src={src}
            autoPlay={performing}
            muted
            playsInline
            preload="auto"
            onEnded={enterRestMode}
            aria-label={LABELS[activeCue]}
          />
          <div className="educator-hologram-noise" aria-hidden="true" />
          <div className="educator-hologram-slice educator-hologram-slice-a" aria-hidden="true" />
          <div className="educator-hologram-slice educator-hologram-slice-b" aria-hidden="true" />
          <div className="educator-tattoo-lights" aria-hidden="true">
            <span className="tattoo-light tattoo-light-neck" />
            <span className="tattoo-light tattoo-light-left" />
            <span className="tattoo-light tattoo-light-right" />
          </div>
        </div>
        <div className="educator-video-status" role="status" aria-live="polite">
          <span className="educator-video-live" aria-hidden="true" />
          <div>
            <strong>Clinical Educator</strong>
            <p>{resting ? LABELS.neutral : LABELS[activeCue]}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
