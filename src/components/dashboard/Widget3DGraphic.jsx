import { Bed, HeartPulse, ShieldCheck, ClipboardList, Droplet, Activity, Stethoscope, BedDouble } from "lucide-react";

const ICONS = {
  bed: Bed, ward: BedDouble, heart: HeartPulse, shield: ShieldCheck,
  clipboard: ClipboardList, droplet: Droplet, vitals: Activity, steth: Stethoscope,
};

const TONES = {
  blue: "from-sky-200 to-sky-400",
  peach: "from-orange-200 to-rose-300",
  lavender: "from-violet-200 to-violet-300",
  mint: "from-emerald-200 to-teal-300",
  pink: "from-pink-200 to-rose-300",
  amber: "from-amber-200 to-orange-300",
  sky: "from-sky-100 to-sky-300",
};

/**
 * Glossy 3D-styled icon tile — gradient face, specular shine streak,
 * soft cast shadow and a base reflection. Used as the graphic on each widget.
 */
export default function Widget3DGraphic({ type = "bed", tone = "blue", size = "md", className = "" }) {
  const Icon = ICONS[type] || Bed;
  const box = size === "lg" ? "w-16 h-16 rounded-2xl" : size === "sm" ? "w-10 h-10 rounded-xl" : "w-12 h-12 rounded-2xl";
  const ic = size === "lg" ? "w-8 h-8" : size === "sm" ? "w-5 h-5" : "w-6 h-6";
  return (
    <div className={`relative ${box} bg-gradient-to-br ${TONES[tone] || TONES.blue} shadow-[0_10px_22px_-8px_rgba(30,64,120,0.45)] flex items-center justify-center overflow-hidden ${className}`}>
      <div className="absolute inset-0 bg-gradient-to-b from-white/60 via-white/10 to-transparent" />
      <div className="absolute -top-1/3 -left-1/4 w-1/2 h-[140%] bg-white/45 blur-md rotate-12" />
      <Icon className={`relative ${ic} text-white drop-shadow-sm`} strokeWidth={2.2} />
      <div className="absolute bottom-0 inset-x-0 h-1/3 bg-black/10" />
    </div>
  );
}