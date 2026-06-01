'use client';
import React, { useContext, useEffect } from 'react';
import { AuthContext } from '../../providers';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import VerifyCertificateTab from '../../../components/faculties/VerifyCertificateTab';

export default function AdminVerify() {
  const { user, loading } = useContext(AuthContext);
  const router = useRouter();

  useEffect(() => {
    if (!loading && user && user.role !== 'admin') {
      toast.error('Access Denied: Only administrators can access the certificate verification portal.');
      router.push('/');
    }
  }, [user, loading, router]);

  if (loading) {
    return <div className="text-indigo-600 font-semibold p-6 text-center">Loading verification portal...</div>;
  }

  if (user?.role !== 'admin') {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-indigo-900 to-indigo-950 p-6 rounded-3xl border border-indigo-850 text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
        <div className="z-10">
          <h2 className="text-2xl font-extrabold tracking-tight">Verify Certificate</h2>
          <p className="text-xs text-indigo-200 mt-1">Audit and validate digital credentials issued by the institution.</p>
        </div>
      </div>
      <VerifyCertificateTab />
    </div>
  );
}
