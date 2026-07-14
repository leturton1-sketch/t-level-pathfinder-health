export default function TLevelLogo({ size = "md", dark = false }) {
  const sizes = {
    sm: { icon: "w-4 h-4", text: "text-sm", badge: "text-[7px] px-1.5 py-0.5" },
    md: { icon: "w-5 h-5", text: "text-lg", badge: "text-[8px] px-2 py-0.5" },
    lg: { icon: "w-7 h-7", text: "text-2xl", badge: "text-[9px] px-2.5 py-1" },
  };
  const s = sizes[size] || sizes.md;
  const textColor = dark ? "text-white" : "text-slate-800";

  return (
    <div className="flex flex-col items-start gap-1">
      <div className="flex items-center gap-1.5">
        <svg viewBox="0 0 24 24" className={`${s.icon} fill-red-600`} xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2 L7 10 L10.5 10 L10.5 22 L13.5 22 L13.5 10 L17 10 Z" />
        </svg>
        <span className={`font-display italic font-bold ${s.text} ${textColor} tracking-wide leading-none`}>
          T-LEVEL ACADEMY
        </span>
      </div>
      <span className={`bg-red-600 text-white ${s.badge} font-bold rounded-sm tracking-wider uppercase leading-none`}>
        Learn Today, Lead Tomorrow
      </span>
    </div>
  );
}