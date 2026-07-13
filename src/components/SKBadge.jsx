import { SK_CODES, PERFORMANCE_OUTCOMES } from "@/lib/specData";

export function SKBadge({ code }) {
  const desc = SK_CODES[code];
  if (!desc) return null;
  return (
    <span
      title={desc}
      className="inline-flex items-center rounded-md bg-clinical-teal/15 border border-clinical-teal/30 px-2 py-0.5 text-xs font-semibold text-clinical-teal cursor-help"
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
      className="inline-flex items-center rounded-md bg-purple-500/15 border border-purple-500/30 px-2 py-0.5 text-xs font-semibold text-purple-300 cursor-help"
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