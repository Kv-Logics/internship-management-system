'use client';
import React, { createContext, useState, useEffect } from 'react';
import api from '../services/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const facultyName = localStorage.getItem('faculty_name');
    if (token && facultyName) {
      setUser({ faculty_name: facultyName });
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
    setUser({ faculty_name: response.data.faculty_name });
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('faculty_name');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, sendOtp, verifyOtp, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};