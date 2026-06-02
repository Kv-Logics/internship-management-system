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
    <div className="flex min-h-screen bg-slate-950 font-sans selection:bg-indigo-500 selection:text-white">
      {/* Left side: Premium Campus Visual & Welcome Banner */}
      <div className="hidden md:flex md:w-[55%] relative flex-col justify-between p-16 text-white overflow-hidden">
        {/* Background Image with Zoom Effect */}
        <div 
          className="absolute inset-0 bg-cover bg-center transform scale-105 hover:scale-100 transition-transform duration-[8000ms] ease-out"
          style={{ backgroundImage: `url(${NitImgBg.src})` }}
        />
        {/* Deep Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-tr from-slate-950 via-slate-950/80 to-indigo-950/50 mix-blend-multiply" />
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-900/10 via-slate-950/60 to-slate-950" />
        
        {/* Top Header */}
        <div className="z-10 flex items-center space-x-4">
          <img src={nitlogo.src} alt="NITT Logo" className="h-16 w-16 object-contain filter drop-shadow-lg" />
          <div>
            <h1 className="text-lg font-bold tracking-wide uppercase text-indigo-200 leading-tight">National Institute of Technology</h1>
            <p className="text-xs tracking-wider text-slate-400 uppercase">Tiruchirappalli</p>
          </div>
        </div>

        {/* Bottom Banner Content */}
        <div className="z-10 space-y-6 max-w-xl">
          <span className="inline-block px-3 py-1 bg-indigo-500/20 border border-indigo-500/30 rounded-full text-xs font-bold text-indigo-300 uppercase tracking-widest">
            Institutional Portal
          </span>
          <h2 className="text-4xl lg:text-5xl font-black leading-tight tracking-tight text-white drop-shadow-md">
            Internship Record <br />
            <span className="text-indigo-400">Management System</span>
          </h2>
          <p className="text-base text-slate-300 leading-relaxed font-medium">
            A unified, secure platform for students, faculty mentors, and institute coordinators to manage summer internship documentation, verify payments, and issue tamper-proof completion certificates.
          </p>
          <div className="pt-4 border-t border-slate-800 flex items-center space-x-8 text-xs font-semibold text-slate-400">
            <div className="flex items-center space-x-2">
              <span className="h-2 w-2 bg-emerald-500 rounded-full animate-pulse" />
              <span>OTP Authentication Securing Portal</span>
            </div>
            <div className="flex items-center space-x-2">
              <ShieldCheck size={14} className="text-indigo-400" />
              <span>Digitally Verified E-Signatures</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right side: Login Panel */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-16 bg-slate-900 relative overflow-hidden">
        {/* Mobile Background Image (Only visible on screens < md) */}
        <div 
          className="absolute inset-0 bg-cover bg-center md:hidden"
          style={{ backgroundImage: `url(${NitImgBg.src})` }}
        />
        <div className="absolute inset-0 md:hidden bg-slate-950/90 backdrop-blur-sm" />
        
        {/* Subtle decorative background glow for desktop */}
        <div className="hidden md:block absolute top-1/4 -right-1/4 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[120px]" />
        
        {/* Login Card */}
        <div className="z-10 w-full max-w-md bg-slate-900/60 md:bg-slate-950/40 backdrop-blur-xl rounded-3xl border border-slate-800/80 shadow-2xl p-8 md:p-10 space-y-8 flex flex-col justify-between">
          <div className="space-y-6">
            {/* Logo display for mobile / Center logo */}
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="md:hidden flex items-center justify-center bg-white/5 p-3.5 rounded-2xl border border-white/10 shadow-inner">
                <img src={nitlogo.src} alt="NITT Logo" className="h-14 w-14 object-contain" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-bold tracking-tight text-white">Sign In</h3>
                <p className="text-sm text-slate-400 max-w-xs mx-auto">
                  Access the IMS portal using your institute email and a secure email verification code.
                </p>
              </div>
            </div>

            {error && (
              <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3.5 text-sm text-red-300">
                {error}
              </div>
            )}

            {message && step === 'otp' && (
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3.5 text-sm text-emerald-300">
                {message}
              </div>
            )}

            {step === 'email' ? (
              <form onSubmit={handleRequestOtp} className="space-y-5">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-300">
                    Institute Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-3.5 h-5 w-5 text-slate-500" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="username@nitt.edu"
                      required
                      className="w-full rounded-2xl border border-slate-800 bg-slate-900/50 pl-12 pr-4 py-3.5 text-white outline-none focus:border-indigo-500 focus:bg-slate-950 focus:ring-2 focus:ring-indigo-500/20 transition-all placeholder:text-slate-600"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="group w-full py-4 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-2xl text-base font-bold text-white shadow-xl hover:shadow-indigo-500/10 transition-all flex items-center justify-center space-x-3 cursor-pointer"
                >
                  <span>{loading ? 'Sending OTP...' : 'Send Verification OTP'}</span>
                  {!loading && <ArrowRight size={18} className="transform group-hover:translate-x-1 transition-transform" />}
                </button>
              </form>
            ) : (
              <form onSubmit={handleLoginSubmit} className="space-y-5">
                <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4 space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Code sent to
                  </p>
                  <p className="truncate font-semibold text-indigo-300">
                    {email}
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-300">
                    Enter Verification Code (OTP)
                  </label>
                  <div className="relative">
                    <KeyRound className="absolute left-4 top-4.5 h-5 w-5 text-slate-500" />
                    <input
                      type="text"
                      inputMode="numeric"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="000000"
                      required
                      className="w-full rounded-2xl border border-slate-800 bg-slate-900/50 pl-12 py-4 text-left text-2xl font-bold tracking-[0.25em] text-white outline-none focus:border-indigo-500 focus:bg-slate-950 focus:ring-2 focus:ring-indigo-500/20 transition-all placeholder:text-slate-700 placeholder:tracking-normal"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || otp.length < 6}
                  className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-2xl text-base font-bold text-white shadow-xl hover:shadow-indigo-500/10 transition-all flex items-center justify-center cursor-pointer"
                >
                  <span>{loading ? 'Verifying OTP...' : 'Sign In'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setStep('email');
                    setOtp('');
                    setError('');
                    setMessage('');
                  }}
                  className="w-full py-2 text-sm font-semibold text-slate-500 hover:text-slate-300 transition-colors flex items-center justify-center space-x-2 cursor-pointer"
                >
                  <ChevronLeft size={16} />
                  <span>Use a different email</span>
                </button>
              </form>
            )}
          </div>

          {/* Footer information */}
          <div className="space-y-4 pt-6 border-t border-slate-800/50">
            <div className="flex items-center justify-center space-x-2 text-xs font-semibold text-slate-500">
              <Lock size={12} className="text-indigo-500/80" />
              <span>TLS 1.3 Encrypted Session</span>
            </div>
            <p className="text-[10px] text-center text-slate-400 leading-normal">
              By accessing this system, you agree to comply with the NIT Trichy Information Technology Policy and academic regulations.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
