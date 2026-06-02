import React from 'react';
import { User, Mail, Phone, BookOpen, GraduationCap } from 'lucide-react';

export default function StudentProfileSection({ formData, handleChange }) {
  return (
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
          <p className="mt-1.5 text-xs text-gray-500 font-medium">
            * The final certificate will be emailed directly to this address upon completion.
          </p>
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
          <label className="block text-sm font-semibold text-gray-700 mb-2">Department</label>
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
  );
}
