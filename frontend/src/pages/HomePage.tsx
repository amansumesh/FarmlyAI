import React from 'react';
import { useAuthStore } from '../store/authStore';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/common/Button';

export const HomePage: React.FC = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Welcome to Farmly AI</h1>
            <Button onClick={handleLogout} variant="secondary">
              Logout
            </Button>
          </div>

          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h2 className="text-lg font-semibold text-green-900 mb-2">User Information</h2>
              <div className="space-y-1 text-sm text-green-800">
                <p><span className="font-medium">Phone:</span> {user?.phoneNumber}</p>
                <p><span className="font-medium">Language:</span> {user?.language.toUpperCase()}</p>
                <p><span className="font-medium">Onboarding Status:</span> {user?.onboardingCompleted ? 'Completed' : 'Pending'}</p>
              </div>
            </div>

            <div className="text-center py-8">
              <p className="text-gray-600 mb-4">
                Authentication is working! This is a placeholder home page.
              </p>
              <p className="text-sm text-gray-500">
                More features will be added in the next steps of the implementation.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
