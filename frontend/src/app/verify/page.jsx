'use client';
import React, { useState } from 'react';
import { Search, ShieldCheck, ShieldAlert, Award, Calendar, BookOpen, User, CheckCircle2 } from 'lucide-react';
import axios from 'axios';

export default function VerifyCertificate() {
  const [certId, setCertId] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!certId.trim()) return;

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
      const response = await axios.get(`${apiUrl}/certificates/verify/${certId.trim()}`);
      setResult(response.data);
    } catch (err) {
      if (err.response && err.response.status === 404) {
        setError('Invalid Verification ID. No certificate found with this number.');
      } else {
        setError('An error occurred while verifying the certificate. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="max-w-3xl w-full text-center space-y-4 mb-10">
        <div className="mx-auto w-24 h-24 flex items-center justify-center mb-6">
          <img 
            src="https://upload.wikimedia.org/wikipedia/en/5/51/NITT_logo.png" 
            alt="NIT Trichy Logo" 
            className="object-contain w-full h-full drop-shadow-md"
          />
        </div>
        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight sm:text-4xl">
          Certificate Verification Portal
        </h2>
        <p className="text-sm text-slate-500 max-w-xl mx-auto">
          National Institute of Technology, Tiruchirappalli (NITT). Validate the authenticity of student internship completion certificates securely.
        </p>
      </div>

      {/* Search Box */}
      <div className="max-w-2xl w-full bg-white p-6 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 mb-8">
        <form onSubmit={handleVerify} className="relative flex items-center">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-slate-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-12 pr-32 py-4 border border-slate-200 rounded-2xl leading-5 bg-slate-50 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:border-indigo-500 sm:text-sm font-medium transition-all"
            placeholder="Enter Certificate ID (e.g. NITT-A1B2C3D4)"
            value={certId}
            onChange={(e) => setCertId(e.target.value.toUpperCase())}
          />
          <button
            type="submit"
            disabled={loading || !certId.trim()}
            className="absolute right-2 top-2 bottom-2 px-6 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl transition-all disabled:opacity-50 flex items-center"
          >
            {loading ? (
              <span className="flex items-center">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></span>
                Verifying...
              </span>
            ) : (
              'Verify Now'
            )}
          </button>
        </form>
      </div>

      {/* Error Message */}
      {error && (
        <div className="max-w-2xl w-full bg-rose-50 border border-rose-200 p-6 rounded-2xl flex items-start space-x-4 animate-fadeIn">
          <div className="bg-rose-100 p-2 rounded-full mt-0.5">
            <ShieldAlert className="h-6 w-6 text-rose-600" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-rose-800">Verification Failed</h3>
            <p className="text-sm text-rose-600 mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Success Result */}
      {result && (
        <div className="max-w-2xl w-full bg-white border border-emerald-100 shadow-2xl shadow-emerald-500/10 rounded-3xl overflow-hidden animate-fadeIn">
          <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 p-6 text-white flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <CheckCircle2 size={28} className="text-emerald-100" />
              <div>
                <h3 className="text-lg font-bold">Authentic Certificate</h3>
                <p className="text-emerald-100 text-xs mt-0.5 font-medium tracking-wide">ID: {result.certificate_number}</p>
              </div>
            </div>
            <div className="bg-white/20 px-3 py-1 rounded-lg backdrop-blur-sm border border-white/20 text-xs font-bold tracking-wider">
              VERIFIED
            </div>
          </div>
          
          <div className="p-8">
            <div className="space-y-6">
              
              <div className="flex items-start space-x-4">
                <div className="bg-slate-100 p-2.5 rounded-xl text-slate-500"><User size={20} /></div>
                <div>
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Intern Name</span>
                  <p className="text-lg font-extrabold text-slate-800">{result.intern_name}</p>
                  <p className="text-sm font-medium text-slate-500 flex items-center mt-0.5">
                    {result.college_name}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-slate-100 pt-6">
                <div className="flex items-start space-x-4">
                  <div className="bg-slate-100 p-2.5 rounded-xl text-slate-500"><BookOpen size={18} /></div>
                  <div>
                    <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Project Details</span>
                    <p className="text-sm font-bold text-slate-800 leading-snug">{result.project_title}</p>
                    <p className="text-xs font-medium text-indigo-600 mt-1">{result.domain}</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="bg-slate-100 p-2.5 rounded-xl text-slate-500"><Calendar size={18} /></div>
                  <div>
                    <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Mentorship Period</span>
                    <p className="text-sm font-bold text-slate-800">{new Date(result.start_date).toLocaleDateString()} — {new Date(result.end_date).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-6 flex items-start space-x-4">
                <div className="bg-slate-100 p-2.5 rounded-xl text-slate-500"><Award size={20} /></div>
                <div>
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Faculty Mentor</span>
                  <p className="text-sm font-bold text-slate-800">
                    {result.mentor_name.startsWith('Dr') ? result.mentor_name : `Dr. ${result.mentor_name}`}
                  </p>
                </div>
              </div>

            </div>
          </div>
          <div className="bg-slate-50 p-4 border-t border-slate-100 text-center text-xs text-slate-500 font-medium">
            This certificate record is officially maintained by National Institute of Technology, Tiruchirappalli.
          </div>
        </div>
      )}
    </div>
  );
}
