'use client';
import React, { useContext } from 'react';
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
      </div>

      {/* Progress & Overview Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Progress Card */}
        <div className="bg-white rounded-3xl p-6 border border-gray-150 shadow-sm lg:col-span-1 flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-800 mb-2">Mentorship Accomplishment</h3>
            <p className="text-xs text-gray-500">Ratio of successfully concluded internships</p>
          </div>
          
          <div className="my-8 flex flex-col items-center">
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

          <div className="bg-gray-50 rounded-2xl p-4 flex justify-between text-center text-xs">
            <div>
              <span className="text-gray-400 block mb-1">Ongoing</span>
              <span className="font-bold text-gray-800 text-sm">{stats?.ongoing || 0}</span>
            </div>
            <div className="border-l border-gray-250"></div>
            <div>
              <span className="text-gray-400 block mb-1">Completed</span>
              <span className="font-bold text-gray-800 text-sm">{stats?.completed || 0}</span>
            </div>
            <div className="border-l border-gray-250"></div>
            <div>
              <span className="text-gray-400 block mb-1">Success</span>
              <span className="font-bold text-indigo-600 text-sm">Perfect</span>
            </div>
          </div>
        </div>

        {/* Recent Internships List */}
        <div className="bg-white rounded-3xl p-6 border border-gray-150 shadow-sm lg:col-span-2">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-lg font-bold text-gray-800">Recent Registrations</h3>
              <p className="text-xs text-gray-500">Overview of the last 5 registered students</p>
            </div>
            <Link href="/internships" className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center space-x-1">
              <span>View All Records</span>
              <ArrowUpRight size={14} />
            </Link>
          </div>

          <div className="space-y-4">
            {stats?.recent && stats.recent.length > 0 ? (
              stats.recent.map((item) => (
                <div key={item.internship_id} className="flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100/70 rounded-2xl border border-gray-100 transition-all group">
                  <div className="flex items-center space-x-4">
                    <div className="bg-indigo-50 text-indigo-600 p-2.5 rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition-all">
                      <GraduationCap className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-gray-800">{item.intern?.intern_name}</h4>
                      <p className="text-xs text-gray-400 flex items-center mt-0.5">
                        <BookOpen size={12} className="mr-1" />
                        {item.internship_domain}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider ${
                      new Date(item.end_date) < new Date() 
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                        : 'bg-amber-100 text-amber-800 border border-amber-200'
                    }`}>
                      {new Date(item.end_date) < new Date() ? 'Completed' : 'Ongoing'}
                    </span>
                    <p className="text-[10px] text-gray-400 mt-2 font-medium">
                      Ends: {new Date(item.end_date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-400 text-xs">
                No recent records found. Click "Add New Intern" to start.
              </div>
            )}
          </div>
        </div>
      </div>
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
