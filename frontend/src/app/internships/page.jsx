'use client';
import React, { useState, useContext, useEffect } from 'react';
import api from '../../services/api';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  Download, FileText, CheckCircle, Upload, Search, Edit2, X, Save, 
  Mail, Calendar, GraduationCap, Eye, Trash2, BookOpen, Clock, Award, ShieldAlert, CheckCircle2, User, Phone
} from 'lucide-react';
import toast from 'react-hot-toast';
import { AuthContext } from '../providers';
import InternshipFilters from '../../components/internship/InternshipFilters';
import InternshipTable from '../../components/internship/InternshipTable';
import PreviewInternshipModal from '../../components/internship/PreviewInternshipModal';
import EditInternshipModal from '../../components/internship/EditInternshipModal';

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
    
    const startDate = new Date(editForm.start_date);
    const endDate = new Date(editForm.end_date);
    const diffTime = Math.abs(endDate - startDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays < 28 || diffDays > 56) {
      toast.error('Internship duration must be exactly between 4 weeks and 8 weeks.');
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

  const handlePreviewCertificate = async (item, e) => {
    if (e) e.stopPropagation();
    try {
      let certPath = item.certificate?.certificate_path;
      if (!certPath) {
        const loadId = toast.loading('Generating certificate...');
        const res = await api.post(`/certificates/generate/${item.internship_id}`);
        certPath = res.data.certificate_path;
        toast.success('Certificate generated successfully!', { id: loadId });
        refreshList();
      }
      const url = `${api.defaults.baseURL}/certificates/view/${item.internship_id}?t=${Date.now()}`;
      window.open(url, '_blank');
    } catch (err) {
      console.error(err);
      toast.error('Failed to preview certificate.');
    }
  };

  const handleSendEmail = async (item, e) => {
    if (e) e.stopPropagation();
    const loadingToast = toast.loading('Sending digital certificate via email...');
    try {
      if (!item.certificate) {
        await api.post(`/certificates/generate/${item.internship_id}`);
        refreshList();
      }
      await api.post(`/certificates/email/${item.internship_id}`);
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
      <InternshipFilters search={search} setSearch={setSearch} activeTab={activeTab} setActiveTab={setActiveTab} internships={internships} getRecordStatus={getRecordStatus} />
      <InternshipTable isLoading={isLoading} filteredInternships={filteredInternships} getRecordStatus={getRecordStatus} calculateDuration={calculateDuration} handleUpload={handleUpload} setPreviewItem={setPreviewItem} handleEditClick={handleEditClick} handlePreviewCertificate={handlePreviewCertificate} handleSendEmail={handleSendEmail} user={user} handleDeleteRecord={handleDeleteRecord} />
      <PreviewInternshipModal previewItem={previewItem} setPreviewItem={setPreviewItem} calculateDuration={calculateDuration} getRecordStatus={getRecordStatus} handlePreviewCertificate={handlePreviewCertificate} user={user} />
      <EditInternshipModal editingItem={editingItem} setEditingItem={setEditingItem} editForm={editForm} setEditForm={setEditForm} handleSaveEdit={handleSaveEdit} />
    </div>
  );
}
