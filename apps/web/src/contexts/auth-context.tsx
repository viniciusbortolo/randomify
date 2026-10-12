'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import type { User } from '@randomify/shared';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isLoggingIn: boolean;
  isAuthenticated: boolean;
  authError: string | null;
  clearAuthError: () => void;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  refetchUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const fetchCurrentUser = async () => {
    const currentToken = typeof window !== 'undefined' ? localStorage.getItem('randomify_token') : null;
    if (!currentToken) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const data = await apiFetch<User>('/auth/me', { timeout: 12000 });
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

    const currentToken = token || localStorage.getItem('randomify_token');

    // Se NÃO houver token salvo nem vindo na URL, o usuário NÃO está autenticado.
    // Carrega instantaneamente sem bloquear a página com requisição a /auth/me
    if (!currentToken) {
      setIsLoading(false);
      setUser(null);

      // Pre-aquecer o servidor silenciosamente em segundo plano (sem travar a interface)
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333';
      try {
        fetch(`${apiUrl}/health`, { method: 'GET', mode: 'no-cors' }).catch(() => {});
      } catch {
        // ignore
      }
      return;
    }

    let isMounted = true;
    void (async () => {
      try {
        const data = await apiFetch<User>('/auth/me', { timeout: 12000 });
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

  const login = async () => {
    setIsLoggingIn(true);
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333';
    const redirectOrigin = typeof window !== 'undefined' ? window.location.origin : '';
    const redirectParam = redirectOrigin ? `?redirect_to=${encodeURIComponent(redirectOrigin)}` : '';
    const targetUrl = `${apiUrl}/auth/login${redirectParam}`;

    // Tenta primeiro acordar o backend via /health em background antes de redirecionar a aba inteira.
    // Isso evita que o Render exiba a tela preta "SERVICE WAKING UP... APPLICATION LOADING" para o usuário.
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 45000);
      await fetch(`${apiUrl}/health`, { signal: controller.signal, mode: 'no-cors' });
      clearTimeout(timeoutId);
    } catch {
      // Mesmo com timeout ou falha de rede, prossegue com o redirecionamento
    }

    window.location.href = targetUrl;
  };

  const logout = async () => {
    try {
      await apiFetch('/auth/logout', { method: 'POST', timeout: 5000 });
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
        isLoggingIn,
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
