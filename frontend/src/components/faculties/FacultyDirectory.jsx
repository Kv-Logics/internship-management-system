import React from 'react';
import { Search } from 'lucide-react';
import FacultyCard from './FacultyCard';

export default function FacultyDirectory({ search, setSearch, filteredFaculties, internships, setSelectedFaculty, handleDeleteFaculty, user, deletingId }) {
  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Search bar */}
      <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-400 pointer-events-none">
            <Search size={18} />
          </span>
          <input type="text" placeholder="Search by mentor name or institutional email..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 pr-4 py-3 w-full bg-white border border-gray-250 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent shadow-sm transition-all" />
        </div>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredFaculties.length > 0 ? (
          filteredFaculties.map((fac) => (
            <FacultyCard key={fac.faculty_id} fac={fac} internships={internships} setSelectedFaculty={setSelectedFaculty} handleDeleteFaculty={handleDeleteFaculty} user={user} deletingId={deletingId} />
          ))
        ) : (
          <div className="col-span-full py-12 text-center text-gray-400 font-medium italic text-sm">No matching faculty database records found.</div>
        )}
      </div>
    </div>
  );
}