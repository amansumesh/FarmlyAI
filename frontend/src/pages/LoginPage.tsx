import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from '../components/common/Input';
import { Button } from '../components/common/Button';
import { OTPInput } from '../components/common/OTPInput';
import { useAuthStore } from '../store/authStore';
import { authService } from '../services/auth.service';

type Step = 'phone' | 'otp';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, error: authError, clearError } = useAuthStore();

  const [step, setStep] = useState<Step>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [otpExpiry, setOtpExpiry] = useState(0);

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    clearError();

    // Validate phone number
    if (!phoneNumber.match(/^\+\d{1,3}\d{10}$/)) {
      setError('Please enter a valid phone number (e.g., +919876543210)');
      return;
    }

    setLoading(true);

    try {
      const response = await authService.sendOTP(phoneNumber);
      
      if (response.success) {
        setOtpExpiry(response.expiresIn);
        setStep('otp');
        
        // Show OTP in development mode
        if (response.otp) {
          console.log('Development OTP:', response.otp);
        }
      }
    } catch (err: unknown) {
      const errorMessage = err && typeof err === 'object' && 'response' in err
        ? ((err.response as { data?: { message?: string } })?.data?.message || 'Failed to send OTP')
        : 'Failed to send OTP';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (otp: string) => {
    setError('');
    clearError();
    setLoading(true);

    try {
      await login(phoneNumber, otp);
      
      // Navigate based on onboarding status
      const user = useAuthStore.getState().user;
      if (user?.onboardingCompleted) {
        navigate('/home');
      } else {
        navigate('/onboarding');
      }
    } catch (err: unknown) {
      const errorMessage = err && typeof err === 'object' && 'response' in err
        ? ((err.response as { data?: { message?: string } })?.data?.message || 'Failed to verify OTP')
        : 'Failed to verify OTP';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setError('');
    setLoading(true);

    try {
      const response = await authService.sendOTP(phoneNumber);
      
      if (response.success) {
        setOtpExpiry(response.expiresIn);
        
        // Show OTP in development mode
        if (response.otp) {
          console.log('Development OTP:', response.otp);
        }
      }
    } catch (err: unknown) {
      const errorMessage = err && typeof err === 'object' && 'response' in err
        ? ((err.response as { data?: { message?: string } })?.data?.message || 'Failed to resend OTP')
        : 'Failed to resend OTP';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleBackToPhone = () => {
    setStep('phone');
    setError('');
    clearError();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        {/* Logo and Header */}
        <div className="text-center mb-8">
          <div className="inline-block bg-green-600 text-white rounded-full p-4 mb-4">
            <svg
              className="w-12 h-12"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Farmly AI</h1>
          <p className="text-gray-600 mt-2">
            {step === 'phone' 
              ? 'Enter your phone number to get started'
              : 'Enter the OTP sent to your phone'
            }
          </p>
        </div>

        {/* Phone Number Step */}
        {step === 'phone' && (
          <form onSubmit={handleSendOTP} className="space-y-6">
            <Input
              type="tel"
              label="Phone Number"
              placeholder="+919876543210"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              error={error}
              autoFocus
            />

            <Button
              type="submit"
              loading={loading}
              className="w-full"
              size="lg"
            >
              Send OTP
            </Button>

            <p className="text-xs text-gray-500 text-center">
              By continuing, you agree to receive SMS messages for verification
            </p>
          </form>
        )}

        {/* OTP Verification Step */}
        {step === 'otp' && (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <p className="text-sm text-gray-600">
                OTP sent to <span className="font-semibold">{phoneNumber}</span>
              </p>
              <button
                onClick={handleBackToPhone}
                className="text-sm text-green-600 hover:underline mt-1"
              >
                Change number
              </button>
            </div>

            <OTPInput
              length={6}
              onComplete={handleVerifyOTP}
              error={error || authError || undefined}
            />

            <div className="text-center space-y-2">
              <p className="text-sm text-gray-600">
                {otpExpiry > 0 && `OTP expires in ${Math.floor(otpExpiry / 60)} minutes`}
              </p>
              
              <button
                onClick={handleResendOTP}
                disabled={loading}
                className="text-sm text-green-600 hover:underline disabled:text-gray-400"
              >
                Resend OTP
              </button>
            </div>

            {loading && (
              <div className="flex justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
