'use client';
import React, { useContext, useEffect } from 'react';
import { AuthContext } from '../../providers';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import SystemSettingsPanel from '../../../components/faculties/SystemSettingsPanel';

export default function AdminSettings() {
  const { user, loading } = useContext(AuthContext);
  const router = useRouter();

  useEffect(() => {
    if (!loading && user && user.role !== 'admin') {
      toast.error('Access Denied: Only administrators can modify system settings.');
      router.push('/');
    }
  }, [user, loading, router]);

  if (loading) {
    return <div className="text-indigo-600 font-semibold p-6 text-center">Loading settings portal...</div>;
  }

  if (user?.role !== 'admin') {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 border border-gray-300 text-gray-900 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden">
        
        <div className="z-10">
          <h2 className="text-2xl font-extrabold tracking-tight">System Settings</h2>
        </div>
      </div>
      <SystemSettingsPanel />
    </div>
  );
}
