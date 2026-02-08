import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LoginPage } from './pages/LoginPage';
import { OnboardingPage } from './pages/OnboardingPage';
import { HomePage } from './pages/HomePage';
import { DiseaseDetectionPage } from './pages/DiseaseDetectionPage';
import { MarketPage } from './pages/MarketPage';
import { MarketPageSimple } from './pages/MarketPageSimple';
import { AdvisoryPage } from './pages/AdvisoryPage';
import { ProtectedRoute } from './components/common/ProtectedRoute';
import { useAuthStore } from './store/authStore';

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
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppRouter />
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
