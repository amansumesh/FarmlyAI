import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireOnboarding?: boolean;
}

const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true';

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children,
  requireOnboarding = false 
}) => {
  const { isAuthenticated, user, setUser, setTokens } = useAuthStore();
  const location = useLocation();

  useEffect(() => {
    if (DEMO_MODE) {
      const demoUser = {
        id: 'demo-user-123',
        phoneNumber: '+919876543210',
        name: 'Demo Farmer',
        language: 'en' as const,
        onboardingCompleted: true,
        farmProfile: {
          location: {
            type: 'Point' as const,
            coordinates: [73.8567, 18.5204] as [number, number],
            address: 'Pune, Maharashtra',
            state: 'Maharashtra',
            district: 'Pune'
          },
          crops: ['tomato', 'wheat', 'cotton'],
          landSize: 5,
          soilType: 'red' as const
        }
      };
      setUser(demoUser);
      setTokens('demo-token-123', 'demo-refresh-token-123');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setUser, setTokens]);

  if (DEMO_MODE) {
    return <>{children}</>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  if (requireOnboarding && user && !user.onboardingCompleted) {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
};
