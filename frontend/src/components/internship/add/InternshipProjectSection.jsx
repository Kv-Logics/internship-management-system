import React, { useState, useRef, useEffect } from 'react';
import { Award, UserCheck, Edit3, BookOpen, Calendar, Search, ChevronDown } from 'lucide-react';

export default function InternshipProjectSection({ formData, handleChange, user, faculties, selectedFacultyId, setSelectedFacultyId, settings }) {
  const minStartDate = settings?.project_start_date || "2026-05-18";
  const maxProjectEndDate = settings?.project_end_date || "2026-07-31";
  const minDurationDays = parseInt(settings?.min_duration_days || "28");

  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredFaculties = faculties.filter(fac => 
    fac.faculty_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    fac.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedFaculty = faculties.find(fac => fac.faculty_id === selectedFacultyId);

  const calculateDateOffset = (dateStr, days) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "";
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
  };
  
  const minEndDate = calculateDateOffset(formData.start_date, minDurationDays) || minStartDate;
  const maxEndDate = maxProjectEndDate;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-150 overflow-hidden">
      <div className="bg-purple-50 border-b border-purple-100 p-5 px-6 flex items-center space-x-3">
        <div className="bg-purple-600 p-2 rounded-lg text-white">
          <Award size={20} />
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-800">Internship Project</h3>
          <p className="text-xs text-purple-600">Research or practical development specifications</p>
        </div>
      </div>

      <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        {user?.role === 'admin' && (
          <div className="md:col-span-2 bg-indigo-50/50 p-5 rounded-2xl border border-indigo-100/50 mb-2">
            <label className="block text-sm font-bold text-indigo-900 mb-2 flex items-center">
              <UserCheck size={18} className="mr-1.5 text-indigo-600 animate-pulse" />
              Assign Faculty Mentor
            </label>
            <p className="text-xs text-indigo-700/80 mb-3">As an administrator, select which faculty member will act as the official mentor for this student.</p>
            
            <div className="relative" ref={dropdownRef}>
              <div 
                className="w-full rounded-xl border border-gray-300 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white shadow-sm font-semibold text-gray-700 cursor-pointer flex justify-between items-center transition-all"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              >
                <span className="truncate">
                  {selectedFaculty ? `${selectedFaculty.faculty_name} (${selectedFaculty.email})` : "Select a Faculty Mentor..."}
                </span>
                <ChevronDown size={18} className={`text-gray-400 transition-transform ${isDropdownOpen ? "rotate-180" : ""}`} />
              </div>

              {isDropdownOpen && (
                <div className="absolute z-10 w-full mt-2 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                  <div className="p-2 border-b border-gray-100 bg-gray-50/50">
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                        <Search size={16} />
                      </span>
                      <input
                        type="text"
                        className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                        placeholder="Search by name or email..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        autoFocus
                      />
                    </div>
                  </div>
                  <ul className="max-h-60 overflow-y-auto py-1 custom-scrollbar">
                    {filteredFaculties.length > 0 ? (
                      filteredFaculties.map((fac) => (
                        <li 
                          key={fac.faculty_id}
                          className={`px-4 py-2.5 text-sm cursor-pointer hover:bg-indigo-50 transition-colors ${selectedFacultyId === fac.faculty_id ? "bg-indigo-100/50 text-indigo-900 font-bold" : "text-gray-700 font-medium"}`}
                          onClick={() => {
                            setSelectedFacultyId(fac.faculty_id);
                            setIsDropdownOpen(false);
                            setSearchQuery('');
                          }}
                        >
                          <div className="flex flex-col">
                            <span>{fac.faculty_name}</span>
                            <span className="text-xs text-gray-500 font-normal">{fac.email}</span>
                          </div>
                        </li>
                      ))
                    ) : (
                      <li className="px-4 py-3 text-sm text-gray-500 text-center italic">
                        No faculty members found.
                      </li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Internship Work Title <span className="text-xs font-normal text-gray-500">(to fit: "...carried out the internship work titled...")</span>
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-400">
              <Edit3 size={18} />
            </span>
            <input
              type="text"
              name="internship_title"
              value={formData.internship_title}
              onChange={handleChange}
              placeholder="e.g. Dynamic Graph Neural Networks Research"
              className="pl-10 w-full rounded-lg border border-gray-300 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Research / Tech Domain</label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-400">
              <BookOpen size={18} />
            </span>
            <input
              type="text"
              name="internship_domain"
              value={formData.internship_domain}
              onChange={handleChange}
              placeholder="e.g. AI / Machine Learning"
              className="pl-10 w-full rounded-lg border border-gray-300 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Mode of Internship</label>
          <select
            name="internship_mode"
            value="Offline"
            onChange={handleChange}
            className="w-full rounded-lg border border-gray-300 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all bg-gray-50 cursor-not-allowed font-semibold text-gray-600"
            disabled
          >
            <option value="Offline">Offline Only</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Project Period</label>
          <div className="grid grid-cols-2 gap-4">
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-400">
                <Calendar size={16} />
              </span>
              <input
                type="date"
                min={minStartDate}
                name="start_date"
                value={formData.start_date}
                onChange={handleChange}
                className="pl-9 w-full rounded-lg border border-gray-300 p-2 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                required
              />
            </div>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-400">
                <Calendar size={16} />
              </span>
              <input
                type="date"
                min={minEndDate}
                max={maxEndDate}
                name="end_date"
                value={formData.end_date}
                onChange={handleChange}
                className="pl-9 w-full rounded-lg border border-gray-300 p-2 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                required
              />
            </div>
          </div>
        </div>


        <div className="md:col-span-2">
          <label className="block text-sm font-semibold text-gray-700 mb-2">Remarks / Special Directions (Optional)</label>
          <textarea
            name="remarks"
            value={formData.remarks}
            onChange={handleChange}
            placeholder="Add any specific performance notes, tools used, or structural goals..."
            rows={3}
            className="w-full rounded-lg border border-gray-300 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
          />
        </div>
      </div>
    </div>
  );
}
