import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function UserManagementPanel() {
  const [formData, setFormData] = useState({
    email: '',
    faculty_name: '',
    department: '',
    role: 'faculty',
  });
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [deleteEmail, setDeleteEmail] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      const res = await api.get('/settings/departments');
      setDepartments(res.data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load departments');
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.email.endsWith('@nitt.edu')) {
      toast.error('Email must end with @nitt.edu');
      return;
    }
    
    setLoading(true);
    try {
      await api.post('/auth/admin/users', formData);
      toast.success('User created successfully');
      setFormData({
        email: '',
        faculty_name: '',
        department: '',
        role: 'faculty',
      });
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.detail || 'Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (e) => {
    e.preventDefault();
    if (!deleteEmail.trim()) return;

    if (!window.confirm(`Are you sure you want to permanently delete the faculty account for ${deleteEmail}?`)) {
      return;
    }

    setDeleting(true);
    try {
      const res = await api.get('/auth/faculties');
      const faculty = res.data.find(f => f.email === deleteEmail.trim().toLowerCase());
      
      if (!faculty) {
        toast.error('Faculty with this email not found.');
        return;
      }

      await api.delete(`/auth/faculties/${faculty.faculty_id}`);
      toast.success('Faculty deleted successfully.');
      setDeleteEmail('');
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.detail || 'Failed to delete faculty');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="bg-white rounded-none shadow-none border border-gray-100 overflow-hidden">
      <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
        <div>
          <h3 className="text-lg font-bold text-gray-800">Provision New User</h3>
          <p className="text-sm text-gray-500 mt-1">Create a new user account with specific roles and privileges.</p>
        </div>
      </div>
      <div className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Email Address</label>
              <input
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                placeholder="user@nitt.edu"
                className="w-full border-gray-300 rounded-none shadow-none focus:border-indigo-500 focus:ring-indigo-500 p-2 border"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Full Name</label>
              <input
                type="text"
                name="faculty_name"
                required
                value={formData.faculty_name}
                onChange={handleChange}
                placeholder="Dr. John Doe"
                className="w-full border-gray-300 rounded-none shadow-none focus:border-indigo-500 focus:ring-indigo-500 p-2 border"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Department</label>
              <select
                name="department"
                required
                value={formData.department}
                onChange={handleChange}
                className="w-full border-gray-300 rounded-none shadow-none focus:border-indigo-500 focus:ring-indigo-500 p-2 border"
              >
                <option value="" disabled>Select Department</option>
                {departments.map((dept, idx) => (
                  <option key={idx} value={dept}>{dept}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">System Role</label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="w-full border-gray-300 rounded-none shadow-none focus:border-indigo-500 focus:ring-indigo-500 p-2 border"
              >
                <option value="faculty">Faculty</option>
                <option value="dean">Dean (R&C)</option>
                <option value="admin">System Admin</option>
              </select>
            </div>
          </div>
          
          <div className="pt-4 border-t border-gray-100 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className={`px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-none shadow-none transition-all ${
                loading ? 'opacity-70 cursor-not-allowed' : ''
              }`}
            >
              {loading ? 'Creating...' : 'Create User'}
            </button>
          </div>
        </form>
      </div>

      {/* Delete User Section */}
      <div className="p-6 border-t border-gray-100 bg-red-50/30">
        <div className="mb-4">
          <h3 className="text-lg font-bold text-red-800">Danger Zone: Delete User</h3>
          <p className="text-sm text-red-600 mt-1">Permanently remove a faculty account from the system.</p>
        </div>
        <form onSubmit={handleDelete} className="flex flex-col md:flex-row items-end gap-4">
          <div className="flex-1 w-full">
            <label className="block text-sm font-semibold text-red-700 mb-1">Email Address to Delete</label>
            <input
              type="email"
              required
              value={deleteEmail}
              onChange={(e) => setDeleteEmail(e.target.value)}
              placeholder="user@nitt.edu"
              className="w-full border-red-200 rounded-none shadow-none focus:border-red-500 focus:ring-red-500 p-2 border bg-white"
            />
          </div>
          <button
            type="submit"
            disabled={deleting}
            className={`px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-none shadow-none transition-all whitespace-nowrap ${
              deleting ? 'opacity-70 cursor-not-allowed' : ''
            }`}
          >
            {deleting ? 'Deleting...' : 'Delete User'}
          </button>
        </form>
      </div>
    </div>
  );
}
