const EMBLEM_SRC = "/branding/t-level-emblem.jpg";

const SIZE_MAP = {
  xs: "h-6",
  sm: "h-8",
  md: "h-10",
  lg: "h-14",
  xl: "h-20",
};

export default function TLevelLogo({ size = "md", className = "" }) {
  const h = SIZE_MAP[size] || SIZE_MAP.md;
  return (
    <img
      src={EMBLEM_SRC}
      alt="T-Level Industry Academy emblem"
      className={`${h} w-auto object-contain ${className}`}
      draggable={false}
    />
  );
}