import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, Eye, EyeOff, AlertCircle, RefreshCw } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext.tsx';
import { ref, get, child } from 'firebase/database';
import { database } from '../../lib/firebase';
import emailjs from '@emailjs/browser';

// Initialize EmailJS immediately (safe to do outside component)
emailjs.init("iPXACY8mKRm_YkNyp");

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // 2FA State
  const [step, setStep] = useState<'credentials' | 'otp'>('credentials');
  const [otp, setOtp] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [pendingUser, setPendingUser] = useState<any>(null); // Store user data while waiting for OTP

  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const dbRef = ref(database);
      const snapshot = await get(child(dbRef, 'accounts'));

      if (snapshot.exists()) {
        const accounts = snapshot.val();
        let userFound = false;

        // Iterate through accounts to find match
        for (const key in accounts) {
          const account = accounts[key];
          // Check against email instead of username
          if (account.email === email && account.password === password) {
            // Check if account is active
            if (account.status === 'Inactive') {
              setError('Account is inactive. Please contact admin.');
              setIsLoading(false);
              return;
            }

            userFound = true;

            // Check for trusted device (2FA persistence)
            const TRUSTED_DEVICE_DURATION = 8 * 24 * 60 * 60 * 1000; // 8 days
            const lastVerified = localStorage.getItem(`2fa_last_verified_${account.email}`);
            const isTrusted = lastVerified && (Date.now() - parseInt(lastVerified) < TRUSTED_DEVICE_DURATION);

            if (isTrusted) {
              login({
                id: key,
                name: account.username,
                email: account.email || '',
                role: account.role || 'User',
              });
              navigate('/');
              return;
            }

            // 2FA Flow
            const code = Math.floor(100000 + Math.random() * 900000).toString();
            setGeneratedOtp(code);
            setPendingUser({
              id: key,
              name: account.username,
              email: account.email || '',
              role: account.role || 'User',
            });

            // Send Email
            try {
              await emailjs.send(
                'service_wieje59',
                'template_rucqsse',
                {
                  username: account.username,
                  to_name: account.username,
                  email: account.email,
                  to_email: account.email,
                  otp: code,
                }
              );
              setStep('otp');
            } catch (emailError) {
              console.error("Failed to send OTP:", emailError);
              setError("Failed to send verification code. Please try again.");
            }
            break;
          }
        }

        if (!userFound) {
          setError('Invalid email or password');
        }

      } else {
        setError('No accounts found in system.');
      }
    } catch (err) {
      console.error("Login error:", err);
      setError('Failed to connect to server.');
    } finally {
      setIsLoading(false);
    }
  };
  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (otp === generatedOtp) {
      if (pendingUser) {
        localStorage.setItem(`2fa_last_verified_${pendingUser.email}`, Date.now().toString());
        login(pendingUser);
        navigate('/');
      }
    } else {
      setError("Invalid code. Please try again.");
    }
  };

  const handleResendOtp = async () => {
    if (!pendingUser) return;
    setIsLoading(true);
    setError('');
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(code);

    try {
      await emailjs.send(
        'service_wieje59',
        'template_rucqsse',
        {
          username: pendingUser.name,
          to_name: pendingUser.name,
          email: pendingUser.email,
          to_email: pendingUser.email,
          otp: code,
        }
      );
      alert(`New code sent to ${pendingUser.email}`);
    } catch (err) {
      console.error("Resend error", err);
      setError("Failed to resend code");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 
                    dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo and Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl 
                        bg-gradient-to-br from-blue-500 to-teal-500 mb-4">
            <Package className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Welcome to Stock Pilot
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Sign in to access your dashboard
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-200 
                      dark:border-gray-800 p-8">

          {step === 'credentials' ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Error Message */}
              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 
                              rounded-lg p-4 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-red-900 dark:text-red-200">
                      Login Failed
                    </p>
                    <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                      {error}
                    </p>
                  </div>
                </div>
              )}

              {/* Email Field */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 
                           bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white
                           placeholder:text-gray-400 dark:placeholder:text-gray-500
                           focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400
                           transition-all"
                  required
                />
              </div>

              {/* Password Field */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 
                             bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white
                             placeholder:text-gray-400 dark:placeholder:text-gray-500
                             focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400
                             transition-all pr-12"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-lg
                             hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    ) : (
                      <Eye className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    )}
                  </button>
                </div>
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-gray-300 text-blue-600 
                             focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Remember me</span>
                </label>
                <button
                  type="button"
                  className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Forgot password?
                </button>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-teal-600 
                         hover:from-blue-700 hover:to-teal-700 text-white font-medium rounded-lg
                         focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                         dark:focus:ring-offset-gray-900 transition-all
                         disabled:opacity-50 disabled:cursor-not-allowed
                         flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-6">
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 mb-3">
                  <Package className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Two-Factor Authentication
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  We sent a code to <span className="font-medium text-gray-900 dark:text-white">{pendingUser?.email}</span>
                </p>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 
                              rounded-lg p-4 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-red-900 dark:text-red-200">
                      Verification Failed
                    </p>
                    <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                      {error}
                    </p>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Enter Verification Code
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000"
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 
                           bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-center text-2xl tracking-widest font-mono
                           placeholder:text-gray-300 dark:placeholder:text-gray-600
                           focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400
                           transition-all"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-teal-600 
                         hover:from-blue-700 hover:to-teal-700 text-white font-medium rounded-lg
                         focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                         dark:focus:ring-offset-gray-900 transition-all"
              >
                Verify Code
              </button>

              <div className="flex items-center justify-between text-sm mt-4">
                <button
                  type="button"
                  onClick={() => setStep('credentials')}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  Back to Login
                </button>
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={isLoading}
                  className="flex items-center gap-1 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 disabled:opacity-50"
                >
                  <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
                  Resend Code
                </button>
              </div>
            </form>
          )}

          {/* Footer */}
          <p className="text-center text-sm text-gray-600 dark:text-gray-400 mt-6">
            © 2026 Stock Pilot. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
