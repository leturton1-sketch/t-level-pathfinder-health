import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { getCurrentUser } from "@/lib/clinicalAuth";
import { RNN_POWER_SKILLS } from "@/lib/pathfinderOperatingModel";
import { BadgeCheck, BriefcaseMedical, MapPin, Clock3 } from "lucide-react";

export default function TalentCardPage() {
  const user = getCurrentUser();
  const [card, setCard] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const rows = await base44.entities.TalentCard.filter({ student_id: user?.id }, "-updated_date", 1);
        if (rows?.[0]) setCard(rows[0]);
        else if (user?.role === "student") {
          const created = await base44.entities.TalentCard.create({
            student_id: user.id,
            student_name: user.full_name,
            career_aspiration: "",
            attendance_pct: 0,
            professionalism_score: 0,
            technical_skills: [],
            digital_capability: [],
            power_skills: {},
            certifications: [],
            placement_hours: 0,
            profile_visibility: "placement_only",
            verified: false,
          });
          setCard(created);
        }
      } catch {}
      finally { setLoading(false); }
    })();
  }, [user?.id]);

  if (loading) return <div className="clinical-page-shell">Loading Talent Card…</div>;
  if (!card) return <div className="clinical-page-shell"><h1 className="text-xl font-black">Talent Card</h1><p className="mt-2 text-sm text-muted-foreground">No Talent Card has been issued for this account yet.</p></div>;

  return <div className="clinical-page-shell clinical-page-shell--narrow min-h-screen bg-background">
    <article className="overflow-hidden rounded-[28px] border bg-card shadow-sm">
      <div className="bg-gradient-to-r from-purple-700 to-violet-500 p-6 text-white"><p className="text-xs font-black tracking-[.18em]">PATHFINDER TALENT CARD</p><div className="mt-3 flex items-end justify-between gap-4"><div><h1 className="text-3xl font-black">{card.student_name}</h1><p className="mt-1 text-sm opacity-90">{card.career_aspiration || "Career aspiration to be confirmed"}</p></div>{card.verified && <BadgeCheck className="h-8 w-8"/>}</div></div>
      <div className="grid gap-4 p-6 sm:grid-cols-3"><div><p className="text-xs text-muted-foreground">Attendance</p><p className="text-2xl font-black">{card.attendance_pct || 0}%</p></div><div><p className="text-xs text-muted-foreground">Placement hours</p><p className="text-2xl font-black">{card.placement_hours || 0}</p></div><div><p className="text-xs text-muted-foreground">Professionalism</p><p className="text-2xl font-black">{card.professionalism_score || 0}/5</p></div></div>
      <div className="border-t p-6"><h2 className="font-black">RNN Power Skills</h2><div className="mt-3 grid gap-2 sm:grid-cols-2">{RNN_POWER_SKILLS.map((skill) => <div key={skill} className="flex items-center justify-between rounded-xl border px-3 py-2 text-sm"><span>{skill}</span><strong>{card.power_skills?.[skill] || "—"}</strong></div>)}</div></div>
      <div className="grid gap-4 border-t p-6 sm:grid-cols-2"><section><h2 className="font-black"><BriefcaseMedical className="mr-2 inline h-4 w-4"/>Technical skills</h2><p className="mt-2 text-sm text-muted-foreground">{card.technical_skills?.join(" · ") || "No verified skills added yet."}</p></section><section><h2 className="font-black"><MapPin className="mr-2 inline h-4 w-4"/>Placement profile</h2><p className="mt-2 text-sm text-muted-foreground">{card.travel_area || "Travel area not recorded"}</p><p className="mt-2 text-sm text-muted-foreground"><Clock3 className="mr-1 inline h-4 w-4"/>{card.placement_experience || "Placement experience will appear here."}</p></section></div>
    </article>
  </div>;
}
