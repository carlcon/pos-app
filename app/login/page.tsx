'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Input, Button, Spinner } from '@heroui/react';
import { AxiosError } from 'axios';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login, isAuthenticated, loading } = useAuth();
  const router = useRouter();

  // Redirect if already authenticated
  useEffect(() => {
    if (!loading && isAuthenticated) {
      router.push('/dashboard');
    }
  }, [loading, isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(username, password);
      // Login successful - redirect handled by AuthContext
    } catch (err) {
      // Handle different error types
      if (err instanceof AxiosError) {
        const errorMsg = err.response?.data?.error || err.response?.data?.detail || 'Invalid username or password';
        setError(errorMsg);
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
      console.error('Login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F5F7FA]">
        <Spinner size="lg" color="primary" />
      </div>
    );
  }

  // Don't render login form if already authenticated
  if (isAuthenticated) {
    return null;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#049AE0] to-[#0B7FBF] p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-md">
        {/* Logo/Brand Section */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-white rounded-xl sm:rounded-2xl shadow-lg mb-3 sm:mb-4">
            <span className="text-2xl sm:text-3xl font-bold text-[#049AE0]">P</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1 sm:mb-2">POS Inventory System</h1>
          <p className="text-sm sm:text-base text-white/90">Motor Parts Retail Management</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl overflow-hidden">
          <div className="p-6 sm:p-8">
            <div className="mb-5 sm:mb-6">
              <h2 className="text-xl sm:text-2xl font-bold text-[#242832] mb-1">Welcome Back</h2>
              <p className="text-sm sm:text-base text-gray-600">Sign in to your account to continue</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
              <div>
                <Input
                  label="Username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  isRequired
                  autoFocus
                  isDisabled={isLoading}
                  placeholder="Enter your username"
                  classNames={{
                    inputWrapper: "bg-gray-50 border border-gray-200 hover:border-[#049AE0] focus-within:!border-[#049AE0] shadow-sm",
                    input: "text-[#242832] focus:!outline-none",
                    label: "text-gray-700 font-medium"
                  }}
                  size="lg"
                />
              </div>
              
              <div>
                <Input
                  label="Password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  isRequired
                  isDisabled={isLoading}
                  placeholder="Enter your password"
                  classNames={{
                    inputWrapper: "bg-gray-50 border border-gray-200 hover:border-[#049AE0] focus-within:!border-[#049AE0] shadow-sm",
                    input: "text-[#242832] focus:!outline-none",
                    label: "text-gray-700 font-medium"
                  }}
                  size="lg"
                />
              </div>

              {error && (
                <div className="px-4 py-3 rounded-lg bg-red-50 border border-red-200">
                  <p className="text-sm text-red-600 font-medium">{error}</p>
                </div>
              )}

              <Button
                type="submit"
                isLoading={isLoading}
                isDisabled={isLoading || !username || !password}
                className="w-full bg-[#049AE0] text-white font-semibold h-12 text-base hover:bg-[#0388c9] shadow-lg shadow-[#049AE0]/20"
                size="lg"
              >
                {isLoading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 sm:px-8 py-3 sm:py-4 border-t border-gray-100">
            <p className="text-xs sm:text-sm text-gray-500 text-center">
              <span className="font-semibold text-gray-700">Demo:</span> admin / admin123
            </p>
          </div>
        </div>

        {/* Additional Info */}
        <p className="text-center text-white/80 text-xs sm:text-sm mt-4 sm:mt-6">
          © 2025 POS Inventory System. All rights reserved.
        </p>
      </div>
    </div>
  );
}
