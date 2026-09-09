import { Link } from "react-router-dom";
import { BookOpen, ClipboardCheck, BriefcaseBusiness, BarChart3, ShieldCheck, Users, BadgeCheck } from "lucide-react";
import { PATHFINDER_HUBS } from "@/lib/pathfinderOperatingModel";

const CONFIG = {
  student: {
    eyebrow: "Learner command centre",
    title: "Learn → evidence → placement → destination",
    message: "Focus on your next learning gap, ESP evidence, workplace readiness and career destination.",
    actions: [
      ["Continue learning", "/theory", BookOpen],
      ["ESP readiness", "/curriculum-readiness", ClipboardCheck],
      ["My Talent Card", "/talent-card", BadgeCheck],
      ["My progress", "/performance", BarChart3],
    ],
  },
  tutor: {
    eyebrow: "Curriculum command centre",
    title: "Cohort readiness and evidence",
    message: "Prioritise specification gaps, ESP evidence quality, learner interventions and placement preparation.",
    actions: [
      ["Curriculum readiness", "/curriculum-readiness", ClipboardCheck],
      ["ESP Tutor Review", "/esp-tutor-review", BookOpen],
      ["Employer & placement", "/employer-portal", BriefcaseBusiness],
      ["User management", "/user-management", Users],
    ],
  },
  admin: {
    eyebrow: "Administration command centre",
    title: "Platform, curriculum and placement operations",
    message: "Monitor system health, curriculum readiness, employer capacity and progression routes.",
    actions: [
      ["System health", "/system-health", ShieldCheck],
      ["Curriculum readiness", "/curriculum-readiness", ClipboardCheck],
      ["Employer portal", "/employer-portal", BriefcaseBusiness],
      ["User management", "/user-management", Users],
    ],
  },
  super_admin: {
    eyebrow: "System Architect command centre",
    title: "Pathfinder Health operating system",
    message: "Protected system oversight across identity, curriculum, employer matching, evidence and destinations.",
    actions: [
      ["System health", "/system-health", ShieldCheck],
      ["Curriculum readiness", "/curriculum-readiness", ClipboardCheck],
      ["Employer portal", "/employer-portal", BriefcaseBusiness],
      ["My progress", "/performance", BarChart3],
    ],
  },
};

export default function RoleMissionPanel({ user }) {
  const config = CONFIG[user?.role] || CONFIG.student;
  return <section className="mb-4 rounded-[24px] border border-purple-200 bg-gradient-to-r from-purple-50 via-white to-rose-50 p-4 shadow-sm">
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div><p className="text-[10px] font-black uppercase tracking-[.18em] text-purple-700">{config.eyebrow}</p><h2 className="mt-1 text-xl font-black text-slate-950">{config.title}</h2><p className="mt-1 max-w-3xl text-sm text-slate-600">{config.message}</p></div>
      <div className="flex flex-wrap gap-1.5">{PATHFINDER_HUBS.map((hub) => <span key={hub} className="rounded-full border border-purple-100 bg-white px-2.5 py-1 text-[10px] font-black text-purple-700">{hub}</span>)}</div>
    </div>
    <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">{config.actions.map(([label, path, Icon]) => <Link key={path} to={path} className="flex min-h-12 items-center gap-2 rounded-xl border border-white bg-white/90 px-3 py-2 text-sm font-bold text-slate-800 shadow-sm transition hover:-translate-y-0.5 hover:border-purple-200"><Icon className="h-4 w-4 text-purple-600" />{label}</Link>)}</div>
  </section>;
}
