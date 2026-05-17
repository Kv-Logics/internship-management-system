'use client';
import React from 'react';
import api from '../services/api';
import { useQuery } from '@tanstack/react-query';

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

  return { total: all.length, ongoing, completed };
};

export default function Dashboard() {
  const { data: stats, isLoading, isError } = useQuery({
    queryKey: ['dashboardStats'],
    queryFn: fetchDashboardStats
  });

  if (isLoading) return <div className="text-gray-500 animate-pulse">Loading dashboard...</div>;
  if (isError) return <div className="text-red-500">Failed to load dashboard data.</div>;

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4 text-gray-800">Dashboard</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow border-t-4 border-blue-500">
          <h3 className="text-gray-500 text-sm font-semibold">Total Internships</h3>
          <p className="text-3xl font-bold text-gray-800">{stats?.total || 0}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow border-t-4 border-yellow-500">
          <h3 className="text-gray-500 text-sm font-semibold">Ongoing</h3>
          <p className="text-3xl font-bold text-gray-800">{stats?.ongoing || 0}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow border-t-4 border-green-500">
          <h3 className="text-gray-500 text-sm font-semibold">Completed</h3>
          <p className="text-3xl font-bold text-gray-800">{stats?.completed || 0}</p>
        </div>
      </div>
    </div>
  );
}
