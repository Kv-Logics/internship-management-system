'use client';
import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../providers';
import { useRouter } from 'next/navigation';
import api from '../services/api';
import toast from 'react-hot-toast';
import { 
  Search, Trash2, Mail, ShieldAlert, Award, UserCheck, RefreshCw, 
  ChevronRight, ArrowLeft, Calendar, BookOpen, GraduationCap, Clock, FileText, Download 
} from 'lucide-react';

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
    if (user && user.role !== 'admin') {
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
      // Fetch both faculties and all internships (Admin has access to all!)
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
      const response = await api.post(`/certificates/${internshipId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Certificate generated successfully!', { id: toastId });
      // Refresh internships
      fetchDatabase();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.detail || 'Failed to generate certificate.', { id: toastId });
    }
  };

  const handleDownloadCertificate = async (certificatePath) => {
    try {
      const token = localStorage.getItem('token');
      const response = await api.get(`/certificates/download/${encodeURIComponent(certificatePath)}`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', certificatePath.split('/').pop());
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error(err);
      toast.error('Failed to download certificate.');
    }
  };

  const filteredFaculties = faculties.filter(fac => 
    fac.faculty_name.toLowerCase().includes(search.toLowerCase()) ||
    fac.email.toLowerCase().includes(search.toLowerCase()) ||
    (fac.role || '').toLowerCase().includes(search.toLowerCase())
  );

  // Filtered internships for selected faculty
  const facultyInternships = internships.filter(item => item.faculty_id === selectedFaculty?.faculty_id);

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
        {/* Detail Header */}
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

        {/* Detailed stats */}
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

        {/* Mentored Student List (All other features inside) */}
        <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-150 bg-gray-50/50 flex justify-between items-center">
            <div>
              <h3 className="text-base font-bold text-gray-800">Mentored Internship Records</h3>
              <p className="text-xs text-gray-500">View, audit, manage, or delete internships linked to this mentor.</p>
            </div>
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
                      
                      {/* Academics info */}
                      <p className="text-xs text-gray-500 font-medium">
                        {item.intern?.college_name} • {item.intern?.department}
                      </p>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1 text-xs text-gray-500">
                        <div className="flex items-center"><BookOpen size={14} className="mr-1.5 text-gray-400" /> Domain: {item.internship_domain}</div>
                        <div className="flex items-center"><Calendar size={14} className="mr-1.5 text-gray-400" /> End Date: {new Date(item.end_date).toLocaleDateString()}</div>
                      </div>
                    </div>

                    {/* Actions and Certificate controls */}
                    <div className="flex items-center gap-3 flex-wrap md:justify-end">
                      {/* Certificate Generator */}
                      {item.certificate ? (
                        <button
                          onClick={() => handleDownloadCertificate(item.certificate.certificate_path)}
                          className="flex items-center space-x-1.5 px-3.5 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold hover:bg-emerald-100 transition-all"
                        >
                          <Download size={14} />
                          <span>Get Certificate</span>
                        </button>
                      ) : (
                        new Date(item.end_date) < new Date() && (
                          <button
                            onClick={() => handleGenerateCertificate(item.internship_id)}
                            className="flex items-center space-x-1.5 px-3.5 py-2 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold hover:bg-indigo-100 transition-all"
                          >
                            <Award size={14} />
                            <span>Issue Certificate</span>
                          </button>
                        )
                      )}

                      {/* Delete Internship Database Record */}
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

  // MASTER VIEW (FACULTY CARDS LIST)
  return (
    <div className="space-y-6">
      
      {/* Overview Card */}
      <div className="bg-gradient-to-r from-indigo-900 to-indigo-950 p-6 rounded-3xl border border-indigo-850 text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
        <div className="z-10">
          <h2 className="text-2xl font-extrabold tracking-tight">System Faculty Database</h2>
          <p className="text-xs text-indigo-200 mt-1">Select a faculty mentor below to view their active profile and manage their internships.</p>
        </div>
        <div className="z-10 flex items-center gap-3">
          <button 
            onClick={fetchDatabase} 
            className="flex items-center space-x-1 px-4 py-2.5 bg-white/10 hover:bg-white/15 active:bg-white/20 border border-white/10 rounded-xl text-xs font-semibold tracking-wider transition-all"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>Refresh Engine</span>
          </button>
          <div className="bg-indigo-500/20 px-4 py-2.5 rounded-xl border border-indigo-500/30 text-indigo-200 font-bold text-xs">
            Mentor Count: {faculties.length}
          </div>
        </div>
      </div>

      {/* Control Panel */}
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

      {/* Faculty Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredFaculties.length > 0 ? (
          filteredFaculties.map((fac) => {
            const facInternsCount = internships.filter(item => item.faculty_id === fac.faculty_id).length;
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
                    
                    {/* Delete option for system admins */}
                    {fac.email !== 'admin@nitt.edu' && (
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
  );
}
