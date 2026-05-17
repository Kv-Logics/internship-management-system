'use client';
import React, { useState, useContext, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AuthContext } from '../providers';
import toast from 'react-hot-toast';
import { Mail, ShieldCheck, KeyRound, ArrowRight, UserCog, Lock, User } from 'lucide-react';

export default function Login() {
  const { user, sendOtp, verifyOtp, adminLogin, loading } = useContext(AuthContext);
  const router = useRouter();
  
  const [loginMode, setLoginMode] = useState('faculty'); // 'faculty' or 'admin'
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [step, setStep] = useState(1); // 1 = Email, 2 = OTP
  const [submitting, setSubmitting] = useState(false);
  const [devOtp, setDevOtp] = useState(''); // Stores the OTP returned in dev mode

  useEffect(() => {
    if (user) {
      router.push('/');
    }
  }, [user, router]);

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!email) {
      toast.error('Please enter your email.');
      return;
    }

    setSubmitting(true);
    try {
      const data = await sendOtp(email);
      toast.success('OTP sent successfully!');
      
      if (data.otp) {
        setDevOtp(data.otp);
        toast.success(`[DEV MODE] Captured OTP: ${data.otp}`, {
          duration: 6000,
          icon: '🔑'
        });
      }
      
      setStep(2);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.detail || 'Failed to send OTP. Ensure your email is seeded.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otp || otp.length !== 6) {
      toast.error('Please enter a valid 6-digit OTP.');
      return;
    }

    setSubmitting(true);
    try {
      await verifyOtp(email, otp);
      toast.success('Logged in successfully!');
      router.push('/');
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.detail || 'Invalid or expired OTP.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      toast.error('Please enter both username and password.');
      return;
    }

    setSubmitting(true);
    try {
      await adminLogin(username, password);
      toast.success('Administrator authenticated successfully!');
      router.push('/');
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.detail || 'Invalid administrator credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAutoFill = () => {
    if (devOtp) {
      setOtp(devOtp);
      toast.success('Auto-filled development OTP!');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-tr from-indigo-900 via-indigo-950 to-purple-950 p-6">
      <div className="w-full max-w-md bg-white/10 backdrop-blur-md rounded-3xl border border-white/10 shadow-2xl overflow-hidden p-8 text-white">
        
        {/* Logo/Icon Area */}
        <div className="text-center mb-6">
          <div className="inline-flex bg-indigo-500/20 p-4 rounded-full border border-indigo-500/30 text-indigo-400 mb-3">
            {loginMode === 'faculty' ? <ShieldCheck size={32} /> : <UserCog size={32} />}
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight">
            {loginMode === 'faculty' ? 'IMS Faculty Portal' : 'IMS Database Admin'}
          </h2>
          <p className="mt-1.5 text-xs text-indigo-200">
            {loginMode === 'faculty' 
              ? (step === 1 ? 'Enter your institutional email to request OTP' : 'Verify your 6-digit passcode')
              : 'Enter system administrator credentials'}
          </p>
        </div>

        {/* Tab Switcher */}
        {step === 1 && (
          <div className="grid grid-cols-2 p-1.5 bg-black/25 rounded-xl border border-white/5 mb-6">
            <button
              onClick={() => setLoginMode('faculty')}
              className={`py-2 text-xs font-semibold rounded-lg transition-all ${loginMode === 'faculty' ? 'bg-indigo-600 shadow-md text-white' : 'text-indigo-200 hover:text-white'}`}
            >
              Faculty OTP
            </button>
            <button
              onClick={() => setLoginMode('admin')}
              className={`py-2 text-xs font-semibold rounded-lg transition-all ${loginMode === 'admin' ? 'bg-indigo-600 shadow-md text-white' : 'text-indigo-200 hover:text-white'}`}
            >
              System Admin
            </button>
          </div>
        )}

        {/* Faculty Login Mode */}
        {loginMode === 'faculty' && (
          <>
            {step === 1 ? (
              <form onSubmit={handleSendOtp} className="space-y-6">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-indigo-300 mb-2">Email Address</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-indigo-300">
                      <Mail size={18} />
                    </span>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. employee@nitt.edu"
                      className="pl-10 w-full rounded-xl bg-white/5 border border-white/10 p-3.5 text-sm text-white placeholder-indigo-300/50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-xl text-sm font-bold shadow-lg hover:shadow-indigo-500/20 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Sending OTP...</span>
                    </>
                  ) : (
                    <>
                      <span>Request OTP Code</span>
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-6">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-indigo-300 mb-2">One-Time Password</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-indigo-300">
                      <KeyRound size={18} />
                    </span>
                    <input
                      type="text"
                      maxLength={6}
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                      placeholder="Enter 6-digit OTP"
                      className="pl-10 w-full rounded-xl bg-white/5 border border-white/10 p-3.5 text-sm text-white placeholder-indigo-300/50 tracking-[0.25em] text-center font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                      required
                    />
                  </div>
                </div>

                {devOtp && (
                  <div className="text-center">
                    <button
                      type="button"
                      onClick={handleAutoFill}
                      className="text-xs text-indigo-300 hover:text-white underline transition-colors"
                    >
                      Quick Autofill Mock OTP ({devOtp})
                    </button>
                  </div>
                )}

                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="w-1/3 py-3.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-semibold transition-all"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 py-3.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-xl text-sm font-bold shadow-lg hover:shadow-indigo-500/20 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
                  >
                    {submitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Verifying...</span>
                      </>
                    ) : (
                      <>
                        <span>Verify & Login</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </>
        )}

        {/* Admin Login Mode */}
        {loginMode === 'admin' && (
          <form onSubmit={handleAdminLogin} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-indigo-300 mb-2">Username</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-indigo-300">
                  <User size={18} />
                </span>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter administrator username"
                  className="pl-10 w-full rounded-xl bg-white/5 border border-white/10 p-3.5 text-sm text-white placeholder-indigo-300/50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-indigo-300 mb-2">Secret Password</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-indigo-300">
                  <Lock size={18} />
                </span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter secret password"
                  className="pl-10 w-full rounded-xl bg-white/5 border border-white/10 p-3.5 text-sm text-white placeholder-indigo-300/50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-xl text-sm font-bold shadow-lg hover:shadow-indigo-500/20 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>Admin Authenticate</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>
        )}

      </div>
    </div>
  );
}
