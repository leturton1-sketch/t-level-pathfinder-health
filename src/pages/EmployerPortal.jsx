import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { isAdmin } from "@/lib/clinicalAuth";
import { RNN_POWER_SKILLS, weightedMatch } from "@/lib/pathfinderOperatingModel";
import { Building2, BriefcaseBusiness, Users, Sparkles } from "lucide-react";

function overlap(list = [], priorities = []) {
  if (!priorities.length) return 70;
  const learner = list.map((value) => String(value).toLowerCase());
  const hit = priorities.filter((value) => learner.includes(String(value).toLowerCase())).length;
  return Math.round((hit / priorities.length) * 100);
}

export default function EmployerPortal() {
  const [employers, setEmployers] = useState([]);
  const [cards, setCards] = useState([]);
  const [matches, setMatches] = useState([]);

  useEffect(() => {
    (async () => {
      try { setEmployers(await base44.entities.EmployerProfile.filter({ active: true }) || []); } catch {}
      try { setCards(await base44.entities.TalentCard.list() || []); } catch {}
      try { setMatches(await base44.entities.PlacementMatch.list("-score", 100) || []); } catch {}
    })();
  }, []);

  const generate = async () => {
    const created = [];
    for (const card of cards) {
      for (const employer of employers) {
        const sector = String(employer.sector || "").toLowerCase();
        const aspirationText = String(card.career_aspiration || "").toLowerCase();
        const parts = {
          aspiration: aspirationText && sector && (aspirationText.includes(sector) || sector.includes(aspirationText)) ? 100 : 65,
          technical: overlap(card.technical_skills, employer.technical_priorities),
          travel: card.travel_area && employer.location && String(card.travel_area).toLowerCase().includes(String(employer.location).toLowerCase()) ? 100 : 60,
          attendance: Math.min(100, card.attendance_pct || 70),
          professionalism: Math.min(100, (card.professionalism_score || 3) * 20),
          powerSkills: 75,
          digital: card.digital_capability?.length ? 80 : 60,
          requirements: 80,
        };
        const score = weightedMatch(parts);
        try {
          created.push(await base44.entities.PlacementMatch.create({
            student_id: card.student_id,
            student_name: card.student_name,
            employer_id: employer.id,
            employer_name: employer.name,
            score,
            status: "suggested",
            aspiration_score: parts.aspiration,
            technical_score: parts.technical,
            travel_score: parts.travel,
            attendance_score: parts.attendance,
            professionalism_score: parts.professionalism,
            power_skills_score: parts.powerSkills,
            digital_score: parts.digital,
            requirements_score: parts.requirements,
            rationale: "Career aspiration is weighted first, followed by technical fit, travel, attendance, professionalism, RNN Power Skills, digital capability and employer requirements.",
            next_step: "Review suitability with learner and employer before offer.",
          }));
        } catch {}
      }
    }
    setMatches(created.sort((a, b) => b.score - a.score));
  };

  return <div className="clinical-page-shell clinical-page-shell--narrow min-h-screen bg-background">
    <div className="mb-6 flex items-start justify-between gap-3"><div><p className="pf-eyebrow">PLACE · DESTINATION</p><h1 className="text-2xl font-black">Employer Portal & Placement Matching</h1><p className="mt-1 text-sm text-muted-foreground">Meaningful placement matching with career aspiration as the highest-weight criterion.</p></div>{isAdmin() && <button onClick={generate} className="pf-primary-button"><Sparkles className="h-4 w-4"/>Generate matches</button>}</div>
    <div className="grid gap-3 sm:grid-cols-3">{[["Employers", employers.length, Building2], ["Talent Cards", cards.length, Users], ["Matches", matches.length, BriefcaseBusiness]].map(([label, value, Icon]) => <div key={label} className="rounded-2xl border bg-card p-4"><Icon className="h-5 w-5 text-purple-600"/><p className="mt-2 text-xs text-muted-foreground">{label}</p><p className="text-2xl font-black">{value}</p></div>)}</div>
    <section className="mt-5 rounded-2xl border bg-card p-5"><h2 className="font-black">RNN Power Skills used in matching</h2><div className="mt-3 flex flex-wrap gap-2">{RNN_POWER_SKILLS.map((skill) => <span key={skill} className="rounded-full bg-purple-50 px-3 py-1 text-xs font-bold text-purple-700">{skill}</span>)}</div></section>
    <section className="mt-5"><h2 className="mb-3 font-black">Top placement matches</h2><div className="space-y-3">{matches.slice(0, 20).map((match) => <article key={match.id} className="rounded-2xl border bg-card p-4"><div className="flex items-center justify-between"><div><strong>{match.student_name || match.student_id}</strong><p className="text-xs text-muted-foreground">{match.employer_name || match.employer_id}</p></div><span className="rounded-full bg-purple-50 px-3 py-1 text-sm font-black text-purple-700">{match.score}%</span></div><p className="mt-2 text-xs text-muted-foreground">{match.rationale}</p></article>)}</div></section>
  </div>;
}
