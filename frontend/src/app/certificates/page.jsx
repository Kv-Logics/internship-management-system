'use client';
import React, { useState, useContext, useEffect } from 'react';
import api from '../../services/api';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  Search, RefreshCw, User, Calendar, FileText, CheckCircle2, AlertCircle, Eye
} from 'lucide-react';
import toast from 'react-hot-toast';
import { AuthContext } from '../providers';
import { useRouter } from 'next/navigation';

export default function CertificatesPortal() {
  const queryClient = useQueryClient();
  const { user } = useContext(AuthContext);
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('eligible'); // 'eligible' | 'generated'

  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => (await api.get('/settings/')).data,
  });

  // Fetch all internships once
  const { data: internships = [], isLoading } = useQuery({
    queryKey: ['internships', 'all'],
    queryFn: async () => (await api.get('/internships/')).data,
  });

  useEffect(() => {
    // If settings are loaded and tab is disabled, boot them out
    if (settings && settings.enable_faculty_certificate_tab !== 'true') {
      router.push('/');
      toast.error('Certificate portal is currently disabled by administrators.');
    }
  }, [settings, router]);

  const refreshList = () => {
    queryClient.invalidateQueries({ queryKey: ['internships'] });
  };

  const handleGenerateCertificate = async (item, e) => {
    if (e) e.stopPropagation();
    const loadId = toast.loading('Generating and signing digital certificate...');
    try {
      let certPath = item.certificate?.certificate_path;
      if (!certPath) {
        const res = await api.post(`/certificates/generate/${item.internship_id}`);
        certPath = res.data.certificate_path;
        toast.success('Certificate generated successfully!', { id: loadId });
        refreshList();
      } else {
        toast.dismiss(loadId);
      }
      
      const url = `${api.defaults.baseURL.replace('/api', '')}/api/certificates/view/${item.internship_id}?t=${Date.now()}`;
      window.open(url, '_blank');
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.detail || 'Failed to generate certificate', { id: loadId });
    }
  };

  // Filter based on active tab and eligibility
  const filtered = internships.filter(item => {
    // Eligibility: Paid + Duration completed
    const isEligible = item.is_paid && new Date(item.end_date) <= new Date();
    
    // Only show eligible ones in this portal
    if (!isEligible) return false;

    // Search filter
    const matchesSearch = 
      item.intern?.intern_name.toLowerCase().includes(search.toLowerCase()) ||
      item.internship_title.toLowerCase().includes(search.toLowerCase());
      
    if (!matchesSearch) return false;

    const hasCert = !!item.certificate;
    if (activeTab === 'eligible') {
      return !hasCert;
    } else {
      return hasCert;
    }
  });

  const getCounts = () => {
    const eligibleList = internships.filter(item => item.is_paid && new Date(item.end_date) <= new Date());
    const eligible = eligibleList.filter(item => !item.certificate).length;
    const generated = eligibleList.filter(item => item.certificate).length;
    return { eligible, generated };
  };

  const counts = getCounts();

  if (settings && settings.enable_faculty_certificate_tab !== 'true') {
    return null; // Don't render while redirecting
  }

  return (
    <div className="space-y-6">
      
      {/* Header Panel */}
      <div className="bg-white p-6 border border-gray-300 text-gray-900 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden">
        
        <div className="z-10">
          <h2 className="text-2xl font-extrabold tracking-tight">Certificate Generation Portal</h2>
          <p className="text-xs text-indigo-200 mt-1">
            Generate and view certificates for students whose billing is cleared and duration is completed.
          </p>
        </div>
        <div className="z-10">
          <button 
            onClick={refreshList} 
            className="flex items-center space-x-1.5 px-4 py-2.5 bg-white/10 hover:bg-white/15 active:bg-white/20 border border-white/10 rounded-none text-xs font-semibold tracking-wider transition-all"
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
            <span>Sync Records</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Row */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-none border border-gray-150 shadow-none">
        
        {/* Sub Tabs */}
        <div className="flex bg-gray-100 p-1 rounded-none w-full md:w-auto border border-gray-200 shadow-none gap-1">
          <button
            onClick={() => setActiveTab('eligible')}
            className={`flex items-center space-x-1.5 px-4 py-2 rounded-none text-xs font-bold transition-all w-full md:w-auto justify-center ${
              activeTab === 'eligible' 
                ? 'bg-indigo-600 text-white shadow-none' 
                : 'text-gray-500 hover:text-indigo-600'
            }`}
          >
            <AlertCircle size={14} />
            <span>Eligible for Generation ({counts.eligible})</span>
          </button>
          <button
            onClick={() => setActiveTab('generated')}
            className={`flex items-center space-x-1.5 px-4 py-2 rounded-none text-xs font-bold transition-all w-full md:w-auto justify-center ${
              activeTab === 'generated' 
                ? 'bg-emerald-600 text-white shadow-none' 
                : 'text-gray-500 hover:text-emerald-600'
            }`}
          >
            <CheckCircle2 size={14} />
            <span>Generated ({counts.generated})</span>
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
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Internship Details</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Certificate Info</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {isLoading && (
                <tr>
                  <td colSpan={4} className="text-center py-12">
                    <div className="flex flex-col items-center space-y-2">
                      <div className="h-8 w-8 animate-spin rounded-none border-4 border-indigo-600 border-t-transparent"></div>
                      <span className="text-xs text-gray-400">Loading listings...</span>
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
                    <button
                      onClick={(e) => handleGenerateCertificate(item, e)}
                      className="flex items-center space-x-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-none font-bold shadow-none transition-all cursor-pointer"
                    >
                      <Eye size={12} />
                      <span>{item.certificate ? 'View Certificate' : 'Generate & View'}</span>
                    </button>
                  </td>
                </tr>
              ))}

              {!isLoading && filtered.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-center py-12 text-gray-450 text-xs italic font-medium">
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
