import {
  Home, BookOpen, ClipboardList, Stethoscope, Library, Users, User, BarChart3,
  Activity, HeartPulse, Brain, FlaskConical, GraduationCap, ClipboardCheck,
} from "lucide-react";

const ALL = ["student", "tutor", "admin"];
const STAFF = ["tutor", "admin"];

/* Workflow-ordered categories: Learn → Assess → Simulate → Review → Account */
export const NAV_CATEGORIES = [
  {
    id: "knowledge",
    label: "Knowledge & Learning",
    icon: GraduationCap,
    items: [
      { icon: BookOpen, label: "Theory Modules", path: "/theory", roles: ALL },
      { icon: Library, label: "Knowledge Library", path: "/knowledge-library", roles: ALL },
      { icon: Activity, label: "Interactive Learning", path: "/interactive-learning", roles: ALL },
      { icon: Brain, label: "Anatomy & Physiology", path: "/anatomy-physiology", roles: ALL },
      { icon: HeartPulse, label: "Health Hub", path: "/health-hub", roles: ALL },
    ],
  },
  {
    id: "care",
    label: "Care Planning",
    icon: ClipboardCheck,
    items: [
      { icon: ClipboardList, label: "Care Planning Suite", path: "/care-planning", roles: ALL },
      { icon: Activity, label: "ABCDE Assessment", path: "/care-planning/abcde", roles: ALL },
      { icon: BarChart3, label: "NEWS2 Scoring", path: "/care-planning/news2", roles: ALL },
      { icon: ClipboardCheck, label: "SMART Goals", path: "/care-planning/smart-goals", roles: ALL },
    ],
  },
  {
    id: "simulation",
    label: "Clinical Simulation",
    icon: Stethoscope,
    items: [
      { icon: Stethoscope, label: "Ward Simulation", path: "/ward-simulation", roles: ALL },
      { icon: FlaskConical, label: "Scenario Authoring", path: "/scenario-authoring", roles: STAFF },
      { icon: ClipboardList, label: "Scenario Templates", path: "/scenario-templates", roles: STAFF },
    ],
  },
  {
    id: "review",
    label: "Progress & Review",
    icon: BarChart3,
    items: [
      { icon: BarChart3, label: "Performance", path: "/performance", roles: ALL },
    ],
  },
  {
    id: "account",
    label: "Account",
    icon: User,
    items: [
      { icon: User, label: "Profile", path: "/profile", roles: ALL },
      { icon: Users, label: "User Management", path: "/user-management", roles: STAFF },
    ],
  },
];

export function getCategoriesForRole(role) {
  return NAV_CATEGORIES.map((cat) => ({
    ...cat,
    items: cat.items.filter((item) => item.roles.includes(role)),
  })).filter((cat) => cat.items.length > 0);
}

/* Compact quick-access set for the mobile bottom pill — one representative per
   workflow stage, ordered Learn → Assess → Simulate → Review. */
export function getQuickNavForRole(role) {
  const student = [
    { icon: Home, label: "Home", path: "/" },
    { icon: BookOpen, label: "Learn", path: "/theory" },
    { icon: ClipboardList, label: "Assess", path: "/care-planning" },
    { icon: Stethoscope, label: "Simulate", path: "/ward-simulation" },
    { icon: BarChart3, label: "Review", path: "/performance" },
  ];
  const tutor = [
    { icon: Home, label: "Home", path: "/" },
    { icon: BookOpen, label: "Learn", path: "/theory" },
    { icon: Stethoscope, label: "Simulate", path: "/ward-simulation" },
    { icon: Users, label: "Users", path: "/user-management" },
  ];
  const admin = [
    { icon: Home, label: "Home", path: "/" },
    { icon: Users, label: "Users", path: "/user-management" },
    { icon: Library, label: "Library", path: "/knowledge-library" },
    { icon: Stethoscope, label: "Simulate", path: "/ward-simulation" },
  ];
  if (role === "student") return student;
  if (role === "tutor") return tutor;
  return admin;
}