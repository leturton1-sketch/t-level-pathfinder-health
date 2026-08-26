import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { isLoggedIn, getCurrentUser, isAdmin, isSuperAdmin, resetPin } from "@/lib/clinicalAuth";
import { Users, UserPlus, RotateCcw, Trash2, Search, Shield, X, Settings2, Volume2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useVoiceSynthesis } from "@/hooks/useVoiceSynthesis";
import VoiceSettings from "@/components/voice/VoiceSettings";

const ROLE_LABELS = {
  super_admin: "Super Admin",
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
  const [newUser, setNewUser] = useState({ username: "", full_name: "", role: "student", cohort: "" });

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
      const allUsers = await base44.entities.AppUser.list();
      setUsers(allUsers);
    } catch {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!newUser.username.trim() || !newUser.full_name.trim()) return;
    try {
      await base44.entities.AppUser.create({
        username: newUser.username.toLowerCase().trim(),
        pin: "0000",
        role: newUser.role,
        full_name: newUser.full_name,
        cohort: newUser.cohort,
        first_login: true,
        active: true,
        ai_voice: "honey",
        ai_persona: "female",
        is_protected: false,
      });
      setNewUser({ username: "", full_name: "", role: "student", cohort: "" });
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

  const handleDelete = async (targetUser) => {
    if (targetUser.is_protected || targetUser.role === "super_admin") {
      alert("This account is protected and cannot be deleted.");
      return;
    }
    if (targetUser.role === "admin" && !isSuperAdmin()) {
      alert("Only the Super Admin can delete Admin accounts.");
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
    <div className="min-h-screen bg-background px-4 pt-6 pb-24 max-w-3xl mx-auto">
      <div className="mb-4">
        <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
          <Users className="w-5 h-5 text-clinical-teal" />
          User Management
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {isSuperAdmin() ? "Full system access — manage all accounts" : isAdmin() ? "Institution-level user management" : "Cohort-level student management"}
        </p>
      </div>

      <div className="mb-5 grid grid-cols-2 gap-2 rounded-2xl border border-white/90 bg-white/65 p-1.5 shadow-[0_14px_35px_-24px_rgba(15,23,42,.55),inset_1px_1px_1px_white] backdrop-blur-xl" role="tablist" aria-label="User management sections">
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
          aria-selected={activeTab === "voice"}
          onClick={() => setActiveTab("voice")}
          className={`flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${activeTab === "voice" ? "bg-white text-clinical-teal shadow-md" : "text-slate-600 hover:bg-white/60"}`}
        >
          <Volume2 className="h-4 w-4" /> Voice Configuration
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
                </div>
              </div>
              <span className={`text-[10px] font-semibold rounded-md border px-2 py-0.5 shrink-0 ${ROLE_COLORS[u.role]}`}>
                {ROLE_LABELS[u.role]}
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

      {/* Create user modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in" onClick={() => setShowCreate(false)}>
          <div className="w-full sm:max-w-sm bg-card rounded-t-2xl sm:rounded-2xl border border-border p-4 animate-slide-up" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-foreground">Create New User</h2>
              <button onClick={() => setShowCreate(false)} className="p-1 rounded-lg hover:bg-muted">
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
                </select>
              </div>
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
                PIN will be set to <span className="font-bold text-foreground">0000</span> — user will be prompted to change on first login.
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