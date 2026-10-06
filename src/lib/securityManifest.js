// Curated inventory of the app's security-relevant surfaces, reviewed by the
// diagnostic security scan. Update this when entities, functions, or risk
// areas change so the scan stays a systematic, complete review rather than a
// guess from runtime noise alone.

// RLS classification:
//   admin-only        — every op restricted to role:admin
//   public-read/admin-write — read: null (any authenticated app user can read),
//                              only admins can create/update/delete
//   owner-based/admin — read/write restricted to the owning user (by id) or admin
//   unknown           — RLS not verified in this manifest; flag for review
export const SECURITY_ENTITIES = [
  { name: "AppUser", rls: "admin-only", sensitivity: "high", notes: "PINs, roles, protected-flag, AI persona prefs. Admin CRUD only." },
  { name: "QRAccessCredential", rls: "admin-only", sensitivity: "high", notes: "QR access token hashes." },
  { name: "AppSession", rls: "admin-only", sensitivity: "high", notes: "Active session token hashes." },
  { name: "AuthAudit", rls: "admin-only", sensitivity: "medium", notes: "Login/role-change audit trail." },
  { name: "AIUsage", rls: "admin-only", sensitivity: "low", notes: "AI provider call logs." },
  { name: "EmployerProfile", rls: "public-read/admin-write", sensitivity: "medium", notes: "Public read intentional for student browsing. Verify no sensitive contact data is exposed to all users." },
  { name: "Scenario", rls: "public-read/admin-write", sensitivity: "medium", notes: "Clinical scenarios + decision trees. Public read for all learners." },
  { name: "ScenarioTemplate", rls: "public-read/admin-write", sensitivity: "medium", notes: "Reusable scenario templates including EHR overrides." },
  { name: "WardLayout", rls: "public-read/admin-write", sensitivity: "low", notes: "Ward furniture layouts." },
  { name: "TheoryModule", rls: "public-read/admin-write", sensitivity: "low", notes: "Curriculum theory content." },
  { name: "KnowledgeArticle", rls: "public-read/admin-write", sensitivity: "low", notes: "Reference knowledge articles." },
  { name: "HealthHubRecord", rls: "owner-based/admin", sensitivity: "high", notes: "Participant health-check data. Owner = recorded_by_id. Must not leak across clinicians." },
  { name: "ESPPortfolio", rls: "owner-based/admin", sensitivity: "high", notes: "Student ESP portfolio evidence." },
  { name: "CarePlanSubmission", rls: "owner-based/admin", sensitivity: "high", notes: "Student care-plan submissions + tutor feedback." },
  { name: "PlacementMatch", rls: "owner-based/admin", sensitivity: "medium", notes: "Placement suggestions + scores." },
  { name: "LearnerReadiness", rls: "owner-based/admin", sensitivity: "medium", notes: "Readiness scores + priority gaps." },
  { name: "SimulationResult", rls: "owner-based/admin", sensitivity: "medium", notes: "Ward simulation scores + decision paths." },
  { name: "TalentCard", rls: "owner-based/admin", sensitivity: "high", notes: "Student talent profiles. profile_visibility field must be honoured before sharing with employers." },
  { name: "CurriculumRequirement", rls: "unknown", sensitivity: "medium", notes: "RLS not verified in this manifest — review required." },
];

export const SECURITY_FUNCTIONS = [
  { name: "verifyAccess", auth: "anonymous (rate-limited)", risk: "medium", notes: "PIN/QR pre-session gate. Must not leak whether a user exists; must rate-limit brute force; returns generic messages." },
  { name: "openaiChat", auth: "session + rate-limited", risk: "low", notes: "Legacy AI proxy. Superseded by InvokeLLM — review for removal to reduce attack surface." },
  { name: "openrouterChat", auth: "session + rate-limited", risk: "low", notes: "Legacy AI proxy. Superseded by InvokeLLM — review for removal." },
  { name: "appData", auth: "session (service-role filters)", risk: "medium", notes: "Bulk data endpoint. Verify owner-based filters are applied for tutors so they only see their own records." },
  { name: "manageQrAccess", auth: "admin", risk: "medium", notes: "QR credential issuance/revocation. Must enforce admin role server-side." },
  { name: "notifySubmission", auth: "session", risk: "low", notes: "Sends submission notifications. Verify recipient is authorised." },
];

export const SECURITY_RISK_AREAS = [
  { area: "Client-side role gating", risk: "medium", notes: "isAdmin() gates UI only and can be bypassed in the browser. Every admin-only action must also be enforced by RLS or a backend role check, not just the client." },
  { area: "Markdown XSS", risk: "medium", notes: "ReactMarkdown renders AI, Knowledge and assistant content. Every render site must apply safeUrlTransform to block javascript: data: and event-handler URLs." },
  { area: "Error message leakage", risk: "low", notes: "verifyAccess must return generic messages to anonymous callers. Confirm no stack traces or user-existence hints reach the client." },
  { area: "Secret storage", risk: "low", notes: "OPENAI_API_KEY / OPENROUTER_API_KEY are server-side secrets. Confirm they are never serialised into client bundles or responses." },
  { area: "localStorage", risk: "low", notes: "Session flags are stored in localStorage. Confirm no tokens, PINs or API keys are persisted client-side." },
  { area: "File uploads", risk: "medium", notes: "End-user uploads should use UploadPrivateFile by default. Confirm private evidence is never exposed via a public URL." },
  { area: "TalentCard visibility", risk: "medium", notes: "TalentCard.profile_visibility (private/placement_only/employer_match) must be enforced before employer-facing queries return records." },
];

export const SECURITY_MANIFEST_VERSION = 1;