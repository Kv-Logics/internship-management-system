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
  const { user, loading: authLoading } = useContext(AuthContext);
  const router = useRouter();
  
  const [faculties, setFaculties] = useState([]);
  const [internships, setInternships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [search, setSearch] = useState('');
  const [hasMore, setHasMore] = useState(true);
  const [skip, setSkip] = useState(0);
  
  // Selected Faculty details view state
  const [selectedFaculty, setSelectedFaculty] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.push('/login');
      return;
    }

    // Only allow admin and dean to access this page
    if (user.role !== 'admin' && user.role !== 'dean') {
      toast.error('Access Denied: Only system administrators can access the database panel.');
      router.push('/');
    }
  }, [user, authLoading, router]);

  const fetchDatabase = async (reset = false, currentSearch = search) => {
    const currentSkip = reset ? 0 : skip;
    if (reset) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }
    
    try {
      const params = {
        skip: currentSkip,
        limit: 50
      };
      if (currentSearch.trim()) {
        params.search = currentSearch.trim();
      }
      
      const facRes = await api.get('/auth/faculties', { params });
      const newFaculties = facRes.data;
      
      if (reset) {
        setFaculties(newFaculties);
        setSkip(newFaculties.length);
      } else {
        setFaculties(prev => [...prev, ...newFaculties]);
        setSkip(prev => prev + newFaculties.length);
      }
      
      setHasMore(newFaculties.length === 50);
      
      if (currentSkip === 0) {
        const internRes = await api.get('/internships/');
        setInternships(internRes.data);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load database records.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    if (authLoading) return;
    if (!user) return;
    if (user.role !== 'admin' && user.role !== 'dean') return;

    const delayDebounceFn = setTimeout(() => {
      fetchDatabase(true, search);
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [search, user, authLoading]);

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
      <div className="bg-white p-6 border border-gray-300 text-gray-900 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden">
        
        <div className="z-10">
          <h2 className="text-2xl font-extrabold tracking-tight">Faculty Directory</h2>
        </div>
        <div className="z-10 flex items-center gap-3">
          <button 
            onClick={() => fetchDatabase(true)} 
            className="flex items-center space-x-1 px-4 py-2 bg-white hover:bg-gray-50 border border-gray-300 rounded-none text-xs font-semibold text-gray-700 transition-all cursor-pointer"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>Sync Directory</span>
          </button>
          <div className="bg-blue-50 px-4 py-2 rounded-none border border-blue-200 text-blue-800 font-bold text-xs">
            Mentors Count: {faculties.length}
          </div>
        </div>
      </div>

      <FacultyDirectory 
        search={search} 
        setSearch={setSearch} 
        filteredFaculties={faculties} 
        internships={internships} 
        setSelectedFaculty={setSelectedFaculty} 
        handleDeleteFaculty={handleDeleteFaculty} 
        user={user} 
        deletingId={deletingId}
        hasMore={hasMore}
        onLoadMore={() => fetchDatabase(false)}
        loadingMore={loadingMore}
      />

    </div>
  );
}
