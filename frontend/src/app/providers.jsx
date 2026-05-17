'use client';
import React, { createContext, useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import api from '../services/api';

export const AuthContext = createContext();

export function Providers({ children }) {
  const [queryClient] = useState(() => new QueryClient());
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const facultyName = localStorage.getItem('faculty_name');
    const role = localStorage.getItem('role');
    if (token && facultyName) {
      setUser({ faculty_name: facultyName, role: role || 'faculty' });
    }
    setLoading(false);
  }, []);

  const sendOtp = async (email) => {
    const response = await api.post('/auth/send-otp', { email });
    return response.data;
  };

  const verifyOtp = async (email, otp) => {
    const response = await api.post('/auth/verify-otp', { email, otp });
    localStorage.setItem('token', response.data.access_token);
    localStorage.setItem('faculty_name', response.data.faculty_name);
    localStorage.setItem('role', 'faculty');
    setUser({ faculty_name: response.data.faculty_name, role: 'faculty' });
  };

  const adminLogin = async (username, password) => {
    const response = await api.post('/auth/admin/login', { username, password });
    localStorage.setItem('token', response.data.access_token);
    localStorage.setItem('faculty_name', response.data.faculty_name);
    localStorage.setItem('role', 'admin');
    setUser({ faculty_name: response.data.faculty_name, role: 'admin' });
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('faculty_name');
    localStorage.removeItem('role');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, sendOtp, verifyOtp, adminLogin, logout, loading }}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </AuthContext.Provider>
  );
}
