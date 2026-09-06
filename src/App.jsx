import { Suspense, lazy, useEffect, useState } from 'react';
import ErrorBoundary from './components/ErrorBoundary';
import { installErrorCollector } from './lib/diagnosticService';
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from './components/ScrollToTop';
import Layout from './components/Layout';
import LoginGate from './components/auth/LoginGate';
import VoiceRecoveryPanel from './components/auth/VoiceRecoveryPanel';
import { base44 } from '@/api/base44Client';
import { ESPCaseProvider } from '@/lib/ESPCaseContext';

// Route-level code splitting: each page loads on demand, reducing the initial bundle
const Dashboard = lazy(() => import('./pages/CommandCenterDashboard'));
const Theory = lazy(() => import('./pages/Theory'));
const TheoryDetail = lazy(() => import('./pages/TheoryDetail'));
const CarePlanning = lazy(() => import('./pages/CarePlanning'));
const ClinicalFormWorkspace = lazy(() => import('./pages/ClinicalFormWorkspace'));
const SharedCarePlan = lazy(() => import('./pages/SharedCarePlan'));
const ABCDEAssessment = lazy(() => import('./pages/ABCDEAssessment'));
const NEWS2Scoring = lazy(() => import('./pages/NEWS2Scoring'));
const SMARTGoals = lazy(() => import('./pages/SMARTGoals'));
const WardSimulation = lazy(() => import('./pages/WardSimulation'));
const KnowledgeLibrary = lazy(() => import('./pages/KnowledgeLibrary'));
const InteractiveLearning = lazy(() => import('./pages/InteractiveLearning'));
const Performance = lazy(() => import('./pages/Performance'));
const UserManagement = lazy(() => import('./pages/UserManagement'));
const ScenarioAuthoring = lazy(() => import('./pages/ScenarioAuthoring'));
const ScenarioTemplates = lazy(() => import('./pages/ScenarioTemplates'));
const Profile = lazy(() => import('./pages/Profile'));
const VoiceAssistant = lazy(() => import('./pages/VoiceAssistant'));
const AnatomyPhysiology = lazy(() => import('./pages/AnatomyPhysiology'));
const HealthHub = lazy(() => import('./pages/HealthHub'));
const ClinicalSkillsAcademy = lazy(() => import('./pages/ClinicalSkillsAcademy'));
const AIModels = lazy(() => import('./pages/AIModels'));
const ESPPracticeHub = lazy(() => import('./pages/ESPPracticeHub'));
const ESPWorkspace = lazy(() => import('./pages/ESPWorkspace'));
const ESPPortfolioReview = lazy(() => import('./pages/ESPPortfolioReview'));
const ESPTutorReview = lazy(() => import('./pages/ESPTutorReview'));
const OAuthConsent = lazy(() => import('./pages/OAuthConsent'));

