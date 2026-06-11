import React from 'react';
import { ArrowLeft, Mail, UserCheck, GraduationCap, BookOpen, Calendar, Eye, Trash2 } from 'lucide-react';

export default function FacultyDetailView({ selectedFaculty, setSelectedFaculty, facultyInternships, handlePreviewCertificate, handleDeleteInternship, user }) {
  if (!selectedFaculty) return null;
  
  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center space-x-4">
        <button onClick={() => setSelectedFaculty(null)} className="p-2.5 bg-white hover:bg-gray-50 border border-gray-250 rounded-none shadow-none text-gray-700 hover:text-indigo-600 transition-all flex items-center justify-center">
          <ArrowLeft size={18} />
        </button>
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-2xl font-bold text-gray-900">{selectedFaculty.faculty_name}</h2>
            <span className={`px-2.5 py-0.5 rounded-none text-xs font-semibold uppercase tracking-wider ${selectedFaculty.role === 'dean' ? 'bg-amber-100 text-amber-800' : 'bg-indigo-100 text-indigo-800'}`}>
              {selectedFaculty.role || 'Faculty'}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1 flex items-center">
            <Mail size={12} className="mr-1" /> {selectedFaculty.email}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-none p-5 border border-gray-200/80 shadow-none">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Total Mentored</p>
          <h4 className="text-2xl font-black text-gray-800 mt-1">{facultyInternships.length} Students</h4>
        </div>
        <div className="bg-white rounded-none p-5 border border-gray-200/80 shadow-none">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Active Mentorship Capacity</p>
          <div className="flex items-center justify-between mt-1">
            <h4 className="text-2xl font-black text-indigo-600">{facultyInternships.length} / 5</h4>
            <span className={`text-[10px] px-2 py-0.5 rounded-none font-bold uppercase ${facultyInternships.length >= 5 ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'}`}>
              {facultyInternships.length >= 5 ? 'At Capacity' : 'Available'}
            </span>
          </div>
        </div>
        <div className="bg-white rounded-none p-5 border border-gray-200/80 shadow-none">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">System Logs</p>
          <h4 className="text-sm font-semibold text-emerald-600 mt-2 flex items-center">
            <UserCheck size={16} className="mr-1" /> Active login authorized
          </h4>
        </div>
      </div>

      <div className="bg-white rounded-none border border-gray-200/80 shadow-none overflow-hidden">
        <div className="p-5 border-b border-gray-150 bg-gray-50/50">
          <h3 className="text-base font-bold text-gray-800">Mentored Internship Records</h3>
          <p className="text-xs text-gray-500">View, audit, manage, or delete internships linked to this mentor.</p>
        </div>

        <div className="divide-y divide-gray-150">
          {facultyInternships.length > 0 ? (
            facultyInternships.map((item) => (
              <div key={item.internship_id} className="p-6 hover:bg-indigo-50/10 transition-colors">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2"><GraduationCap className="h-5 w-5 text-indigo-600" /><h4 className="text-base font-bold text-gray-900">{item.intern?.intern_name}</h4><span className={`text-[10px] px-2.5 py-0.5 rounded-none font-bold uppercase tracking-wider ${new Date(item.end_date) < new Date() ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>{new Date(item.end_date) < new Date() ? 'Completed' : 'Ongoing'}</span></div>
                    <p className="text-xs text-gray-500 font-medium">{item.intern?.college_name} • {item.intern?.department}</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1 text-xs text-gray-500">
                      <div className="flex items-center"><BookOpen size={14} className="mr-1.5 text-gray-400" /> Domain: {item.internship_domain}</div>
                      <div className="flex items-center"><Calendar size={14} className="mr-1.5 text-gray-400" /> End Date: {new Date(item.end_date).toLocaleDateString()}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-wrap md:justify-end">
                    {(item.certificate || new Date(item.end_date) < new Date() || user?.role === 'admin') && (<button onClick={(e) => handlePreviewCertificate(item, e)} className="flex items-center space-x-1.5 px-3.5 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-none text-xs font-bold hover:bg-emerald-100 transition-all"><Eye size={14} /><span>Preview Cert</span></button>)}
                    <button onClick={() => handleDeleteInternship(item.internship_id)} className="p-2 text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 rounded-none transition-all" title="Delete Internship Record"><Trash2 size={16} /></button>
                  </div>
                </div>
              </div>
            ))
          ) : (<div className="p-8 text-center text-gray-400 font-medium italic text-sm">This faculty member has not registered any student internships yet.</div>)}
        </div>
      </div>
    </div>
  );
}
