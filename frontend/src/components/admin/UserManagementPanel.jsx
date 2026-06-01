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

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
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
                className="w-full border-gray-300 rounded-lg shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border"
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
                className="w-full border-gray-300 rounded-lg shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Department</label>
              <select
                name="department"
                required
                value={formData.department}
                onChange={handleChange}
                className="w-full border-gray-300 rounded-lg shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border"
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
                className="w-full border-gray-300 rounded-lg shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border"
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
              className={`px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md transition-all ${
                loading ? 'opacity-70 cursor-not-allowed' : ''
              }`}
            >
              {loading ? 'Creating...' : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
