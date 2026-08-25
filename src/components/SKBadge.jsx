import { SK_CODES, PERFORMANCE_OUTCOMES } from "@/lib/specData";

export function SKBadge({ code }) {
  const desc = SK_CODES[code];
  if (!desc) return null;
  return (
    <span
      title={desc}
      className="inline-flex items-center rounded-md bg-tl-purple/15 border border-tl-purple/30 px-2 py-0.5 text-xs font-semibold text-tl-purple cursor-help"
    >
      {code}
    </span>
  );
}

export function POBadge({ code }) {
  const desc = PERFORMANCE_OUTCOMES[code];
  if (!desc) return null;
  return (
    <span
      title={desc}
      className="inline-flex items-center rounded-md bg-violet-100 border border-violet-300 px-2 py-0.5 text-xs font-semibold text-violet-800 cursor-help"
    >
      {code}
    </span>
  );
}

export function SKBadgeGroup({ skCodes = [], poCodes = [] }) {
  return (
    <div className="flex flex-wrap gap-1">
      {skCodes.map((c) => <SKBadge key={c} code={c} />)}
      {poCodes.map((c) => <POBadge key={c} code={c} />)}
    </div>
  );
}