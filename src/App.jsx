import { Suspense, lazy, useEffect } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SystemProvider } from './context/SystemContext';
import { GameProvider, useGame } from './context/GameContext';
import { WorkoutProvider } from './context/WorkoutContext';
import { AppShell } from './components/AppShell';
import { SystemModal } from './components/SystemModal';
import { Toasts } from './components/ui/Toasts';
import { BootScreen } from './components/BootScreen';
import { SetupRequired } from './components/SetupRequired';
import AuthPage from './pages/AuthPage';
import Dashboard from './pages/Dashboard';

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

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => window.scrollTo(0, 0), [pathname]);
  return null;
}

function PageFallback() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <span
          className="h-8 w-8 animate-spin rounded-full border-2 border-t-transparent"
          style={{ borderColor: 'rgb(var(--accent) / 0.5)', borderTopColor: 'transparent' }}
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
  if (!user) return <Navigate to="/auth" replace />;
  if (profileLoading && !profile) return <BootScreen message="Loading hunter data" />;

  return (
    <WorkoutProvider>
      <ThemeBridge>
        <AppShell>
          <Suspense fallback={<PageFallback />}>
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
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </AppShell>
        <SystemModal />
      </ThemeBridge>
    </WorkoutProvider>
  );
}

function Gate() {
  const { user, loading, unconfigured } = useAuth();
  if (loading) return <BootScreen message="Establishing link" />;
  if (unconfigured) return <SetupRequired />;

  return (
    <Routes>
      <Route path="/auth" element={user ? <Navigate to="/" replace /> : <AuthPage />} />
      <Route path="/*" element={<Protected />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <SystemProvider>
        <GameProvider>
          <ScrollToTop />
          <Gate />
          <Toasts />
        </GameProvider>
      </SystemProvider>
    </AuthProvider>
  );
}
