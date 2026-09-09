import "./learning-journey.css";
import { Link, useLocation } from "react-router-dom";
import { useESPCase } from "@/lib/ESPCaseContext";

const PAGES = {
  "/theory": ["Learn", "Build the knowledge behind safe care.", "Explain the principles and check your understanding.", "20–30 minutes per topic", "Continue learning", "/ward-simulation", "Start practice"],
  "/health-hub": ["Learn", "Explore health topics and clinical reasoning.", "Connect health knowledge with person-centred care.", "15–25 minutes", "Continue learning", "/clinical-skills-academy", "Start practice"],
  "/anatomy-physiology": ["Learn", "Explore body systems and how illness affects them.", "Relate structures and function to care needs.", "15–25 minutes", "Start learning", "/theory", "Continue to theory"],
  "/knowledge-library": ["Learn", "Find supporting explanations and reference material.", "Use relevant knowledge to explain a care decision.", "10–15 minutes", "Browse resources", "/ward-simulation", "Start practice"],
  "/clinical-skills-academy": ["Practise", "Develop a clinical skill through guided activities.", "Explain, practise and review your approach.", "20–30 minutes", "Start practice", "/ward-simulation", "Continue in the ward"],
  "/interactive-learning": ["Practise", "Rehearse clinical knowledge through interactive activities.", "Identify strengths and areas to revisit.", "10–20 minutes", "Start practice", "/reflection", "Reflect on your practice"],
  "/ward-simulation": ["Practise", "Apply your learning to a simulated clinical scenario.", "Assess, prioritise, act and review your decisions.", "20–30 minutes", "Start practice", "/care-planning", "Continue to care planning"],
  "/care-planning": ["Practise", "Translate assessment findings into a person-centred plan.", "Document needs, goals, actions and review arrangements.", "20–30 minutes", "Continue", "/reflection", "Reflect on your care plan"],
  "/reflection": ["Practise", "Turn your experience and feedback into an action plan.", "Identify what worked, what to improve and your next action.", "10–15 minutes", "Write reflection", "/performance", "View feedback and progress"],
  "/esp-practice": ["Assessment preparation", "Build connected practice evidence across the ESP tasks.", "Apply knowledge, justify decisions and review your evidence.", "See individual task timings", "Start practice", "/esp-practice/portfolio", "View feedback"],
};
const STEPS = [["Learn", "/theory"], ["Practise", "/ward-simulation"], ["Care plan", "/care-planning"], ["Reflect", "/reflection"], ["Progress & feedback", "/performance"]];
export default function LearningJourney({ footer = false }) {
  const { pathname } = useLocation();
  const { portfolio } = useESPCase();
  const root = "/" + pathname.split("/")[1];
  const page = PAGES[root];
  // ESP workspaces already provide their own timed section navigation.
  if (!page || (root === "/esp-practice" && pathname !== root)) return null;
  const [stage, purpose, outcome, time, action, next, nextLabel] = page;
  if (footer) return <section className="pf-learning-guide pf-learning-next" aria-label="Next learning step">
    <div><h2>When you have finished</h2><p>Save your work in the activity before moving on. Moving between pages does not mark an activity complete.</p></div>
    <Link className="pf-primary-button" to={next}>{nextLabel} →</Link>
  </section>;
  return <section className="pf-learning-guide" aria-label="Learning plan">
    <p className="pf-eyebrow">{stage}</p>
    <h2>Your learning plan</h2><p>{purpose}</p>
    <dl><div><dt>Learning outcome</dt><dd>{outcome}</dd></div><div><dt>Suggested study time</dt><dd>{time}</dd></div></dl>
    {portfolio && <p className="pf-muted">Active ESP case: {portfolio.case_name}. Your ESP case remains available as you move between activities.</p>}
    <nav className="pf-learning-steps" aria-label="Learning journey">{STEPS.map(([label, to]) => <Link key={to} to={to} aria-current={root === to ? "step" : undefined}>{label}</Link>)}</nav>
    <button className="pf-primary-button" onClick={() => { const target = document.getElementById("learning-activity"); target?.scrollIntoView({ block: "start" }); target?.focus({ preventScroll: true }); }}>{action}</button>
  </section>;
}
