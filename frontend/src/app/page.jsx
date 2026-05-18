'use client';
import React, { useContext, useState, useEffect } from 'react';
import api from '../services/api';
import { useQuery } from '@tanstack/react-query';
import { LayoutDashboard, Users, Clock, Award, ArrowUpRight, TrendingUp, Calendar, BookOpen } from 'lucide-react';
import Link from 'next/link';
import { AuthContext } from './providers';
import DashboardStats from '../components/dashboard/DashboardStats';
import MentorshipProgress from '../components/dashboard/MentorshipProgress';
import AdminOperationsPanel from '../components/dashboard/AdminOperationsPanel';

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

      <DashboardStats stats={stats} user={user} facultiesCount={facultiesCount} />
      <MentorshipProgress stats={stats} completionRate={completionRate} />

      {user?.role === 'admin' && <AdminOperationsPanel />}
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
