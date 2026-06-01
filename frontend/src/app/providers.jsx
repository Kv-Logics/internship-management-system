'use client';
import React, { createContext, useState, useEffect, useCallback } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import api from '../services/api';

export const AuthContext = createContext();

export function Providers({ children }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
        staleTime: 60000,
        retry: false,
      },
    },
  }));
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    try {
      const response = await api.get('/auth/me');
      setUser(response.data);
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.pathname === '/auth/callback') {
      // Let the callback page handle its own token extraction and refetchUser
      setLoading(false);
    } else {
      fetchUser();
    }
  }, []);

  const login = () => {
    const ssoUrl = process.env.NEXT_PUBLIC_SSO_URL || 'https://cdi.nitt.edu/login';
    const redirectUrl = encodeURIComponent(window.location.origin + '/auth/callback');
    window.location.href = `${ssoUrl}?redirectTo=${redirectUrl}`;
  };

  const logout = async () => {
    setUser(null);
    queryClient.clear();
    localStorage.removeItem('token');
    document.cookie = "accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC; SameSite=Lax;";
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, refetchUser: fetchUser }}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </AuthContext.Provider>
  );
}
