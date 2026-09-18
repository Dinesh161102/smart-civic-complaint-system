import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { ArrowRight, User, Mail, Lock, Phone, Building2 } from 'lucide-react';
import { api } from '../services/api';

export default function RegisterPage() {
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get('redirectTo') || '/my-complaints';

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await api.register({
        email,
        password,
        full_name: fullName,
        phone: phone || undefined,
        role: 'Citizen'
      });

      // Per requirement: After successful registration, redirect to Login
      navigate(`/login?registered=true&redirectTo=${encodeURIComponent(redirectTo)}`, { replace: true });
    } catch (err) {
      setError(err.message || 'Registration failed. Email may already be in use.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container auth-page">
      <div className="auth-card fade-in-up">
        <div className="auth-card-header">
          <div className="auth-logo-badge">
            <Building2 size={24} />
          </div>
          <h2>Citizen Registration</h2>
          <p>Create your municipal account to report & track civic issues</p>
        </div>

        {error && (
          <div className="alert alert-error">
            {error}
          </div>
        )}

        <form onSubmit={handleRegister}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <div className="input-with-icon">
              <User className="input-icon" size={18} />
              <input
                type="text"
                className="form-input"
                placeholder="Jane Citizen"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <div className="input-with-icon">
              <Mail className="input-icon" size={18} />
              <input
                type="email"
                className="form-input"
                placeholder="citizen@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Phone Number (Optional)</label>
            <div className="input-with-icon">
              <Phone className="input-icon" size={18} />
              <input
                type="text"
                className="form-input"
                placeholder="+1-555-0199"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Password (Min 6 chars)</label>
            <div className="input-with-icon">
              <Lock className="input-icon" size={18} />
              <input
                type="password"
                className="form-input"
                placeholder="Choose a secure password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
          </div>

          <button type="submit" className="btn-submit" disabled={loading}>
            {loading ? 'Creating Account...' : 'Create Citizen Account'} <ArrowRight size={18} />
          </button>
        </form>

        <div className="auth-card-footer">
          <span>Already registered?</span>
          <Link to={`/login?redirectTo=${encodeURIComponent(redirectTo)}`} className="auth-link">
            Sign In to Your Account
          </Link>
        </div>
      </div>
    </div>
  );
}
