'use client';
import { useEffect, useContext } from 'react';
import { useRouter } from 'next/navigation';
import { AuthContext } from '../../providers';

export default function AuthCallback() {
  const router = useRouter();
  const { refetchUser } = useContext(AuthContext);

  useEffect(() => {
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
