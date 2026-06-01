'use client';
import React, { useContext, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AuthContext } from '../providers';
import { ShieldCheck, ArrowRight } from 'lucide-react';

export default function Login() {
  const { user, login, loading } = useContext(AuthContext);
  const router = useRouter();
  
  useEffect(() => {
    if (user && !loading) {
      router.push('/');
    }
  }, [user, loading, router]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-gradient-to-tr from-indigo-900 via-indigo-950 to-purple-950 text-white">Loading...</div>;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-tr from-indigo-900 via-indigo-950 to-purple-950 p-6">
      <div className="w-full max-w-md bg-white/10 backdrop-blur-md rounded-3xl border border-white/10 shadow-2xl overflow-hidden p-8 text-white text-center">
        <div className="inline-flex bg-indigo-500/20 p-4 rounded-full border border-indigo-500/30 text-indigo-400 mb-6">
          <ShieldCheck size={48} />
        </div>
        <h2 className="text-3xl font-extrabold tracking-tight mb-2">IMS Portal</h2>
        <p className="text-indigo-200 mb-8">Login using NITT Central Auth Service to access the Internship Management System.</p>
        <button
          onClick={login}
          className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-xl text-lg font-bold shadow-lg hover:shadow-indigo-500/20 transition-all flex items-center justify-center space-x-3"
        >
          <span>Login with NITT SSO</span>
          <ArrowRight size={20} />
        </button>
      </div>
    </div>
  );
}
