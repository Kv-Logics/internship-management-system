'use client';
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import api from '../../../services/api';
import { Search, ChevronRight, User } from 'lucide-react';

export default function DeanFacultyList() {
  const [search, setSearch] = useState('');
  const router = useRouter();

  const { data: faculties = [], isLoading } = useQuery({
    queryKey: ['dean-faculties'],
    queryFn: async () => {
      const res = await api.get('/auth/faculties');
      return res.data;
    },
  });

  const filtered = faculties.filter(f =>
    f.faculty_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900">Faculty Overview</h1>
        <p className="text-sm text-gray-500 mt-1">Search and view interns under each faculty mentor.</p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search faculty by name..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          autoFocus
        />
      </div>

      {/* List */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {isLoading ? (
          <p className="text-sm text-gray-400 p-6">Loading...</p>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-gray-400 p-6">No faculty found.</p>
        ) : (
          <ul className="divide-y divide-gray-50">
            {filtered.map((f) => (
              <li key={f.faculty_id}>
                <button
                  onClick={() => router.push(`/dean/faculties/${f.faculty_id}`)}
                  className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-indigo-50 transition-colors text-left group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                      <User size={15} className="text-indigo-600" />
                    </div>
                    <div>
                      <span className="text-sm font-semibold text-gray-800">{f.faculty_name}</span>
                      <span className="text-xs text-gray-400 block">{f.email}</span>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-gray-300 group-hover:text-indigo-500 transition-colors" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
