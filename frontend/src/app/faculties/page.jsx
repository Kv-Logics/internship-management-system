'use client';
import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Search, Trash2, Mail, ShieldAlert, Award, UserCheck, RefreshCw } from 'lucide-react';

export default function FacultyDatabase() {
  const { user } = useContext(AuthContext);
  const router = useRouter();
  const [faculties, setFaculties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    if (user && user.role !== 'admin') {
      toast.error('Access Denied: Only administrators can view this page.');
      router.push('/');
    } else {
      fetchFaculties();
    }
  }, [user, router]);

  const fetchFaculties = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await api.get('/auth/faculties', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setFaculties(response.data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load faculties database records.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (facultyId) => {
    if (!window.confirm('Are you absolutely sure you want to delete this faculty member? All their linked internships will also be permanently deleted.')) {
      return;
    }

    setDeletingId(facultyId);
    try {
      const token = localStorage.getItem('token');
      await api.delete(`/auth/faculties/${facultyId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      toast.success('Faculty member deleted successfully.');
      setFaculties(faculties.filter(fac => fac.faculty_id !== facultyId));
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.detail || 'Failed to delete faculty record.');
    } finally {
      setDeletingId(null);
    }
  };

  const filteredFaculties = faculties.filter(fac => 
    fac.faculty_name.toLowerCase().includes(search.toLowerCase()) ||
    fac.email.toLowerCase().includes(search.toLowerCase()) ||
    (fac.role || '').toLowerCase().includes(search.toLowerCase())
  );

  if (loading && faculties.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-indigo-600 font-semibold space-y-3">
        <RefreshCw className="animate-spin text-indigo-600" size={32} />
        <span>Loading faculties database...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Overview Card */}
      <div className="bg-gradient-to-r from-indigo-850 to-indigo-950 p-6 rounded-2xl border border-indigo-500/10 text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Faculty & Mentor Database</h2>
          <p className="text-xs text-indigo-200 mt-1">Manage and audit all system logins, roles, and faculty records.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={fetchFaculties} 
            className="flex items-center space-x-1 px-4 py-2 bg-white/10 hover:bg-white/15 active:bg-white/20 border border-white/10 rounded-xl text-xs font-semibold tracking-wider transition-all"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>Refresh Table</span>
          </button>
          <div className="bg-indigo-500/20 px-4 py-2 rounded-xl border border-indigo-500/30 text-indigo-200 font-bold text-xs">
            Total Records: {faculties.length}
          </div>
        </div>
      </div>

      {/* Control Panel */}
      <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
        {/* Search Bar */}
        <div className="relative flex-1 max-w-md">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400 pointer-events-none">
            <Search size={18} />
          </span>
          <input
            type="text"
            placeholder="Search by name, email, or system role..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 pr-4 py-2.5 w-full bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent shadow-sm transition-all"
          />
        </div>
      </div>

      {/* Database Table */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-xs font-semibold uppercase tracking-wider text-gray-500">
                <th className="py-4 px-6">Faculty Name</th>
                <th className="py-4 px-6">Email Address</th>
                <th className="py-4 px-6">Assigned System Role</th>
                <th className="py-4 px-6 text-right">Database Controls</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-150 text-sm text-gray-700">
              {filteredFaculties.length > 0 ? (
                filteredFaculties.map((fac) => (
                  <tr key={fac.faculty_id} className="hover:bg-indigo-50/20 transition-colors">
                    {/* Name */}
                    <td className="py-4 px-6 font-semibold text-gray-900">
                      {fac.faculty_name}
                    </td>
                    
                    {/* Email */}
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-1.5 text-gray-500">
                        <Mail size={14} className="text-gray-400" />
                        <span>{fac.email}</span>
                      </div>
                    </td>

                    {/* Role */}
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                        fac.role === 'dean'
                          ? 'bg-amber-100 text-amber-800 border border-amber-200/50'
                          : fac.role === 'admin'
                          ? 'bg-rose-100 text-rose-800 border border-rose-200/50'
                          : 'bg-indigo-100 text-indigo-800 border border-indigo-200/50'
                      }`}>
                        {fac.role === 'dean' ? (
                          <>
                            <Award size={12} />
                            <span>Dean / Director</span>
                          </>
                        ) : fac.role === 'admin' ? (
                          <>
                            <ShieldAlert size={12} />
                            <span>System Admin</span>
                          </>
                        ) : (
                          <>
                            <UserCheck size={12} />
                            <span>Faculty Mentor</span>
                          </>
                        )}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-6 text-right">
                      {fac.email === 'admin@nitt.edu' ? (
                        <span className="text-xs text-gray-400 italic font-medium pr-3 select-none">System Protected</span>
                      ) : (
                        <button
                          onClick={() => handleDelete(fac.faculty_id)}
                          disabled={deletingId === fac.faculty_id}
                          className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg border border-transparent hover:border-rose-200 transition-all inline-flex items-center space-x-1.5 disabled:opacity-50"
                          title="Delete Faculty Account"
                        >
                          <Trash2 size={16} />
                          <span className="text-xs font-bold">Delete</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="py-8 text-center text-gray-400 font-medium italic">
                    No matching faculty records found in database.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
