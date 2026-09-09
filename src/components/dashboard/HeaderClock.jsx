import { useEffect, useState } from "react";

/**
 * Displays the live time/date in the ward board header. Isolated into its
 * own component with its own 1-second timer so the second-level tick
 * doesn't re-render the rest of the dashboard (patient lists, widgets, etc).
 */
export default function HeaderClock() {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const clock = new Date(now).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  const date = new Date(now).toLocaleDateString("en-GB", { weekday: "short", day: "2-digit", month: "short", year: "numeric" });

  return (
    <>
      <span className="font-mono">{clock}</span>
      <span className="text-white/50">·</span>
      <span>{date}</span>
    </>
  );
}
