'use client';
import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../providers';
import { useRouter } from 'next/navigation';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { RefreshCw, Server } from 'lucide-react';
import FacultyDetailView from '../../components/faculties/FacultyDetailView';
import FacultyDirectory from '../../components/faculties/FacultyDirectory';

export default function FacultyDatabase() {
  const { user } = useContext(AuthContext);
  const router = useRouter();
  
  const [faculties, setFaculties] = useState([]);
  const [internships, setInternships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Selected Faculty details view state
  const [selectedFaculty, setSelectedFaculty] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    // Only allow admin and dean to access this page
    if (user && user.role !== 'admin' && user.role !== 'dean') {
      toast.error('Access Denied: Only system administrators can access the database panel.');
      router.push('/');
    } else {
      fetchDatabase();
    }
  }, [user, router]);

  const fetchDatabase = async () => {
    setLoading(true);
    try {
      // Fetch both faculties and all internships
      const [facRes, internRes] = await Promise.all([
        api.get('/auth/faculties'),
        api.get('/internships/')
      ]);
      setFaculties(facRes.data);
      setInternships(internRes.data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load database records.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteFaculty = async (facultyId, e) => {
    e.stopPropagation(); // Prevent opening detail view when deleting
    if (!window.confirm('Are you absolutely sure you want to delete this faculty member? All their linked internships will also be permanently deleted.')) {
      return;
    }

    setDeletingId(facultyId);
    try {
      await api.delete(`/auth/faculties/${facultyId}`);
      toast.success('Faculty member deleted successfully.');
      setFaculties(faculties.filter(fac => fac.faculty_id !== facultyId));
      if (selectedFaculty?.faculty_id === facultyId) {
        setSelectedFaculty(null);
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.detail || 'Failed to delete faculty record.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleDeleteInternship = async (internshipId) => {
    if (!window.confirm('Are you sure you want to delete this student internship record?')) {
      return;
    }

    try {
      await api.delete(`/internships/${internshipId}`);
      toast.success('Internship deleted successfully.');
      setInternships(internships.filter(item => item.internship_id !== internshipId));
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete internship record.');
    }
  };

  const handleGenerateCertificate = async (internshipId) => {
    const toastId = toast.loading('Generating certificate...');
    try {
      await api.post(`/certificates/${internshipId}`);
      toast.success('Certificate generated successfully!', { id: toastId });
      fetchDatabase();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.detail || 'Failed to generate certificate.', { id: toastId });
    }
  };

  const handlePreviewCertificate = async (item, e) => {
    if (e) e.stopPropagation();
    
    if (item.certificate) {
      const url = `${api.defaults.baseURL}/certificates/view/${item.internship_id}`;
      window.open(url, '_blank');
      return;
    }
    
    const loadId = toast.loading('Loading certificate preview...');
    try {
      const res = await api.get(`/certificates/preview/${item.internship_id}`, {
        responseType: 'blob'
      });
      const file = new Blob([res.data], { type: 'application/pdf' });
      const fileURL = URL.createObjectURL(file);
      window.open(fileURL, '_blank');
      toast.success('Preview loaded successfully!', { id: loadId });
      fetchDatabase();
    } catch (err) {
      console.error(err);
      toast.error('Failed to load certificate preview.', { id: loadId });
    }
  };

  const filteredFaculties = faculties.filter(fac => 
    fac.faculty_name.toLowerCase().includes(search.toLowerCase()) ||
    fac.email.toLowerCase().includes(search.toLowerCase()) ||
    (fac.role || '').toLowerCase().includes(search.toLowerCase())
  );

  const facultyInternships = internships.filter(item => (item.faculty_id || item.faculty?.faculty_id) === selectedFaculty?.faculty_id);

  if (loading && faculties.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-indigo-600 font-semibold space-y-3">
        <RefreshCw className="animate-spin text-indigo-600" size={32} />
        <span>Loading secure database engine...</span>
      </div>
    );
  }

  // DETAILED VIEW (FACULTY DETAIL + MENTORED INTERNSHIPS + CERTIFICATES)
  if (selectedFaculty) {
    return (
      <FacultyDetailView 
        selectedFaculty={selectedFaculty} 
        setSelectedFaculty={setSelectedFaculty} 
        facultyInternships={facultyInternships} 
        handlePreviewCertificate={handlePreviewCertificate} 
        handleDeleteInternship={handleDeleteInternship} 
        user={user}
      />
    );
  }

  // MASTER VIEW (lightweight directory view)
  return (
    <div className="space-y-6">
      
      {/* Header Panel */}
      <div className="bg-gradient-to-r from-indigo-900 to-indigo-950 p-6 rounded-3xl border border-indigo-850 text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
        <div className="z-10">
          <h2 className="text-2xl font-extrabold tracking-tight">Faculty Directory</h2>
          <p className="text-xs text-indigo-200 mt-1">Manage and sync the employee directory database records.</p>
        </div>
        <div className="z-10 flex items-center gap-3">
          <button 
            onClick={fetchDatabase} 
            className="flex items-center space-x-1 px-4 py-2.5 bg-white/10 hover:bg-white/15 active:bg-white/20 border border-white/10 rounded-xl text-xs font-semibold tracking-wider transition-all"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>Sync Directory</span>
          </button>
          <div className="bg-indigo-500/20 px-4 py-2.5 rounded-xl border border-indigo-500/30 text-indigo-200 font-bold text-xs">
            Mentors Count: {faculties.length}
          </div>
        </div>
      </div>

      <FacultyDirectory 
        search={search} setSearch={setSearch} filteredFaculties={filteredFaculties} 
        internships={internships} setSelectedFaculty={setSelectedFaculty} 
        handleDeleteFaculty={handleDeleteFaculty} user={user} deletingId={deletingId} 
      />

    </div>
  );
}
