'use client';
import React, { useState, useContext } from 'react';
import api from '../../services/api';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  Download, FileText, CheckCircle, Upload, Search, Edit2, X, Save, 
  Mail, Calendar, GraduationCap, Eye, Trash2, BookOpen, Clock, Award, ShieldAlert, CheckCircle2, User, Phone
} from 'lucide-react';
import toast from 'react-hot-toast';
import { AuthContext } from '../providers';

export default function InternshipList() {
  const queryClient = useQueryClient();
  const { user } = useContext(AuthContext);
  const [search, setSearch] = useState('');
  
  // Status filter tabs state: 'all' | 'not_started' | 'ongoing' | 'pending' | 'complete'
  const [activeTab, setActiveTab] = useState('ongoing');

  // Preview Modal state
  const [previewItem, setPreviewItem] = useState(null);

  // Edit Modal state
  const [editingItem, setEditingItem] = useState(null);
  const [editForm, setEditForm] = useState({
    intern_name: '',
    intern_email: '',
    intern_phone: '',
    college_name: '',
    department: '',
    internship_title: '',
    internship_domain: '',
    internship_mode: 'Hybrid',
    start_date: '',
    end_date: '',
    remarks: ''
  });

  // Fetch internships based on the search query
  const { data: internships = [], isLoading } = useQuery({
    queryKey: ['internships', search],
    queryFn: async () => (await api.get(`/internships/?search=${search}`)).data,
  });

  const refreshList = () => queryClient.invalidateQueries({ queryKey: ['internships'] });

  const handleGenerateCertificate = async (id, e) => {
    if (e) e.stopPropagation();
    const loadId = toast.loading('Generating and signing digital certificate...');
    try {
      await api.post(`/certificates/generate/${id}`);
      toast.success('Certificate generated successfully!', { id: loadId });
      refreshList();
    } catch (err) {
      toast.error('Failed to generate certificate', { id: loadId });
    }
  };

  const handleUpload = async (e, id, type) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('document_type', type);
    
    const loadId = toast.loading(`Uploading student ${type}...`);
    try {
      await api.post(`/documents/upload/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} uploaded successfully!`, { id: loadId });
      refreshList();
    } catch (err) {
      toast.error('Upload failed. Please try again.', { id: loadId });
    }
  };

  const handleEditClick = (item, e) => {
    if (e) e.stopPropagation();
    setEditingItem(item);
    setEditForm({
      intern_name: item.intern?.intern_name || '',
      intern_email: item.intern?.email || '',
      intern_phone: item.intern?.phone || '',
      college_name: item.intern?.college_name || '',
      department: item.intern?.department || '',
      internship_title: item.internship_title || '',
      internship_domain: item.internship_domain || '',
      internship_mode: item.internship_mode || 'Hybrid',
      start_date: item.start_date || '',
      end_date: item.end_date || '',
      remarks: item.remarks || ''
    });
  };

  const handleSaveEdit = async () => {
    if (!editForm.intern_name || !editForm.intern_email || !editForm.internship_title || !editForm.start_date || !editForm.end_date) {
      toast.error('Please fill in all required fields.');
      return;
    }

    const loadId = toast.loading('Saving updated parameters...');
    try {
      await api.put(`/internships/${editingItem.internship_id}`, {
        internship_title: editForm.internship_title,
        internship_domain: editForm.internship_domain,
        internship_mode: editForm.internship_mode,
        start_date: editForm.start_date,
        end_date: editForm.end_date,
        remarks: editForm.remarks,
        intern_name: editForm.intern_name,
        intern_email: editForm.intern_email,
        intern_phone: editForm.intern_phone,
        college_name: editForm.college_name,
        department: editForm.department
      });
      setEditingItem(null);
      refreshList();
      toast.success('Mentorship record updated successfully!', { id: loadId });
    } catch (err) {
      toast.error('Failed to update record', { id: loadId });
    }
  };

  const handleDeleteRecord = async (id, e) => {
    if (e) e.stopPropagation();
    if (!window.confirm('Are you absolutely sure you want to delete this internship record from the system database?')) {
      return;
    }

    const loadId = toast.loading('Deleting internship record...');
    try {
      await api.delete(`/internships/${id}`);
      toast.success('Record deleted successfully!', { id: loadId });
      refreshList();
      if (previewItem?.internship_id === id) {
        setPreviewItem(null);
      }
    } catch (err) {
      toast.error('Failed to delete record.', { id: loadId });
    }
  };

  const handleSendEmail = async (id, e) => {
    if (e) e.stopPropagation();
    const loadingToast = toast.loading('Sending digital certificate via email...');
    try {
      await api.post(`/certificates/email/${id}`);
      toast.success('Official certificate email sent to student successfully!', { id: loadingToast });
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to send certificate email.', { id: loadingToast });
    }
  };

  // Helper: calculate user-friendly duration
  const calculateDuration = (start, end) => {
    if (!start || !end) return 'N/A';
    const sDate = new Date(start);
    const eDate = new Date(end);
    const diffTime = Math.abs(eDate - sDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays >= 30) {
      const months = Math.floor(diffDays / 30);
      const remainingDays = diffDays % 30;
      return `${months} month${months > 1 ? 's' : ''}${remainingDays > 0 ? ` ${remainingDays} day${remainingDays > 1 ? 's' : ''}` : ''}`;
    }
    if (diffDays >= 7) {
      const weeks = Math.floor(diffDays / 7);
      const remainingDays = diffDays % 7;
      return `${weeks} week${weeks > 1 ? 's' : ''}${remainingDays > 0 ? ` ${remainingDays} day${remainingDays > 1 ? 's' : ''}` : ''}`;
    }
    return `${diffDays} day${diffDays > 1 ? 's' : ''}`;
  };

  // Helper: Classify record into a status category
  const getRecordStatus = (item) => {
    const today = new Date();
    const start = new Date(item.start_date);
    const end = new Date(item.end_date);

    if (start > today) {
      return 'not_started';
    } else if (start <= today && today <= end) {
      return 'ongoing';
    } else if (end < today && !item.certificate) {
      return 'pending';
    } else {
      return 'complete';
    }
  };

  // Filter internships dynamically based on the active tab
  const filteredInternships = internships.filter((item) => {
    const status = getRecordStatus(item);
    if (activeTab === 'all') return true;
    return status === activeTab;
  });

  return (
    <div className="space-y-6">
      
      {/* Header and Filter Control */}
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

      {/* Interactive Tabs */}
      <div className="flex bg-gray-100 p-1.5 rounded-2xl w-full md:w-max border border-gray-200 shadow-inner gap-1 overflow-x-auto">
        {[
          { id: 'all', label: 'All', icon: BookOpen },
          { id: 'not_started', label: 'Not Started', icon: Calendar, color: 'text-slate-600 bg-slate-100 border-slate-200' },
          { id: 'ongoing', label: 'Ongoing', icon: Clock, color: 'text-amber-700 bg-amber-50 border-amber-200' },
          { id: 'pending', label: 'Pending Signature', icon: ShieldAlert, color: 'text-rose-700 bg-rose-50 border-rose-200' },
          { id: 'complete', label: 'Completed', icon: Award, color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
        ].map((tab) => {
          const tabCount = internships.filter(item => tab.id === 'all' ? true : getRecordStatus(item) === tab.id).length;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === tab.id 
                  ? 'bg-white text-indigo-950 shadow-sm border border-gray-200' 
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-200/50'
              }`}
            >
              <tab.icon size={13} />
              <span>{tab.label}</span>
              <span className="text-[10px] bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full font-bold ml-1">{tabCount}</span>
            </button>
          );
        })}
      </div>
      
      {/* Clean Table Container */}
      <div className="bg-white rounded-3xl border border-gray-150 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-150">
            <thead className="bg-gray-50/75">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Student Profile</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Faculty Mentor</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Project Duration</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Verification Docs</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Management Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {isLoading && (
                <tr>
                  <td colSpan="5" className="text-center py-12">
                    <div className="flex flex-col items-center space-y-2">
                      <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
                      <span className="text-xs text-gray-400">Fetching database records...</span>
                    </div>
                  </td>
                </tr>
              )}
              
              {!isLoading && filteredInternships.map((item) => {
                const status = getRecordStatus(item);
                return (
                  <tr key={item.internship_id} className="hover:bg-indigo-50/5 transition-colors">
                    {/* Student Profile */}
                    <td className="px-6 py-5 whitespace-nowrap">
                      <div className="flex items-center space-x-3">
                        <div className="h-10 w-10 bg-indigo-100/70 text-indigo-700 flex items-center justify-center rounded-xl font-extrabold text-sm uppercase shrink-0">
                          {item.intern?.intern_name?.slice(0, 2) || 'ST'}
                        </div>
                        <div>
                          <div className="text-sm font-bold text-gray-800">{item.intern?.intern_name || 'N/A'}</div>
                          <div className="text-xs text-gray-400 mt-0.5">{item.intern?.college_name || 'N/A'}</div>
                          <span className={`inline-flex text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider mt-1.5 ${
                            status === 'not_started' ? 'bg-slate-100 text-slate-700' :
                            status === 'ongoing' ? 'bg-amber-100 text-amber-800' :
                            status === 'pending' ? 'bg-rose-100 text-rose-800' :
                            'bg-emerald-100 text-emerald-800'
                          }`}>
                            {status === 'not_started' ? 'Not Started' :
                             status === 'ongoing' ? 'Ongoing' :
                             status === 'pending' ? 'Pending Signature' :
                             'Completed'}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Faculty Mentor */}
                    <td className="px-6 py-5 whitespace-nowrap">
                      <div className="text-sm font-bold text-gray-800">
                        {item.faculty?.faculty_name || 'Not Assigned'}
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5">
                        {item.faculty?.email || 'N/A'}
                      </div>
                    </td>

                    {/* Project Duration */}
                    <td className="px-6 py-5 whitespace-nowrap">
                      <div className="text-sm font-bold text-indigo-600 leading-tight">
                        {calculateDuration(item.start_date, item.end_date)}
                      </div>
                      <div className="text-[10px] text-gray-400 mt-1 flex items-center">
                        <Calendar size={11} className="mr-1" />
                        <span>{new Date(item.start_date).toLocaleDateString()} to {new Date(item.end_date).toLocaleDateString()}</span>
                      </div>
                    </td>

                    {/* Verification Docs */}
                    <td className="px-6 py-5 whitespace-nowrap">
                      <div className="flex flex-col space-y-2 text-xs font-semibold">
                        <div className="flex space-x-3">
                          <label className="cursor-pointer text-indigo-600 hover:text-indigo-800 flex items-center space-x-1 hover:underline">
                            <Upload size={14} />
                            <span>Report</span>
                            <input type="file" className="hidden" onChange={(e) => handleUpload(e, item.internship_id, 'report')} />
                          </label>

                          <label className="cursor-pointer text-blue-600 hover:text-blue-800 flex items-center space-x-1 hover:underline">
                            <Upload size={14} />
                            <span>Proof</span>
                            <input type="file" className="hidden" onChange={(e) => handleUpload(e, item.internship_id, 'proof')} />
                          </label>
                        </div>

                        <div className="flex flex-wrap gap-1 mt-1">
                          {item.documents?.map(doc => (
                            <a 
                              key={doc.document_id} 
                              href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/${doc.file_path}`} 
                              target="_blank" 
                              rel="noreferrer" 
                              className="inline-flex items-center text-[9px] text-emerald-600 hover:text-emerald-800 font-bold bg-emerald-50 border border-emerald-150 p-1 px-2 rounded-lg"
                            >
                              <CheckCircle size={10} className="mr-1" />
                              <span>{doc.document_type.toUpperCase()}</span>
                            </a>
                          ))}
                        </div>
                      </div>
                    </td>

                    {/* Management Actions */}
                    <td className="px-6 py-5 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-3">
                        {/* Preview Icon */}
                        <button
                          onClick={() => setPreviewItem(item)}
                          className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 border border-transparent hover:border-indigo-100 rounded-lg transition-all"
                          title="Preview Details"
                        >
                          <Eye size={15} />
                        </button>

                        {/* Edit Icon */}
                        <button
                          onClick={(e) => handleEditClick(item, e)}
                          className="p-1.5 text-gray-500 hover:text-amber-600 hover:bg-amber-50 border border-transparent hover:border-amber-100 rounded-lg transition-all"
                          title="Edit Entire Record"
                        >
                          <Edit2 size={15} />
                        </button>

                        {/* Generate Cert / Action buttons */}
                        {!item.certificate ? (
                          status === 'complete' || status === 'pending' ? (
                            <button 
                              onClick={(e) => handleGenerateCertificate(item.internship_id, e)} 
                              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
                            >
                              Issue Cert
                            </button>
                          ) : null
                        ) : (
                          <div className="flex space-x-2">
                            <a 
                              href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/${item.certificate.certificate_path}`} 
                              target="_blank" 
                              rel="noreferrer" 
                              className="p-1.5 text-emerald-600 hover:bg-emerald-50 border border-transparent hover:border-emerald-100 rounded-lg transition-all"
                              title="Download Signed Certificate"
                            >
                              <Download size={15} />
                            </a>
                            <button 
                              onClick={(e) => handleSendEmail(item.internship_id, e)} 
                              className="p-1.5 text-blue-600 hover:bg-blue-50 border border-transparent hover:border-blue-100 rounded-lg transition-all"
                              title="Email Cert to Student"
                            >
                              <Mail size={15} />
                            </button>
                          </div>
                        )}

                        {/* Delete Record Option for Admin */}
                        {user?.role === 'admin' && (
                          <button
                            onClick={(e) => handleDeleteRecord(item.internship_id, e)}
                            className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-100 rounded-lg transition-all"
                            title="Delete Record"
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              
              {!isLoading && filteredInternships.length === 0 && (
                <tr>
                  <td colSpan="5" className="text-center py-12 text-gray-450 text-xs italic font-medium">
                    No active student records found matching the selection.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ==================== PREVIEW MODAL ==================== */}
      {previewItem && (
        <div className="fixed inset-0 bg-slate-900/70 z-50 flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-white rounded-3xl w-full max-w-2xl border border-gray-200 overflow-hidden shadow-2xl animate-scaleUp">
            
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-900 to-indigo-950 p-6 text-white flex justify-between items-start">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-3 py-1 rounded-full">
                  Internship Profile Registry
                </span>
                <h3 className="text-xl font-extrabold mt-3">{previewItem.intern?.intern_name}</h3>
                <p className="text-xs text-indigo-200 mt-1 flex items-center">
                  <GraduationCap size={12} className="mr-1" /> {previewItem.intern?.college_name} • {previewItem.intern?.department}
                </p>
              </div>
              <button 
                onClick={() => setPreviewItem(null)}
                className="p-2 hover:bg-white/10 rounded-xl text-white/80 hover:text-white transition-all"
              >
                <X size={18} />
              </button>
            </div>

            {/* Details Body */}
            <div className="p-6 space-y-6 overflow-y-auto max-h-[70vh]">
              {/* Mentorship Linkage */}
              <div className="bg-indigo-50/50 rounded-2xl p-4 border border-indigo-100 flex items-center justify-between">
                <div>
                  <span className="text-[9px] font-bold text-indigo-600 uppercase tracking-wide block">Assigned Faculty Mentor</span>
                  <strong className="text-sm text-indigo-950 font-bold">{previewItem.faculty?.faculty_name || 'Not Assigned'}</strong>
                </div>
                <div className="text-right">
                  <span className="text-[9px] font-bold text-indigo-600 uppercase tracking-wide block">Contact Email</span>
                  <span className="text-xs text-indigo-900 font-semibold">{previewItem.faculty?.email || 'N/A'}</span>
                </div>
              </div>

              {/* Grid Specifications */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider border-b pb-2">Student Particulars</h4>
                  <div className="space-y-2 text-xs font-medium text-gray-700">
                    <p className="flex items-center"><Mail size={13} className="mr-2 text-gray-400" /> {previewItem.intern?.email}</p>
                    <p className="flex items-center"><Phone size={13} className="mr-2 text-gray-400" /> {previewItem.intern?.phone || 'No phone'}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider border-b pb-2">Project Particulars</h4>
                  <div className="space-y-2 text-xs font-medium text-gray-700">
                    <p className="font-bold text-gray-800 leading-snug">{previewItem.internship_title}</p>
                    <p className="flex items-center mt-1"><BookOpen size={13} className="mr-2 text-gray-400" /> Domain: {previewItem.internship_domain}</p>
                    <p className="flex items-center"><Clock size={13} className="mr-2 text-gray-400" /> Mode: {previewItem.internship_mode || 'Hybrid'}</p>
                  </div>
                </div>
              </div>

              {/* Period & Duration */}
              <div className="border-t border-gray-150 pt-4 space-y-3">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Mentorship Timeline</h4>
                <div className="grid grid-cols-3 gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-200">
                  <div>
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Start Date</span>
                    <p className="text-xs font-bold mt-1 text-gray-700">{new Date(previewItem.start_date).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">End Date</span>
                    <p className="text-xs font-bold mt-1 text-gray-700">{new Date(previewItem.end_date).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Total Duration</span>
                    <p className="text-xs font-extrabold mt-1 text-indigo-600">{calculateDuration(previewItem.start_date, previewItem.end_date)}</p>
                  </div>
                </div>
              </div>

              {/* Uploaded Verification Docs */}
              <div className="border-t border-gray-150 pt-4 space-y-3">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Uploaded Verification Documents</h4>
                <div className="flex flex-wrap gap-2">
                  {previewItem.documents && previewItem.documents.length > 0 ? (
                    previewItem.documents.map((doc) => (
                      <a 
                        key={doc.document_id} 
                        href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/${doc.file_path}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center space-x-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 rounded-xl text-xs font-bold transition-all"
                      >
                        <CheckCircle2 size={13} />
                        <span>{doc.document_type.toUpperCase()} PDF</span>
                      </a>
                    ))
                  ) : (
                    <p className="text-xs italic text-gray-400 font-medium">No files uploaded yet.</p>
                  )}
                </div>
              </div>

              {/* Remarks */}
              {previewItem.remarks && (
                <div className="border-t border-gray-150 pt-4 space-y-2">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Administrative Remarks</h4>
                  <p className="text-xs text-gray-600 bg-gray-50 border border-gray-200 rounded-2xl p-3.5 italic leading-relaxed">
                    "{previewItem.remarks}"
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="bg-gray-50 border-t border-gray-150 p-5 px-6 flex justify-end space-x-3">
              <button
                onClick={() => setPreviewItem(null)}
                className="px-5 py-2.5 bg-white hover:bg-gray-100 border border-gray-300 rounded-xl text-xs font-bold text-gray-700 transition-all cursor-pointer"
              >
                Close Registry
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ==================== FULL EDIT MODAL ==================== */}
      {editingItem && (
        <div className="fixed inset-0 bg-slate-900/70 z-50 flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-white rounded-3xl w-full max-w-2xl border border-gray-200 overflow-hidden shadow-2xl animate-scaleUp">
            
            {/* Header */}
            <div className="bg-gradient-to-r from-amber-600 to-amber-700 p-6 text-white flex justify-between items-start">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest bg-white/20 text-amber-100 border border-white/20 px-3 py-1 rounded-full">
                  Record Modification Studio
                </span>
                <h3 className="text-xl font-extrabold mt-3">Edit Record: {editingItem.intern?.intern_name}</h3>
                <p className="text-xs text-amber-100 mt-1">Make structural changes to student details or project specifications.</p>
              </div>
              <button 
                onClick={() => setEditingItem(null)}
                className="p-2 hover:bg-white/10 rounded-xl text-white/80 hover:text-white transition-all"
              >
                <X size={18} />
              </button>
            </div>

            {/* Form Fields Body */}
            <div className="p-6 space-y-6 overflow-y-auto max-h-[65vh] grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider col-span-full border-b pb-1 flex items-center">
                <User size={13} className="mr-1 text-amber-600" />
                <span>1. Student Profile Data</span>
              </h4>
              
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Student Full Name *</label>
                <input
                  type="text"
                  value={editForm.intern_name}
                  onChange={(e) => setEditForm({...editForm, intern_name: e.target.value})}
                  className="w-full rounded-xl border border-gray-300 p-2.5 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Institutional Email *</label>
                <input
                  type="email"
                  value={editForm.intern_email}
                  onChange={(e) => setEditForm({...editForm, intern_email: e.target.value})}
                  className="w-full rounded-xl border border-gray-300 p-2.5 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Contact Phone</label>
                <input
                  type="text"
                  value={editForm.intern_phone}
                  onChange={(e) => setEditForm({...editForm, intern_phone: e.target.value})}
                  className="w-full rounded-xl border border-gray-300 p-2.5 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">College Name</label>
                <input
                  type="text"
                  value={editForm.college_name}
                  onChange={(e) => setEditForm({...editForm, college_name: e.target.value})}
                  className="w-full rounded-xl border border-gray-300 p-2.5 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-gray-700 mb-1">Department</label>
                <input
                  type="text"
                  value={editForm.department}
                  onChange={(e) => setEditForm({...editForm, department: e.target.value})}
                  className="w-full rounded-xl border border-gray-300 p-2.5 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider col-span-full border-b pb-1 pt-2 flex items-center">
                <Award size={13} className="mr-1 text-amber-600" />
                <span>2. Project Specifications</span>
              </h4>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-gray-700 mb-1">Project / Internship Title *</label>
                <input
                  type="text"
                  value={editForm.internship_title}
                  onChange={(e) => setEditForm({...editForm, internship_title: e.target.value})}
                  className="w-full rounded-xl border border-gray-300 p-2.5 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Technology Domain *</label>
                <input
                  type="text"
                  value={editForm.internship_domain}
                  onChange={(e) => setEditForm({...editForm, internship_domain: e.target.value})}
                  className="w-full rounded-xl border border-gray-300 p-2.5 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Internship Mode</label>
                <select
                  value={editForm.internship_mode}
                  onChange={(e) => setEditForm({...editForm, internship_mode: e.target.value})}
                  className="w-full rounded-xl border border-gray-300 p-2.5 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none bg-white"
                >
                  <option value="Hybrid">Hybrid</option>
                  <option value="Online">Online</option>
                  <option value="Physical">Physical</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Start Date *</label>
                <input
                  type="date"
                  value={editForm.start_date}
                  onChange={(e) => setEditForm({...editForm, start_date: e.target.value})}
                  className="w-full rounded-xl border border-gray-300 p-2.5 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">End Date *</label>
                <input
                  type="date"
                  value={editForm.end_date}
                  onChange={(e) => setEditForm({...editForm, end_date: e.target.value})}
                  className="w-full rounded-xl border border-gray-300 p-2.5 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-gray-700 mb-1">Remarks & Details</label>
                <textarea
                  value={editForm.remarks}
                  onChange={(e) => setEditForm({...editForm, remarks: e.target.value})}
                  className="w-full h-20 rounded-xl border border-gray-300 p-2.5 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  placeholder="Additional student accomplishments..."
                />
              </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 border-t border-gray-150 p-5 px-6 flex justify-end space-x-3">
              <button
                onClick={() => setEditingItem(null)}
                className="px-5 py-2.5 bg-white hover:bg-gray-100 border border-gray-300 rounded-xl text-xs font-bold text-gray-700 transition-all cursor-pointer"
              >
                Discard Changes
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white rounded-xl text-xs font-bold shadow-md shadow-amber-600/10 transition-all cursor-pointer flex items-center space-x-1"
              >
                <Save size={13} />
                <span>Save Modification</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
