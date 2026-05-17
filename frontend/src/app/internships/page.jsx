'use client';
import React, { useState } from 'react';
import api from '../../services/api';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Download, FileText, CheckCircle, Upload, Search, Edit2, X, Save, Mail, Calendar, Globe, GraduationCap, ArrowUpDown } from 'lucide-react';
import toast from 'react-hot-toast';

export default function InternshipList() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ start_date: '', end_date: '', intern_email: '' });

  // Fetch internships based on the search query
  const { data: internships = [], isLoading } = useQuery({
    queryKey: ['internships', search],
    queryFn: async () => (await api.get(`/internships/?search=${search}`)).data,
  });

  const refreshList = () => queryClient.invalidateQueries({ queryKey: ['internships'] });

  const handleGenerateCertificate = async (id) => {
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

  const handleEditClick = (item) => {
    setEditingId(item.internship_id);
    setEditForm({ 
      start_date: item.start_date || '', 
      end_date: item.end_date || '', 
      intern_email: item.intern?.email || '' 
    });
  };

  const handleSaveEdit = async (item) => {
    const loadId = toast.loading('Saving updated parameters...');
    try {
      await api.put(`/internships/${item.internship_id}`, {
        internship_title: item.internship_title, 
        start_date: editForm.start_date,
        end_date: editForm.end_date,
        intern_email: editForm.intern_email
      });
      setEditingId(null);
      refreshList();
      toast.success('Mentorship record updated successfully!', { id: loadId });
    } catch (err) {
      toast.error('Failed to update record', { id: loadId });
    }
  };

  const handleSendEmail = async (id) => {
    const loadingToast = toast.loading('Sending digital certificate via email...');
    try {
      await api.post(`/certificates/email/${id}`);
      toast.success('Official certificate email sent to student successfully!', { id: loadingToast });
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to send certificate email.', { id: loadingToast });
    }
  };

  const isCompleted = (endDate) => new Date(endDate) < new Date();

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
            placeholder="Search student or tech domain..." 
            className="pl-10 pr-4 py-3 w-full rounded-2xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all placeholder-gray-400" 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
          />
        </div>
      </div>
      
      {/* Table Container */}
      <div className="bg-white rounded-3xl border border-gray-150 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-150">
            <thead className="bg-gray-50/75">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Student Profile</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Project Specification</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Mentorship Period</th>
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
                      <span className="text-xs text-gray-400">Fetching records...</span>
                    </div>
                  </td>
                </tr>
              )}
              
              {!isLoading && internships.map((item) => (
                <tr key={item.internship_id} className="hover:bg-indigo-50/10 transition-colors">
                  {/* Student Profile */}
                  <td className="px-6 py-5 whitespace-nowrap">
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 bg-indigo-100/70 text-indigo-700 flex items-center justify-center rounded-xl font-extrabold text-sm uppercase">
                        {item.intern?.intern_name?.slice(0, 2) || 'ST'}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-gray-800">{item.intern?.intern_name || 'N/A'}</div>
                        <div className="text-xs text-gray-400 mt-0.5">{item.intern?.college_name || 'N/A'}</div>
                        
                        {editingId === item.internship_id ? (
                          <input 
                            type="email" 
                            value={editForm.intern_email} 
                            onChange={e => setEditForm({...editForm, intern_email: e.target.value})} 
                            className="border border-gray-300 rounded-lg px-2.5 py-1 text-xs mt-2 w-full focus:ring-2 focus:ring-indigo-500 focus:outline-none" 
                            placeholder="Update Student Email" 
                          />
                        ) : (
                          <div className="text-[11px] text-indigo-600/80 font-medium mt-1 hover:underline cursor-pointer flex items-center">
                            <Mail size={10} className="mr-1" />
                            {item.intern?.email || 'No email configured'}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Title & Domain */}
                  <td className="px-6 py-5">
                    <div className="text-sm font-bold text-gray-800 leading-tight">{item.internship_title}</div>
                    <div className="inline-flex items-center bg-purple-50 text-purple-700 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider mt-2 border border-purple-100">
                      {item.internship_domain}
                    </div>
                  </td>

                  {/* Mentorship Period */}
                  <td className="px-6 py-5 whitespace-nowrap">
                    {editingId === item.internship_id ? (
                      <div className="flex flex-col space-y-2">
                        <div>
                          <label className="text-[10px] text-gray-400 block font-semibold mb-1">Start Date</label>
                          <input 
                            type="date" 
                            value={editForm.start_date} 
                            onChange={e => setEditForm({...editForm, start_date: e.target.value})} 
                            className="border border-gray-300 rounded-lg px-2 py-1 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none" 
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-gray-400 block font-semibold mb-1">End Date</label>
                          <input 
                            type="date" 
                            value={editForm.end_date} 
                            onChange={e => setEditForm({...editForm, end_date: e.target.value})} 
                            className="border border-gray-300 rounded-lg px-2 py-1 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none" 
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        <div className="flex items-center text-xs text-gray-600 font-medium">
                          <Calendar size={13} className="mr-1.5 text-gray-400" />
                          <span>{new Date(item.start_date).toLocaleDateString()} to {new Date(item.end_date).toLocaleDateString()}</span>
                        </div>
                        <span className={`inline-block text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                          isCompleted(item.end_date) 
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-250' 
                            : 'bg-amber-100 text-amber-800 border border-amber-250'
                        }`}>
                          {isCompleted(item.end_date) ? 'Completed' : 'Ongoing'}
                        </span>
                      </div>
                    )}
                  </td>

                  {/* Verification Docs */}
                  <td className="px-6 py-5 whitespace-nowrap">
                    <div className="flex flex-col space-y-2 text-xs font-semibold">
                      {/* Upload Report Button */}
                      <label className="cursor-pointer text-indigo-600 hover:text-indigo-800 flex items-center space-x-1 hover:underline">
                        <Upload size={14} />
                        <span>Upload Report</span>
                        <input type="file" className="hidden" onChange={(e) => handleUpload(e, item.internship_id, 'report')} />
                      </label>

                      {/* Upload Proof Button */}
                      <label className="cursor-pointer text-blue-600 hover:text-blue-800 flex items-center space-x-1 hover:underline">
                        <Upload size={14} />
                        <span>Upload Proof</span>
                        <input type="file" className="hidden" onChange={(e) => handleUpload(e, item.internship_id, 'proof')} />
                      </label>

                      {/* Rendered Uploaded Items */}
                      <div className="flex flex-col space-y-1 mt-1">
                        {item.documents?.map(doc => (
                          <a 
                            key={doc.document_id} 
                            href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/${doc.file_path}`} 
                            target="_blank" 
                            rel="noreferrer" 
                            className="inline-flex items-center text-[10px] text-emerald-600 hover:text-emerald-800 font-bold bg-emerald-50 border border-emerald-150 p-1 px-2 rounded-lg"
                          >
                            <CheckCircle size={10} className="mr-1" />
                            <span>{doc.document_type.toUpperCase()}</span>
                          </a>
                        ))}
                      </div>
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-5 whitespace-nowrap text-sm font-medium">
                    <div className="flex flex-col space-y-2">
                      {editingId === item.internship_id ? (
                        <div className="flex space-x-2">
                          <button 
                            onClick={() => handleSaveEdit(item)} 
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all flex items-center space-x-1 shadow-sm"
                          >
                            <Save size={13} />
                            <span>Save</span>
                          </button>
                          <button 
                            onClick={() => setEditingId(null)} 
                            className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg text-xs font-bold transition-all flex items-center space-x-1"
                          >
                            <X size={13} />
                            <span>Cancel</span>
                          </button>
                        </div>
                      ) : (
                        <button 
                          onClick={() => handleEditClick(item)} 
                          className="text-gray-500 hover:text-gray-800 flex items-center space-x-1 hover:underline text-xs"
                        >
                          <Edit2 size={13} />
                          <span>Edit Info</span>
                        </button>
                      )}

                      {/* Certificate Options */}
                      {!item.certificate ? (
                        <button 
                          onClick={() => handleGenerateCertificate(item.internship_id)} 
                          className="px-3 py-2 bg-indigo-650 hover:bg-indigo-750 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center justify-center space-x-1.5 w-max"
                        >
                          <FileText size={13} />
                          <span>Generate Cert</span>
                        </button>
                      ) : (
                        <div className="flex space-x-2.5">
                          <a 
                            href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/${item.certificate.certificate_path}`} 
                            target="_blank" 
                            rel="noreferrer" 
                            className="text-emerald-600 hover:text-emerald-800 flex items-center space-x-1 hover:underline text-xs font-bold"
                          >
                            <Download size={13} />
                            <span>Download</span>
                          </a>
                          <button 
                            onClick={() => handleSendEmail(item.internship_id)} 
                            className="text-blue-600 hover:text-blue-800 flex items-center space-x-1 hover:underline text-xs font-bold"
                          >
                            <Mail size={13} />
                            <span>Email Intern</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              
              {!isLoading && internships.length === 0 && (
                <tr>
                  <td colSpan="5" className="text-center py-12 text-gray-400 text-sm">
                    No active student records found matching the query.
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
