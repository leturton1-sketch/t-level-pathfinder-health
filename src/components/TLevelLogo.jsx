/**
 * TLevelLogo — uses official T Level uploaded assets.
 * variant: "black" (default for light screens), "salmon", "red", "white"
 * dark: true forces white version on dark backgrounds
 */
const LOGOS = {
  white: "https://media.base44.com/images/public/6a4759cc86fe95039e31fd09/4852697b2_TLevel-Logo-White.png",
  whiteStrapline: "https://media.base44.com/images/public/6a4759cc86fe95039e31fd09/e326bdc6f_TLevel-Logo-WhiteWithStrapline.png",
  salmon: "https://media.base44.com/images/public/6a4759cc86fe95039e31fd09/8fa0bc1b2_TLevel-Logo-SalmonWithStrapline.png",
  salmonNoStrap: "https://media.base44.com/images/public/6a4759cc86fe95039e31fd09/2b3a2d224_TLevel-Logo-Strapline.png",
  red: "https://media.base44.com/images/public/6a4759cc86fe95039e31fd09/2919fffdc_TLevel-Logo-RedWithStrapline.png",
  redNoStrap: "https://media.base44.com/images/public/6a4759cc86fe95039e31fd09/9a14e3242_TLevel-Logo-Red.png",
  black: "https://media.base44.com/images/public/6a4759cc86fe95039e31fd09/8acde0e8c_TLevel-Logo-BlackWithStrapline.png",
};

const SIZE_MAP = {
  xs: "h-6",
  sm: "h-8",
  md: "h-10",
  lg: "h-14",
  xl: "h-20",
};

export default function TLevelLogo({ size = "md", variant = "black", dark = false, className = "" }) {
  const src = dark ? LOGOS.white : LOGOS[variant] || LOGOS.black;
  const h = SIZE_MAP[size] || SIZE_MAP.md;
  return (
    <img
      src={src}
      alt="T Levels"
      className={`${h} w-auto object-contain ${className}`}
      draggable={false}
    />
  );
}