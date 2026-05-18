'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { ShieldCheck, ShieldX, Loader2, GraduationCap, Calendar, BookOpen, User, Building2, Search } from 'lucide-react';

export default function VerifyCertificatePage() {
  const params = useParams();
  const [certData, setCertData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [manualId, setManualId] = useState('');
  const certId = params?.certId;

  const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

  const fetchCertificate = async (id) => {
    if (!id) return;
    setLoading(true);
    setError(null);
    setCertData(null);
    try {
      const res = await fetch(`${apiBase}/certificates/verify/${id}`);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Certificate not found.');
      }
      const data = await res.json();
      setCertData(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (certId) {
      setManualId(certId);
      fetchCertificate(certId);
    } else {
      setLoading(false);
    }
  }, [certId]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (manualId.trim()) {
      window.history.pushState({}, '', `/verify/${manualId.trim()}`);
      fetchCertificate(manualId.trim());
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #0f172a 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.75rem',
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '9999px',
          padding: '0.5rem 1.25rem',
          marginBottom: '1.5rem',
        }}>
          <ShieldCheck size={16} color="#60a5fa" />
          <span style={{ color: '#93c5fd', fontSize: '0.8rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            Official Verification Portal
          </span>
        </div>
        <h1 style={{ color: '#ffffff', fontSize: '2.5rem', fontWeight: 800, margin: '0 0 0.5rem 0', lineHeight: 1.2 }}>
          Certificate Verification
        </h1>
        <p style={{ color: '#94a3b8', fontSize: '1rem', margin: 0 }}>
          National Institute of Technology, Tiruchirappalli
        </p>
      </div>

      {/* Search Form */}
      <form onSubmit={handleSearch} style={{
        display: 'flex',
        gap: '0.75rem',
        marginBottom: '2rem',
        width: '100%',
        maxWidth: '520px',
      }}>
        <input
          type="text"
          value={manualId}
          onChange={e => setManualId(e.target.value)}
          placeholder="Enter Verification ID (e.g. NITT-A1B2C3D4E5F6)"
          style={{
            flex: 1,
            background: 'rgba(255,255,255,0.07)',
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: '0.75rem',
            padding: '0.875rem 1rem',
            color: '#ffffff',
            fontSize: '0.9rem',
            outline: 'none',
          }}
        />
        <button type="submit" style={{
          background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
          border: 'none',
          borderRadius: '0.75rem',
          padding: '0.875rem 1.25rem',
          color: '#ffffff',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          fontWeight: 600,
          fontSize: '0.9rem',
        }}>
          <Search size={16} />
          Verify
        </button>
      </form>

      {/* Result Card */}
      <div style={{ width: '100%', maxWidth: '640px' }}>
        {loading && certId && (
          <div style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '1.25rem',
            padding: '3rem',
            textAlign: 'center',
          }}>
            <Loader2 size={48} color="#60a5fa" style={{ animation: 'spin 1s linear infinite', margin: '0 auto 1rem auto' }} />
            <p style={{ color: '#94a3b8', margin: 0 }}>Verifying certificate...</p>
          </div>
        )}

        {error && (
          <div style={{
            background: 'rgba(239,68,68,0.1)',
            border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: '1.25rem',
            padding: '2.5rem',
            textAlign: 'center',
          }}>
            <ShieldX size={56} color="#f87171" style={{ margin: '0 auto 1rem auto' }} />
            <h2 style={{ color: '#fca5a5', fontSize: '1.5rem', fontWeight: 700, margin: '0 0 0.5rem 0' }}>
              Invalid Certificate
            </h2>
            <p style={{ color: '#94a3b8', margin: 0, fontSize: '0.9rem' }}>{error}</p>
            <p style={{ color: '#64748b', margin: '0.75rem 0 0 0', fontSize: '0.8rem' }}>
              Please check the Verification ID printed on the certificate and try again.
            </p>
          </div>
        )}

        {certData && (
          <div style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(34,197,94,0.3)',
            borderRadius: '1.25rem',
            overflow: 'hidden',
            boxShadow: '0 0 40px rgba(34,197,94,0.1)',
          }}>
            {/* Valid Banner */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(34,197,94,0.15), rgba(16,185,129,0.1))',
              borderBottom: '1px solid rgba(34,197,94,0.2)',
              padding: '1.5rem 2rem',
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
            }}>
              <div style={{
                background: 'rgba(34,197,94,0.15)',
                border: '1px solid rgba(34,197,94,0.3)',
                borderRadius: '50%',
                padding: '0.75rem',
                display: 'flex',
              }}>
                <ShieldCheck size={28} color="#4ade80" />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <h2 style={{ color: '#4ade80', fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>
                    ✓ Authentic Certificate
                  </h2>
                </div>
                <p style={{ color: '#86efac', fontSize: '0.8rem', margin: '0.1rem 0 0 0', fontFamily: 'monospace', letterSpacing: '0.05em' }}>
                  ID: {certData.certificate_number}
                </p>
              </div>
              <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                <p style={{ color: '#64748b', fontSize: '0.7rem', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Issued</p>
                <p style={{ color: '#94a3b8', fontSize: '0.8rem', margin: '0.1rem 0 0 0', fontWeight: 600 }}>
                  {formatDate(certData.generated_at)}
                </p>
              </div>
            </div>

            {/* Student Name Highlight */}
            <div style={{ padding: '1.75rem 2rem', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.375rem' }}>
                <GraduationCap size={16} color="#60a5fa" />
                <span style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Intern</span>
              </div>
              <h3 style={{ color: '#f1f5f9', fontSize: '1.5rem', fontWeight: 700, margin: '0 0 0.25rem 0' }}>
                {certData.intern_name}
              </h3>
              <p style={{ color: '#94a3b8', fontSize: '0.9rem', margin: 0 }}>
                {certData.college_name}
              </p>
            </div>

            {/* Details Grid */}
            <div style={{
              padding: '1.5rem 2rem',
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '1.25rem',
              borderBottom: '1px solid rgba(255,255,255,0.07)',
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.375rem' }}>
                  <BookOpen size={14} color="#a78bfa" />
                  <span style={{ color: '#64748b', fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Project Title</span>
                </div>
                <p style={{ color: '#e2e8f0', fontSize: '0.9rem', fontWeight: 600, margin: 0 }}>{certData.project_title}</p>
                <p style={{ color: '#64748b', fontSize: '0.8rem', margin: '0.25rem 0 0 0' }}>{certData.domain}</p>
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.375rem' }}>
                  <User size={14} color="#f59e0b" />
                  <span style={{ color: '#64748b', fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Faculty Mentor</span>
                </div>
                <p style={{ color: '#e2e8f0', fontSize: '0.9rem', fontWeight: 600, margin: 0 }}>{certData.mentor_name}</p>
                <p style={{ color: '#64748b', fontSize: '0.8rem', margin: '0.25rem 0 0 0' }}>NIT Tiruchirappalli</p>
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.375rem' }}>
                  <Calendar size={14} color="#34d399" />
                  <span style={{ color: '#64748b', fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Duration</span>
                </div>
                <p style={{ color: '#e2e8f0', fontSize: '0.85rem', fontWeight: 600, margin: 0 }}>
                  {formatDate(certData.start_date)} – {formatDate(certData.end_date)}
                </p>
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.375rem' }}>
                  <Building2 size={14} color="#fb923c" />
                  <span style={{ color: '#64748b', fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Issued By</span>
                </div>
                <p style={{ color: '#e2e8f0', fontSize: '0.85rem', fontWeight: 600, margin: 0 }}>NIT Tiruchirappalli</p>
                <p style={{ color: '#64748b', fontSize: '0.8rem', margin: '0.25rem 0 0 0' }}>Internship Management System</p>
              </div>
            </div>

            {/* Footer Note */}
            <div style={{ padding: '1rem 2rem', textAlign: 'center' }}>
              <p style={{ color: '#475569', fontSize: '0.75rem', margin: 0 }}>
                This certificate was issued through the official NIT Tiruchirappalli Internship Management System.
                Verification ID is unique and cryptographically generated to prevent forgery.
              </p>
            </div>
          </div>
        )}

        {!loading && !certData && !error && (
          <div style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '1.25rem',
            padding: '3rem',
            textAlign: 'center',
          }}>
            <ShieldCheck size={48} color="#334155" style={{ margin: '0 auto 1rem auto' }} />
            <p style={{ color: '#475569', margin: 0 }}>Enter a Verification ID above to validate a certificate.</p>
          </div>
        )}
      </div>

      {/* Styles */}
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        input::placeholder { color: #475569; }
        input:focus { border-color: rgba(96,165,250,0.5) !important; }
      `}</style>
    </div>
  );
}
