'use client';
import React, { createContext, useState, useEffect, useCallback } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import api from '../services/api';

export const AuthContext = createContext();

export function Providers({ children }) {
  const [queryClient] = useState(() => new QueryClient());
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const restoreSession = async () => {
      const storedUser = localStorage.getItem('ims_user');
      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser));
          setLoading(false);
          return;
        } catch {
          localStorage.removeItem('ims_user');
        }
      }

      try {
        const response = await api.get('/auth/me');
        const sessionUser = {
          faculty_name: response.data.faculty_name,
          email: response.data.email,
          role: response.data.role || 'faculty',
          dept: response.data.dept || '',
        };
        localStorage.setItem('ims_user', JSON.stringify(sessionUser));
        setUser(sessionUser);
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    restoreSession();
  }, []);

  const loginWithNittAuth = useCallback(() => {
    const authBaseUrl = process.env.NEXT_PUBLIC_NITT_AUTH_URL || 'http://localhost:5001';
    const callbackUrl = `${window.location.origin}/auth/callback`;
    window.location.href = `${authBaseUrl}/login?redirectTo=${encodeURIComponent(callbackUrl)}`;
  }, []);

  const completeNittAuth = useCallback((profile) => {
    const sessionUser = {
      faculty_name: profile.name || profile.email,
      email: profile.email,
      role: (profile.role || 'faculty').toLowerCase(),
      dept: profile.dept || '',
    };
    localStorage.setItem('ims_user', JSON.stringify(sessionUser));
    setUser(sessionUser);
  }, []);

  const logout = async () => {
    try {
      const authApiUrl = process.env.NEXT_PUBLIC_NITT_AUTH_API_URL;
      if (authApiUrl) {
        await api.post(`${authApiUrl}/auth/logout`);
      }
    } catch {
      // Local logout should still complete if central logout is unavailable.
    }
    localStorage.removeItem('ims_user');
    setUser(null);
    queryClient.clear();
  };

  return (
    <AuthContext.Provider value={{ user, loginWithNittAuth, completeNittAuth, logout, loading }}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </AuthContext.Provider>
  );
}
