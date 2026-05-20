import React from 'react';
import { Search, BookOpen, Calendar, Clock, ShieldAlert, Award } from 'lucide-react';

export default function InternshipFilters({ search, setSearch, activeTab, setActiveTab, internships, getRecordStatus }) {
  return (
    <>
      <div className="bg-white p-6 rounded-3xl border border-gray-150 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">Mentored Internships</h2>
          <p className="text-xs text-gray-500 mt-1">Review active students, upload work documents, and manage credentials.</p>
        </div>
        
        <div className="relative w-full md:w-80">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-400">
            <Search size={18} />
          </span>
          <input 
            type="text" 
            placeholder="Search student or faculty assigned..." 
            className="pl-10 pr-4 py-3 w-full rounded-2xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all placeholder-gray-400 shadow-inner" 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
          />
        </div>
      </div>

      <div className="flex bg-gray-100 p-1.5 rounded-2xl w-full md:w-max border border-gray-200 shadow-inner gap-1 overflow-x-auto">
        {[
          { id: 'all', label: 'All', icon: BookOpen },
          { id: 'not_started', label: 'Not Started', icon: Calendar, color: 'text-slate-600 bg-slate-100 border-slate-200' },
          { id: 'ongoing', label: 'Ongoing', icon: Clock, color: 'text-amber-700 bg-amber-50 border-amber-200' },
          { id: 'complete', label: 'Completed', icon: Award, color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
        ].map((tab) => {
          const tabCount = internships.filter(item => tab.id === 'all' ? true : getRecordStatus(item) === tab.id).length;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center space-x-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-white text-indigo-950 shadow-sm border border-gray-200' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-200/50'}`}>
              <tab.icon size={13} />
              <span>{tab.label}</span>
              <span className="text-[10px] bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full font-bold ml-1">{tabCount}</span>
            </button>
          );
        })}
      </div>
    </>
  );
}