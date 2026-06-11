'use client';
import React, { useState, useContext } from 'react';
import api from '../../services/api';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  Mail, Search, CheckCircle2, AlertCircle, RefreshCw, 
  User, Calendar, Send, FileText, CheckCircle, HelpCircle, Download
} from 'lucide-react';
import toast from 'react-hot-toast';
import { AuthContext } from '../providers';

export default function CertificateEmailPortal() {
  const queryClient = useQueryClient();
  const { user } = useContext(AuthContext);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' | 'sent'
  const [isDownloading, setIsDownloading] = useState(false);

  // Fetch all internships once
  const { data: internships = [], isLoading } = useQuery({
    queryKey: ['internships', 'all'],
    queryFn: async () => (await api.get('/internships/')).data,
    enabled: !!user,
  });

  const refreshList = () => {
    queryClient.invalidateQueries({ queryKey: ['internships'] });
  };

  const handleBulkDownload = async () => {
    setIsDownloading(true);
    const loadId = toast.loading('Archiving eligible certificates...');
    try {
      const response = await api.get('/certificates/bulk-download', {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      const dateStr = new Date().toISOString().split('T')[0];
      link.setAttribute('download', `Bulk_Certificates_${dateStr}.zip`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.success('Certificates archived and downloaded securely!', { id: loadId });
    } catch (err) {
      console.error(err);
      toast.error('Failed to download certificates archive. Are there any eligible students?', { id: loadId });
    } finally {
      setIsDownloading(false);
    }
  };

  const handleSendEmail = async (item, e) => {
    if (e) e.stopPropagation();
    const loadingToast = toast.loading('Sending digital certificate via email...');
    try {
      // 1. Generate certificate if it is missing
      if (!item.certificate) {
        toast.loading('Generating certificate PDF first...', { id: loadingToast });
        await api.post(`/certificates/generate/${item.internship_id}`);
      }
      
      // 2. Dispatch email
      toast.loading('Dispatching email securely to student...', { id: loadingToast });
      await api.post(`/certificates/email/${item.internship_id}`);
      
      toast.success('Official certificate email sent to student successfully!', { id: loadingToast });
      refreshList();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.detail || 'Failed to send certificate email.', { id: loadingToast });
    }
  };

  // Local filtering based on active tab
  const filtered = internships.filter(item => {
    // Only paid AND completed internships are eligible for emailing
    if (!item.is_paid) return false;
    if (new Date(item.end_date) > new Date()) return false;

    // Search filter
    const matchesSearch = 
      item.intern?.intern_name.toLowerCase().includes(search.toLowerCase()) ||
      item.internship_title.toLowerCase().includes(search.toLowerCase()) ||
      (item.faculty?.faculty_name || '').toLowerCase().includes(search.toLowerCase());
      
    if (!matchesSearch) return false;

    if (activeTab === 'pending') {
      return !item.is_emailed;
    } else {
      return item.is_emailed;
    }
  });

  const getCounts = () => {
    const eligibleList = internships.filter(item => item.is_paid && new Date(item.end_date) <= new Date());
    const pending = eligibleList.filter(item => !item.is_emailed).length;
    const sent = eligibleList.filter(item => item.is_emailed).length;
    return { pending, sent };
  };

  const counts = getCounts();

  return (
    <div className="space-y-6">
      
      {/* Header Panel */}
      <div className="bg-white p-6 border border-gray-300 text-gray-900 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden">
        
        <div className="z-10">
          <h2 className="text-2xl font-extrabold tracking-tight">Certificate Delivery Portal</h2>
        </div>
        <div className="z-10 flex flex-col sm:flex-row gap-3">
          <button 
            onClick={handleBulkDownload}
            disabled={isDownloading || counts.pending + counts.sent === 0}
            className="flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-50 border border-emerald-600 rounded-none text-xs font-semibold text-white transition-all cursor-pointer"
          >
            <Download size={14} className={isDownloading ? 'animate-bounce' : ''} />
            <span>Bulk ZIP Download</span>
          </button>
          <button 
            onClick={refreshList} 
            className="flex items-center space-x-1.5 px-4 py-2 bg-white hover:bg-gray-50 border border-gray-300 rounded-none text-xs font-semibold text-gray-700 transition-all cursor-pointer"
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
            <span>Sync Certificates</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Row */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-none border border-gray-150 shadow-none">
        
        {/* Sub Tabs */}
        <div className="flex bg-gray-100 p-1 rounded-none w-full md:w-auto border border-gray-200 shadow-none gap-1">
          <button
            onClick={() => setActiveTab('pending')}
            className={`flex items-center space-x-1.5 px-4 py-2 rounded-none text-xs font-bold transition-all w-full md:w-auto justify-center ${
              activeTab === 'pending' 
                ? 'bg-indigo-600 text-white shadow-none' 
                : 'text-gray-500 hover:text-indigo-600'
            }`}
          >
            <AlertCircle size={14} />
            <span>Pending Email ({counts.pending})</span>
          </button>
          <button
            onClick={() => setActiveTab('sent')}
            className={`flex items-center space-x-1.5 px-4 py-2 rounded-none text-xs font-bold transition-all w-full md:w-auto justify-center ${
              activeTab === 'sent' 
                ? 'bg-emerald-600 text-white shadow-none' 
                : 'text-gray-500 hover:text-emerald-600'
            }`}
          >
            <CheckCircle2 size={14} />
            <span>Email Sent ({counts.sent})</span>
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-72">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-slate-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-none leading-5 bg-slate-50 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-xs font-semibold transition-all"
            placeholder="Search by student or domain..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

      </div>

      {/* Main Table */}
      <div className="bg-white rounded-none border border-gray-150 shadow-none overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-150">
            <thead className="bg-gray-50/75">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Student Profile</th>
                {user?.role !== 'faculty' && (
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Faculty Mentor</th>
                )}
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Internship Details</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Certificate Info</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {isLoading && (
                <tr>
                  <td colSpan={user?.role === 'faculty' ? 4 : 5} className="text-center py-12">
                    <div className="flex flex-col items-center space-y-2">
                      <div className="h-8 w-8 animate-spin rounded-none border-4 border-indigo-600 border-t-transparent"></div>
                      <span className="text-xs text-gray-400">Loading delivery listings...</span>
                    </div>
                  </td>
                </tr>
              )}

              {!isLoading && filtered.map((item) => (
                <tr key={item.internship_id} className="hover:bg-indigo-50/5 transition-colors">
                  <td className="px-6 py-5 whitespace-nowrap">
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 bg-indigo-100/70 text-indigo-700 flex items-center justify-center rounded-none shrink-0">
                        <User size={18} />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-gray-800">{item.intern?.intern_name || 'N/A'}</div>
                        <div className="text-xs text-gray-400 mt-0.5">{item.intern?.email || 'No Email'}</div>
                      </div>
                    </div>
                  </td>
                  {user?.role !== 'faculty' && (
                    <td className="px-6 py-5 whitespace-nowrap">
                      <div className="text-sm font-bold text-gray-800">{item.faculty?.faculty_name || 'Not Assigned'}</div>
                      <div className="text-xs text-gray-400 mt-0.5">{item.faculty?.email || 'N/A'}</div>
                    </td>
                  )}
                  <td className="px-6 py-5 whitespace-nowrap">
                    <div className="text-xs font-bold text-gray-700 truncate max-w-[200px]">{item.internship_title}</div>
                    <div className="text-[10px] text-gray-400 mt-1 flex items-center">
                      <Calendar size={11} className="mr-1" />
                      <span>{new Date(item.start_date).toLocaleDateString()} to {new Date(item.end_date).toLocaleDateString()}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5 whitespace-nowrap">
                    {item.certificate?.certificate_number ? (
                      <div className="flex flex-col space-y-0.5">
                        <span className="text-xs font-mono font-bold text-indigo-900 bg-indigo-50 p-1 px-1.5 rounded-none w-max border border-indigo-150">
                          {item.certificate.certificate_number}
                        </span>
                        <span className="text-[9px] text-gray-450">Generated</span>
                      </div>
                    ) : (
                      <span className="text-[10px] text-gray-450 italic">Awaiting Generation</span>
                    )}
                  </td>
                  <td className="px-6 py-5 whitespace-nowrap text-xs font-medium">
                    {activeTab === 'pending' ? (
                      <button
                        onClick={(e) => handleSendEmail(item, e)}
                        className="flex items-center space-x-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-none font-bold shadow-none transition-all cursor-pointer"
                      >
                        <Send size={12} />
                        <span>Send Certificate</span>
                      </button>
                    ) : (
                      <span className="inline-flex items-center text-[10px] bg-emerald-50 text-emerald-700 font-bold px-2.5 py-0.5 rounded-none border border-emerald-150">
                        Email Dispatched
                      </span>
                    )}
                  </td>
                </tr>
              ))}

              {!isLoading && filtered.length === 0 && (
                <tr>
                  <td colSpan={user?.role === 'faculty' ? 4 : 5} className="text-center py-12 text-gray-450 text-xs italic font-medium">
                    No students found matching this category.
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
