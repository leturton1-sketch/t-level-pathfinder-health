import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Network, Stethoscope, FileText, Heart, User, Activity, Hand, FlaskConical,
  Utensils, Users, ChevronRight, X, ArrowRight, Award,
} from "lucide-react";
import { MDT_ROLES } from "@/lib/learningData";

const ICONS = { Stethoscope, FileText, Heart, User, Activity, Hand, FlaskConical, Utensils, Users, Network };

export default function OrgChartMDT() {
  const [selectedId, setSelectedId] = useState(null);

  const tiers = [1, 2, 3];
  const tierLabels = { 1: "Tier 1 — Senior Leadership", 2: "Tier 2 — Registered Practitioners", 3: "Tier 3 — Allied & Support Roles" };

  const selected = MDT_ROLES.find(r => r.id === selectedId);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-blue-700 rounded-2xl p-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
          <Network className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="font-heading font-bold text-white text-lg">MDT Organisational Chart</h2>
          <p className="text-xs text-blue-100">Explore the Multi-Disciplinary Team: roles, responsibilities, referral criteria, and escalation pathways (CS3 — Team Working).</p>
        </div>
      </div>

      {/* Org chart */}
      <div className="space-y-4">
        {tiers.map(tier => (
          <div key={tier}>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-2 px-1">{tierLabels[tier]}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {MDT_ROLES.filter(r => r.tier === tier).map(role => {
                const Icon = ICONS[role.icon] || User;
                const isSelected = selectedId === role.id;
                return (
                  <motion.button key={role.id} onClick={() => setSelectedId(role.id)}
                    whileHover={{ scale: 1.02 }}
                    className={`text-left rounded-xl border p-3 transition-all ${isSelected ? "border-clinical-teal bg-clinical-teal/5 shadow-md" : "border-slate-200 bg-white hover:border-slate-300"}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${role.color}`}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="font-heading font-bold text-sm text-slate-800">{role.title}</p>
                      </div>
                      <ChevronRight className={`w-4 h-4 transition-colors ${isSelected ? "text-clinical-teal" : "text-slate-300"}`} />
                    </div>
                    <p className="text-[11px] text-slate-500 leading-tight line-clamp-2">{role.description}</p>
                  </motion.button>
                );
              })}
            </div>
            {tier < 3 && <div className="flex justify-center py-1"><ArrowRight className="w-4 h-4 text-slate-300 rotate-90" /></div>}
          </div>
        ))}
      </div>

      {/* Detail panel */}
      <AnimatePresence>
        {selected && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}>
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              <div className={`${selected.color} px-4 py-3 flex items-center justify-between`}>
                <div className="flex items-center gap-2">
                  {(() => { const Icon = ICONS[selected.icon] || User; return <Icon className="w-5 h-5 text-white" />; })()}
                  <h3 className="font-heading font-bold text-white">{selected.title}</h3>
                </div>
                <button onClick={() => setSelectedId(null)} className="text-white/80 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-4 space-y-3">
                <p className="text-sm text-slate-700 leading-relaxed">{selected.description}</p>

                <div>
                  <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Key Responsibilities</p>
                  <ul className="space-y-1">
                    {selected.responsibilities.map((r, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-slate-600">
                        <span className="w-1 h-1 rounded-full bg-clinical-teal mt-1.5 shrink-0" />
                        {r}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-xl border border-blue-200 bg-blue-50 p-3">
                  <p className="text-[10px] font-semibold text-blue-600 uppercase tracking-wide mb-1">When to Refer</p>
                  <p className="text-xs text-slate-700 leading-relaxed">{selected.referralCriteria}</p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-1">Escalation Pathway</p>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {selected.escalation.split(" → ").map((step, i, arr) => (
                      <span key={i} className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold text-slate-700">{step}</span>
                        {i < arr.length - 1 && <ArrowRight className="w-3 h-3 text-slate-400" />}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-start gap-2 text-[11px] text-slate-500 bg-clinical-teal/5 border border-clinical-teal/20 rounded-lg p-2.5">
                  <Award className="w-3.5 h-3.5 text-clinical-teal shrink-0 mt-0.5" />
                  <span><strong>CS3 — Team Working:</strong> Understanding MDT boundaries and escalation pathways ensures coordinated, person-centred care.</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}