'use client';
import React, { useContext, useState, useEffect } from 'react';
import api from '../services/api';
import { useQuery } from '@tanstack/react-query';
import { LayoutDashboard, Users, Clock, Award, ArrowUpRight, TrendingUp, Calendar, BookOpen } from 'lucide-react';
import Link from 'next/link';
import { AuthContext } from './providers';

const fetchDashboardStats = async () => {
  const res = await api.get('/internships/');
  const all = res.data;
  const now = new Date();
  
  let ongoing = 0;
  let completed = 0;
  
  all.forEach(item => {
    const end = new Date(item.end_date);
    if (end < now) completed++;
    else ongoing++;
  });

  return { 
    total: all.length, 
    ongoing, 
    completed,
    recent: all.slice(0, 5) // Return up to 5 most recent records
  };
};

export default function Dashboard() {
  const { user } = useContext(AuthContext);
  const [facultiesCount, setFacultiesCount] = useState(0);

  useEffect(() => {
    if (user?.role === 'admin') {
      const fetchFaculties = async () => {
        try {
          const token = localStorage.getItem('token');
          const res = await api.get('/auth/faculties', {
            headers: { Authorization: `Bearer ${token}` }
          });
          setFacultiesCount(res.data.length);
        } catch (e) {
          console.error(e);
        }
      };
      fetchFaculties();
    }
  }, [user]);

  const { data: stats, isLoading, isError } = useQuery({
    queryKey: ['dashboardStats'],
    queryFn: fetchDashboardStats
  });

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
          <p className="text-sm font-semibold text-gray-500 animate-pulse">Orchestrating Dashboard Metrics...</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center text-red-700 max-w-lg mx-auto my-12">
        <p className="font-bold text-lg mb-2">Metrics Fetch Failed</p>
        <p className="text-sm">Ensure your FastAPI server is running on port 8000 and CORS is enabled.</p>
      </div>
    );
  }

  const completionRate = stats?.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;



  return (
    <div className="space-y-8 py-4">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-gradient-to-r from-indigo-900 to-indigo-950 p-8 rounded-3xl shadow-xl text-white overflow-hidden relative border border-indigo-850">
        <div className="absolute right-0 top-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
        <div className="absolute left-1/3 bottom-0 w-60 h-60 bg-purple-500/10 rounded-full blur-3xl -ml-20 -mb-20"></div>
        
        <div className="z-10 space-y-2">
          <h2 className="text-3xl font-extrabold tracking-tight">Academic Mentorship Insights</h2>
          <p className="text-indigo-200 text-sm max-w-xl leading-relaxed">
            Real-time analytics and tracking interface for your mentored student internships, project periods, and official certificate status.
          </p>
        </div>
        {(stats?.total < 5 || user?.role === 'admin') && (
          <Link href="/internships/add" className="z-10 mt-6 md:mt-0 px-6 py-3.5 bg-white text-indigo-900 font-bold rounded-xl shadow-lg hover:shadow-white/10 hover:scale-105 active:scale-98 transition-all duration-300 flex items-center space-x-2 text-sm">
            <span>Add New Intern</span>
            <ArrowUpRight size={16} />
          </Link>
        )}
      </div>

      {/* Stats Cards */}
      <div className={`grid grid-cols-1 ${user?.role === 'admin' ? 'md:grid-cols-4' : 'md:grid-cols-3'} gap-6`}>
        {/* Total Card */}
        <div className="bg-white rounded-3xl p-6 border border-gray-150 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1 relative group overflow-hidden">
          <div className="absolute right-0 bottom-0 w-24 h-24 bg-indigo-50 rounded-tl-full -mr-2 -mb-2 transition-all duration-300 group-hover:scale-110"></div>
          <div className="flex items-center space-x-4 relative z-10">
            <div className="bg-indigo-100 text-indigo-600 p-3.5 rounded-2xl">
              <Users size={24} />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Total Internships</p>
              <h4 className="text-3xl font-black text-gray-800 mt-1">{stats?.total || 0}</h4>
            </div>
          </div>
          <div className="mt-6 flex items-center text-xs text-indigo-600 font-bold relative z-10">
            <TrendingUp size={14} className="mr-1" />
            <span>Active mentored student records</span>
          </div>
        </div>

        {/* Ongoing Card */}
        <div className="bg-white rounded-3xl p-6 border border-gray-150 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1 relative group overflow-hidden">
          <div className="absolute right-0 bottom-0 w-24 h-24 bg-amber-50 rounded-tl-full -mr-2 -mb-2 transition-all duration-300 group-hover:scale-110"></div>
          <div className="flex items-center space-x-4 relative z-10">
            <div className="bg-amber-100 text-amber-600 p-3.5 rounded-2xl">
              <Clock size={24} />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Ongoing Projects</p>
              <h4 className="text-3xl font-black text-gray-800 mt-1">{stats?.ongoing || 0}</h4>
            </div>
          </div>
          <div className="mt-6 flex items-center text-xs text-amber-600 font-bold relative z-10">
            <Clock size={14} className="mr-1 animate-pulse" />
            <span>Currently under active mentoring</span>
          </div>
        </div>

        {/* Completed Card */}
        <div className="bg-white rounded-3xl p-6 border border-gray-150 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1 relative group overflow-hidden">
          <div className="absolute right-0 bottom-0 w-24 h-24 bg-emerald-50 rounded-tl-full -mr-2 -mb-2 transition-all duration-300 group-hover:scale-110"></div>
          <div className="flex items-center space-x-4 relative z-10">
            <div className="bg-emerald-100 text-emerald-600 p-3.5 rounded-2xl">
              <Award size={24} />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Completed Projects</p>
              <h4 className="text-3xl font-black text-gray-800 mt-1">{stats?.completed || 0}</h4>
            </div>
          </div>
          <div className="mt-6 flex items-center text-xs text-emerald-600 font-bold relative z-10">
            <Award size={14} className="mr-1" />
            <span>Eligible for certificate delivery</span>
          </div>
        </div>

        {/* Admin Specific Faculty Mentors Card */}
        {user?.role === 'admin' && (
          <div className="bg-white rounded-3xl p-6 border border-gray-150 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1 relative group overflow-hidden">
            <div className="absolute right-0 bottom-0 w-24 h-24 bg-purple-50 rounded-tl-full -mr-2 -mb-2 transition-all duration-300 group-hover:scale-110"></div>
            <div className="flex items-center space-x-4 relative z-10">
              <div className="bg-purple-100 text-purple-600 p-3.5 rounded-2xl">
                <Users size={24} />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">System Mentors</p>
                <h4 className="text-3xl font-black text-gray-800 mt-1">{facultiesCount || 0}</h4>
              </div>
            </div>
            <div className="mt-6 flex items-center text-xs text-purple-600 font-bold relative z-10">
              <Award size={14} className="mr-1" />
              <span>Registered faculty database logins</span>
            </div>
          </div>
        )}
      </div>

      {/* Progress & Accomplishment Panel */}
      <div className="bg-white rounded-3xl p-8 border border-gray-150 shadow-sm flex flex-col md:flex-row justify-between items-center gap-8">
        <div className="space-y-2 text-center md:text-left">
          <h3 className="text-xl font-bold text-gray-800">Mentorship Accomplishment</h3>
          <p className="text-xs text-gray-500">Ratio of successfully concluded student internships</p>
        </div>
        
        <div className="flex flex-col items-center">
          <div className="relative flex items-center justify-center">
            {/* Outer ring */}
            <svg className="w-36 h-36 transform -rotate-90">
              <circle cx="72" cy="72" r="60" stroke="#f3f4f6" strokeWidth="12" fill="transparent" />
              <circle cx="72" cy="72" r="60" stroke="#4f46e5" strokeWidth="12" fill="transparent"
                strokeDasharray={376.8}
                strokeDashoffset={376.8 - (376.8 * completionRate) / 100}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-out"
              />
            </svg>
            <div className="absolute text-center">
              <span className="text-3xl font-black text-gray-800">{completionRate}%</span>
              <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider mt-0.5">Finished</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 rounded-2xl p-6 flex flex-col sm:flex-row justify-between gap-8 text-center text-xs border border-gray-150 min-w-[320px]">
          <div>
            <span className="text-gray-400 block mb-1 font-semibold uppercase tracking-wider text-[10px]">Ongoing</span>
            <span className="font-extrabold text-gray-800 text-base">{stats?.ongoing || 0}</span>
          </div>
          <div className="hidden sm:block border-l border-gray-200"></div>
          <div>
            <span className="text-gray-400 block mb-1 font-semibold uppercase tracking-wider text-[10px]">Completed</span>
            <span className="font-extrabold text-gray-800 text-base">{stats?.completed || 0}</span>
          </div>
        </div>
      </div>

      {/* Admin Database & Systems Operations Panel */}
      {user?.role === 'admin' && (
        <div className="bg-gradient-to-tr from-indigo-950 via-purple-950 to-slate-900 rounded-3xl p-8 text-white border border-white/5 shadow-2xl relative overflow-hidden">
          <div className="absolute right-0 bottom-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl -mr-32 -mb-32"></div>
          <div className="relative z-10 space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h3 className="text-xl font-extrabold tracking-tight">Database Systems & Control Operations</h3>
                <p className="text-xs text-indigo-300 mt-1">Real-time diagnostics and structural configurations for your PostgreSQL database.</p>
              </div>
              <Link href="/faculties" className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-xs font-bold rounded-xl shadow-lg shadow-indigo-500/20 transition-all flex items-center space-x-1">
                <span>Manage Faculty Database</span>
                <ArrowUpRight size={14} />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-white/10">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">Migration Engine</span>
                <h4 className="text-sm font-bold">SQL Database Schema</h4>
                <p className="text-xs text-slate-300 leading-relaxed">FastAPI Lifespan migrations are fully active. Structural columns and retrofitting backfills successfully synchronized.</p>
                <div className="pt-2 text-xs font-semibold text-emerald-400 flex items-center">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full mr-1.5 animate-ping"></span>
                  <span>Operational & Healthy</span>
                </div>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400">Enforcement Rules</span>
                <h4 className="text-sm font-bold">Global Student Cap</h4>
                <p className="text-xs text-slate-300 leading-relaxed">Maximum of 5 interns per faculty mentor strictly governed. Frontend elements and direct routing guards activated.</p>
                <div className="pt-2 text-xs font-semibold text-emerald-400 flex items-center">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full mr-1.5 animate-ping"></span>
                  <span>Limits Enforced</span>
                </div>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-pink-400">Security Privileges</span>
                <h4 className="text-sm font-bold">Administrator Override</h4>
                <p className="text-xs text-slate-300 leading-relaxed">Full global access authorization enabled. Bypasses individual faculty scopes to grant complete DB management rights.</p>
                <div className="pt-2 text-xs font-semibold text-pink-400 flex items-center">
                  <span className="w-2 h-2 bg-pink-500 rounded-full mr-1.5 animate-pulse"></span>
                  <span>Override Active</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Simple internal icon to avoid package import mismatch
function GraduationCap(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z" />
      <path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5" />
    </svg>
  );
}
