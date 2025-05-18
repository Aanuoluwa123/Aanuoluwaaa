import React, { useState } from 'react';
import { supabase, isUsingRealSupabase, isDevEnvironment } from '../lib/supabaseClient';
import { Toaster, toast } from 'react-hot-toast';

interface AuthProps {
  onAuthChange: (session: any) => void;
}

export default function Auth({ onAuthChange }: AuthProps) {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [resetPassword, setResetPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setFormError(null);

    try {
      if (resetPassword) {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        
        if (error) throw error;
        toast.success('Password reset instructions sent to your email');
        setResetPassword(false);
        setIsLogin(true);
        return;
      }

      if (isLogin) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;
        onAuthChange(data.session);
        toast.success('Logged in successfully!');
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          }
        });

        if (error) throw error;
        
        if (data.user) {
          if (data.user.identities && data.user.identities.length === 0) {
            throw new Error('This email is already registered. Please log in instead.');
          }
          
          if (data.user.email_confirmed_at) {
            toast.success('Sign up successful! You can now log in.');
            setIsLogin(true);
          } else {
            toast.success('Sign up successful! Please check your email for verification.');
          }
        }
      }
    } catch (error: any) {
      setFormError(error.message || 'An error occurred during authentication');
      toast.error(error.message || 'An error occurred during authentication');
    } finally {
      setLoading(false);
    }
  };

  // Development mode login
  const handleDevLogin = () => {
    // Create a mock session object
    const mockSession = {
      user: {
        id: 'dev-user-id',
        email: 'dev@example.com',
      },
      access_token: 'mock-token',
      refresh_token: 'mock-refresh-token',
    };
    
    onAuthChange(mockSession);
    toast.success('Logged in with development account');
  };

  const isDevelopmentMode = isDevEnvironment();
  const usingRealSupabase = isUsingRealSupabase();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col items-center justify-center p-4">
      <Toaster position="top-right" />
      
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
              <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
              <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd" />
            </svg>
          </div>
          <h1 className="mt-2 text-3xl font-bold text-gray-900">FinanceTracker</h1>
          <p className="mt-1 text-sm text-gray-600">Manage your finances with ease</p>
        </div>
        
        <div className="bg-white rounded-xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
            <h2 className="text-xl font-bold text-white">
              {resetPassword ? 'Reset Your Password' : isLogin ? 'Welcome Back' : 'Create Your Account'}
            </h2>
            <p className="text-blue-100 text-sm mt-1">
              {resetPassword 
                ? 'Enter your email to receive reset instructions' 
                : isLogin 
                  ? 'Sign in to access your account' 
                  : 'Join us to start managing your finances'}
            </p>
          </div>
          
          <div className="p-6">
            {!usingRealSupabase && (
              <div className="mb-6 p-3 bg-amber-50 border-l-4 border-amber-500 rounded-r text-sm">
                <p className="font-medium text-amber-800">⚠️ Supabase Not Configured</p>
                <p className="text-amber-700">Real authentication is disabled. Use development mode login below.</p>
              </div>
            )}
            
            {formError && (
              <div className="mb-6 p-3 bg-red-50 border-l-4 border-red-500 rounded-r text-sm text-red-700">
                <p className="font-medium">Authentication Error</p>
                <p>{formError}</p>
              </div>
            )}
            
            <form onSubmit={handleAuth} className="space-y-5">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                      <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                    </svg>
                  </div>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              
              {!resetPassword && (
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              )}
              
              <button
                type="submit"
                disabled={loading || (!usingRealSupabase && !isDevelopmentMode)}
                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200"
              >
                {loading ? (
                  <div className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </div>
                ) : resetPassword ? 'Send Reset Instructions' : isLogin ? 'Sign In' : 'Create Account'}
              </button>
            </form>
            
            <div className="mt-6 text-center">
              {resetPassword ? (
                <button
                  onClick={() => setResetPassword(false)}
                  className="text-sm text-blue-600 hover:text-blue-500 font-medium"
                >
                  Back to login
                </button>
              ) : isLogin ? (
                <div className="space-y-3">
                  <div>
                    <button
                      onClick={() => setIsLogin(false)}
                      className="text-sm text-blue-600 hover:text-blue-500 font-medium"
                    >
                      Don't have an account? Sign up
                    </button>
                  </div>
                  <div>
                    <button
                      onClick={() => setResetPassword(true)}
                      className="text-sm text-gray-600 hover:text-gray-500"
                    >
                      Forgot your password?
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setIsLogin(true)}
                  className="text-sm text-blue-600 hover:text-blue-500 font-medium"
                >
                  Already have an account? Log in
                </button>
              )}
            </div>
          </div>
        </div>
        
        {isDevelopmentMode && (
          <div className="mt-6 bg-white p-6 rounded-xl shadow-lg border border-gray-100">
            <div className="flex items-center mb-3">
              <div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-amber-600" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Development Mode</h3>
            </div>
            <p className="mb-4 text-sm text-gray-600">
              Use this option for local testing without Supabase credentials. Data will be stored locally in your browser.
            </p>
            <button
              onClick={handleDevLogin}
              className="w-full flex justify-center items-center py-2.5 px-4 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-amber-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
              </svg>
              Development Mode Login
            </button>
          </div>
        )}
      </div>
    </div>
  );
} 