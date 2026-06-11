import React, { useState } from 'react';
import { Search, ShieldCheck, ShieldAlert, Award, Calendar, BookOpen, User, CheckCircle2 } from 'lucide-react';
import api from '../../services/api';

export default function VerifyCertificateTab() {
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
      const response = await api.get(`/certificates/verify/${certId.trim()}`);
      setResult(response.data);
    } catch (err) {
      if (err.response && err.response.status === 404) {
        setError('Invalid Verification ID. No certificate found with this number.');
      } else {
        setError('An error occurred while verifying the certificate. Please verify you are logged in as Admin.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-none border border-gray-150 p-8 shadow-none space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        
        {/* Left Column: Form & Info */}
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Certificate Verification Portal</h3>
            <p className="text-xs text-gray-500 mt-1">Validate the authenticity of generated student internship completion credentials securely.</p>
          </div>

          {/* Search Box */}
          <div className="bg-gray-50 p-6 rounded-none border border-gray-200">
            <form onSubmit={handleVerify} className="relative flex items-center">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-slate-400" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-32 py-3.5 border border-slate-200 rounded-none leading-5 bg-white placeholder-slate-405 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-xs font-semibold transition-all"
                placeholder="Enter Certificate ID (e.g. NITT-A1B2C3D4)"
                value={certId}
                onChange={(e) => setCertId(e.target.value.toUpperCase())}
              />
              <button
                type="submit"
                disabled={loading || !certId.trim()}
                className="absolute right-2 top-2 bottom-2 px-5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-none transition-all disabled:opacity-50 flex items-center cursor-pointer"
              >
                {loading ? (
                  <span className="flex items-center">
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-none animate-spin mr-1.5"></span>
                    Verifying
                  </span>
                ) : (
                  'Verify'
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Results */}
        <div className="w-full h-full flex flex-col justify-center min-h-[220px]">
          {!result && !error && !loading && (
            <div className="h-full border-2 border-dashed border-slate-200 rounded-none flex flex-col items-center justify-center p-8 text-center text-slate-400 bg-slate-50/50">
              <ShieldCheck size={36} className="mb-2 text-slate-350" />
              <p className="text-xs font-semibold">Enter a Verification ID to view credential status.</p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="w-full bg-rose-50 border border-rose-200 p-5 rounded-none flex items-start space-x-3 animate-fadeIn shadow-none">
              <div className="bg-rose-100 p-1.5 rounded-none mt-0.5">
                <ShieldAlert className="h-5 w-5 text-rose-600" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-rose-800">Verification Failed</h3>
                <p className="text-xs text-rose-600 mt-1 leading-relaxed">{error}</p>
              </div>
            </div>
          )}

          {/* Success Result */}
          {result && (
            <div className="w-full bg-white border border-emerald-150 shadow-none rounded-none overflow-hidden animate-fadeIn">
              <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 p-5 text-white flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <CheckCircle2 size={24} className="text-emerald-100" />
                  <div>
                    <h3 className="text-sm font-bold">Authentic Certificate</h3>
                    <p className="text-emerald-100 text-[10px] mt-0.5 font-medium tracking-wide">ID: {result.certificate_number}</p>
                  </div>
                </div>
                <div className="bg-white/20 px-2.5 py-0.5 rounded-none border border-white/20 text-[10px] font-bold tracking-wider">
                  VERIFIED
                </div>
              </div>
              
              <div className="p-6 space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="bg-slate-100 p-2 rounded-none text-slate-500"><User size={16} /></div>
                  <div>
                    <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Intern Name</span>
                    <p className="text-sm font-black text-slate-855">{result.intern_name}</p>
                    <p className="text-xs font-medium text-slate-500 mt-0.5">{result.college_name}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-100 pt-4">
                  <div className="flex items-start space-x-3">
                    <div className="bg-slate-100 p-2 rounded-none text-slate-500"><BookOpen size={16} /></div>
                    <div>
                      <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Project Details</span>
                      <p className="text-xs font-bold text-slate-800 leading-snug">{result.project_title}</p>
                      <p className="text-[10px] font-semibold text-indigo-600 mt-1">{result.domain}</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <div className="bg-slate-100 p-2 rounded-none text-slate-500"><Calendar size={16} /></div>
                    <div>
                      <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Mentorship Period</span>
                      <p className="text-xs font-bold text-slate-800">{new Date(result.start_date).toLocaleDateString()} — {new Date(result.end_date).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-4 flex items-start space-x-3">
                  <div className="bg-slate-100 p-2 rounded-none text-slate-500"><Award size={16} /></div>
                  <div>
                    <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Faculty Mentor</span>
                    <p className="text-xs font-bold text-slate-800">
                      {result.mentor_name.startsWith('Dr') ? result.mentor_name : `Dr. ${result.mentor_name}`}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
