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

  const login = async (email, otp) => {
    const response = await api.post('/auth/login', { email, otp });
    if (response.data.success) {
      setUser(response.data.user);
      return response.data;
    } else {
      throw new Error(response.data.message || 'Login failed');
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      console.error('Failed to log out cleanly on backend:', err);
    }
    setUser(null);
    queryClient.clear();
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
