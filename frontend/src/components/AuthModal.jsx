import React, { useState } from 'react';
import { X, User, Lock, Mail, Phone, ArrowRight, ShieldCheck } from 'lucide-react';
import { api, setStoredToken, setStoredUser } from '../services/api';

export default function AuthModal({ isOpen, initialMode = 'login', onClose, onAuthSuccess }) {
  const [mode, setMode] = useState(initialMode); // 'login' or 'register'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.login({ email, password });
      setStoredToken(res.access_token);
      setStoredUser(res.user);
      onAuthSuccess(res.user);
      onClose();
    } catch (err) {
      setError(err.message || 'Login failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.register({
        email,
        password,
        full_name: fullName,
        phone: phone || undefined,
        role: 'Citizen'
      });
      setStoredToken(res.access_token);
      setStoredUser(res.user);
      onAuthSuccess(res.user);
      onClose();
    } catch (err) {
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (role) => {
    setError('');
    setLoading(true);
    const credentials = role === 'officer' 
      ? { email: 'officer@civic.gov', password: 'Officer123!' }
      : { email: 'citizen@civic.gov', password: 'Citizen123!' };

    try {
      const res = await api.login(credentials);
      setStoredToken(res.access_token);
      setStoredUser(res.user);
      onAuthSuccess(res.user);
      onClose();
    } catch (err) {
      setError(err.message || 'Demo login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-card">
        <div className="modal-header">
          <h2>{mode === 'login' ? 'Account Login' : 'Citizen Registration'}</h2>
          <button className="btn-close-modal" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          {/* Tab Switcher */}
          <div style={{ display: 'flex', gap: '8px', background: '#F1F5F9', padding: '4px', borderRadius: '12px', marginBottom: '24px' }}>
            <button
              style={{
                flex: 1,
                padding: '10px',
                borderRadius: '8px',
                border: 'none',
                background: mode === 'login' ? 'white' : 'transparent',
                fontWeight: mode === 'login' ? 700 : 500,
                color: mode === 'login' ? '#0F172A' : '#64748B',
                cursor: 'pointer',
                boxShadow: mode === 'login' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none'
              }}
              onClick={() => { setMode('login'); setError(''); }}
            >
              Login
            </button>
            <button
              style={{
                flex: 1,
                padding: '10px',
                borderRadius: '8px',
                border: 'none',
                background: mode === 'register' ? 'white' : 'transparent',
                fontWeight: mode === 'register' ? 700 : 500,
                color: mode === 'register' ? '#0F172A' : '#64748B',
                cursor: 'pointer',
                boxShadow: mode === 'register' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none'
              }}
              onClick={() => { setMode('register'); setError(''); }}
            >
              Register (Citizen)
            </button>
          </div>

          {error && (
            <div style={{ padding: '12px 16px', background: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626', borderRadius: '10px', fontSize: '14px', marginBottom: '20px' }}>
              {error}
            </div>
          )}

          {mode === 'login' ? (
            <form onSubmit={handleLogin}>
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <div style={{ position: 'relative' }}>
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
                <input
                  type="password"
                  className="form-input"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <button type="submit" className="btn-submit" disabled={loading}>
                {loading ? 'Signing in...' : 'Sign In'} <ArrowRight size={18} />
              </button>

              <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid #E2E8F0', textAlign: 'center' }}>
                <p style={{ fontSize: '13px', color: '#64748B', marginBottom: '12px' }}>Quick Demo Logins:</p>
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                  <button
                    type="button"
                    style={{ padding: '8px 14px', borderRadius: '8px', border: '1px solid #CBD5E1', background: 'white', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
                    onClick={() => handleDemoLogin('citizen')}
                  >
                    <User size={14} style={{ display: 'inline', marginRight: '4px' }} /> Citizen Demo
                  </button>
                  <button
                    type="button"
                    style={{ padding: '8px 14px', borderRadius: '8px', border: '1px solid #CBD5E1', background: '#F8FAFC', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
                    onClick={() => handleDemoLogin('officer')}
                  >
                    <ShieldCheck size={14} style={{ display: 'inline', marginRight: '4px', color: '#0F9F59' }} /> Officer Demo
                  </button>
                </div>
              </div>
            </form>
          ) : (
            <form onSubmit={handleRegister}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Jane Citizen"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input
                  type="email"
                  className="form-input"
                  placeholder="citizen@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Phone Number (Optional)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="+1-555-0199"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Password (Min 6 chars)</label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="Choose a password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>

              <button type="submit" className="btn-submit" disabled={loading}>
                {loading ? 'Creating Account...' : 'Create Citizen Account'} <ArrowRight size={18} />
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
