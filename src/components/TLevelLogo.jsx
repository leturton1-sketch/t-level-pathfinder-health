/**
 * TLevelLogo — official artwork recoloured through a single Pathfinder blue
 * treatment so every route uses the same navy/cyan identity.
 */
const NAVY_LOGO = "https://media.base44.com/images/public/6a4759cc86fe95039e31fd09/8acde0e8c_TLevel-Logo-BlackWithStrapline.png";

const LOGOS = {
  blue: NAVY_LOGO,
  navy: NAVY_LOGO,
  black: NAVY_LOGO,
  white: "https://media.base44.com/images/public/6a4759cc86fe95039e31fd09/4852697b2_TLevel-Logo-White.png",
  whiteStrapline: "https://media.base44.com/images/public/6a4759cc86fe95039e31fd09/e326bdc6f_TLevel-Logo-WhiteWithStrapline.png",
  red: "https://media.base44.com/images/public/6a4759cc86fe95039e31fd09/2919fffdc_TLevel-Logo-RedWithStrapline.png",
  emblem: "/branding/tlevel-industry-academy-silver.svg",
};

const SIZE_MAP = {
  xs: "h-6",
  sm: "h-8",
  md: "h-10",
  lg: "h-14",
  xl: "h-20",
};

export default function TLevelLogo({ size = "md", variant = "blue", dark = false, className = "" }) {
  const selected = dark ? "white" : variant;
  const src = LOGOS[selected] || LOGOS.blue;
  const h = SIZE_MAP[size] || SIZE_MAP.md;
  const isEmblem = selected === "emblem";
  const brandClass = !dark && !isEmblem && selected !== "white" && selected !== "whiteStrapline" && selected !== "red"
    ? "tlevel-logo--blue"
    : isEmblem ? "tlevel-emblem" : "";
  return (
    <img
      src={src}
      alt={isEmblem ? "T Level Industry Academy" : "T Levels"}
      className={`${h} w-auto object-contain ${brandClass} ${className}`}
      draggable={false}
    />
  );
}
