import React from 'react';
import { Users, Clock, Award, TrendingUp } from 'lucide-react';

export default function DashboardStats({ stats, user, facultiesCount }) {
  return (
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
  );
}