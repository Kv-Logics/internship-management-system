import React from 'react';
import { Mail, Trash2, ChevronRight } from 'lucide-react';

export default function FacultyCard({ fac, internships, setSelectedFaculty, handleDeleteFaculty, user, deletingId }) {
  const facInternsCount = internships.filter(item => (item.faculty_id || item.faculty?.faculty_id) === fac.faculty_id).length;
  
  return (
    <div onClick={() => setSelectedFaculty(fac)} className="bg-white rounded-3xl border border-gray-200/80 p-6 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col justify-between group">
      <div className="space-y-4">
        <div className="flex justify-between items-start">
          <span className={`inline-flex px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${fac.role === 'dean' ? 'bg-amber-100 text-amber-800' : 'bg-indigo-100 text-indigo-800'}`}>
            {fac.role || 'Faculty'}
          </span>
          
          {fac.email !== 'admin@nitt.edu' && user?.role === 'admin' && (
            <button onClick={(e) => handleDeleteFaculty(fac.faculty_id, e)} disabled={deletingId === fac.faculty_id} className="p-1.5 text-gray-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-all opacity-0 group-hover:opacity-100" title="Delete Faculty Account">
              <Trash2 size={15} />
            </button>
          )}
        </div>

        <div>
          <h3 className="text-lg font-bold text-gray-800 group-hover:text-indigo-600 transition-colors">{fac.faculty_name}</h3>
          <p className="text-xs text-gray-400 flex items-center mt-1">
            <Mail size={12} className="mr-1" /> {fac.email}
          </p>
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-gray-100 flex justify-between items-center text-xs">
        <div className="text-gray-500 font-medium">Mentoring: <span className="font-bold text-indigo-600">{facInternsCount} Students</span></div>
        <span className="text-indigo-600 group-hover:translate-x-1 transition-transform flex items-center font-bold">
          <span>Inspect Details</span><ChevronRight size={14} className="ml-0.5" />
        </span>
      </div>
    </div>
  );
}
