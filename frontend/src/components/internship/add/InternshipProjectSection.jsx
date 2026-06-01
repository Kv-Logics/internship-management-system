import React from 'react';
import { Award, UserCheck, Edit3, BookOpen, Calendar } from 'lucide-react';

export default function InternshipProjectSection({ formData, handleChange, user, faculties, selectedFacultyId, setSelectedFacultyId, settings }) {
  const minStartDate = settings?.project_start_date || "2026-05-18";
  const maxProjectEndDate = settings?.project_end_date || "2026-07-31";
  const minDurationDays = parseInt(settings?.min_duration_days || "28");

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
            <select
              value={selectedFacultyId}
              onChange={(e) => setSelectedFacultyId(e.target.value)}
              className="w-full rounded-xl border border-gray-300 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white shadow-sm font-semibold text-gray-700 transition-all"
              required
            >
              {faculties.map((fac) => (
                <option key={fac.faculty_id} value={fac.faculty_id}>
                  {fac.faculty_name} ({fac.email})
                </option>
              ))}
            </select>
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
