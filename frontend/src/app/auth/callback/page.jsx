'use client';
import { useEffect, useContext } from 'react';
import { useRouter } from 'next/navigation';
import { AuthContext } from '../../providers';

export default function AuthCallback() {
  const router = useRouter();
  const { refetchUser } = useContext(AuthContext);

  useEffect(() => {
    // Extract token query parameter from NITT SSO redirect
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    if (token) {
      // Store token as accessToken cookie so backend withCredentials fetches it
      document.cookie = `accessToken=${token}; path=/; max-age=3600; SameSite=Lax;`;
      // Also store in localStorage for local state compatibility
      localStorage.setItem('token', token);
    }

    // Re-fetch user explicitly after callback redirect to ensure state is up-to-date
    // then redirect to home
    if (refetchUser) {
      refetchUser().then(() => {
        router.push('/');
      }).catch(() => {
        router.push('/login');
      });
    } else {
      router.push('/');
    }
  }, [router, refetchUser]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-indigo-950 text-white">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      <span className="ml-3">Authenticating...</span>
    </div>
  );
}
