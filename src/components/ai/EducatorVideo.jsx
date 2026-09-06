import { useEffect, useRef, useState } from "react";

export default function EducatorVideo() {
  const videoRef = useRef(null);
  const [motionEnabled, setMotionEnabled] = useState(() => !window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  const [playing, setPlaying] = useState(false);
  const [failed, setFailed] = useState(false);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => { if (query.matches) setMotionEnabled(false); };
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  useEffect(() => {
    const video = videoRef.current;
    let visible = true;
    let disposed = false;
    const update = () => {
      if (!motionEnabled || document.hidden || !visible) { video.pause(); return; }
      video.play().catch(() => { if (!disposed) setPlaying(false); });
    };
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; update(); }, { threshold: 0.05 });
    observer.observe(video);
    document.addEventListener("visibilitychange", update);
    video.addEventListener("canplay", update);
    update();
    return () => {
      disposed = true;
      observer.disconnect();
      document.removeEventListener("visibilitychange", update);
      video.removeEventListener("canplay", update);
      video.pause();
    };
  }, [motionEnabled, retry]);
  const toggle = () => {
    if (playing) { setMotionEnabled(false); videoRef.current.pause(); }
    else {
      setMotionEnabled(true);
      videoRef.current.play().catch(() => setPlaying(false));
    }
  };
  return <div className="educator-video">
    <video key={retry} ref={videoRef} src="/media/clinical-educator.mp4" poster="/media/clinical-educator-poster.jpg"
      loop muted playsInline preload="metadata" aria-label="Animated Clinical Educator"
      onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onError={() => setFailed(true)} />
    <div className="educator-video-controls">
      {failed ? <><p role="alert">The educator video could not load. You can still use chat and voice.</p>
        <button type="button" onClick={() => { setFailed(false); setRetry(value => value + 1); }}>Retry video</button></> :
        <button type="button" onClick={toggle} aria-pressed={!playing}>{playing ? "Pause video" : "Play video"}</button>}
    </div>
  </div>;
}
