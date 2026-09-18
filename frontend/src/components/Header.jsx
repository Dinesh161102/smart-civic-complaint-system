import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Building2, User, UserPlus, LogOut, ShieldAlert, FileText, Megaphone } from 'lucide-react';

export default function Header({ user, onLogout, onOpenAbout }) {
  const navigate = useNavigate();
  const location = useLocation();
  const userRole = (user?.role || '').toLowerCase();


  return (
    <header className="container">
      <nav className="navbar">
        {/* Brand Logo */}
        <Link to="/" className="logo-container">
          <div className="logo-icon-bg">
            <Building2 size={24} />
          </div>
          <div className="logo-text-group">
            <span className="logo-title">Smart Civic</span>
            <span className="logo-subtext">Report  Resolve  Build Together</span>
          </div>
        </Link>

        {/* Navigation Links */}
        <ul className="nav-menu">
          <li>
            <Link to="/" className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}>
              {(userRole === 'crew' || userRole.includes('officer')) ? 'Back to Home' : 'Home'}
            </Link>
          </li>

          {/* Officer Navigation */}
          {userRole.includes('officer') && (
            <li>
              <Link to="/officer" className={`nav-link ${location.pathname.startsWith('/officer') ? 'active' : ''}`}>
                Officer Portal
              </Link>
            </li>
          )}

          {/* Crew Navigation */}
          {userRole === 'crew' && (
            <li>
              <Link to="/crew" className={`nav-link ${location.pathname === '/crew' ? 'active' : ''}`}>
                Crew Operations
              </Link>
            </li>
          )}

          {/* Citizen / Public Navigation */}
          {!userRole.includes('officer') && userRole !== 'crew' && (
            <>
              <li>
                <Link to="/report-issue" className={`nav-link ${location.pathname === '/report-issue' ? 'active' : ''}`}>
                  Report Issue
                </Link>
              </li>
              <li>
                <Link to="/my-complaints" className={`nav-link ${location.pathname.startsWith('/my-complaints') || location.pathname.startsWith('/complaints') ? 'active' : ''}`}>
                  My Complaints
                </Link>
              </li>
              {/* Only show About on the Landing Page ('/') */}
              {location.pathname === '/' && onOpenAbout && (
                <li>
                  <span className="nav-link" onClick={() => onOpenAbout('about')} style={{ cursor: 'pointer' }}>
                    About
                  </span>
                </li>
              )}
            </>
          )}
        </ul>


        {/* Auth / Profile Actions */}
        <div className="nav-auth-buttons">
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {(user?.role && (user.role === 'Municipal Officer' || user.role === 'Officer' || user.role === 'municipal_officer' || user.role.toLowerCase().includes('officer'))) && (
                <button 
                  className="btn-register" 
                  style={{ background: '#0F172A', padding: '8px 16px', fontSize: '13px' }}
                  onClick={() => navigate('/officer')}
                >
                  <ShieldAlert size={16} /> Officer Portal
                </button>
              )}
              <div style={{ textAlign: 'right', lineHeight: '1.2' }}>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#0F172A' }}>{user.full_name}</div>
                <div style={{ fontSize: '11px', color: '#0F9F59', fontWeight: 600 }}>{user.role}</div>
              </div>
              <button className="btn-login" style={{ padding: '8px 14px' }} onClick={onLogout} title="Logout">
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <>
              <Link to="/login" className="btn-login">
                <User size={16} /> Login
              </Link>
              <Link to="/register" className="btn-register">
                <UserPlus size={16} /> Register
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
