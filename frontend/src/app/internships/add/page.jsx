'use client';
import React, { useState, useEffect, useContext } from 'react';
import { useRouter } from 'next/navigation';
import api from '../../../services/api';
import toast from 'react-hot-toast';
import { ArrowRight } from 'lucide-react';
import { AuthContext } from '../../providers';
import { useQueryClient } from '@tanstack/react-query';
import StudentProfileSection from '../../../components/internship/add/StudentProfileSection';
import InternshipProjectSection from '../../../components/internship/add/InternshipProjectSection';

export default function AddInternship() {
  const router = useRouter();
  const { user } = useContext(AuthContext);
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState({
    project_start_date: '2026-05-18',
    project_end_date: '2026-07-31',
    min_duration_days: '28',
    max_students_per_faculty: '5',
    max_students_per_year: '100',
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await api.get('/settings/');
        setSettings((prev) => ({ ...prev, ...res.data }));
      } catch (err) {
        console.error(err);
      }
    };
    fetchSettings();
  }, []);
  
  useEffect(() => {
    const checkLimit = async () => {
      if (user && user.role !== 'admin') {
        try {
          const res = await api.get('/internships/');
          const settingsRes = await api.get('/settings/');
          const maxFaculty = parseInt(settingsRes.data.max_students_per_faculty || '5');
          if (res.data.length >= maxFaculty) {
            toast.error(`Limit Exceeded: You are already mentoring the maximum of ${maxFaculty} students.`);
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
    internship_mode: 'Offline',
    start_date: '',
    end_date: '',
    remarks: ''
  });
  
  const [faculties, setFaculties] = useState([]);
  const [selectedFacultyId, setSelectedFacultyId] = useState('');

  useEffect(() => {
    const fetchFacultiesList = async () => {
      if (user?.role === 'admin') {
        try {
          const res = await api.get('/auth/faculties');
          setFaculties(res.data);
          if (res.data.length > 0) {
            setSelectedFacultyId(res.data[0].faculty_id);
          }
        } catch (err) {
          console.error(err);
        }
      }
    };
    fetchFacultiesList();
  }, [user]);

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
    
    const pStart = new Date(settings.project_start_date);
    const pEnd = new Date(settings.project_end_date);
    const startDate = new Date(formData.start_date);
    const endDate = new Date(formData.end_date);

    if (startDate < pStart) {
      toast.error(`Internship start date must be on or after the academic year start date of ${settings.project_start_date}.`);
      return;
    }

    if (endDate > pEnd) {
      toast.error(`Internship end date must be on or before the academic year end date of ${settings.project_end_date}.`);
      return;
    }

    const diffTime = Math.abs(endDate - startDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const minDays = parseInt(settings.min_duration_days);
    if (diffDays < minDays) {
      toast.error(`Internship duration must be at least ${minDays} days.`);
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
        remarks: formData.remarks || '',
        faculty_id: user?.role === 'admin' ? selectedFacultyId : undefined
      });

      queryClient.invalidateQueries({ queryKey: ['layoutInternships'] });
      queryClient.invalidateQueries({ queryKey: ['internships'] });

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
        <StudentProfileSection formData={formData} handleChange={handleChange} />
        <InternshipProjectSection 
          formData={formData} 
          handleChange={handleChange} 
          user={user} 
          faculties={faculties} 
          selectedFacultyId={selectedFacultyId} 
          setSelectedFacultyId={setSelectedFacultyId} 
          settings={settings}
        />

        {/* Form Controls */}
        <div className="flex justify-end items-center space-x-4 pt-4">
          <button
            type="button"
            onClick={() => router.push('/internships')}
            className="px-6 py-3 border border-gray-300 rounded-none text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 hover:shadow-none transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 border border-transparent rounded-none text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-none hover:shadow-none transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 flex items-center space-x-2 disabled:opacity-50"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-none h-4 w-4 border-b-2 border-white"></div>
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