const AuthenticatedApp = () => {
  const { user, isLoadingAuth, isLoadingPublicSettings, authError, isAuthenticated, authChecked, navigateToLogin } = useAuth();
  const [unlocked, setUnlocked] = useState(() => sessionStorage.getItem("pathfinder-unlocked") === "1");
  const [adminVoiceSetupRequired, setAdminVoiceSetupRequired] = useState(null);
  const platformEmail = String(user?.email || "").trim().toLowerCase();
  const isProtectedSuperAdmin = [
    "lee.turton@academic.rnngroup.ac.uk",
    "leturton1@gmail.com",
  ].includes(platformEmail);

  useEffect(() => {
    const stop = installErrorCollector();
    return stop;
  }, []);

  useEffect(() => {
    let active = true;
    if (!isAuthenticated || !isProtectedSuperAdmin) {
      setAdminVoiceSetupRequired(false);
      return () => { active = false; };
    }
    setAdminVoiceSetupRequired(null);
    base44.functions.invoke("getSpokenRecoveryStatus", { username: "lee" })
      .then((response) => {
        const data = response?.data ?? response;
        if (active) setAdminVoiceSetupRequired(!data?.voice_recovery_enrolled);
      })
      .catch(() => {
        if (active) setAdminVoiceSetupRequired(false);
      });
    return () => { active = false; };
  }, [isAuthenticated, isProtectedSuperAdmin]);

  // MCP OAuth consent renders even when signed out — the page gates on its own
  // server session (cookie + token), bypassing the app's normal auth flow.
  if (typeof window !== "undefined" && window.location.pathname === "/oauth/consent") {
    return (
      <Suspense fallback={
        <div className="fixed inset-0 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
        </div>
      }>
        <OAuthConsent />
      </Suspense>
    );
  }

  // Resolve Base44 authentication first. Showing the PIN gate before platform auth
  // created a second, inconsistent sign-in path and caused intermittent denials.
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Redirect to login automatically
      navigateToLogin();
      return null;
    }
  }

  // Send unauthenticated users to the platform sign-in first.
  if (authChecked && !isAuthenticated && !authError) {
    navigateToLogin();
    return null;
  }

  // Protected super-admin identities have already been strongly authenticated by
  // Base44, so they bypass the redundant Pathfinder PIN gate entirely. On the first
  // successful platform session only, require spoken recovery setup once.
  if (isProtectedSuperAdmin && adminVoiceSetupRequired === null) {
    return (
      <div className="fixed inset-0 z-[250] grid place-items-center bg-slate-950/85 p-6 backdrop-blur-xl">
        <div className="w-full max-w-xl rounded-3xl border border-white/20 bg-white p-6 shadow-2xl">
          <p className="text-center text-sm font-bold text-slate-700">Checking spoken recovery setup…</p>
        </div>
      </div>
    );
  }

  if (isProtectedSuperAdmin && adminVoiceSetupRequired) {
    return (
      <div className="fixed inset-0 z-[250] grid place-items-center bg-slate-950/85 p-6 backdrop-blur-xl">
        <div className="w-full max-w-xl rounded-3xl border border-white/20 bg-white p-6 shadow-2xl">
          <div className="mb-4 text-center">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-cyan-600">Pathfinder Health Security</p>
            <h1 className="mt-1 text-2xl font-black text-slate-900">Set up backup voice access</h1>
            <p className="mt-2 text-sm text-slate-600">Your microphone recording is not stored. Pathfinder saves only a salted hash of the phrase you choose.</p>
          </div>
          <VoiceRecoveryPanel
            mode="enrol"
            username="lee"
            user={{ username: "lee", full_name: "Lee Turton", role: "super_admin" }}
            onSuccess={() => setAdminVoiceSetupRequired(false)}
          />
        </div>
      </div>
    );
  }

  if (!unlocked && !isProtectedSuperAdmin) {
    return <LoginGate onUnlock={() => { sessionStorage.setItem("pathfinder-unlocked", "1"); setUnlocked(true); }} />;
  }

  // Render the main app
  return (
    <Suspense fallback={
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    }>
    <ErrorBoundary>
    <Routes>
      <Route path="/login" element={<Navigate to="/" replace />} />
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/theory" element={<Theory />} />
        <Route path="/theory/:moduleId" element={<TheoryDetail />} />
        <Route path="/care-planning" element={<CarePlanning />} />
        <Route path="/care-planning/tool/:toolId" element={<ClinicalFormWorkspace />} />
        <Route path="/care-planning/shared" element={<SharedCarePlan />} />
        <Route path="/care-planning/abcde" element={<ABCDEAssessment />} />
        <Route path="/care-planning/news2" element={<NEWS2Scoring />} />
        <Route path="/care-planning/smart-goals" element={<SMARTGoals />} />
        <Route path="/ward-simulation" element={<WardSimulation />} />
        <Route path="/knowledge-library" element={<KnowledgeLibrary />} />
        <Route path="/interactive-learning" element={<InteractiveLearning />} />
        <Route path="/anatomy-physiology" element={<AnatomyPhysiology />} />
        <Route path="/health-hub" element={<HealthHub />} />
        <Route path="/clinical-skills-academy" element={<ClinicalSkillsAcademy />} />
        <Route path="/ai-models" element={<AIModels />} />
        <Route path="/performance" element={<Performance />} />
        <Route path="/esp-practice" element={<ESPPracticeHub />} />
        <Route path="/esp-practice/portfolio" element={<ESPPortfolioReview />} />
        <Route path="/esp-tutor-review" element={<ESPTutorReview />} />
        <Route path="/esp-practice/:taskId/:sectionId" element={<ESPWorkspace />} />
        <Route path="/user-management" element={<UserManagement />} />
        <Route path="/scenario-authoring" element={<ScenarioAuthoring />} />
        <Route path="/scenario-templates" element={<ScenarioTemplates />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/voice-assistant" element={<VoiceAssistant />} />
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
    </ErrorBoundary>
    </Suspense>
  );
};


function App() {

  return (
    <AuthProvider>
      <ESPCaseProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <ScrollToTop />
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
      </ESPCaseProvider>
    </AuthProvider>
  )
}

export default App