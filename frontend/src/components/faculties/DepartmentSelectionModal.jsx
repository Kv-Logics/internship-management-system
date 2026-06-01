import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../app/providers';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Building2, Search, ArrowRight, Loader2 } from 'lucide-react';

export default function DepartmentSelectionModal() {
  const { user, refetchUser } = useContext(AuthContext);
  const [departments, setDepartments] = useState([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchDepts = async () => {
      try {
        const res = await api.get('/settings/departments');
        setDepartments(res.data || []);
      } catch (err) {
        console.error(err);
        toast.error('Failed to load departments');
      } finally {
        setLoading(false);
      }
    };
    if (user && user.role === 'faculty' && !user.department) {
      fetchDepts();
    }
  }, [user]);

  if (!user || user.role !== 'faculty' || user.department) {
    return null;
  }

  const filteredDepts = departments.filter(d => d.toLowerCase().includes(search.toLowerCase()));

  const handleSubmit = async () => {
    if (!selected) {
      toast.error('Please select a department.');
      return;
    }
    setSubmitting(true);
    try {
      await api.put('/auth/me/department', { department: selected });
      toast.success('Department updated successfully.');
      if (refetchUser) {
        await refetchUser();
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.detail || 'Failed to update department.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/80 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-scaleUp">
        <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 p-6 text-white text-center">
          <div className="inline-flex bg-white/20 p-3 rounded-full mb-3">
            <Building2 size={32} />
          </div>
          <h2 className="text-2xl font-bold">Complete Your Profile</h2>
          <p className="text-indigo-100 mt-1 text-sm">Please select your department to continue. This will be printed on your interns' certificates.</p>
        </div>
        
        <div className="p-6 space-y-4">
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
              <Search size={18} />
            </span>
            <input
              type="text"
              placeholder="Search department..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
            />
          </div>

          <div className="h-64 overflow-y-auto border border-gray-100 rounded-xl bg-gray-50/50 p-2 space-y-1">
            {loading ? (
              <div className="flex justify-center items-center h-full text-indigo-500">
                <Loader2 className="animate-spin mr-2" size={24} />
                <span className="font-medium text-sm">Loading departments...</span>
              </div>
            ) : filteredDepts.length > 0 ? (
              filteredDepts.map((dept, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelected(dept)}
                  className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                    selected === dept 
                      ? 'bg-indigo-100 text-indigo-800 border border-indigo-200 shadow-sm' 
                      : 'text-gray-700 hover:bg-white border border-transparent hover:border-gray-200'
                  }`}
                >
                  {dept}
                </button>
              ))
            ) : (
              <div className="flex justify-center items-center h-full text-gray-400 text-sm">
                No departments found.
              </div>
            )}
          </div>
        </div>

        <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end">
          <button
            onClick={handleSubmit}
            disabled={!selected || submitting}
            className="flex items-center space-x-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all shadow-md active:scale-95"
          >
            {submitting ? (
              <>
                <Loader2 className="animate-spin" size={18} />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <span>Save & Continue</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
