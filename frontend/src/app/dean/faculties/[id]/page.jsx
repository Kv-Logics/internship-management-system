'use client';
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import api from '../../../../services/api';
import { ArrowLeft, User, BookOpen, Calendar, GraduationCap, Building2 } from 'lucide-react';

const statusColor = (status) => {
  if (status === 'completed') return 'bg-emerald-100 text-emerald-700';
  if (status === 'ongoing') return 'bg-blue-100 text-blue-700';
  return 'bg-gray-100 text-gray-600';
};

const fmt = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

export default function DeanFacultyProfile() {
  const { id } = useParams();
  const router = useRouter();

  const { data: internships = [], isLoading } = useQuery({
    queryKey: ['dean-faculty-internships', id],
    queryFn: async () => {
      const res = await api.get('/internships/');
      return res.data.filter(i => i.faculty?.faculty_id === id || i.faculty_id === id);
    },
    enabled: !!id,
  });

  const faculty = internships[0]?.faculty || null;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Back */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
      >
        <ArrowLeft size={15} /> Back to Faculty List
      </button>

      {/* Header */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
          <User size={26} className="text-indigo-500" />
        </div>
        <div>
          <h1 className="text-xl font-extrabold text-gray-900">
            {faculty ? `Dr. ${faculty.faculty_name}` : 'Faculty Profile'}
          </h1>
          {faculty && <p className="text-sm text-gray-500 mt-0.5">{faculty.email}</p>}
          <span className="inline-block mt-1 text-xs font-semibold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full">
            {internships.length} intern{internships.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Internship List */}
      <div>
        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Interns & Projects</h2>
        {isLoading ? (
          <p className="text-sm text-gray-400">Loading...</p>
        ) : internships.length === 0 ? (
          <p className="text-sm text-gray-400 bg-white rounded-xl border border-gray-100 p-5">No interns assigned yet.</p>
        ) : (
          <ul className="space-y-3">
            {internships.map((internship) => (
              <li key={internship.internship_id} className="bg-white rounded-xl border border-gray-100 shadow-sm px-5 py-4 space-y-2">
                {/* Intern Name & College */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <GraduationCap size={15} className="text-indigo-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="text-sm font-bold text-gray-800">{internship.intern?.intern_name}</span>
                      <span className="text-xs text-gray-400 block flex items-center gap-1">
                        <Building2 size={11} className="inline" /> {internship.intern?.college_name}
                      </span>
                    </div>
                  </div>
                  <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full capitalize flex-shrink-0 ${statusColor(internship.status)}`}>
                    {internship.status || 'ongoing'}
                  </span>
                </div>

                {/* Project */}
                <div className="flex items-start gap-2 text-sm text-gray-600">
                  <BookOpen size={13} className="text-gray-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-semibold text-gray-800">{internship.internship_title}</span>
                    <span className="text-xs text-indigo-500 block">{internship.internship_domain}</span>
                  </div>
                </div>

                {/* Dates */}
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <Calendar size={12} />
                  <span>{fmt(internship.start_date)} — {fmt(internship.end_date)}</span>
                </div>

                {/* Verification Documents */}
                <div className="pt-2.5 border-t border-gray-100 flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-bold text-gray-450 uppercase tracking-wider mr-1">Verification Docs:</span>
                  {internship.documents && internship.documents.length > 0 ? (
                    internship.documents.map((doc) => {
                      const docUrl = `${api.defaults.baseURL.replace(/\/api\/?$/, '')}/${doc.file_path}`;
                      return (
                        <a
                          key={doc.document_id}
                          href={docUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center text-[10px] text-emerald-700 hover:text-emerald-900 font-bold bg-emerald-50 border border-emerald-150 px-2 py-0.5 rounded-lg transition-all"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5"></span>
                          <span>{doc.document_type.toUpperCase()}</span>
                        </a>
                      );
                    })
                  ) : (
                    <span className="text-[10px] text-gray-400 italic">No files uploaded yet</span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
