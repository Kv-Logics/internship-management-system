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
      <div className="space-y-6 animate-fadeIn">
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => setSelectedFaculty(null)}
            className="p-2.5 bg-white hover:bg-gray-50 border border-gray-250 rounded-xl shadow-sm text-gray-700 hover:text-indigo-600 transition-all flex items-center justify-center"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-2xl font-bold text-gray-900">{selectedFaculty.faculty_name}</h2>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider ${
                selectedFaculty.role === 'dean' ? 'bg-amber-100 text-amber-800' : 'bg-indigo-100 text-indigo-800'
              }`}>
                {selectedFaculty.role || 'Faculty'}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1 flex items-center">
              <Mail size={12} className="mr-1" /> {selectedFaculty.email}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl p-5 border border-gray-200/80 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Total Mentored</p>
            <h4 className="text-2xl font-black text-gray-800 mt-1">{facultyInternships.length} Students</h4>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-gray-200/80 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Active Mentorship Capacity</p>
            <div className="flex items-center justify-between mt-1">
              <h4 className="text-2xl font-black text-indigo-600">{facultyInternships.length} / 5</h4>
              <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                facultyInternships.length >= 5 ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
              }`}>
                {facultyInternships.length >= 5 ? 'At Capacity' : 'Available'}
              </span>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-gray-200/80 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">System Logs</p>
            <h4 className="text-sm font-semibold text-emerald-600 mt-2 flex items-center">
              <UserCheck size={16} className="mr-1" /> Active login authorized
            </h4>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-150 bg-gray-50/50">
            <h3 className="text-base font-bold text-gray-800">Mentored Internship Records</h3>
            <p className="text-xs text-gray-500">View, audit, manage, or delete internships linked to this mentor.</p>
          </div>

          <div className="divide-y divide-gray-150">
            {facultyInternships.length > 0 ? (
              facultyInternships.map((item) => (
                <div key={item.internship_id} className="p-6 hover:bg-indigo-50/10 transition-colors">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <GraduationCap className="h-5 w-5 text-indigo-600" />
                        <h4 className="text-base font-bold text-gray-900">{item.intern?.intern_name}</h4>
                        <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                          new Date(item.end_date) < new Date() 
                            ? 'bg-emerald-100 text-emerald-800' 
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {new Date(item.end_date) < new Date() ? 'Completed' : 'Ongoing'}
                        </span>
                      </div>
                      
                      <p className="text-xs text-gray-500 font-medium">
                        {item.intern?.college_name} • {item.intern?.department}
                      </p>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1 text-xs text-gray-500">
                        <div className="flex items-center"><BookOpen size={14} className="mr-1.5 text-gray-400" /> Domain: {item.internship_domain}</div>
                        <div className="flex items-center"><Calendar size={14} className="mr-1.5 text-gray-400" /> End Date: {new Date(item.end_date).toLocaleDateString()}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 flex-wrap md:justify-end">
                      {(item.certificate || new Date(item.end_date) < new Date()) && (
                        <button
                          onClick={(e) => handlePreviewCertificate(item, e)}
                          className="flex items-center space-x-1.5 px-3.5 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold hover:bg-emerald-100 transition-all"
                        >
                          <Eye size={14} />
                          <span>Preview Cert</span>
                        </button>
                      )}

                      <button
                        onClick={() => handleDeleteInternship(item.internship_id)}
                        className="p-2 text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 rounded-xl transition-all"
                        title="Delete Internship Record"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-gray-400 font-medium italic text-sm">
                This faculty member has not registered any student internships yet.
              </div>
            )}
          </div>
        </div>
      </div>
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
        <div className="space-y-6 animate-fadeIn">
          {/* Search bar */}
          <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-400 pointer-events-none">
                <Search size={18} />
              </span>
              <input
                type="text"
                placeholder="Search by mentor name or institutional email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 pr-4 py-3 w-full bg-white border border-gray-250 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent shadow-sm transition-all"
              />
            </div>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredFaculties.length > 0 ? (
              filteredFaculties.map((fac) => {
                const facInternsCount = internships.filter(item => (item.faculty_id || item.faculty?.faculty_id) === fac.faculty_id).length;
                return (
                  <div 
                    key={fac.faculty_id}
                    onClick={() => setSelectedFaculty(fac)}
                    className="bg-white rounded-3xl border border-gray-200/80 p-6 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col justify-between group"
                  >
                    <div className="space-y-4">
                      <div className="flex justify-between items-start">
                        <span className={`inline-flex px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          fac.role === 'dean' ? 'bg-amber-100 text-amber-800' : 'bg-indigo-100 text-indigo-800'
                        }`}>
                          {fac.role || 'Faculty'}
                        </span>
                        
                        {fac.email !== 'admin@nitt.edu' && user?.role === 'admin' && (
                          <button
                            onClick={(e) => handleDeleteFaculty(fac.faculty_id, e)}
                            disabled={deletingId === fac.faculty_id}
                            className="p-1.5 text-gray-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-all opacity-0 group-hover:opacity-100"
                            title="Delete Faculty Account"
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>

                      <div>
                        <h3 className="text-lg font-bold text-gray-800 group-hover:text-indigo-600 transition-colors">{fac.faculty_name}</h3>
                        <p className="text-xs text-gray-400 flex items-center mt-1">
                          <Mail size={12} className="mr-1" /> {fac.email}
                        </p>
                      </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-gray-100 flex justify-between items-center text-xs">
                      <div className="text-gray-500 font-medium">
                        Mentoring: <span className="font-bold text-indigo-600">{facInternsCount} Students</span>
                      </div>
                      <span className="text-indigo-600 group-hover:translate-x-1 transition-transform flex items-center font-bold">
                        <span>Inspect Details</span>
                        <ChevronRight size={14} className="ml-0.5" />
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="col-span-full py-12 text-center text-gray-400 font-medium italic text-sm">
                No matching faculty database records found.
              </div>
            )}
          </div>
        </div>
      ) : (
        /* SQL Query Terminal Tab View (Visual Grid Splits Console and Schema Sidebar) */
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 animate-fadeIn">
          
          {/* Main SQL Console Panel */}
          <div className="lg:col-span-3 bg-slate-900 rounded-3xl border border-slate-800 shadow-2xl overflow-hidden text-slate-100 p-6 space-y-6">
            <div className="flex justify-between items-center pb-4 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <div className="w-3.5 h-3.5 rounded-full bg-rose-500"></div>
                <div className="w-3.5 h-3.5 rounded-full bg-amber-500"></div>
                <div className="w-3.5 h-3.5 rounded-full bg-emerald-500"></div>
                <span className="text-xs font-bold font-mono text-slate-400 ml-2">postgresql_engine@nitt.local</span>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest bg-emerald-950 text-emerald-400 border border-emerald-900 px-3 py-1 rounded-full flex items-center">
                <UserCheck size={12} className="mr-1 animate-pulse" />
                <span>Root Administrator</span>
              </span>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-mono font-bold text-slate-400">Write SQL Statement</label>
              <div className="relative">
                <textarea
                  value={sqlQuery}
                  onChange={(e) => setSqlQuery(e.target.value)}
                  className="w-full h-36 bg-slate-950 border border-slate-800 rounded-2xl p-4 font-mono text-sm text-emerald-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-slate-600 leading-relaxed shadow-inner"
                  placeholder="SELECT * FROM internships;"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <p className="text-[11px] text-slate-400 leading-snug max-w-md">
                <AlertCircle size={12} className="inline mr-1 text-amber-500" />
                <strong className="text-amber-500">Warning:</strong> Executing raw SQL statements bypassed standard application models and applies changes instantly inside the PostgreSQL records.
              </p>
              <button
                onClick={handleExecuteQuery}
                disabled={executingQuery}
                className="flex items-center space-x-2 px-6 py-3 bg-indigo-650 hover:bg-indigo-700 active:bg-indigo-800 disabled:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-indigo-650/10 cursor-pointer"
              >
                {executingQuery ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <Play size={14} fill="white" />
                    <span>Execute SQL</span>
                  </>
                )}
              </button>
            </div>

            {/* Errors View */}
            {queryError && (
              <div className="bg-rose-950/40 border border-rose-900 rounded-2xl p-4 flex items-start space-x-3 text-rose-300 font-mono text-xs animate-shake">
                <AlertCircle size={16} className="text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="font-bold block mb-1">SQL Compilation / Execution Error</strong>
                  <span>{queryError}</span>
                </div>
              </div>
            )}

            {/* Results View */}
            {queryResult && (
              <div className="space-y-3 pt-4 border-t border-slate-800 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-mono font-bold text-slate-400 flex items-center">
                    <CheckCircle2 size={14} className="text-emerald-500 mr-1.5" />
                    <span>Query Results Output ({queryResult.type === 'select' ? `${queryResult.rows.length} rows returned` : `Mutation finished`})</span>
                  </h4>
                </div>

                {queryResult.type === 'select' ? (
                  <div className="bg-slate-950 border border-slate-800/80 rounded-2xl overflow-hidden w-full">
                    <div className="max-h-[600px] overflow-auto">
                      <table className="min-w-full divide-y divide-slate-800 text-xs font-mono">
                        <thead className="bg-slate-900">
                          <tr>
                            {queryResult.columns.map((col, idx) => (
                              <th key={idx} className="px-6 py-4 text-left font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800 whitespace-nowrap">
                                {col}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/50">
                          {queryResult.rows.length > 0 ? (
                            queryResult.rows.map((row, rowIdx) => (
                              <tr key={rowIdx} className="hover:bg-slate-900/50 transition-colors">
                                {queryResult.columns.map((col, colIdx) => (
                                  <td key={colIdx} className="px-6 py-3.5 text-slate-300 whitespace-nowrap" title={String(row[col])}>
                                    {row[col] !== null ? String(row[col]) : <em className="text-slate-600">null</em>}
                                  </td>
                                ))}
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={queryResult.columns.length} className="text-center py-8 text-slate-500 italic">
                                Result set is empty.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 font-mono text-xs text-indigo-300">
                    <span className="text-slate-500 mr-2">$</span>
                    <span>Database Mutation Statement complete. Rows affected: </span>
                    <strong className="text-indigo-400 font-bold">{queryResult.rowcount}</strong>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Database Schema Navigator Sidebar (Displays all tables) */}
          <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-5 space-y-5 lg:col-span-1 h-fit">
            <div className="flex items-center space-x-2 pb-3 border-b border-gray-100">
              <Database className="text-indigo-600" size={18} />
              <div>
                <h4 className="text-sm font-bold text-gray-800">Schema Schema</h4>
                <p className="text-[10px] text-gray-400 font-medium">Core PostgreSQL Tables</p>
              </div>
            </div>

            <div className="space-y-4">
              {dbSchema.map((table, idx) => (
                <div key={idx} className="space-y-2 bg-gray-50/50 border border-gray-150 p-3.5 rounded-2xl">
                  <div className="flex items-center justify-between">
                    <span 
                      onClick={() => setSqlQuery(`SELECT * FROM ${table.name} LIMIT 10;`)}
                      className="text-xs font-mono font-bold text-indigo-650 hover:underline cursor-pointer flex items-center"
                      title="Generate quick query"
                    >
                      <span>{table.name}</span>
                    </span>
                    <Columns size={12} className="text-gray-400" />
                  </div>
                  <p className="text-[10px] text-gray-400 italic leading-snug">{table.description}</p>
                  
                  <div className="pt-2 border-t border-gray-200/50 space-y-1">
                    {table.columns.map((col, cidx) => (
                      <div key={cidx} className="text-[10px] font-mono text-gray-500 flex items-center">
                        <span className="w-1 h-1 bg-indigo-500 rounded-full mr-1.5"></span>
                        <span>{col}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-indigo-50 border border-indigo-100 p-3 rounded-2xl text-[10px] text-indigo-700 leading-relaxed font-semibold">
              <HelpCircle size={14} className="inline mr-1 text-indigo-600 shrink-0" />
              <span>Click on any blue table name to auto-populate the terminal with a quick preview query!</span>
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
