'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import type { User, AuthTokens, Partner, Store, ImpersonationResponse, StoreImpersonationResponse, ImpersonationStatus } from '@/types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  hasRole: (roles: User['role'][]) => boolean;
  // Partner/Impersonation
  impersonatedPartner: Partner | null;
  isImpersonatingPartner: boolean;
  isSuperAdmin: boolean;
  isPartnerAdmin: boolean;
  impersonatePartner: (partnerId: number) => Promise<void>;
  exitPartnerImpersonation: () => Promise<void>;
  // Store Impersonation
  impersonatedStore: Store | null;
  isImpersonatingStore: boolean;
  impersonateStore: (partnerId: number, storeId: number) => Promise<void>;
  exitStoreImpersonation: () => Promise<void>;
  // Effective context
  effectivePartnerId: number | null;
  effectiveStoreId: number | null;
  // Role helpers
  isStoreAdmin: boolean;
  isCashier: boolean;
  isStoreLevelUser: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [impersonatedPartner, setImpersonatedPartner] = useState<Partner | null>(null);
  const [impersonatedStore, setImpersonatedStore] = useState<Store | null>(null);
  const router = useRouter();

  // Load user from localStorage on mount
  useEffect(() => {
    const loadUser = async () => {
      if (typeof window !== 'undefined') {
        const storedUser = localStorage.getItem('user');
        const accessToken = localStorage.getItem('access_token');
        const storedPartnerImpersonation = localStorage.getItem('impersonated_partner');
        const storedStoreImpersonation = localStorage.getItem('impersonated_store');
        
        if (storedUser && accessToken) {
          const userData = JSON.parse(storedUser);
          setUser(userData);
          
          // Load cached impersonation state
          if (storedPartnerImpersonation) {
            setImpersonatedPartner(JSON.parse(storedPartnerImpersonation));
          }
          if (storedStoreImpersonation) {
            setImpersonatedStore(JSON.parse(storedStoreImpersonation));
          }
          
          // Verify with server
          try {
            const response = await api.get<ImpersonationStatus>('/auth/impersonation-status/');
            
            if (response.data.is_impersonating_partner && response.data.partner) {
              setImpersonatedPartner(response.data.partner);
              localStorage.setItem('impersonated_partner', JSON.stringify(response.data.partner));
            } else {
              setImpersonatedPartner(null);
              localStorage.removeItem('impersonated_partner');
            }
            
            if (response.data.is_impersonating_store && response.data.store) {
              setImpersonatedStore(response.data.store);
              localStorage.setItem('impersonated_store', JSON.stringify(response.data.store));
            } else {
              setImpersonatedStore(null);
              localStorage.removeItem('impersonated_store');
            }
          } catch (error) {
            console.error('Failed to verify impersonation status:', error);
            // Ignore errors - likely not authenticated or server unavailable
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
      localStorage.removeItem('impersonated_store');
      localStorage.removeItem('original_access_token');
      localStorage.removeItem('original_refresh_token');
      localStorage.removeItem('partner_access_token');
      localStorage.removeItem('partner_refresh_token');

      setUser(userData);
      setImpersonatedPartner(null);
      setImpersonatedStore(null);
      
      // Route based on role
      if (userData.role === 'CASHIER') {
        router.push('/pos');
      } else {
        router.push('/dashboard');
      }
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
      localStorage.removeItem('impersonated_store');
      localStorage.removeItem('original_access_token');
      localStorage.removeItem('original_refresh_token');
      localStorage.removeItem('partner_access_token');
      localStorage.removeItem('partner_refresh_token');
      setUser(null);
      setImpersonatedPartner(null);
      setImpersonatedStore(null);
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
      setImpersonatedStore(null);
      localStorage.removeItem('impersonated_store');
      
      // Refresh page to reload data with new partner context
      router.push('/dashboard');
      router.refresh();
    } catch (error) {
      console.error('Partner impersonation failed:', error);
      throw error;
    }
  };

  const exitPartnerImpersonation = async () => {
    try {
      // Call exit endpoint to revoke impersonation token
      await api.post('/auth/exit-impersonation/');
    } catch (error) {
      console.error('Exit partner impersonation error:', error);
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
    localStorage.removeItem('impersonated_store');
    localStorage.removeItem('original_access_token');
    localStorage.removeItem('original_refresh_token');
    localStorage.removeItem('partner_access_token');
    localStorage.removeItem('partner_refresh_token');
    
    setImpersonatedPartner(null);
    setImpersonatedStore(null);
    
    // Refresh page to reload data
    router.push('/dashboard');
    router.refresh();
  };

  const impersonateStore = async (partnerId: number, storeId: number) => {
    try {
      // Store current token as partner-level token (for exit store impersonation)
      const currentAccessToken = localStorage.getItem('access_token');
      const currentRefreshToken = localStorage.getItem('refresh_token');
      
      if (currentAccessToken && currentRefreshToken) {
        localStorage.setItem('partner_access_token', currentAccessToken);
        localStorage.setItem('partner_refresh_token', currentRefreshToken);
      }
      
      const response = await api.post<StoreImpersonationResponse>(`/auth/impersonate/${partnerId}/store/${storeId}/`);
      
      const { access_token, refresh_token, impersonating_store } = response.data;
      
      // Update tokens to store impersonation tokens
      localStorage.setItem('access_token', access_token);
      localStorage.setItem('refresh_token', refresh_token);
      localStorage.setItem('impersonated_store', JSON.stringify(impersonating_store));
      
      setImpersonatedStore(impersonating_store);
      
      // Refresh page to reload data with new store context
      router.push('/dashboard');
      router.refresh();
    } catch (error) {
      console.error('Store impersonation failed:', error);
      throw error;
    }
  };

  const exitStoreImpersonation = async () => {
    try {
      const response = await api.post<{ access_token?: string; refresh_token?: string }>('/auth/exit-store-impersonation/');
      
      if (response.data.access_token && response.data.refresh_token) {
        // Server returned new partner-level token
        localStorage.setItem('access_token', response.data.access_token);
        localStorage.setItem('refresh_token', response.data.refresh_token);
      } else {
        // Restore partner-level tokens from storage
        const partnerAccessToken = localStorage.getItem('partner_access_token');
        const partnerRefreshToken = localStorage.getItem('partner_refresh_token');
        
        if (partnerAccessToken && partnerRefreshToken) {
          localStorage.setItem('access_token', partnerAccessToken);
          localStorage.setItem('refresh_token', partnerRefreshToken);
        }
      }
    } catch (error) {
      console.error('Exit store impersonation error:', error);
      
      // Fallback to stored partner tokens
      const partnerAccessToken = localStorage.getItem('partner_access_token');
      const partnerRefreshToken = localStorage.getItem('partner_refresh_token');
      
      if (partnerAccessToken && partnerRefreshToken) {
        localStorage.setItem('access_token', partnerAccessToken);
        localStorage.setItem('refresh_token', partnerRefreshToken);
      }
    }
    
    // Clear store impersonation data
    localStorage.removeItem('impersonated_store');
    localStorage.removeItem('partner_access_token');
    localStorage.removeItem('partner_refresh_token');
    
    setImpersonatedStore(null);
    
    // Refresh page to reload data
    router.push('/stores');
    router.refresh();
  };

  const hasRole = (roles: User['role'][]): boolean => {
    if (!user) return false;
    return roles.includes(user.role);
  };

  // Computed values
  const isSuperAdmin = user?.is_super_admin ?? false;
  const isPartnerAdmin = (user?.role === 'ADMIN' && !isSuperAdmin) || !!impersonatedPartner;
  const isStoreAdmin = user?.role === 'STORE_ADMIN';
  const isCashier = user?.role === 'CASHIER';
  const isStoreLevelUser = isStoreAdmin || isCashier;
  
  // Effective partner/store IDs for API filtering
  const effectivePartnerId = impersonatedPartner?.id ?? user?.partner?.id ?? null;
  const effectiveStoreId = impersonatedStore?.id ?? user?.assigned_store?.id ?? null;

  const value: AuthContextType = {
    user,
    loading,
    login,
    logout,
    isAuthenticated: !!user,
    hasRole,
    // Partner/Impersonation
    impersonatedPartner,
    isImpersonatingPartner: !!impersonatedPartner,
    isSuperAdmin,
    isPartnerAdmin,
    impersonatePartner,
    exitPartnerImpersonation,
    // Store Impersonation
    impersonatedStore,
    isImpersonatingStore: !!impersonatedStore,
    impersonateStore,
    exitStoreImpersonation,
    // Effective context
    effectivePartnerId,
    effectiveStoreId,
    // Role helpers
    isStoreAdmin,
    isCashier,
    isStoreLevelUser,
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
