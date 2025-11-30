'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import type { User, AuthTokens, Partner, ImpersonationResponse, ImpersonationStatus } from '@/types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  hasRole: (roles: User['role'][]) => boolean;
  // Partner/Impersonation
  impersonatedPartner: Partner | null;
  isImpersonating: boolean;
  isSuperAdmin: boolean;
  impersonatePartner: (partnerId: number) => Promise<void>;
  exitImpersonation: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [impersonatedPartner, setImpersonatedPartner] = useState<Partner | null>(null);
  const router = useRouter();

  // Load user from localStorage on mount
  useEffect(() => {
    const loadUser = async () => {
      if (typeof window !== 'undefined') {
        const storedUser = localStorage.getItem('user');
        const accessToken = localStorage.getItem('access_token');
        const storedImpersonation = localStorage.getItem('impersonated_partner');
        
        if (storedUser && accessToken) {
          setUser(JSON.parse(storedUser));
          
          // Check impersonation status
          if (storedImpersonation) {
            setImpersonatedPartner(JSON.parse(storedImpersonation));
          } else {
            // Verify with server if impersonating
            try {
              const response = await api.get<ImpersonationStatus>('/auth/impersonation-status/');
              if (response.data.is_impersonating && response.data.partner) {
                setImpersonatedPartner(response.data.partner);
                localStorage.setItem('impersonated_partner', JSON.stringify(response.data.partner));
              }
            } catch {
              // Ignore errors - likely not authenticated or server unavailable
            }
          }
        }
      }
      setLoading(false);
    };

    loadUser();
  }, []);

  const login = async (username: string, password: string) => {
    try {
      const response = await api.post<AuthTokens>('/auth/login/', {
        username,
        password,
      });

      const { access_token, refresh_token, user: userData } = response.data;

      // Store tokens and user
      localStorage.setItem('access_token', access_token);
      localStorage.setItem('refresh_token', refresh_token);
      localStorage.setItem('user', JSON.stringify(userData));
      
      // Clear any previous impersonation
      localStorage.removeItem('impersonated_partner');
      localStorage.removeItem('original_access_token');
      localStorage.removeItem('original_refresh_token');

      setUser(userData);
      setImpersonatedPartner(null);
      router.push('/dashboard');
    } catch (error: unknown) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout/');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear all local storage and state
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
      localStorage.removeItem('impersonated_partner');
      localStorage.removeItem('original_access_token');
      localStorage.removeItem('original_refresh_token');
      setUser(null);
      setImpersonatedPartner(null);
      router.push('/login');
    }
  };

  const impersonatePartner = async (partnerId: number) => {
    try {
      // Store original tokens before impersonation
      const currentAccessToken = localStorage.getItem('access_token');
      const currentRefreshToken = localStorage.getItem('refresh_token');
      
      if (currentAccessToken && currentRefreshToken) {
        localStorage.setItem('original_access_token', currentAccessToken);
        localStorage.setItem('original_refresh_token', currentRefreshToken);
      }
      
      const response = await api.post<ImpersonationResponse>(`/auth/impersonate/${partnerId}/`);
      
      const { access_token, refresh_token, impersonating } = response.data;
      
      // Update tokens to impersonation tokens
      localStorage.setItem('access_token', access_token);
      localStorage.setItem('refresh_token', refresh_token);
      localStorage.setItem('impersonated_partner', JSON.stringify(impersonating));
      
      setImpersonatedPartner(impersonating);
      
      // Refresh page to reload data with new partner context
      router.push('/dashboard');
      router.refresh();
    } catch (error) {
      console.error('Impersonation failed:', error);
      throw error;
    }
  };

  const exitImpersonation = async () => {
    try {
      // Call exit endpoint to revoke impersonation token
      await api.post('/auth/exit-impersonation/');
    } catch (error) {
      console.error('Exit impersonation error:', error);
    }
    
    // Restore original tokens
    const originalAccessToken = localStorage.getItem('original_access_token');
    const originalRefreshToken = localStorage.getItem('original_refresh_token');
    
    if (originalAccessToken && originalRefreshToken) {
      localStorage.setItem('access_token', originalAccessToken);
      localStorage.setItem('refresh_token', originalRefreshToken);
    }
    
    // Clear impersonation data
    localStorage.removeItem('impersonated_partner');
    localStorage.removeItem('original_access_token');
    localStorage.removeItem('original_refresh_token');
    
    setImpersonatedPartner(null);
    
    // Refresh page to reload data
    router.push('/dashboard');
    router.refresh();
  };

  const hasRole = (roles: User['role'][]): boolean => {
    if (!user) return false;
    return roles.includes(user.role);
  };

  const value = {
    user,
    loading,
    login,
    logout,
    isAuthenticated: !!user,
    hasRole,
    // Partner/Impersonation
    impersonatedPartner,
    isImpersonating: !!impersonatedPartner,
    isSuperAdmin: user?.is_super_admin ?? false,
    impersonatePartner,
    exitImpersonation,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
