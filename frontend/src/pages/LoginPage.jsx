import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { ArrowRight, Lock, Mail, Building2, User, ShieldAlert, Wrench, Sparkles, CheckCircle2 } from 'lucide-react';
import { api, setStoredToken, setStoredUser } from '../services/api';

export default function LoginPage({ onAuthSuccess }) {
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get('redirectTo') || '/my-complaints';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await api.login({ email, password });
      setStoredToken(res.access_token);
      setStoredUser(res.user);
      if (onAuthSuccess) onAuthSuccess(res.user);

      const role = (res.user?.role || '').toLowerCase();
      if (role.includes('crew') || role.includes('field')) {
        navigate('/crew', { replace: true });
      } else if (role.includes('officer') || role.includes('municipal')) {
        navigate('/officer', { replace: true });
      } else {
        const target = searchParams.get('redirectTo') || '/my-complaints';
        navigate(decodeURIComponent(target), { replace: true });
      }
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleFillDemo = (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setError('');
  };

  return (
    <div className="page-container auth-page">
      <div className="auth-card fade-in-up" style={{ maxWidth: '480px' }}>
        <div className="auth-card-header">
          <div className="auth-logo-badge">
            <Building2 size={24} />
          </div>
          <h2>Account Login</h2>
          <p>Sign in to access your civic portal, view complaints, or manage field operations</p>
        </div>

        {searchParams.get('registered') === 'true' && (
          <div className="alert alert-success">
            Account created successfully! Please sign in with your credentials.
          </div>
        )}

        {searchParams.get('sessionExpired') === 'true' && (
          <div className="alert alert-error">
            Your session has expired. Please sign in again to continue.
          </div>
        )}

        {error && (
          <div className="alert alert-error">
            {error}
          </div>
        )}

        {/* Unified Single Login Form (No Dropdown Selector) */}
        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <div className="input-with-icon">
              <Mail className="input-icon" size={18} />
              <input
                type="email"
                className="form-input"
                placeholder="e.g. citizen@civic.gov"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div className="input-with-icon">
              <Lock className="input-icon" size={18} />
              <input
                type="password"
                className="form-input"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button type="submit" className="btn-submit" disabled={loading}>
            {loading ? 'Signing In...' : 'Sign In'} <ArrowRight size={18} />
          </button>
        </form>

        {/* "Who can sign in?" Section */}
        <div style={{
          marginTop: '22px',
          padding: '16px',
          background: '#F8FAFC',
          borderRadius: '12px',
          border: '1px solid #E2E8F0',
          textAlign: 'left'
        }}>
          <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' }}>
            Who can sign in?
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', color: '#475569', lineHeight: '1.4' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
              <span style={{ color: '#0F9F59', fontWeight: 700, marginTop: '-1px' }}>•</span>
              <div><strong style={{ color: '#0F172A' }}>Citizen</strong> — Register a new account to report and track civic issues.</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
              <span style={{ color: '#2563EB', fontWeight: 700, marginTop: '-1px' }}>•</span>
              <div><strong style={{ color: '#0F172A' }}>Municipal Officer</strong> — Sign in using official municipal credentials.</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
              <span style={{ color: '#D97706', fontWeight: 700, marginTop: '-1px' }}>•</span>
              <div><strong style={{ color: '#0F172A' }}>Field Crew</strong> — Sign in using assigned crew credentials.</div>
            </div>
          </div>
        </div>

        {/* Demo Access Option for Hackathon Panel Testing */}
        <div style={{
          marginTop: '16px',
          padding: '14px 16px',
          background: 'linear-gradient(135deg, #F0FDF4 0%, #ECFDF5 100%)',
          borderRadius: '12px',
          border: '1px solid #C6EAD7',
          textAlign: 'left'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', fontWeight: 700, color: '#065F46' }}>
              <Sparkles size={15} color="#059669" /> Demo Access
            </div>
            <span style={{ fontSize: '11px', color: '#047857', fontWeight: 600 }}>Click to auto-fill</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
            <button
              type="button"
              style={{
                padding: '8px 6px',
                borderRadius: '8px',
                border: '1px solid #C6EAD7',
                background: '#FFFFFF',
                fontSize: '12px',
                fontWeight: 600,
                color: '#065F46',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '3px',
                transition: 'all 0.2s'
              }}
              onClick={() => handleFillDemo('citizen@civic.gov', 'Citizen123!')}
              title="Auto-fill Citizen credentials"
            >
              <User size={14} color="#059669" />
              <span>Citizen</span>
            </button>

            <button
              type="button"
              style={{
                padding: '8px 6px',
                borderRadius: '8px',
                border: '1px solid #C6EAD7',
                background: '#FFFFFF',
                fontSize: '12px',
                fontWeight: 600,
                color: '#1E40AF',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '3px',
                transition: 'all 0.2s'
              }}
              onClick={() => handleFillDemo('officer@civic.gov', 'Officer123!')}
              title="Auto-fill Municipal Officer credentials"
            >
              <ShieldAlert size={14} color="#2563EB" />
              <span>Officer</span>
            </button>

            <button
              type="button"
              style={{
                padding: '8px 6px',
                borderRadius: '8px',
                border: '1px solid #C6EAD7',
                background: '#FFFFFF',
                fontSize: '12px',
                fontWeight: 600,
                color: '#92400E',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '3px',
                transition: 'all 0.2s'
              }}
              onClick={() => handleFillDemo('crew@civic.gov', 'Crew123!')}
              title="Auto-fill Field Crew credentials"
            >
              <Wrench size={14} color="#D97706" />
              <span>Crew</span>
            </button>
          </div>
        </div>

        {/* Citizen-only Registration Footer */}
        <div className="auth-card-footer" style={{ marginTop: '20px' }}>
          <span>Don't have a citizen account?</span>
          <Link to={`/register?redirectTo=${encodeURIComponent(redirectTo)}`} className="auth-link">
            Register as Citizen
          </Link>
        </div>
      </div>
    </div>
  );
}
