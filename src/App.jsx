import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from './components/ScrollToTop';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Theory from './pages/Theory';
import TheoryDetail from './pages/TheoryDetail';
import CarePlanning from './pages/CarePlanning';
import SharedCarePlan from './pages/SharedCarePlan';
import ABCDEAssessment from './pages/ABCDEAssessment';
import NEWS2Scoring from './pages/NEWS2Scoring';
import SMARTGoals from './pages/SMARTGoals';
import WardSimulation from './pages/WardSimulation';
import KnowledgeLibrary from './pages/KnowledgeLibrary';
import InteractiveLearning from './pages/InteractiveLearning';
import Performance from './pages/Performance';
import UserManagement from './pages/UserManagement';
import Profile from './pages/Profile';
import VoiceAssistant from './pages/VoiceAssistant';
import Layout from './components/Layout';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  // Show loading spinner while checking app public settings or auth
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

  // Render the main app
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/theory" element={<Theory />} />
        <Route path="/theory/:moduleId" element={<TheoryDetail />} />
        <Route path="/care-planning" element={<CarePlanning />} />
        <Route path="/care-planning/shared" element={<SharedCarePlan />} />
        <Route path="/care-planning/abcde" element={<ABCDEAssessment />} />
        <Route path="/care-planning/news2" element={<NEWS2Scoring />} />
        <Route path="/care-planning/smart-goals" element={<SMARTGoals />} />
        <Route path="/ward-simulation" element={<WardSimulation />} />
        <Route path="/knowledge-library" element={<KnowledgeLibrary />} />
        <Route path="/interactive-learning" element={<InteractiveLearning />} />
        <Route path="/performance" element={<Performance />} />
        <Route path="/user-management" element={<UserManagement />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/voice-assistant" element={<VoiceAssistant />} />
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
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