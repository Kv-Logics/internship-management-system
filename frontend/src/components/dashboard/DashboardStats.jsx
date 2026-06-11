import React from 'react';
import { Users, Clock, Award, TrendingUp } from 'lucide-react';

export default function DashboardStats({ stats, user, facultiesCount }) {
  return (
    <div className={`grid grid-cols-1 ${user?.role === 'admin' ? 'md:grid-cols-4' : 'md:grid-cols-3'} gap-6`}>
      {/* Total Card */}
      <div className="bg-white p-6 border border-gray-300">
        <div className="flex items-center space-x-4">
          <div className="text-blue-700">
            <Users size={32} />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Total Internships</p>
            <h4 className="text-3xl font-black text-gray-900 mt-1">{stats?.total || 0}</h4>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-gray-100 flex items-center text-xs text-gray-600 font-semibold">
          <TrendingUp size={14} className="mr-1 text-blue-600" />
          <span>Active mentored student records</span>
        </div>
      </div>

      {/* Ongoing Card */}
      <div className="bg-white p-6 border border-gray-300">
        <div className="flex items-center space-x-4">
          <div className="text-amber-600">
            <Clock size={32} />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Ongoing Projects</p>
            <h4 className="text-3xl font-black text-gray-900 mt-1">{stats?.ongoing || 0}</h4>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-gray-100 flex items-center text-xs text-gray-600 font-semibold">
          <Clock size={14} className="mr-1 text-amber-600" />
          <span>Currently under active mentoring</span>
        </div>
      </div>

      {/* Completed Card */}
      <div className="bg-white p-6 border border-gray-300">
        <div className="flex items-center space-x-4">
          <div className="text-emerald-600">
            <Award size={32} />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Completed Projects</p>
            <h4 className="text-3xl font-black text-gray-900 mt-1">{stats?.completed || 0}</h4>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-gray-100 flex items-center text-xs text-gray-600 font-semibold">
          <Award size={14} className="mr-1 text-emerald-600" />
          <span>Eligible for certificate delivery</span>
        </div>
      </div>

      {/* Admin Specific Faculty Mentors Card */}
      {user?.role === 'admin' && (
        <div className="bg-white p-6 border border-gray-300">
          <div className="flex items-center space-x-4">
            <div className="text-purple-600">
              <Users size={32} />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-gray-500">System Mentors</p>
              <h4 className="text-3xl font-black text-gray-900 mt-1">{facultiesCount || 0}</h4>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100 flex items-center text-xs text-gray-600 font-semibold">
            <Award size={14} className="mr-1 text-purple-600" />
            <span>Registered faculty database logins</span>
          </div>
        </div>
      )}
    </div>
  );
}
