import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/common/Button';

export const OnboardingPage: React.FC = () => {
  const navigate = useNavigate();

  const handleSkip = () => {
    navigate('/home');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Onboarding</h1>
        <p className="text-gray-600 mb-8">
          This is a placeholder onboarding page. The full onboarding flow will be implemented in the next step.
        </p>
        <Button onClick={handleSkip} className="w-full">
          Skip for Now
        </Button>
      </div>
    </div>
  );
};
