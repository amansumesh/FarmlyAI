import { useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { LoginPage } from './pages/LoginPage';
import { LoadingSpinner } from './components/common/LoadingSpinner';
import { ProtectedRoute } from './components/common/ProtectedRoute';
import { InstallPrompt } from './components/common/InstallPrompt';
import { OfflineBanner } from './components/common/OfflineBanner';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { useAuthStore } from './store/authStore';

const OnboardingPage = lazy(() => import('./pages/OnboardingPage').then(m => ({ default: m.OnboardingPage })));
const HomePage = lazy(() => import('./pages/HomePage').then(m => ({ default: m.HomePage })));
const DiseaseDetectionPage = lazy(() => import('./pages/DiseaseDetectionPage').then(m => ({ default: m.DiseaseDetectionPage })));
const MarketPage = lazy(() => import('./pages/MarketPage').then(m => ({ default: m.MarketPage })));
const MarketPageV2 = lazy(() => import('./pages/MarketPage.v2').then(m => ({ default: m.MarketPageV2 })));
const MarketPageSimple = lazy(() => import('./pages/MarketPageSimple').then(m => ({ default: m.MarketPageSimple })));
const AdvisoryPage = lazy(() => import('./pages/AdvisoryPage').then(m => ({ default: m.AdvisoryPage })));
const SchemesPage = lazy(() => import('./pages/SchemesPage').then(m => ({ default: m.SchemesPage })));
const ProfilePage = lazy(() => import('./pages/ProfilePage').then(m => ({ default: m.ProfilePage })));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function AppRouter() {
  const { isAuthenticated, user } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated && user) {
      if (!user.onboardingCompleted) {
        navigate('/onboarding', { replace: true });
      }
    }
  }, [isAuthenticated, user, navigate]);

  return (
    <Suspense fallback={<LoadingSpinner fullScreen size="lg" text="Loading..." />}>
      <Routes>
        <Route 
          path="/" 
          element={
            isAuthenticated 
              ? user?.onboardingCompleted 
                ? <Navigate to="/home" replace /> 
                : <Navigate to="/onboarding" replace />
              : <LoginPage />
          } 
        />
        <Route
          path="/onboarding"
          element={
            <ProtectedRoute>
              <OnboardingPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/home"
          element={
            <ProtectedRoute requireOnboarding>
              <HomePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/disease"
          element={
            <ProtectedRoute requireOnboarding>
              <DiseaseDetectionPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/market"
          element={
            <ProtectedRoute requireOnboarding>
              <MarketPageV2 />
            </ProtectedRoute>
          }
        />
        <Route
          path="/market-simple"
          element={
            <ProtectedRoute requireOnboarding>
              <MarketPageSimple />
            </ProtectedRoute>
          }
        />
        <Route
          path="/market-full"
          element={
            <ProtectedRoute requireOnboarding>
              <MarketPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/advisory"
          element={
            <ProtectedRoute requireOnboarding>
              <AdvisoryPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/schemes"
          element={
            <ProtectedRoute requireOnboarding>
              <SchemesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute requireOnboarding>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Toaster position="top-center" richColors closeButton />
          <OfflineBanner />
          <AppRouter />
          <InstallPrompt />
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
