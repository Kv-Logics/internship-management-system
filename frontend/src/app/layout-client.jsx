"use client";

import React, { useContext, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { AuthContext } from './providers';
import { LayoutDashboard, Users, UserPlus, LogOut, Database, PenTool, Search, CreditCard, Mail, Settings, ShieldCheck, Terminal, FileText, ChevronDown, Download } from 'lucide-react';
import { Toaster, toast } from 'react-hot-toast';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import DepartmentSelectionModal from '../components/faculties/DepartmentSelectionModal';

export default function ProtectedLayout({ children }) {
  const { user, logout, loading } = useContext(AuthContext);
  const router = useRouter();
  const pathname = usePathname();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const { data: internships } = useQuery({
    queryKey: ['internships', 'all'],
    queryFn: async () => {
      const res = await api.get('/internships/');
      return res.data;
    },
    enabled: !!user && pathname !== '/login',
  });
  
  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const res = await api.get('/settings/');
      return res.data;
    },
    enabled: !!user && pathname !== '/login',
  });
  
  const count = internships?.length || 0;

  useEffect(() => {
    if (!loading && !user && pathname !== '/login' && pathname !== '/auth/callback') {
      router.push('/login');
    } else if (user && (pathname === '/payments' || pathname === '/emails') && user.role !== 'admin') {
      router.push('/');
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

  // If not logged in and on the login or callback page, let them view the page directly
  if (!user && (pathname === '/login' || pathname === '/auth/callback')) {
    return (
      <>
        {children}
        <Toaster position="top-right" />
      </>
    );
  }

  // If not logged in and not on login or callback page, wait for redirect
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
      <DepartmentSelectionModal />
      
      {/* Sidebar */}
      <div className="w-64 bg-indigo-800 text-white flex flex-col shadow-lg">
        <div className="p-5 font-extrabold text-2xl border-b border-indigo-700 tracking-wider">
          IMS Portal
        </div>
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto max-h-[calc(100vh-180px)]">
          <Link href="/" className={`flex items-center space-x-3 p-3 rounded-lg transition-all ${isActive('/')}`}>
            <LayoutDashboard size={20} /> <span>Dashboard</span>
          </Link>
          {(count < 5 || user?.role === 'admin') && user?.role !== 'dean' && (
            <Link href="/internships/add" className={`flex items-center space-x-3 p-3 rounded-lg transition-all ${isActive('/internships/add')}`}>
              <UserPlus size={20} /> <span>Add Intern</span>
            </Link>
          )}
          {user?.role !== 'dean' && (
            <Link href="/internships" className={`flex items-center space-x-3 p-3 rounded-lg transition-all ${isActive('/internships')}`}>
              <Users size={20} /> <span>Internships</span>
            </Link>
          )}
          {user?.role === 'admin' && (
            <Link href="/payments" className={`flex items-center space-x-3 p-3 rounded-lg transition-all ${isActive('/payments')}`}>
              <CreditCard size={20} /> <span>Payments Portal</span>
            </Link>
          )}
          {user?.role === 'admin' && (
            <Link href="/emails" className={`flex items-center space-x-3 p-3 rounded-lg transition-all ${isActive('/emails')}`}>
              <Mail size={20} /> <span>Certificate Emailing</span>
            </Link>
          )}
          {user?.role === 'dean' && (
            <Link href="/dean/faculties" className={`flex items-center space-x-3 p-3 rounded-lg transition-all ${isActive('/dean/faculties')}`}>
              <Search size={20} /> <span>Faculty Overview</span>
            </Link>
          )}
          {(user?.role === 'admin' || user?.role === 'dean') && (
            <Link href="/faculties" className={`flex items-center space-x-3 p-3 rounded-lg transition-all ${isActive('/faculties')}`}>
              <Database size={20} /> <span>Faculty Directory</span>
            </Link>
          )}
          {user?.role === 'faculty' && settings?.enable_faculty_certificate_tab === 'true' && (
            <Link href="/certificates" className={`flex items-center space-x-3 p-3 rounded-lg transition-all ${isActive('/certificates')}`}>
              <FileText size={20} /> <span>Certificates</span>
            </Link>
          )}
          {user?.role === 'admin' && (
            <>
              <Link href="/admin/settings" className={`flex items-center space-x-3 p-3 rounded-lg transition-all ${isActive('/admin/settings')}`}>
                <Settings size={20} /> <span>System Settings</span>
              </Link>
              <Link href="/admin/users" className={`flex items-center space-x-3 p-3 rounded-lg transition-all ${isActive('/admin/users')}`}>
                <Users size={20} /> <span>User Management</span>
              </Link>
              <Link href="/admin/verify" className={`flex items-center space-x-3 p-3 rounded-lg transition-all ${isActive('/admin/verify')}`}>
                <ShieldCheck size={20} /> <span>Verify Certificate</span>
              </Link>
              <Link href="/admin/terminal" className={`flex items-center space-x-3 p-3 rounded-lg transition-all ${isActive('/admin/terminal')}`}>
                <Terminal size={20} /> <span>SQL Query Terminal</span>
              </Link>
            </>
          )}
          {(user?.role === 'faculty' || user?.role === 'dean') && (
            <Link href="/signature" className={`flex items-center space-x-3 p-3 rounded-lg transition-all ${isActive('/signature')}`}>
              <PenTool size={20} /> <span>Upload E-Sign</span>
            </Link>
          )}
        </nav>
        <div className="p-4 border-t border-indigo-700">
          <div className="mb-2 px-3 text-xs text-indigo-300 font-semibold truncate">
            Signed in as: {user?.faculty_name}
          </div>
          <button onClick={handleLogout} className="flex items-center space-x-3 w-full p-3 hover:bg-indigo-700 rounded-lg text-left transition-all text-indigo-200 hover:text-white">
            <LogOut size={20} /> <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white shadow p-4 px-6 flex justify-between items-center border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-800">Welcome, {user?.faculty_name}</h1>
          <div className="flex items-center space-x-4">
            {/* Faculty Sample Report Format & Intern Reports Dropdown */}
            {user?.role === 'faculty' && (
              <a
                href={`${api.defaults.baseURL?.replace('/api', '')}/uploads/Internship-Record.pdf`}
                download="Internship-Record.pdf"
                target="_blank"
                rel="noreferrer"
                className="flex items-center space-x-1.5 px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
              >
                <Download size={14} />
                <span>Sample Report Format</span>
              </a>
            )}
            {user?.role === 'faculty' && internships && internships.length > 0 && (
              <div className="relative">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center space-x-1.5 px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
                >
                  <FileText size={14} />
                  <span>Intern Reports</span>
                  <ChevronDown size={12} />
                </button>
                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-2xl shadow-xl py-2 z-50 animate-scaleUp">
                    <div className="px-3.5 py-1.5 border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                      Select Intern Report
                    </div>
                    <div className="max-h-48 overflow-y-auto">
                      {internships.map((item) => {
                        const reportDoc = item.documents?.find(doc => doc.document_type === 'report');
                        return reportDoc ? (
                          <a
                            key={item.internship_id}
                            href={`${api.defaults.baseURL?.replace('/api', '')}/${reportDoc.file_path}`}
                            target="_blank"
                            rel="noreferrer"
                            onClick={() => setDropdownOpen(false)}
                            className="flex items-center justify-between px-3.5 py-2.5 text-xs text-gray-700 hover:bg-indigo-50/50 hover:text-indigo-700 font-semibold transition-colors"
                          >
                            <span className="truncate mr-2">{item.intern?.intern_name}</span>
                            <span className="text-[9px] bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded font-bold uppercase shrink-0">View</span>
                          </a>
                        ) : (
                          <button
                            key={item.internship_id}
                            onClick={() => {
                              toast.error(`No report uploaded for ${item.intern?.intern_name} yet.`);
                              setDropdownOpen(false);
                            }}
                            className="w-full flex items-center justify-between px-3.5 py-2.5 text-xs text-gray-450 hover:bg-gray-50/50 text-left font-medium transition-colors"
                          >
                            <span className="truncate mr-2">{item.intern?.intern_name}</span>
                            <span className="text-[9px] bg-gray-100 text-gray-400 px-1.5 py-0.5 rounded font-bold uppercase shrink-0">None</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
            <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
              user?.role === 'admin'
                ? 'bg-rose-100 text-rose-800'
                : user?.role === 'dean'
                ? 'bg-amber-100 text-amber-800'
                : 'bg-indigo-100 text-indigo-800'
            }`}>
              {user?.role === 'admin' ? 'System Admin' : user?.role === 'dean' ? 'Dean (R&C)' : 'Faculty Account'}
            </span>
          </div>
        </header>
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
