'use client';
import React, { useState } from 'react';
import api from '../../services/api';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Download, FileText, CheckCircle, Upload, Search, Edit2, X, Save, Mail } from 'lucide-react';
import toast from 'react-hot-toast';

export default function InternshipList() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ start_date: '', end_date: '', intern_email: '' });

  // React Query automatically refetches when the 'search' dependency changes
  const { data: internships = [], isLoading } = useQuery({
    queryKey: ['internships', search],
    queryFn: async () => (await api.get(`/internships/?search=${search}`)).data,
  });

  const refreshList = () => queryClient.invalidateQueries({ queryKey: ['internships'] });

  const handleGenerateCertificate = async (id) => {
    try {
      await api.post(`/certificates/generate/${id}`);
      toast.success('Certificate generated successfully!');
      refreshList();
    } catch (err) {
      toast.error('Failed to generate certificate');
    }
  };

  const handleUpload = async (e, id, type) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('document_type', type);
    
    try {
      await api.post(`/documents/upload/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success('Document uploaded successfully!');
      refreshList();
    } catch (err) {
      toast.error('Upload failed');
    }
  };

  const handleEditClick = (item) => {
    setEditingId(item.internship_id);
    setEditForm({ start_date: item.start_date || '', end_date: item.end_date || '', intern_email: item.intern?.email || '' });
  };

  const handleSaveEdit = async (item) => {
    try {
      await api.put(`/internships/${item.internship_id}`, {
        internship_title: item.internship_title, 
        start_date: editForm.start_date,
        end_date: editForm.end_date,
        intern_email: editForm.intern_email
      });
      setEditingId(null);
      refreshList();
      toast.success('Record updated successfully!');
    } catch (err) {
      toast.error('Failed to update record');
    }
  };

  const handleSendEmail = async (id) => {
    const loadingToast = toast.loading('Sending email to intern...');
    try {
      await api.post(`/certificates/email/${id}`);
      toast.success('Email sent successfully!', { id: loadingToast });
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to send email', { id: loadingToast });
    }
  };

  return (
    <div className="bg-white p-6 rounded shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Internships List</h2>
        <div className="relative">
          <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
          <input type="text" placeholder="Search intern or domain..." className="pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Intern</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title & Domain</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dates</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Documents</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {isLoading && <tr><td colSpan="5" className="text-center py-4 text-gray-500">Loading internships...</td></tr>}
            {!isLoading && internships.map(item => (
              <tr key={item.internship_id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{item.intern?.intern_name || 'N/A'}</div>
                  <div className="text-sm text-gray-500">{item.intern?.college_name || 'N/A'}</div>
                  {editingId === item.internship_id ? (
                    <input type="email" value={editForm.intern_email} onChange={e => setEditForm({...editForm, intern_email: e.target.value})} className="border rounded px-2 py-1 text-xs mt-1 w-full" placeholder="Intern Email" />
                  ) : (
                    <div className="text-xs text-gray-400 mt-1">{item.intern?.email || 'No email set'}</div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{item.internship_title}</div>
                    <div className="text-sm text-gray-500">{item.internship_domain}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {editingId === item.internship_id ? (
                    <div className="flex flex-col space-y-1">
                      <input type="date" value={editForm.start_date} onChange={e => setEditForm({...editForm, start_date: e.target.value})} className="border rounded px-2 py-1 text-xs" />
                      <input type="date" value={editForm.end_date} onChange={e => setEditForm({...editForm, end_date: e.target.value})} className="border rounded px-2 py-1 text-xs" />
                    </div>
                  ) : (
                    <span>{item.start_date} to <br/>{item.end_date}</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex flex-col space-y-2">
                    <label className="cursor-pointer text-indigo-600 hover:text-indigo-900 flex items-center"><Upload size={16} className="mr-1"/> Upload Report<input type="file" className="hidden" onChange={(e) => handleUpload(e, item.internship_id, 'report')} /></label>
                    <label className="cursor-pointer text-blue-600 hover:text-blue-900 flex items-center"><Upload size={16} className="mr-1"/> Upload Proof<input type="file" className="hidden" onChange={(e) => handleUpload(e, item.internship_id, 'proof')} /></label>
                    {item.documents?.map(doc => (<a key={doc.document_id} href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/${doc.file_path}`} target="_blank" rel="noreferrer" className="text-xs text-green-600 flex items-center"><CheckCircle size={12} className="mr-1"/> {doc.document_type}</a>))}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex flex-col space-y-3">
                    {editingId === item.internship_id ? (<div className="flex space-x-2"><button onClick={() => handleSaveEdit(item)} className="text-green-600 hover:text-green-900 flex items-center"><Save size={16} className="mr-1"/> Save</button><button onClick={() => setEditingId(null)} className="text-red-600 hover:text-red-900 flex items-center"><X size={16} className="mr-1"/> Cancel</button></div>) : (<button onClick={() => handleEditClick(item)} className="text-yellow-600 hover:text-yellow-900 flex items-center" title="Edit Record"><Edit2 size={16} className="mr-1"/> Edit Dates & Email</button>)}
                    {!item.certificate ? (<button onClick={() => handleGenerateCertificate(item.internship_id)} className="text-indigo-600 hover:text-indigo-900 flex items-center"><FileText size={16} className="mr-1"/> Generate Cert</button>) : (<div className="flex space-x-3"><a href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/${item.certificate.certificate_path}`} target="_blank" rel="noreferrer" className="text-green-600 hover:text-green-900 flex items-center"><Download size={16} className="mr-1"/> Download</a><button onClick={() => handleSendEmail(item.internship_id)} className="text-blue-600 hover:text-blue-900 flex items-center"><Mail size={16} className="mr-1"/> Email</button></div>)}
                  </div>
                </td>
              </tr>
            ))}
            {!isLoading && internships.length === 0 && (<tr><td colSpan="5" className="text-center py-4 text-gray-500">No internships found.</td></tr>)}
          </tbody>
        </table>
      </div>
    </div>
  );
}
