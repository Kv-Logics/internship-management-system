import React, { useState, useEffect } from 'react';
import { Calendar, Users, Clock, Save, RefreshCw, AlertCircle, Mail, ShieldCheck } from 'lucide-react';
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
  const [smtpSettings, setSmtpSettings] = useState({
    smtp_host: '',
    smtp_port: '',
    smtp_username: '',
    smtp_password: '',
    smtp_secure: 'ssl',
    has_password: false,
  });
  const [testEmail, setTestEmail] = useState('');
  const [testingSmtp, setTestingSmtp] = useState(false);
  const [savingSmtp, setSavingSmtp] = useState(false);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const [res, smtpRes] = await Promise.all([
        api.get('/settings/'),
        api.get('/settings/smtp')
      ]);
      setSettings((prev) => ({ ...prev, ...res.data }));
      setSmtpSettings({
        smtp_host: smtpRes.data.smtp_host || '',
        smtp_port: smtpRes.data.smtp_port || '',
        smtp_username: smtpRes.data.smtp_username || '',
        smtp_password: smtpRes.data.has_password ? '********' : '',
        smtp_secure: smtpRes.data.smtp_secure || 'ssl',
        has_password: smtpRes.data.has_password || false,
      });
    } catch (err) {
      console.error(err);
      toast.error('Failed to load system configurations.');
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

  const handleSaveSmtp = async (e) => {
    e.preventDefault();
    setSavingSmtp(true);
    const loadId = toast.loading('Updating SMTP configurations...');
    try {
      await api.put('/settings/smtp', smtpSettings);
      toast.success('SMTP configurations updated successfully!', { id: loadId });
      // Refresh to get the updated status
      const smtpRes = await api.get('/settings/smtp');
      setSmtpSettings({
        smtp_host: smtpRes.data.smtp_host || '',
        smtp_port: smtpRes.data.smtp_port || '',
        smtp_username: smtpRes.data.smtp_username || '',
        smtp_password: smtpRes.data.has_password ? '********' : '',
        smtp_secure: smtpRes.data.smtp_secure || 'ssl',
        has_password: smtpRes.data.has_password || false,
      });
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.detail || 'Failed to save SMTP settings.', { id: loadId });
    } finally {
      setSavingSmtp(false);
    }
  };

  const handleTestSmtp = async (e) => {
    e.preventDefault();
    if (!testEmail) {
      toast.error('Please specify a reception email address to test.');
      return;
    }
    setTestingSmtp(true);
    const loadId = toast.loading(`Sending test email to ${testEmail}...`);
    try {
      await api.post('/settings/smtp/test', { recipient_email: testEmail });
      toast.success('Test email sent successfully! Please check your inbox.', { id: loadId });
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.detail || 'Failed to send test email. Double check credentials.', { id: loadId });
    } finally {
      setTestingSmtp(false);
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

      {/* Dynamic SMTP Configuration Section */}
      <div className="bg-white rounded-3xl border border-gray-150 p-8 shadow-sm space-y-6 mt-6">
        <div>
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Mail className="text-indigo-600" size={20} />
            <span>SMTP Mail Delivery Configuration</span>
          </h3>
          <p className="text-xs text-gray-500 mt-1">Configure custom email server settings to deliver completion certificates dynamically from the system.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* SMTP Config Form */}
          <form onSubmit={handleSaveSmtp} className="lg:col-span-2 bg-indigo-50/30 rounded-2xl p-6 border border-indigo-100/50 space-y-4">
            <h4 className="text-xs font-bold text-indigo-950 uppercase tracking-wider flex items-center gap-1.5 border-b border-indigo-100 pb-2">
              <ShieldCheck size={14} className="text-indigo-600" />
              <span>Mail Server Credentials</span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">SMTP Host</label>
                <input
                  type="text"
                  name="smtp_host"
                  value={smtpSettings.smtp_host}
                  onChange={(e) => setSmtpSettings({ ...smtpSettings, smtp_host: e.target.value })}
                  placeholder="e.g. smtp.gmail.com"
                  className="w-full rounded-xl border border-gray-300 p-2.5 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">SMTP Port</label>
                <input
                  type="text"
                  name="smtp_port"
                  value={smtpSettings.smtp_port}
                  onChange={(e) => setSmtpSettings({ ...smtpSettings, smtp_port: e.target.value })}
                  placeholder="e.g. 465 or 587"
                  className="w-full rounded-xl border border-gray-300 p-2.5 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">SMTP Username</label>
                <input
                  type="text"
                  name="smtp_username"
                  value={smtpSettings.smtp_username}
                  onChange={(e) => setSmtpSettings({ ...smtpSettings, smtp_username: e.target.value })}
                  placeholder="e.g. sender@nitt.edu"
                  className="w-full rounded-xl border border-gray-300 p-2.5 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">SMTP Password</label>
                <input
                  type="password"
                  name="smtp_password"
                  value={smtpSettings.smtp_password}
                  onChange={(e) => setSmtpSettings({ ...smtpSettings, smtp_password: e.target.value })}
                  placeholder={smtpSettings.has_password ? '********' : 'Enter password'}
                  className="w-full rounded-xl border border-gray-300 p-2.5 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
                  required={!smtpSettings.has_password}
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-gray-700 mb-1">Connection Security</label>
                <select
                  name="smtp_secure"
                  value={smtpSettings.smtp_secure}
                  onChange={(e) => setSmtpSettings({ ...smtpSettings, smtp_secure: e.target.value })}
                  className="w-full rounded-xl border border-gray-300 p-2.5 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
                  required
                >
                  <option value="ssl">SSL (Recommended for Port 465)</option>
                  <option value="tls">TLS / STARTTLS (Recommended for Port 587)</option>
                  <option value="none">None (Plaintext/Non-encrypted Port 25)</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={savingSmtp}
                className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs font-bold rounded-xl shadow-md transition-all disabled:opacity-50 cursor-pointer"
              >
                {savingSmtp ? (
                  <>
                    <RefreshCw size={12} className="animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save size={12} />
                    <span>Save SMTP Settings</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* SMTP Test Card */}
          <div className="bg-purple-50/30 rounded-2xl p-6 border border-purple-100/50 flex flex-col justify-between space-y-4">
            <div>
              <h4 className="text-xs font-bold text-purple-950 uppercase tracking-wider flex items-center gap-1.5 border-b border-purple-100 pb-2">
                <Mail size={14} className="text-purple-600" />
                <span>Test Connection</span>
              </h4>
              <p className="text-xs text-gray-600 mt-3 leading-relaxed">
                Before sending certificates to interns, test your configured settings by sending a test email to a reception address.
              </p>
            </div>

            <form onSubmit={handleTestSmtp} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Reception Email</label>
                <input
                  type="email"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  placeholder="recipient@example.com"
                  className="w-full rounded-xl border border-gray-300 p-2.5 text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none bg-white"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={testingSmtp}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white text-xs font-bold rounded-xl shadow-md transition-all disabled:opacity-50 cursor-pointer"
              >
                {testingSmtp ? (
                  <>
                    <RefreshCw size={12} className="animate-spin" />
                    <span>Sending Test...</span>
                  </>
                ) : (
                  <span>Send Test Email</span>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
