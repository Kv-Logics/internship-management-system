import React from 'react';
import { Search, Mail, Trash2, Eye, User } from 'lucide-react';

export default function FacultyDirectory({ search, setSearch, filteredFaculties, internships, setSelectedFaculty, handleDeleteFaculty, user, deletingId }) {
  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Search bar */}
      <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-400 pointer-events-none">
            <Search size={18} />
          </span>
          <input 
            type="text" 
            placeholder="Search by mentor name or institutional email..." 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
            className="pl-10 pr-4 py-2.5 w-full bg-white border border-gray-200 rounded-none text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-none transition-all" 
          />
        </div>
      </div>

      {/* Lightweight List */}
      <div className="bg-white rounded-none border border-gray-150 shadow-none overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-150">
            <thead className="bg-gray-50/75">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Faculty Member</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Institutional Email</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">System Role</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Mentored Interns</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {filteredFaculties.length > 0 ? (
                filteredFaculties.map((fac) => {
                  const facInternsCount = internships.filter(item => (item.faculty_id || item.faculty?.faculty_id) === fac.faculty_id).length;
                  return (
                    <tr 
                      key={fac.faculty_id} 
                      className="hover:bg-indigo-50/5 transition-colors cursor-pointer"
                      onClick={() => setSelectedFaculty(fac)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-3">
                          <div className="h-8 w-8 bg-indigo-150 text-indigo-700 flex items-center justify-center rounded-none shrink-0">
                            <User size={15} />
                          </div>
                          <span className="text-sm font-bold text-gray-800">{fac.faculty_name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500 flex items-center">
                          <Mail size={13} className="mr-1.5 text-gray-400" />
                          <span>{fac.email}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-0.5 rounded-none text-[10px] font-bold uppercase tracking-wider ${fac.role === 'dean' ? 'bg-amber-100 text-amber-800' : fac.role === 'admin' ? 'bg-rose-100 text-rose-800' : 'bg-indigo-100 text-indigo-800'}`}>
                          {fac.role || 'faculty'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-700">
                        {facInternsCount} / 5
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2" onClick={(e) => e.stopPropagation()}>
                          <button 
                            onClick={() => setSelectedFaculty(fac)} 
                            className="p-1.5 text-gray-550 hover:text-indigo-600 hover:bg-indigo-50 rounded-none transition-all" 
                            title="Inspect Details"
                          >
                            <Eye size={15} />
                          </button>
                          {fac.email !== 'admin@nitt.edu' && user?.role === 'admin' && (
                            <button 
                              onClick={(e) => handleDeleteFaculty(fac.faculty_id, e)} 
                              disabled={deletingId === fac.faculty_id} 
                              className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-none transition-all disabled:opacity-50" 
                              title="Delete Faculty Account"
                            >
                              <Trash2 size={15} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="5" className="px-6 py-10 text-center text-gray-450 italic text-xs font-medium">
                    No matching faculty records found.
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
