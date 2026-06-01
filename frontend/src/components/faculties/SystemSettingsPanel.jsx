import React, { useState, useEffect } from 'react';
import { Calendar, Users, Clock, Save, RefreshCw, AlertCircle } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function SystemSettingsPanel() {
  const [settings, setSettings] = useState({
    project_start_date: '2026-05-18',
    project_end_date: '2026-07-31',
    min_duration_days: '28',
    max_students_per_faculty: '5',
    max_students_per_year: '100',
    allow_faculty_edit: 'true',
    enable_faculty_certificate_tab: 'false',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await api.get('/settings/');
      setSettings((prev) => ({ ...prev, ...res.data }));
    } catch (err) {
      console.error(err);
      toast.error('Failed to load system settings.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    const loadId = toast.loading('Synchronizing system configurations...');
    try {
      await api.put('/settings/', settings);
      toast.success('System configurations updated successfully!', { id: loadId });
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.detail || 'Failed to save system settings.', { id: loadId });
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e) => {
    setSettings({ ...settings, [e.target.name]: e.target.value });
  };

  if (loading) {
    return (
      <div className="bg-white rounded-3xl border border-gray-150 p-12 flex flex-col items-center justify-center space-y-4 shadow-sm">
        <RefreshCw className="animate-spin text-indigo-600" size={32} />
        <span className="text-sm font-semibold text-gray-500 animate-pulse">Retrieving System Rules...</span>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl border border-gray-150 p-8 shadow-sm space-y-6">
      <div>
        <h3 className="text-lg font-bold text-gray-900">Academic Project Constraints</h3>
        <p className="text-xs text-gray-500 mt-1">Configure global validation boundaries, student limit caps, and duration bounds.</p>
      </div>

      <form onSubmit={handleSave} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Section 1: Project Period */}
          <div className="bg-indigo-50/50 rounded-2xl p-6 border border-indigo-100/50 space-y-4">
            <h4 className="text-xs font-bold text-indigo-950 uppercase tracking-wider flex items-center gap-1.5 border-b border-indigo-100 pb-2">
              <Calendar size={14} className="text-indigo-600" />
              <span>Project Period Boundaries</span>
            </h4>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Academic Year Start Date</label>
                <input
                  type="date"
                  name="project_start_date"
                  value={settings.project_start_date}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-gray-300 p-2.5 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Academic Year End Date</label>
                <input
                  type="date"
                  name="project_end_date"
                  value={settings.project_end_date}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-gray-300 p-2.5 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
                  required
                />
              </div>
            </div>
          </div>

          {/* Section 2: Student Capacities & Limits */}
          <div className="bg-purple-50/50 rounded-2xl p-6 border border-purple-100/50 space-y-4">
            <h4 className="text-xs font-bold text-purple-950 uppercase tracking-wider flex items-center gap-1.5 border-b border-purple-100 pb-2">
              <Users size={14} className="text-purple-600" />
              <span>Enrollment & Mentorship Capacities</span>
            </h4>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Max Interns per Faculty Mentor</label>
                <input
                  type="number"
                  name="max_students_per_faculty"
                  value={settings.max_students_per_faculty}
                  onChange={handleChange}
                  min="1"
                  className="w-full rounded-xl border border-gray-300 p-2.5 text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none bg-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Allow Faculty Edit Access</label>
                <select
                  name="allow_faculty_edit"
                  value={settings.allow_faculty_edit || 'true'}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-gray-300 p-2.5 text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none bg-white"
                  required
                >
                  <option value="true">Yes, allow faculties to edit records</option>
                  <option value="false">No, block faculties from editing records</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Enable Faculty Certificates Tab</label>
                <select
                  name="enable_faculty_certificate_tab"
                  value={settings.enable_faculty_certificate_tab || 'false'}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-gray-300 p-2.5 text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none bg-white"
                  required
                >
                  <option value="true">Yes, show hidden Certificates tab for faculties</option>
                  <option value="false">No, hide Certificates tab from faculties (Default)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 3: Durations */}
          <div className="bg-amber-50/50 rounded-2xl p-6 border border-amber-100/50 space-y-4 md:col-span-2">
            <h4 className="text-xs font-bold text-amber-950 uppercase tracking-wider flex items-center gap-1.5 border-b border-amber-100 pb-2">
              <Clock size={14} className="text-amber-600" />
              <span>Duration Verification Boundary</span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Minimum Internship Duration (Days)</label>
                <input
                  type="number"
                  name="min_duration_days"
                  value={settings.min_duration_days}
                  onChange={handleChange}
                  min="1"
                  className="w-full rounded-xl border border-gray-300 p-2.5 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none bg-white"
                  required
                />
              </div>
              <div className="flex gap-2 p-3 bg-amber-50 rounded-xl border border-amber-100 text-xs text-amber-800 leading-relaxed">
                <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
                <p>
                  Any submitted internships with durations less than this setting will be blocked during registration and modification. (Default is 28 days / 4 weeks).
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-gray-150">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-500/10 transition-all disabled:opacity-50 cursor-pointer"
          >
            {saving ? (
              <>
                <RefreshCw size={14} className="animate-spin" />
                <span>Saving Parameters...</span>
              </>
            ) : (
              <>
                <Save size={14} />
                <span>Save System Settings</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
