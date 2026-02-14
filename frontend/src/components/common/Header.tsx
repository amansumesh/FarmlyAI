import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

export const Header: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div 
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => navigate('/home')}
          >
            <div className="bg-green-600 rounded-lg p-2">
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-gray-900">Farmly AI</h1>
          </div>

          <button
            onClick={() => navigate('/profile')}
            className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 rounded-full px-3 py-2 transition-colors"
          >
            <div className="bg-green-600 rounded-full w-8 h-8 flex items-center justify-center text-white font-semibold text-sm">
              {user?.name ? user.name.charAt(0).toUpperCase() : user?.phoneNumber?.slice(-2) || 'U'}
            </div>
            <span className="text-sm font-medium text-gray-700 hidden sm:inline">
              {user?.name || user?.phoneNumber}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
};
