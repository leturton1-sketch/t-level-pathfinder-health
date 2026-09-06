import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { isLoggedIn, getCurrentUser, isAdmin, isSuperAdmin, resetPin } from "@/lib/clinicalAuth";
import { Users, UserPlus, RotateCcw, Trash2, Search, Shield, X, Settings2, Volume2, Download, Waves, ShieldCheck, Activity, KeyRound, AlertTriangle, RefreshCw } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useVoiceSynthesis } from "@/hooks/useVoiceSynthesis";
import VoiceSettings from "@/components/voice/VoiceSettings";
import AppInstallerPanel from "@/components/admin/AppInstallerPanel";

const ROLE_LABELS = {
  super_admin: "System Architect",
  admin: "Admin",
  tutor: "Lecturer",
  student: "Student",
  guest: "Guest",
};

const ROLE_COLORS = {
  super_admin: "bg-purple-500/15 text-purple-600 border-purple-500/30",
  admin: "bg-clinical-teal/15 text-clinical-teal border-clinical-teal/30",
  tutor: "bg-clinical-green/15 text-clinical-green border-clinical-green/30",
  student: "bg-muted text-muted-foreground border-border",
  guest: "bg-muted text-muted-foreground border-border",
};

export default function UserManagement() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const voiceSynth = useVoiceSynthesis();
  const user = getCurrentUser();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [activeTab, setActiveTab] = useState("users");
  const [voiceSettingsOpen, setVoiceSettingsOpen] = useState(false);
  const [diagnostics, setDiagnostics] = useState({ users: [], events: [] });
  const [diagnosticsLoading, setDiagnosticsLoading] = useState(false);
  const [securityFilter, setSecurityFilter] = useState("");
  const [newUser, setNewUser] = useState({ username: "", full_name: "", role: "student", title: "", pin: "0000", cohort: "" });

  useEffect(() => {
    if (!isLoggedIn() || !canManageUsers()) {
      navigate("/");
      return;
    }
    loadUsers();
  }, [navigate]);

  const canManageUsers = () => {
    const u = getCurrentUser();
    return ["super_admin", "admin", "tutor"].includes(u?.role);
  };

  const loadUsers = async () => {
    setLoading(true);
    try {
      const response = await base44.functions.invoke("listAppUsers");
      const data = response?.data ?? response;
      if (data?.error) throw new Error(data.error);
      setUsers(data?.users || []);
    } catch {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const loadDiagnostics = async () => {
    setDiagnosticsLoading(true);
    try {
      const response = await base44.functions.invoke("getAuthDiagnostics", { limit: 150 });
      const data = response?.data ?? response;
      if (data?.error) throw new Error(data.error);
      setDiagnostics({ users: data?.users || [], events: data?.events || [] });
    } catch (error) {
      toast({ title: "Diagnostics unavailable", description: error?.message || "Unable to load authentication diagnostics.", variant: "destructive" });
    } finally {
      setDiagnosticsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "security") loadDiagnostics();
  }, [activeTab]);

  const handleCreate = async () => {
    if (!newUser.username.trim() || !newUser.full_name.trim()) return;
    const pin = isSuperAdmin() ? newUser.pin.trim() : "0000";
    if (!/^\d{4}$/.test(pin)) {
      alert("PIN must be exactly 4 digits.");
      return;
    }
    try {
      await base44.functions.invoke("createAppUser", {
        username: newUser.username.toLowerCase().trim(),
        pin,
        role: newUser.role,
        full_name: newUser.full_name,
        title: newUser.title.trim() || undefined,
        cohort: newUser.cohort,
        first_login: true,
        active: true,
        ai_voice: "honey",
        ai_persona: "female",
      });
      setNewUser({ username: "", full_name: "", role: "student", title: "", pin: "0000", cohort: "" });
      setShowCreate(false);
      loadUsers();
    } catch (err) {
      alert("Failed to create user. The username may already exist.");
    }
  };

  const handleResetPin = async (targetUser) => {
    if (!confirm(`Reset PIN for ${targetUser.full_name}? The PIN will be set to 0000.`)) return;
    try {
      await resetPin(targetUser.id);
      loadUsers();
    } catch {
      alert("Failed to reset PIN.");
    }
  };

  const handleResetVoice = async (targetUser) => {
    if (!confirm(`Reset spoken recovery for ${targetUser.full_name}? They will need to enrol it again.`)) return;
    try {
      const response = await base44.functions.invoke("resetSpokenRecovery", { user_id: targetUser.id });
      const data = response?.data ?? response;
      if (data?.error) throw new Error(data.error);
      toast({ title: "Voice recovery reset", description: `${targetUser.full_name} will be prompted to enrol again.` });
      await Promise.all([loadUsers(), loadDiagnostics()]);
    } catch (error) {
      toast({ title: "Reset failed", description: error?.message || "Unable to reset spoken recovery.", variant: "destructive" });
    }
  };

  const handleDelete = async (targetUser) => {
    if (targetUser.is_protected || targetUser.role === "super_admin") {
      alert("This account is protected and cannot be deleted.");
      return;
    }
    if (targetUser.role === "admin" && !isSuperAdmin()) {
      alert("Only the System Architect can delete Admin accounts.");
      return;
    }
    if (!confirm(`Delete ${targetUser.full_name}? This cannot be undone.`)) return;
    try {
      await base44.entities.AppUser.delete(targetUser.id);
      loadUsers();
    } catch {
      alert("Failed to delete user.");
    }
  };

  const canDelete = (targetUser) => {
    if (targetUser.is_protected || targetUser.role === "super_admin") return false;
    if (targetUser.role === "admin") return isSuperAdmin();
    return true;
  };

  const filtered = users.filter((u) =>
    u.username?.toLowerCase().includes(search.toLowerCase()) ||
    u.full_name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="clinical-page-shell clinical-page-shell--narrow min-h-screen bg-background">
      <div className="mb-4">
        <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
          <Users className="w-5 h-5 text-clinical-teal" />
          User Management
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {isSuperAdmin() ? "Full system access — manage all accounts" : isAdmin() ? "Institution-level user management" : "Cohort-level student management"}
        </p>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-2 rounded-2xl border border-white/90 bg-white/75 p-1.5 shadow-[0_14px_35px_-24px_rgba(118,90,176,.35),inset_1px_1px_1px_white] backdrop-blur-xl sm:grid-cols-4" role="tablist" aria-label="User management sections">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "users"}
          onClick={() => setActiveTab("users")}
          className={`flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${activeTab === "users" ? "bg-white text-clinical-teal shadow-md" : "text-slate-600 hover:bg-white/60"}`}
        >
          <Users className="h-4 w-4" /> Users
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "security"}
          onClick={() => setActiveTab("security")}
          className={`flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${activeTab === "security" ? "bg-white text-fuchsia-700 shadow-md" : "text-slate-600 hover:bg-white/60"}`}
        >
          <ShieldCheck className="h-4 w-4" /> Security & Access
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "voice"}
          onClick={() => setActiveTab("voice")}
          className={`flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${activeTab === "voice" ? "bg-white text-clinical-teal shadow-md" : "text-slate-600 hover:bg-white/60"}`}
        >
          <Volume2 className="h-4 w-4" /> Voice Configuration
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "installer"}
          onClick={() => setActiveTab("installer")}
          className={`flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${activeTab === "installer" ? "bg-white text-clinical-teal shadow-md" : "text-slate-600 hover:bg-white/60"}`}
        >
          <Download className="h-4 w-4" /> Install App
        </button>
      </div>

      <div className={activeTab === "users" ? "block" : "hidden"}>
      {/* Search + Create */}
      <div className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search users…"
            className="w-full bg-muted border border-border rounded-lg pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-clinical-teal"
          />
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-1.5 rounded-lg bg-clinical-teal text-white px-4 py-2.5 text-sm font-semibold hover:opacity-90"
        >
          <UserPlus className="w-4 h-4" /> Add
        </button>
      </div>

      {/* User list */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-clinical-teal/30 border-t-clinical-teal rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((u) => (
            <div
              key={u.id}
              className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 animate-fade-in"
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                u.role === "super_admin" ? "bg-purple-500/20 text-purple-600" :
                u.role === "admin" ? "bg-clinical-teal/20 text-clinical-teal" :
                u.role === "tutor" ? "bg-clinical-green/20 text-clinical-green" :
                "bg-muted text-muted-foreground"
              }`}>
                {u.full_name?.charAt(0)?.toUpperCase() || "U"}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm text-foreground truncate">{u.full_name}</span>
                  {u.is_protected && <Shield className="w-3.5 h-3.5 text-purple-600 shrink-0" />}
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>@{u.username}</span>
                  {u.cohort && <span>· {u.cohort}</span>}
                  {u.first_login && <span className="text-clinical-amber">· PIN reset needed</span>}
                  <span className={`inline-flex items-center gap-1 ${u.voice_recovery_enrolled ? "text-emerald-600" : "text-amber-600"}`}>
                    <Waves className="h-3 w-3" />
                    {u.voice_recovery_enrolled ? "Voice recovery ready" : "Voice setup required"}
                  </span>
                </div>
              </div>
              <span className={`text-[10px] font-semibold rounded-md border px-2 py-0.5 shrink-0 ${ROLE_COLORS[u.role]}`}>
                {u.title || ROLE_LABELS[u.role]}
              </span>
              <div className="flex gap-1">
                <button
                  onClick={() => handleResetPin(u)}
                  className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-clinical-amber transition-colors"
                  title="Reset PIN to 0000"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
                {canDelete(u) && (
                  <button
                    onClick={() => handleDelete(u)}
                    className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-clinical-red transition-colors"
                    title="Delete user"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <p className="text-center text-sm text-muted-foreground py-8">No users found.</p>
          )}
        </div>
      )}
      </div>

      {activeTab === "security" && (
        <section className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["Active users", diagnostics.users.filter((u) => u.active).length, Users, "from-rose-500 to-fuchsia-600"],
              ["Successful logins", diagnostics.events.filter((e) => e.result === "success").length, ShieldCheck, "from-fuchsia-600 to-violet-700"],
              ["Denied attempts", diagnostics.events.filter((e) => e.result === "denied").length, AlertTriangle, "from-rose-500 to-red-600"],
              ["Voice enrolled", diagnostics.users.filter((u) => u.voice_recovery_enrolled).length, Waves, "from-violet-500 to-purple-700"],
            ].map(([label, value, Icon, gradient]) => (
              <div key={label} className="rounded-2xl border border-white/90 bg-white/85 p-4 shadow-[0_16px_36px_-28px_rgba(118,90,176,.45)]">
                <div className={`mb-3 grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br ${gradient} text-white shadow-md`}><Icon className="h-5 w-5" /></div>
                <p className="text-2xl font-black text-slate-900">{value}</p>
                <p className="text-xs font-semibold text-slate-500">{label}</p>
              </div>
            ))}
          </div>

          <div className="rounded-[28px] border border-white/90 bg-white/80 p-5 shadow-[0_24px_55px_-34px_rgba(118,90,176,.45)] backdrop-blur-xl">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[.18em] text-rose-500">Authentication Diagnostics</p>
                <h2 className="text-lg font-black text-slate-900">Security & Access</h2>
                <p className="text-xs text-slate-500">Actual PIN, QR and voice recovery events from Pathfinder authentication.</p>
              </div>
              <button type="button" onClick={loadDiagnostics} disabled={diagnosticsLoading} className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-rose-500 via-fuchsia-600 to-violet-700 px-4 py-2.5 text-sm font-bold text-white shadow-md disabled:opacity-50">
                <RefreshCw className={`h-4 w-4 ${diagnosticsLoading ? "animate-spin" : ""}`} /> Refresh diagnostics
              </button>
            </div>

            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input value={securityFilter} onChange={(e) => setSecurityFilter(e.target.value)} placeholder="Filter by user…" className="w-full rounded-xl border border-fuchsia-100 bg-white py-2.5 pl-10 pr-3 text-sm outline-none focus:border-fuchsia-400 focus:ring-2 focus:ring-fuchsia-100" />
            </div>

            <div className="overflow-x-auto rounded-2xl border border-fuchsia-100">
              <table className="w-full min-w-[760px] text-left text-xs">
                <thead className="bg-gradient-to-r from-rose-50 via-white to-violet-50 text-slate-600">
                  <tr>
                    <th className="px-3 py-3">User</th><th className="px-3 py-3">Role</th><th className="px-3 py-3">PIN</th><th className="px-3 py-3">Voice recovery</th><th className="px-3 py-3">Success</th><th className="px-3 py-3">Denied</th><th className="px-3 py-3">Last method</th><th className="px-3 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {diagnostics.users.filter((u) => !securityFilter || u.username?.includes(securityFilter.toLowerCase()) || u.full_name?.toLowerCase().includes(securityFilter.toLowerCase())).map((u) => {
                    const target = users.find((item) => item.username === u.username);
                    return (
                      <tr key={u.username} className="border-t border-fuchsia-50 bg-white/80">
                        <td className="px-3 py-3"><p className="font-bold text-slate-900">{u.full_name}</p><p className="text-slate-500">@{u.username}</p></td>
                        <td className="px-3 py-3 capitalize text-slate-600">{String(u.role || "").replaceAll("_", " ")}</td>
                        <td className="px-3 py-3"><span className={`rounded-full px-2 py-1 font-bold ${u.first_login ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"}`}>{u.first_login ? "Reset required" : "Ready"}</span></td>
                        <td className="px-3 py-3"><span className={`rounded-full px-2 py-1 font-bold ${u.voice_recovery_enrolled ? "bg-violet-50 text-violet-700" : "bg-rose-50 text-rose-700"}`}>{u.voice_recovery_enrolled ? "Enrolled" : "Not enrolled"}</span></td>
                        <td className="px-3 py-3 font-bold text-emerald-700">{u.successes}</td>
                        <td className="px-3 py-3 font-bold text-rose-700">{u.denials}</td>
                        <td className="px-3 py-3 uppercase text-slate-500">{u.last_method || "—"}</td>
                        <td className="px-3 py-3"><div className="flex gap-2">{target && <><button onClick={() => handleResetPin(target)} className="rounded-lg border border-fuchsia-100 bg-white p-2 text-fuchsia-700 hover:bg-fuchsia-50" title="Reset PIN"><KeyRound className="h-4 w-4" /></button><button onClick={() => handleResetVoice(target)} className="rounded-lg border border-violet-100 bg-white p-2 text-violet-700 hover:bg-violet-50" title="Reset voice recovery"><Waves className="h-4 w-4" /></button></>}</div></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-[28px] border border-white/90 bg-white/80 p-5 shadow-[0_24px_55px_-34px_rgba(118,90,176,.45)] backdrop-blur-xl">
            <div className="mb-3 flex items-center gap-2"><Activity className="h-5 w-5 text-fuchsia-700" /><h3 className="font-black text-slate-900">Recent authentication events</h3></div>
            <div className="max-h-80 overflow-auto rounded-2xl border border-fuchsia-100">
              {diagnostics.events.slice(0, 50).map((event) => (
                <div key={event.id || `${event.username}-${event.created_date}`} className="grid gap-1 border-b border-fuchsia-50 bg-white/85 px-4 py-3 text-xs sm:grid-cols-[1fr_90px_90px_2fr_150px] sm:items-center">
                  <span className="font-bold text-slate-900">@{event.username}</span>
                  <span className="uppercase text-slate-500">{event.method}</span>
                  <span className={`font-black uppercase ${event.result === "success" ? "text-emerald-600" : event.result === "denied" ? "text-rose-600" : "text-amber-600"}`}>{event.result}</span>
                  <span className="text-slate-600">{event.reason || "—"}</span>
                  <span className="text-slate-400">{event.created_date ? new Date(event.created_date).toLocaleString("en-GB") : "—"}</span>
                </div>
              ))}
              {!diagnosticsLoading && diagnostics.events.length === 0 && <p className="p-6 text-center text-sm text-slate-500">No authentication events recorded yet.</p>}
            </div>
          </div>
        </section>
      )}

      {activeTab === "voice" && (
        <section className="polished-glass-edge overflow-hidden rounded-[28px] border border-white/90 bg-white/70 shadow-[0_20px_55px_-34px_rgba(15,23,42,.65),inset_1px_1px_2px_white] backdrop-blur-2xl">
          <div className="border-b border-slate-200/70 bg-gradient-to-r from-cyan-50/80 via-white/70 to-purple-50/70 p-6">
            <div className="flex items-start gap-3">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-cyan-400 to-teal-700 text-white shadow-[0_9px_18px_-10px_rgba(8,145,178,.9),inset_1px_1px_1px_rgba(255,255,255,.7)]">
                <Volume2 className="h-6 w-6" />
              </span>
              <div>
                <h2 className="text-base font-bold text-slate-900">Voice Configuration</h2>
                <p className="mt-1 text-sm leading-5 text-slate-600">
                  Manage the application’s speech engine, voice model, system voice, pitch, speed, stability and volume from this single location.
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-3 p-6 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm">
              <p className="text-[10px] font-bold uppercase tracking-[.16em] text-slate-500">Current engine</p>
              <p className="mt-1 text-sm font-bold capitalize text-slate-900">{voiceSynth.prefs.engine === "cloud" ? "Cloud HD" : "Browser"}</p>
              <p className="mt-1 text-xs text-slate-500">Profile: {voiceSynth.prefs.profileId}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm">
              <p className="text-[10px] font-bold uppercase tracking-[.16em] text-slate-500">Speech tuning</p>
              <p className="mt-1 text-sm font-bold text-slate-900">
                {Number(voiceSynth.prefs.rate).toFixed(2)}× speed · {Number(voiceSynth.prefs.pitch).toFixed(2)}× pitch
              </p>
              <p className="mt-1 text-xs text-slate-500">{Math.round(voiceSynth.prefs.volume * 100)}% volume</p>
            </div>
          </div>

          <div className="flex flex-col gap-3 border-t border-slate-200/70 bg-slate-50/70 p-6 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-slate-600">Settings are saved for the current signed-in user and used by voice-enabled areas across Clinical Edge.</p>
            <button
              type="button"
              onClick={() => setVoiceSettingsOpen(true)}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-clinical-teal px-4 py-2.5 text-sm font-semibold text-white shadow-md transition hover:-translate-y-0.5 hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              <Settings2 className="h-4 w-4" /> Configure Voice
            </button>
          </div>
        </section>
      )}

      {activeTab === "installer" && (
        <AppInstallerPanel />
      )}

      <VoiceSettings
        open={voiceSettingsOpen}
        onClose={() => setVoiceSettingsOpen(false)}
        synth={voiceSynth}
        onSaved={() => {
          toast({ title: "Voice settings saved", description: "The voice configuration has been updated." });
          setTimeout(() => voiceSynth.speak("Voice settings saved. Your voice is ready."), 80);
        }}
      />

      {/* Create user modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in" onClick={() => setShowCreate(false)}>
          <div className="w-full sm:max-w-sm bg-card rounded-t-2xl sm:rounded-2xl border border-border p-4 animate-slide-up" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-foreground">Create New User</h2>
              <button type="button" onClick={() => setShowCreate(false)} aria-label="Close create user window" className="p-1 rounded-lg hover:bg-muted">
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Full Name</label>
                <input
                  type="text"
                  value={newUser.full_name}
                  onChange={(e) => setNewUser({ ...newUser, full_name: e.target.value })}
                  placeholder="e.g., Jane Smith"
                  className="w-full bg-muted border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-clinical-teal"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Username</label>
                <input
                  type="text"
                  value={newUser.username}
                  onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                  placeholder="e.g., jsmith"
                  className="w-full bg-muted border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-clinical-teal"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Role</label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                  className="w-full bg-muted border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-clinical-teal"
                >
                  <option value="student">Student</option>
                  {isAdmin() && <option value="tutor">Lecturer</option>}
                  {isSuperAdmin() && <option value="admin">Admin</option>}
                  {isSuperAdmin() && <option value="super_admin">System Architect</option>}
                </select>
              </div>
              {isSuperAdmin() && (
                <>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Custom title (optional)</label>
                    <input
                      type="text"
                      value={newUser.title}
                      onChange={(e) => setNewUser({ ...newUser, title: e.target.value })}
                      placeholder="e.g., System Architect"
                      className="w-full bg-muted border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-clinical-teal"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Initial PIN</label>
                    <input
                      type="password"
                      inputMode="numeric"
                      maxLength={4}
                      value={newUser.pin}
                      onChange={(e) => setNewUser({ ...newUser, pin: e.target.value.replace(/\D/g, "").slice(0, 4) })}
                      className="w-full bg-muted border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-clinical-teal"
                    />
                  </div>
                </>
              )}
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Cohort (optional)</label>
                <input
                  type="text"
                  value={newUser.cohort}
                  onChange={(e) => setNewUser({ ...newUser, cohort: e.target.value })}
                  placeholder="e.g., 2026 Cohort A"
                  className="w-full bg-muted border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-clinical-teal"
                />
              </div>
              <div className="rounded-lg bg-muted p-2 text-xs text-muted-foreground">
                PIN will be set to <span className="font-bold text-foreground">{isSuperAdmin() ? newUser.pin || "0000" : "0000"}</span> — user will be prompted to change on first login.
              </div>
              <button
                onClick={handleCreate}
                disabled={!newUser.username.trim() || !newUser.full_name.trim()}
                className="w-full py-3 rounded-lg bg-clinical-teal text-white font-semibold text-sm disabled:opacity-40 hover:opacity-90"
              >
                Create User
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}