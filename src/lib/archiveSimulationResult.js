import { base44 } from "@/api/base44Client";

export async function archiveSimulationResult(record) {
  if (!record?.id) return { ok: false, error: "Simulation result was not saved" };
  try {
    const response = await base44.functions.invoke("archiveSimulationReport", { record_id: record.id });
    const result = response?.data ?? response;
    if (result?.error) throw new Error(result.error);
    return result;
  } catch (error) {
    // The entity result remains saved even if Drive is temporarily unavailable.
    console.warn("Simulation report Drive archive pending:", error?.message || error);
    return { ok: false, error: error?.message || "Drive archive unavailable" };
  }
}
