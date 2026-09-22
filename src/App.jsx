import { Suspense, lazy, useEffect, useState } from 'react';
import ErrorBoundary from './components/ErrorBoundary';
import { installErrorCollector } from './lib/diagnosticService';
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate, useNavigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from './components/ScrollToTop';
import Layout from './components/Layout';
import LoginGate from './components/auth/LoginGate';
import WelcomeGreeting from './components/auth/WelcomeGreeting';
import { getCurrentUser, isLoggedIn } from '@/lib/clinicalAuth';
import { ESPCaseProvider } from '@/lib/ESPCaseContext';

import { MODULE_RESET_EVENT, resetModuleSession } from "@/lib/moduleSession";
import { handWardControlToUser } from "@/lib/simulationState";

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
const Reflection = lazy(() => import('./pages/Reflection'));
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
const SystemHealth = lazy(() => import('./pages/SystemHealth'));
const CurriculumReadiness = lazy(() => import('./pages/CurriculumReadiness'));
const EmployerPortal = lazy(() => import('./pages/EmployerPortal'));
const TalentCardPage = lazy(() => import('./pages/TalentCardPage')); 
const AIAssistant = lazy(() => import('./components/AIAssistant'));

const AuthenticatedApp = () => {
  const { user, isLoadingAuth, isLoadingPublicSettings, authError, isAuthenticated, authChecked, checkUserAuth, checkAppState } = useAuth();
  const appUser = getCurrentUser();
  const hasAppSession = isLoggedIn();
  const activeUser = appUser || user;
  const hasAccess = hasAppSession || isAuthenticated;
  const [unlocked, setUnlocked] = useState(false);
  const [welcomed, setWelcomed] = useState(false);
  const [clientReady, setClientReady] = useState(false);

  useEffect(() => {
    const sessionAvailable = isLoggedIn();
    setUnlocked(sessionAvailable && sessionStorage.getItem("pathfinder-unlocked") === "1");
    setWelcomed(sessionAvailable && sessionStorage.getItem("pathfinder-welcomed") === "1");
    if (!sessionAvailable) {
      sessionStorage.removeItem("pathfinder-unlocked");
      sessionStorage.removeItem("pathfinder-welcomed");
    }
    setClientReady(true);
  }, []);

  useEffect(() => {
    const stop = installErrorCollector();
    return stop;
  }, []);

  const navigate = useNavigate();
  const [startupUser, setStartupUser] = useState(null);
  useEffect(() => {
    const reset = () => setStartupUser(null);
    window.addEventListener(MODULE_RESET_EVENT, reset);
    return () => window.removeEventListener(MODULE_RESET_EVENT, reset);
  }, []);
  useEffect(() => {
    if (!hasAccess) { setStartupUser(null); return; }
    if (!unlocked || !welcomed || isLoadingPublicSettings || window.location.pathname === "/oauth/consent") return;
    if (startupUser !== activeUser?.id) {
      resetModuleSession();
      handWardControlToUser();
      navigate("/", { replace: true });
      setStartupUser(activeUser?.id);
    }
  }, [hasAccess, unlocked, welcomed, isLoadingPublicSettings, activeUser?.id, startupUser, navigate]);

  if (!clientReady) {
    return (
      <div className="fixed inset-0 flex items-center justify-center" aria-label="Loading Pathfinder Health">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-blue-700 rounded-full animate-spin" />
      </div>
    );
  }

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

  // PIN/QR identification gate. Do not mount protected routes until the
  // server-issued Pathfinder session has been verified by the app shell.
  if (!unlocked) {
    return <LoginGate onUnlock={async () => {
      const accepted = await checkUserAuth();
      if (!accepted) return;
      sessionStorage.setItem("pathfinder-unlocked", "1");
      setUnlocked(true);
    }} />;
  }

  // Personalised welcome — shown once per session right after sign-in
  if (!welcomed) {
    return (
      <WelcomeGreeting
        user={activeUser}
        onContinue={() => { sessionStorage.setItem("pathfinder-welcomed", "1"); setWelcomed(true); }}
      />
    );
  }

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || (isLoadingAuth && !hasAppSession)) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle startup failures without leaving users on a blank screen.
  if (authError && !hasAppSession) {
    if (authError.type === 'user_not_registered') return <UserNotRegisteredError />;
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-slate-50 p-6">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-lg">
          <h1 className="text-lg font-bold text-slate-900">Pathfinder could not start</h1>
          <p className="mt-2 text-sm text-slate-600">{authError.message || 'Please check your connection and try again.'}</p>
          <button type="button" onClick={checkAppState} className="mt-4 rounded-xl bg-blue-700 px-4 py-2 text-sm font-semibold text-white">Try again</button>
        </div>
      </div>
    );
  }

  // Invalid or expired sessions return to the Pathfinder login instead of
  // repeatedly redirecting to a second authentication system.
  if (authChecked && !hasAccess) {
    sessionStorage.removeItem("pathfinder-unlocked");
    sessionStorage.removeItem("pathfinder-welcomed");
    return <LoginGate onUnlock={async () => {
      const accepted = await checkUserAuth();
      if (!accepted) return;
      sessionStorage.setItem("pathfinder-unlocked", "1");
      setUnlocked(true);
      setWelcomed(false);
    }} />;
  }

  if (!hasAccess || !startupUser || startupUser !== activeUser?.id) return null;

  // Render the main app
  return (
    <Suspense fallback={
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    }>
    <ErrorBoundary>
    <ESPCaseProvider key={startupUser}>
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
        <Route path="/reflection" element={<Reflection />} />
        <Route path="/esp-practice" element={<ESPPracticeHub />} />
        <Route path="/esp-practice/portfolio" element={<ESPPortfolioReview />} />
        <Route path="/esp-tutor-review" element={<ESPTutorReview />} />
        <Route path="/esp-practice/:taskId/:sectionId" element={<ESPWorkspace />} />
        <Route path="/user-management" element={<UserManagement />} />
        <Route path="/scenario-authoring" element={<ScenarioAuthoring />} />
        <Route path="/scenario-templates" element={<ScenarioTemplates />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/voice-assistant" element={<VoiceAssistant />} />
        <Route path="/system-health" element={<SystemHealth />} />
        <Route path="/curriculum-readiness" element={<CurriculumReadiness />} />
        <Route path="/employer-portal" element={<EmployerPortal />} />
        <Route path="/talent-card" element={<TalentCardPage />} />
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
    {/* Mounted once above the route content so chat, voice and display state survive navigation. */}
    <AIAssistant context="Pathfinder Health application" />
    </ESPCaseProvider>
    </ErrorBoundary>
    </Suspense>
  );
};


function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <ScrollToTop />
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App