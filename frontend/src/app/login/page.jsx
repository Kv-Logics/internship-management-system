'use client';
import React, { useContext, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AuthContext } from '../providers';
import { ArrowRight, ShieldCheck } from 'lucide-react';

export default function Login() {
  const { user, loginWithNittAuth } = useContext(AuthContext);
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.push('/');
    }
  }, [user, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-6">
      <div className="w-full max-w-md bg-white rounded-lg border border-slate-200 shadow-xl p-8">
        <div className="text-center mb-8">
          <div className="inline-flex bg-indigo-50 p-4 rounded-full text-indigo-700 mb-4">
            <ShieldCheck size={34} />
          </div>
          <h1 className="text-2xl font-bold text-slate-950">Internship Management System</h1>
          <p className="mt-2 text-sm text-slate-600">
            Sign in with your NITT central authentication account.
          </p>
        </div>

        <button
          type="button"
          onClick={loginWithNittAuth}
          className="w-full py-3 bg-indigo-700 hover:bg-indigo-800 active:bg-indigo-900 rounded-md text-sm font-semibold text-white shadow-sm transition-colors flex items-center justify-center gap-2"
        >
          <span>Continue with NITT Auth</span>
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}
