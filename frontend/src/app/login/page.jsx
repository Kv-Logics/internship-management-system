'use client';
import React, { useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthContext } from '../providers';
import api from '../../services/api';
import { ArrowRight, ShieldCheck, Lock, Mail, KeyRound, ChevronLeft } from 'lucide-react';
import nitlogo from '../../assets/nitlogo.png';
import NitImgBg from '../../assets/NitImgBg.jpeg';

export default function Login() {
  const { user, login, loading: authLoading } = useContext(AuthContext);
  const router = useRouter();
  
  const [step, setStep] = useState('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (user && !authLoading) {
      router.push('/');
    }
  }, [user, authLoading, router]);

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    let normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail.includes('@')) {
      normalizedEmail = `${normalizedEmail}@nitt.edu`;
    }
    if (!normalizedEmail.endsWith('@nitt.edu')) {
      setError('Only @nitt.edu email addresses are permitted.');
      return;
    }
    setEmail(normalizedEmail);
    setLoading(true);
    try {
      const response = await api.post('/auth/request-otp', { email: normalizedEmail });
      if (response.data.success) {
        setMessage('Verification code sent successfully to your NITT email.');
        setStep('otp');
      } else {
        setError(response.data.message || 'Failed to send OTP.');
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to send OTP. Please check your email or contact the administrator.');
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (otp.trim().length !== 6) {
      setError('OTP must be a 6-digit number.');
      return;
    }
    setLoading(true);
    let normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail.includes('@')) {
      normalizedEmail = `${normalizedEmail}@nitt.edu`;
    }
    try {
      await login(normalizedEmail, otp.trim());
      router.push('/');
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid or expired OTP code.');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-indigo-400 font-semibold space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
        <span>Establishing secure session...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative font-sans">
      
      {/* Background Image heavily darkened and lightly blurred */}
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${NitImgBg.src})` }}
      />
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Main Login Card - pure white, heavily rounded */}
      <div className="z-10 w-full max-w-[400px] bg-white rounded-[2rem] shadow-2xl p-8 md:p-10 flex flex-col items-center">
        
        {/* Logo in an app icon style box */}
        <div className="mx-auto mb-5 bg-stone-100 border border-stone-200 overflow-hidden flex items-center justify-center" style={{ width: '120px', height: '120px', borderRadius: '20px' }}>
          <img src={nitlogo.src} alt="NITT Logo" className="mix-blend-multiply" style={{ width: '110%', height: '110%', objectFit: 'contain' }} />
        </div>
        
        {/* Title & Subtitle */}
        <h1 className="text-xl font-bold text-gray-900 mb-1.5 text-center leading-tight">National Institute of Technology, Tiruchirappalli</h1>
        <p className="text-xs text-gray-500 mb-8">Sign in with your institute email</p>
        
        {/* Form area */}
        <div className="w-full">
          {error && (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-600 text-center font-medium">
              {error}
            </div>
          )}

          {message && step === 'otp' && (
            <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs text-emerald-600 text-center font-medium">
              {message}
            </div>
          )}

          {step === 'email' ? (
            <form onSubmit={handleRequestOtp} className="space-y-6">
              <div className="space-y-2 text-left w-full">
                <label className="block text-xs font-bold text-gray-700">Email address</label>
                <div className="flex items-center w-full rounded-xl border border-gray-300 bg-white focus-within:border-gray-800 focus-within:ring-1 focus-within:ring-gray-800 transition-all overflow-hidden">
                  <input
                    type="text"
                    value={email.split('@')[0]}
                    onChange={(e) => setEmail(e.target.value.split('@')[0])}
                    placeholder="Roll number or username"
                    required
                    className="flex-1 bg-transparent px-4 py-3 text-gray-900 outline-none text-sm placeholder:text-gray-400 font-medium"
                  />
                  <div className="px-4 py-3 bg-gray-50 border-l border-gray-200 text-gray-500 text-sm font-bold select-none">
                    @nitt.edu
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-[#1a1a1a] hover:bg-black rounded-xl text-sm font-bold text-white transition-all flex items-center justify-center cursor-pointer"
              >
                <span>{loading ? 'Sending...' : 'Send OTP'}</span>
              </button>
            </form>
          ) : (
            <form onSubmit={handleLoginSubmit} className="space-y-6">
              <div className="space-y-2 text-left w-full text-center">
                <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
                  Code sent to
                </p>
                <p className="font-bold text-gray-900 text-sm">
                  {email}
                </p>
              </div>

              <div className="space-y-2 text-left w-full mt-4">
                <label className="block text-xs font-bold text-gray-700">Verification Code</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  required
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-4 text-center text-3xl font-black tracking-[0.3em] text-gray-900 outline-none focus:border-gray-800 focus:ring-1 focus:ring-gray-800 transition-all placeholder:text-gray-300 placeholder:tracking-normal placeholder:font-medium"
                />
              </div>

              <button
                type="submit"
                disabled={loading || otp.length < 6}
                className="w-full py-3.5 bg-[#1a1a1a] hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-sm font-bold text-white transition-all flex items-center justify-center cursor-pointer"
              >
                <span>{loading ? 'Verifying...' : 'Sign In'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setStep('email');
                  setOtp('');
                  setError('');
                  setMessage('');
                }}
                className="w-full py-2 text-xs font-bold text-gray-500 hover:text-gray-800 transition-colors flex items-center justify-center cursor-pointer"
              >
                Change email address
              </button>
            </form>
          )}
        </div>
      </div>
      
      {/* Footer Text at the bottom of the screen */}
      <div className="absolute bottom-8 text-[11px] text-gray-300/80 font-medium tracking-wide">
        National Institute of Technology Tiruchirappalli Central Authentication
      </div>
    </div>
  );
}
