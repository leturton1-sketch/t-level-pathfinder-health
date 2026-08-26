import { Home, BookOpen, ClipboardList, Stethoscope, Library, Users, User, BarChart3 } from "lucide-react";

const STUDENT_NAV = [
  { icon: Home, label: "Home", path: "/" },
  { icon: BookOpen, label: "Theory", path: "/theory" },
  { icon: ClipboardList, label: "Care Plans", path: "/care-planning" },
  { icon: Stethoscope, label: "Ward Sim", path: "/ward-simulation" },
  { icon: BarChart3, label: "Progress", path: "/performance" },
  { icon: User, label: "Profile", path: "/profile" },
];

const TUTOR_NAV = [
  { icon: Home, label: "Home", path: "/" },
  { icon: BookOpen, label: "Theory", path: "/theory" },
  { icon: Stethoscope, label: "Ward Sim", path: "/ward-simulation" },
  { icon: Users, label: "Users", path: "/user-management" },
  { icon: Library, label: "Library", path: "/knowledge-library" },
];

const ADMIN_NAV = [
  { icon: Home, label: "Home", path: "/" },
  { icon: Users, label: "Users", path: "/user-management" },
  { icon: Library, label: "Library", path: "/knowledge-library" },
  { icon: Stethoscope, label: "Ward Sim", path: "/ward-simulation" },
  { icon: User, label: "Profile", path: "/profile" },
];

export function getNavForRole(role) {
  if (role === "student") return STUDENT_NAV;
  if (role === "tutor") return TUTOR_NAV;
  return ADMIN_NAV;
}