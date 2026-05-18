'use client';
import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../providers';
import { useRouter } from 'next/navigation';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { 
  Search, Trash2, Mail, ShieldAlert, Award, UserCheck, RefreshCw, 
  ChevronRight, ArrowLeft, Calendar, BookOpen, GraduationCap, Clock, FileText, Download,
  Database, Play, AlertCircle, CheckCircle2, Server, HelpCircle, Columns, ChevronDown, Eye
} from 'lucide-react';
import FacultyDetailView from '../../components/faculties/FacultyDetailView';
import FacultyDirectory from '../../components/faculties/FacultyDirectory';
import SqlTerminal from '../../components/faculties/SqlTerminal';

export default function FacultyDatabase() {
  const { user } = useContext(AuthContext);
  const router = useRouter();
  
  const [faculties, setFaculties] = useState([]);
  const [internships, setInternships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Tab selector state ('directory' or 'terminal')
  const [activeTab, setActiveTab] = useState('directory');

  // SQL Terminal state
  const [sqlQuery, setSqlQuery] = useState('SELECT * FROM faculties LIMIT 5;');
  const [queryResult, setQueryResult] = useState(null);
  const [executingQuery, setExecutingQuery] = useState(false);
  const [queryError, setQueryError] = useState('');

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
      const token = localStorage.getItem('token');
      // Fetch both faculties and all internships
      const [facRes, internRes] = await Promise.all([
        api.get('/auth/faculties', { headers: { Authorization: `Bearer ${token}` } }),
        api.get('/internships/', { headers: { Authorization: `Bearer ${token}` } })
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

  const handleExecuteQuery = async () => {
    if (!sqlQuery.trim()) {
      toast.error('Please enter a SQL query statement first.');
      return;
    }
    setExecutingQuery(true);
    setQueryError('');
    setQueryResult(null);
    try {
      const token = localStorage.getItem('token');
      const res = await api.post('/auth/admin/query', { query: sqlQuery }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setQueryResult(res.data);
      toast.success('SQL executed successfully!');
    } catch (err) {
      console.error(err);
      setQueryError(err.response?.data?.detail || 'An error occurred during query execution.');
      toast.error('Query execution failed.');
    } finally {
      setExecutingQuery(false);
    }
  };

  // Automatically generate certificates for pending internships
  useEffect(() => {
    const generatePendingCertificates = async () => {
      const today = new Date();
      const pendingInternships = internships.filter(item => new Date(item.end_date) < today && !item.certificate);
      if (pendingInternships.length > 0) {
        const token = localStorage.getItem('token');
        for (const item of pendingInternships) {
          try {
            await api.post(`/certificates/generate/${item.internship_id}`, {}, { headers: { Authorization: `Bearer ${token}` } });
          } catch (err) {
            console.error('Auto-generation failed', err);
          }
        }
        fetchDatabase();
      }
    };
    generatePendingCertificates();
  }, [internships]);

  const handleDeleteFaculty = async (facultyId, e) => {
    e.stopPropagation(); // Prevent opening detail view when deleting
    if (!window.confirm('Are you absolutely sure you want to delete this faculty member? All their linked internships will also be permanently deleted.')) {
      return;
    }

    setDeletingId(facultyId);
    try {
      const token = localStorage.getItem('token');
      await api.delete(`/auth/faculties/${facultyId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
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
      const token = localStorage.getItem('token');
      await api.delete(`/internships/${internshipId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
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
      const token = localStorage.getItem('token');
      await api.post(`/certificates/${internshipId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Certificate generated successfully!', { id: toastId });
      fetchDatabase();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.detail || 'Failed to generate certificate.', { id: toastId });
    }
  };

  const handlePreviewCertificate = async (item, e) => {
    if (e) e.stopPropagation();
    try {
      let certPath = item.certificate?.certificate_path;
      if (!certPath) {
        const loadId = toast.loading('Generating certificate...');
        const token = localStorage.getItem('token');
        const res = await api.post(`/certificates/generate/${item.internship_id}`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
        certPath = res.data.certificate_path;
        toast.success('Certificate generated successfully!', { id: loadId });
        fetchDatabase();
      }
      const url = `${api.defaults.baseURL}/certificates/view/${item.internship_id}`;
      window.open(url, '_blank');
    } catch (err) {
      console.error(err);
      toast.error('Failed to preview certificate.');
    }
  };

  const filteredFaculties = faculties.filter(fac => 
    fac.faculty_name.toLowerCase().includes(search.toLowerCase()) ||
    fac.email.toLowerCase().includes(search.toLowerCase()) ||
    (fac.role || '').toLowerCase().includes(search.toLowerCase())
  );

  const facultyInternships = internships.filter(item => (item.faculty_id || item.faculty?.faculty_id) === selectedFaculty?.faculty_id);

  // Database Schema specifications for direct visual navigator
  const dbSchema = [
    {
      name: 'faculties',
      description: 'Faculty mentors login registry',
      columns: ['faculty_id (UUID, PK)', 'faculty_name (VARCHAR)', 'email (VARCHAR, UNIQUE)', 'hashed_password (VARCHAR)', 'role (VARCHAR)']
    },
    {
      name: 'interns',
      description: 'Mentored student demographic data',
      columns: ['intern_id (UUID, PK)', 'intern_name (VARCHAR)', 'college_name (VARCHAR)', 'department (VARCHAR)', 'email (VARCHAR)', 'phone (VARCHAR)']
    },
    {
      name: 'internships',
      description: 'Project records & mentors linkages',
      columns: ['internship_id (UUID, PK)', 'intern_id (UUID, FK)', 'faculty_id (UUID, FK)', 'internship_title (VARCHAR)', 'internship_domain (VARCHAR)', 'internship_mode (VARCHAR)', 'start_date (DATE)', 'end_date (DATE)', 'remarks (TEXT)']
    },
    {
      name: 'documents',
      description: 'Student upload verification index',
      columns: ['document_id (UUID, PK)', 'internship_id (UUID, FK)', 'document_type (VARCHAR)', 'file_path (VARCHAR)', 'uploaded_at (TIMESTAMP)']
    },
    {
      name: 'certificates',
      description: 'Issued digital credentials index',
      columns: ['certificate_id (UUID, PK)', 'internship_id (UUID, FK)', 'certificate_path (VARCHAR)', 'generated_at (TIMESTAMP)']
    }
  ];

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

  // MASTER VIEW (WITH DIRECT SQL TERMINAL TAB TOGGLE)
  return (
    <div className="space-y-6">
      
      {/* Header Panel */}
      <div className="bg-gradient-to-r from-indigo-900 to-indigo-950 p-6 rounded-3xl border border-indigo-850 text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
        <div className="z-10">
          <h2 className="text-2xl font-extrabold tracking-tight">System Core Databases</h2>
          <p className="text-xs text-indigo-200 mt-1">Select a folder below to manage seeded faculty records, or run custom SQL statements directly against the engines.</p>
        </div>
        <div className="z-10 flex items-center gap-3">
          <button 
            onClick={fetchDatabase} 
            className="flex items-center space-x-1 px-4 py-2.5 bg-white/10 hover:bg-white/15 active:bg-white/20 border border-white/10 rounded-xl text-xs font-semibold tracking-wider transition-all"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>Sync DB</span>
          </button>
          <div className="bg-indigo-500/20 px-4 py-2.5 rounded-xl border border-indigo-500/30 text-indigo-200 font-bold text-xs">
            Mentors Count: {faculties.length}
          </div>
        </div>
      </div>

      {/* Admin Tab Selector */}
      {user?.role === 'admin' && (
        <div className="flex bg-gray-150 p-1.5 rounded-2xl w-max border border-gray-200 shadow-inner">
          <button
            onClick={() => setActiveTab('directory')}
            className={`flex items-center space-x-1.5 px-6 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'directory' 
                ? 'bg-white text-indigo-950 shadow-sm border border-gray-200' 
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <Server size={14} />
            <span>Faculty Directory</span>
          </button>
          <button
            onClick={() => setActiveTab('terminal')}
            className={`flex items-center space-x-1.5 px-6 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'terminal' 
                ? 'bg-indigo-600 text-white shadow-md' 
                : 'text-gray-500 hover:text-indigo-600'
            }`}
          >
            <Database size={14} />
            <span>SQL Query Terminal</span>
          </button>
        </div>
      )}

      {/* Directory Tab View */}
      {activeTab === 'directory' ? (
        <FacultyDirectory 
          search={search} setSearch={setSearch} filteredFaculties={filteredFaculties} 
          internships={internships} setSelectedFaculty={setSelectedFaculty} 
          handleDeleteFaculty={handleDeleteFaculty} user={user} deletingId={deletingId} 
        />
      ) : (
        /* SQL Query Terminal Tab View (Visual Grid Splits Console and Schema Sidebar) */
        <SqlTerminal 
          sqlQuery={sqlQuery} setSqlQuery={setSqlQuery} handleExecuteQuery={handleExecuteQuery} 
          executingQuery={executingQuery} queryError={queryError} queryResult={queryResult} 
          dbSchema={dbSchema} 
        />
      )}

    </div>
  );
}
