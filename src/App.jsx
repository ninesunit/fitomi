import { Suspense, lazy, useEffect, useSyncExternalStore } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SystemProvider } from './context/SystemContext';
import { GameProvider, useGame } from './context/GameContext';
import { WorkoutProvider } from './context/WorkoutContext';
import { AppShell } from './components/AppShell';
import { SystemModal } from './components/SystemModal';
import { SocialProvider } from './context/SocialContext';
import { RouteTransition } from './components/RouteTransition';
import { Toasts } from './components/ui/Toasts';
import { InstallPrompt } from './components/InstallPrompt';
import { UpdatePrompt } from './components/UpdatePrompt';
import { BootScreen } from './components/BootScreen';
import { SetupRequired } from './components/SetupRequired';
import AuthPage from './pages/AuthPage';
import AwakenPage from './pages/AwakenPage';
import Dashboard from './pages/Dashboard';
import { getAwakeningSnapshot, subscribeAwakening } from './lib/onboarding';

// Everything past the dashboard is code-split. The first paint after sign-in
// should download the shell and the dashboard, nothing else — the exercise
// library alone is a meaningful fraction of the bundle.
const WorkoutPage = lazy(() => import('./pages/WorkoutPage'));
const LibraryPage = lazy(() => import('./pages/LibraryPage'));
const QuestsPage = lazy(() => import('./pages/QuestsPage'));
const RaidPage = lazy(() => import('./pages/RaidPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const ToolsPage = lazy(() => import('./pages/ToolsPage'));
const HistoryPage = lazy(() => import('./pages/HistoryPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const NotomiPage = lazy(() => import('./pages/NotomiPage'));
const RoutinesPage = lazy(() => import('./pages/RoutinesPage'));
const SocialPage = lazy(() => import('./pages/SocialPage'));

/** Applies the active shadow's theme by rewriting the root CSS variables. */
function ThemeBridge({ children }) {
  const { theme } = useGame();

  useEffect(() => {
    if (!theme) return;
    const root = document.documentElement;
    root.style.setProperty('--accent', theme.accent);
    root.style.setProperty('--accent-2', theme.accent2);
  }, [theme]);

  return children;
}

function PageFallback() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <span
          className="h-8 w-8 animate-spin rounded-full border-2 border-t-transparent"
          style={{ borderColor: 'rgb(var(--sys) / 0.5)', borderTopColor: 'transparent' }}
        />
        <span className="hud-label">Loading module</span>
      </div>
    </div>
  );
}

function Protected() {
  const { user, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading } = useGame();

  if (authLoading) return <BootScreen message="Establishing link" />;
  if (!user) return <Navigate to="/awaken" replace />;
  if (profileLoading && !profile) return <BootScreen message="Loading hunter data" />;

  return (
    <SocialProvider>
    <WorkoutProvider>
      <ThemeBridge>
        <AppShell>
          <Suspense fallback={<PageFallback />}>
            <RouteTransition>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/workout" element={<WorkoutPage />} />
              <Route path="/library" element={<LibraryPage />} />
              <Route path="/library/:exerciseId" element={<LibraryPage />} />
              <Route path="/quests" element={<QuestsPage />} />
              <Route path="/raid" element={<RaidPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/tools" element={<ToolsPage />} />
              <Route path="/history" element={<HistoryPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/notomi" element={<NotomiPage />} />
              <Route path="/routines" element={<RoutinesPage />} />
              <Route path="/social" element={<SocialPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
            </RouteTransition>
          </Suspense>
        </AppShell>
        <SystemModal />
      </ThemeBridge>
    </WorkoutProvider>
    </SocialProvider>
  );
}

function Gate() {
  const { user, loading, unconfigured } = useAuth();
  if (loading) return <BootScreen message="Establishing link" />;
  if (unconfigured) return <SetupRequired />;

  // A visitor meets the System before they meet a sign-up form: the assessment
  // runs first, and /auth only becomes reachable once it is finished.
  //
  // Subscribed rather than read inline: this lives in localStorage, and a plain
  // read would be captured on first render and never update, so finishing the
  // assessment would bounce off /auth back to the start of the questionnaire.
  const awakened = useSyncExternalStore(subscribeAwakening, getAwakeningSnapshot, () => false);

  return (
    <Routes>
      <Route
        path="/awaken"
        element={user ? <Navigate to="/" replace /> : <AwakenPage />}
      />
      {/* Always reachable. Adding the app to a home screen creates a fresh
          storage sandbox, so a returning hunter arrives with no saved answers
          and no session — gating this behind the assessment would force them
          to redo a setup they have already completed. */}
      <Route path="/auth" element={user ? <Navigate to="/" replace /> : <AuthPage />} />
      <Route
        path="/*"
        element={user ? <Protected /> : <Navigate to={awakened ? '/auth' : '/awaken'} replace />}
      />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <SystemProvider>
        <GameProvider>
          <Gate />
          <Toasts />
          <InstallPrompt />
          <UpdatePrompt />
        </GameProvider>
      </SystemProvider>
    </AuthProvider>
  );
}
