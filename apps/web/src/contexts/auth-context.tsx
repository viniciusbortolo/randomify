'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import type { User } from '@randomify/shared';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  authError: string | null;
  clearAuthError: () => void;
  login: () => void;
  logout: () => Promise<void>;
  refetchUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  const fetchCurrentUser = async () => {
    try {
      const data = await apiFetch<User>('/auth/me');
      setUser(data);
    } catch {
      setUser(null);
      if (typeof window !== 'undefined') {
        localStorage.removeItem('randomify_token');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Verifica se veio um token ou erro na URL após o redirect do Spotify OAuth
    const params = new URLSearchParams(window.location.search);
    const token = params.get('auth_token');
    const errorParam = params.get('auth_error');

    if (token) {
      localStorage.setItem('randomify_token', token);
      params.delete('auth_token');
    }

    if (errorParam) {
      const decoded = decodeURIComponent(errorParam);
      queueMicrotask(() => {
        setAuthError(decoded);
      });
      params.delete('auth_error');
    }

    if (token || errorParam) {
      const newQuery = params.toString() ? `?${params.toString()}` : '';
      window.history.replaceState({}, '', `${window.location.pathname}${newQuery}`);
    }

    let isMounted = true;
    void (async () => {
      try {
        const data = await apiFetch<User>('/auth/me');
        if (isMounted) setUser(data);
      } catch {
        if (isMounted) {
          setUser(null);
          if (typeof window !== 'undefined') {
            localStorage.removeItem('randomify_token');
          }
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  const login = () => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333';
    const redirectOrigin = typeof window !== 'undefined' ? window.location.origin : '';
    const redirectParam = redirectOrigin ? `?redirect_to=${encodeURIComponent(redirectOrigin)}` : '';
    window.location.href = `${apiUrl}/auth/login${redirectParam}`;
  };

  const logout = async () => {
    try {
      await apiFetch('/auth/logout', { method: 'POST' });
    } catch {
      // Ignora erro de rede no logout
    }
    if (typeof window !== 'undefined') {
      localStorage.removeItem('randomify_token');
    }
    setUser(null);
  };

  const clearAuthError = () => {
    setAuthError(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        authError,
        clearAuthError,
        login,
        logout,
        refetchUser: fetchCurrentUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
