'use client';
import { useEffect, useContext, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AuthContext } from '../../providers';

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refetchUser } = useContext(AuthContext);
  const token = searchParams.get('token');

  useEffect(() => {
    console.log('[CALLBACK] Extracted token:', token ? token.substring(0, 15) + '...' : 'null');
    if (token) {
      // Store token as accessToken cookie so backend withCredentials fetches it
      document.cookie = `accessToken=${token}; path=/; max-age=3600; SameSite=Lax;`;
      // Also store in localStorage for local state compatibility
      localStorage.setItem('token', token);
      
      if (refetchUser) {
        refetchUser().then(() => {
          router.push('/');
        }).catch((err) => {
          console.error('[CALLBACK] refetchUser failed:', err);
          router.push('/login');
        });
      } else {
        router.push('/');
      }
    } else {
      console.warn('[CALLBACK] No token found in search parameters yet.');
    }
  }, [token, router, refetchUser]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-indigo-950 text-white">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      <span className="ml-3">Authenticating...</span>
    </div>
  );
}

export default function AuthCallback() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-indigo-950 text-white">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
        <span className="ml-3">Loading Callback...</span>
      </div>
    }>
      <CallbackContent />
    </Suspense>
  );
}
