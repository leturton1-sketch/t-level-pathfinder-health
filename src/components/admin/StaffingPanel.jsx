import { useEffect, useState } from "react";
import { UsersRound, UserPlus, X } from "lucide-react";
import { getStaffing, subscribeStaffing, assignStaff, removeStaff, getSimulationState, subscribeSimulationState } from "@/lib/simulationState";

const DUTY_ROLES = ["Staff Nurse", "Healthcare Assistant", "Ward Manager", "Doctor", "Student Nurse"];

/** Tutor-facing panel for assigning who is on duty in the ward for the current/next simulation. */
export default function StaffingPanel({ users }) {
  const [staffing, setStaffing] = useState(getStaffing);
  const [simState, setSimState] = useState(getSimulationState);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [dutyRole, setDutyRole] = useState(DUTY_ROLES[0]);

  useEffect(() => subscribeStaffing(setStaffing), []);
  useEffect(() => subscribeSimulationState(setSimState), []);

  const assignable = users.filter((u) => u.role === "student" || u.role === "tutor");
  const alreadyAssignedIds = new Set(staffing.map((s) => s.userId).filter(Boolean));
  const available = assignable.filter((u) => !alreadyAssignedIds.has(u.id));

  const handleAssign = () => {
    const u = assignable.find((x) => x.id === selectedUserId);
    if (!u) return;
    assignStaff({ userId: u.id, name: u.full_name, dutyRole, status: "Available" });
    setSelectedUserId("");
  };

  return (
    <section className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-start gap-3 mb-4">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-clinical-teal/15 text-clinical-teal">
          <UsersRound className="h-5 w-5" />
        </span>
        <div>
          <h2 className="text-base font-bold text-foreground">Ward Staffing</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Assign who is on duty before a simulation starts. The ward stays empty until staff are assigned here.
            {simState.running && " A simulation is currently running — changes apply immediately."}
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <select
          value={selectedUserId}
          onChange={(e) => setSelectedUserId(e.target.value)}
          className="flex-1 bg-muted border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-clinical-teal"
        >
          <option value="">Select a person…</option>
          {available.map((u) => (
            <option key={u.id} value={u.id}>{u.full_name} ({ROLE_LABEL(u.role)})</option>
          ))}
        </select>
        <select
          value={dutyRole}
          onChange={(e) => setDutyRole(e.target.value)}
          className="bg-muted border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-clinical-teal"
        >
          {DUTY_ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
        <button
          type="button"
          onClick={handleAssign}
          disabled={!selectedUserId}
          className="flex items-center justify-center gap-1.5 rounded-lg bg-clinical-teal text-white px-4 py-2.5 text-sm font-semibold hover:opacity-90 disabled:opacity-40"
        >
          <UserPlus className="w-4 h-4" /> Assign
        </button>
      </div>

      {staffing.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4 text-center">No staff assigned to this shift yet.</p>
      ) : (
        <ul className="space-y-2">
          {staffing.map((s) => (
            <li key={s.id} className="flex items-center gap-3 rounded-xl border border-border bg-muted/40 p-3">
              <div className="w-9 h-9 rounded-full bg-clinical-teal/15 text-clinical-teal flex items-center justify-center text-xs font-bold">
                {s.name?.slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{s.name}</p>
                <p className="text-xs text-muted-foreground">{s.dutyRole} · {s.status}</p>
              </div>
              <button
                type="button"
                onClick={() => removeStaff(s.id)}
                className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-clinical-red transition-colors"
                title="Remove from shift"
              >
                <X className="w-4 h-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function ROLE_LABEL(role) {
  return role === "tutor" ? "Lecturer" : "Student";
}
