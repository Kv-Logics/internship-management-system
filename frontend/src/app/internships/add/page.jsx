'use client';
import React, { useState, useEffect, useContext } from 'react';
import { useRouter } from 'next/navigation';
import api from '../../../services/api';
import toast from 'react-hot-toast';
import { User, Mail, Phone, BookOpen, GraduationCap, Calendar, Award, Edit3, ArrowRight, CheckCircle } from 'lucide-react';
import { AuthContext } from '../../providers';

export default function AddInternship() {
  const router = useRouter();
  const { user } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    const checkLimit = async () => {
      if (user && user.role !== 'admin') {
        try {
          const res = await api.get('/internships/');
          if (res.data.length >= 5) {
            toast.error('Limit Exceeded: You are already mentoring the maximum of 5 students.');
            router.push('/');
          }
        } catch (err) {
          console.error(err);
        }
      }
    };
    checkLimit();
  }, [user, router]);
  const [formData, setFormData] = useState({
    intern_name: '',
    email: '',
    phone: '',
    college_name: '',
    department: '',
    internship_title: '',
    internship_domain: '',
    internship_mode: 'Hybrid',
    start_date: '',
    end_date: '',
    remarks: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validations
    if (!formData.intern_name || !formData.email || !formData.phone || !formData.college_name || !formData.department) {
      toast.error('Please complete all student information fields.');
      return;
    }
    if (!formData.internship_title || !formData.internship_domain || !formData.start_date || !formData.end_date) {
      toast.error('Please complete all internship details.');
      return;
    }
    if (new Date(formData.start_date) > new Date(formData.end_date)) {
      toast.error('Start date cannot be after end date.');
      return;
    }

    setLoading(true);
    const toastId = toast.loading('Registering intern and internship...');
    
    try {
      // Step 1: Create Intern
      const internRes = await api.post('/interns/', {
        intern_name: formData.intern_name,
        college_name: formData.college_name,
        department: formData.department,
        email: formData.email,
        phone: formData.phone
      });
      
      const internId = internRes.data.intern_id;

      // Step 2: Create Internship
      await api.post(`/internships/${internId}`, {
        internship_title: formData.internship_title,
        internship_domain: formData.internship_domain,
        internship_mode: formData.internship_mode,
        start_date: formData.start_date,
        end_date: formData.end_date,
        remarks: formData.remarks || ''
      });

      toast.success('Intern and internship registered successfully!', { id: toastId });
      router.push('/internships');
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.detail || 'An error occurred during registration.', { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="flex flex-col mb-8">
        <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Add New Intern</h2>
        <p className="mt-2 text-sm text-gray-600">
          Register a student and associate them with a new mentored internship record.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Step 1: Student Information */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-150 overflow-hidden">
          <div className="bg-indigo-50 border-b border-indigo-100 p-5 px-6 flex items-center space-x-3">
            <div className="bg-indigo-600 p-2 rounded-lg text-white">
              <User size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-800">Student Profile</h3>
              <p className="text-xs text-indigo-600">Personal and academic identification details</p>
            </div>
          </div>
          
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Student Name</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-400">
                  <User size={18} />
                </span>
                <input
                  type="text"
                  name="intern_name"
                  value={formData.intern_name}
                  onChange={handleChange}
                  placeholder="e.g. Jane Doe"
                  className="pl-10 w-full rounded-lg border border-gray-300 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-400">
                  <Mail size={18} />
                </span>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="e.g. student@nitt.edu"
                  className="pl-10 w-full rounded-lg border border-gray-300 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-400">
                  <Phone size={18} />
                </span>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="e.g. 9876543210"
                  className="pl-10 w-full rounded-lg border border-gray-300 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">College Name</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-400">
                  <GraduationCap size={18} />
                </span>
                <input
                  type="text"
                  name="college_name"
                  value={formData.college_name}
                  onChange={handleChange}
                  placeholder="e.g. NIT Trichy"
                  className="pl-10 w-full rounded-lg border border-gray-300 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  required
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Department / Discipline</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-400">
                  <BookOpen size={18} />
                </span>
                <input
                  type="text"
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  placeholder="e.g. Department of Computer Science & Engineering"
                  className="pl-10 w-full rounded-lg border border-gray-300 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  required
                />
              </div>
            </div>
          </div>
        </div>

        {/* Step 2: Internship Details */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-150 overflow-hidden">
          <div className="bg-purple-50 border-b border-purple-100 p-5 px-6 flex items-center space-x-3">
            <div className="bg-purple-600 p-2 rounded-lg text-white">
              <Award size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-800">Internship Project</h3>
              <p className="text-xs text-purple-600">Research or practical development specifications</p>
            </div>
          </div>

          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Project / Internship Title</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-400">
                  <Edit3 size={18} />
                </span>
                <input
                  type="text"
                  name="internship_title"
                  value={formData.internship_title}
                  onChange={handleChange}
                  placeholder="e.g. Dynamic Graph Neural Networks Research"
                  className="pl-10 w-full rounded-lg border border-gray-300 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Research / Tech Domain</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-400">
                  <BookOpen size={18} />
                </span>
                <input
                  type="text"
                  name="internship_domain"
                  value={formData.internship_domain}
                  onChange={handleChange}
                  placeholder="e.g. AI / Machine Learning"
                  className="pl-10 w-full rounded-lg border border-gray-300 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Mode of Internship</label>
              <select
                name="internship_mode"
                value={formData.internship_mode}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              >
                <option value="Online">Online</option>
                <option value="Offline">Offline</option>
                <option value="Hybrid">Hybrid</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Project Period</label>
              <div className="grid grid-cols-2 gap-4">
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-400">
                    <Calendar size={16} />
                  </span>
                  <input
                    type="date"
                    name="start_date"
                    value={formData.start_date}
                    onChange={handleChange}
                    className="pl-9 w-full rounded-lg border border-gray-300 p-2 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    required
                  />
                </div>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-400">
                    <Calendar size={16} />
                  </span>
                  <input
                    type="date"
                    name="end_date"
                    value={formData.end_date}
                    onChange={handleChange}
                    className="pl-9 w-full rounded-lg border border-gray-300 p-2 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Remarks / Special Directions (Optional)</label>
              <textarea
                name="remarks"
                value={formData.remarks}
                onChange={handleChange}
                placeholder="Add any specific performance notes, tools used, or structural goals..."
                rows={3}
                className="w-full rounded-lg border border-gray-300 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              />
            </div>
          </div>
        </div>

        {/* Form Controls */}
        <div className="flex justify-end items-center space-x-4 pt-4">
          <button
            type="button"
            onClick={() => router.push('/internships')}
            className="px-6 py-3 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 hover:shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 border border-transparent rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow hover:shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 flex items-center space-x-2 disabled:opacity-50"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Processing...</span>
              </>
            ) : (
              <>
                <span>Register Intern</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
