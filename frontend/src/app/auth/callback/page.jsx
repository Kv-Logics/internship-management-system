'use client';
import React, { useContext, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AuthContext } from '../../providers';
import api from '../../../services/api';

const normalizeRole = (role) => (role || 'faculty').toLowerCase();

export default function AuthCallback() {
  const { completeNittAuth } = useContext(AuthContext);
  const router = useRouter();

  useEffect(() => {
    const completeLogin = async () => {
      const searchParams = new URLSearchParams(window.location.search);
      const profile = {
        email: searchParams.get('email') || '',
        name: searchParams.get('name') || '',
        role: normalizeRole(searchParams.get('role')),
        dept: searchParams.get('dept') || '',
      };

      if (!profile.email) {
        router.replace('/login');
        return;
      }

      completeNittAuth(profile);

      try {
        await api.get('/auth/me');
      } catch {
        router.replace('/login');
        return;
      }

      router.replace('/');
    };

    completeLogin();
  }, [completeNittAuth, router]);

  return (
    <div className="flex h-screen items-center justify-center bg-gray-50 text-indigo-700 font-semibold">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-700 mr-3"></div>
      Completing NITT sign in...
    </div>
  );
}
