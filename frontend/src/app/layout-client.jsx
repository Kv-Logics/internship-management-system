'use client';
import React, { useContext, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { AuthContext } from './providers';
import { LayoutDashboard, Users, UserPlus, LogOut } from 'lucide-react';
import { Toaster } from 'react-hot-toast';

export default function ProtectedLayout({ children }) {
  const { user, logout, loading } = useContext(AuthContext);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user && pathname !== '/login') {
      router.push('/login');
    }
  }, [user, loading, router, pathname]);

  // If loading session, show a spinner
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 text-indigo-600 font-semibold">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mr-2"></div>
        Checking session...
      </div>
    );
  }

  // If not logged in and on the login page, let them view the login page directly
  if (!user && pathname === '/login') {
    return (
      <>
        {children}
        <Toaster position="top-right" />
      </>
    );
  }

  // If not logged in and not on login page, wait for redirect
  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 text-gray-500">
        Redirecting to login...
      </div>
    );
  }

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const isActive = (path) => pathname === path ? 'bg-indigo-700 font-bold' : 'hover:bg-indigo-700';

  return (
    <div className="flex h-screen bg-gray-100">
      <Toaster position="top-right" />
      
      {/* Sidebar */}
      <div className="w-64 bg-indigo-800 text-white flex flex-col shadow-lg">
        <div className="p-5 font-extrabold text-2xl border-b border-indigo-700 tracking-wider">
          IMS Portal
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <Link href="/" className={`flex items-center space-x-3 p-3 rounded-lg transition-all ${isActive('/')}`}>
            <LayoutDashboard size={20} /> <span>Dashboard</span>
          </Link>
          <Link href="/internships/add" className={`flex items-center space-x-3 p-3 rounded-lg transition-all ${isActive('/internships/add')}`}>
            <UserPlus size={20} /> <span>Add Intern</span>
          </Link>
          <Link href="/internships" className={`flex items-center space-x-3 p-3 rounded-lg transition-all ${isActive('/internships')}`}>
            <Users size={20} /> <span>Internships</span>
          </Link>
        </nav>
        <div className="p-4 border-t border-indigo-700">
          <button onClick={handleLogout} className="flex items-center space-x-3 w-full p-3 hover:bg-indigo-700 rounded-lg text-left transition-all text-indigo-200 hover:text-white">
            <LogOut size={20} /> <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white shadow p-4 px-6 flex justify-between items-center border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-800">Welcome, {user?.faculty_name}</h1>
          <span className="bg-indigo-100 text-indigo-800 text-xs px-2.5 py-1 rounded-full font-semibold">Faculty Account</span>
        </header>
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
