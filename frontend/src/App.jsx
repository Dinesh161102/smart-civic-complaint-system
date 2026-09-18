import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import ProtectedRoute from './components/ProtectedRoute';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ReportIssuePage from './pages/ReportIssuePage';
import ReportManualPage from './pages/ReportManualPage';
import ReportAIPage from './pages/ReportAIPage';
import MyComplaintsPage from './pages/MyComplaintsPage';
import ComplaintDetailPage from './pages/ComplaintDetailPage';
import OfficerDashboardPage from './pages/OfficerDashboardPage';
import OfficerComplaintsPage from './pages/OfficerComplaintsPage';
import OfficerComplaintDetailPage from './pages/OfficerComplaintDetailPage';
import OfficerReportsPage from './pages/OfficerReportsPage';
import CrewPortalPage from './pages/CrewPortalPage';
import InfoModal from './components/InfoModal';
import { getStoredUser, clearAuth, api } from './services/api';
import { Building2 } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState(getStoredUser());
  const [infoModal, setInfoModal] = useState({ isOpen: false, type: 'about' });

  useEffect(() => {
    // Check health of backend on mount
    api.checkHealth().catch(() => {
      console.log('Backend server not detected or starting up...');
    });

    // Synchronize auth state on logout, cross-tab events, or browser back navigation
    const handleAuthChange = () => {
      setUser(getStoredUser());
    };

    const handlePageShow = (event) => {
      const currentUser = getStoredUser();
      setUser(currentUser);
      const publicPaths = ['/', '/login', '/register'];
      if (!currentUser && !publicPaths.includes(window.location.pathname)) {
        window.location.replace('/');
      }
    };

    window.addEventListener('storage', handleAuthChange);
    window.addEventListener('auth:logout', handleAuthChange);
    window.addEventListener('popstate', handleAuthChange);
    window.addEventListener('pageshow', handlePageShow);

    return () => {
      window.removeEventListener('storage', handleAuthChange);
      window.removeEventListener('auth:logout', handleAuthChange);
      window.removeEventListener('popstate', handleAuthChange);
      window.removeEventListener('pageshow', handlePageShow);
    };
  }, []);

  const handleAuthSuccess = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    clearAuth();
    setUser(null);
    window.location.replace('/');
  };

  return (
    <BrowserRouter>
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div>
          {/* Navigation Header */}
          <Header 
            user={user}
            onLogout={handleLogout}
            onOpenAbout={(type) => setInfoModal({ isOpen: true, type })}
          />

          {/* Page Routing with Role-Based Route Protection */}
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<HomePage />} />
            
            <Route 
              path="/login" 
              element={<LoginPage onAuthSuccess={handleAuthSuccess} />} 
            />
            
            <Route 
              path="/register" 
              element={<RegisterPage />} 
            />
            
            {/* Citizen Protected Routes */}
            <Route 
              path="/report-issue" 
              element={
                <ProtectedRoute allowedRoles={['Citizen', 'Municipal Officer']}>
                  <ReportIssuePage />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/report-issue/manual" 
              element={
                <ProtectedRoute allowedRoles={['Citizen', 'Municipal Officer']}>
                  <ReportManualPage user={user} />
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/report-issue/ai" 
              element={
                <ProtectedRoute allowedRoles={['Citizen', 'Municipal Officer']}>
                  <ReportAIPage user={user} />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/my-complaints" 
              element={
                <ProtectedRoute allowedRoles={['Citizen', 'Municipal Officer', 'Crew']}>
                  <MyComplaintsPage user={user} />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/complaints/:id" 
              element={
                <ProtectedRoute allowedRoles={['Citizen', 'Municipal Officer', 'Crew']}>
                  <ComplaintDetailPage user={user} />
                </ProtectedRoute>
              } 
            />
            
            {/* Officer Protected Routes */}
            <Route 
              path="/officer" 
              element={
                <ProtectedRoute allowedRoles={['Municipal Officer', 'Officer']}>
                  <OfficerDashboardPage user={user} />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/officer/complaints" 
              element={
                <ProtectedRoute allowedRoles={['Municipal Officer', 'Officer']}>
                  <OfficerComplaintsPage user={user} />
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/officer/complaints/:id" 
              element={
                <ProtectedRoute allowedRoles={['Municipal Officer', 'Officer']}>
                  <OfficerComplaintDetailPage user={user} />
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/officer/reports" 
              element={
                <ProtectedRoute allowedRoles={['Municipal Officer', 'Officer']}>
                  <OfficerReportsPage user={user} />
                </ProtectedRoute>
              } 
            />

            {/* Crew Protected Routes */}

            <Route 
              path="/crew" 
              element={
                <ProtectedRoute allowedRoles={['Crew', 'Municipal Officer']}>
                  <CrewPortalPage user={user} />
                </ProtectedRoute>
              } 
            />
          </Routes>
        </div>

        {/* Footer Banner */}
        <footer style={{ background: '#1E293B', padding: '26px 0', borderTop: 'none', marginTop: '40px' }}>
          <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'linear-gradient(135deg, #0F9F59 0%, #059669 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', boxShadow: '0 2px 8px rgba(15, 159, 89, 0.3)' }}>
                <Building2 size={18} />
              </div>
              <span style={{ fontWeight: 800, fontSize: '16px', color: '#FFFFFF', letterSpacing: '-0.3px' }}>Smart Civic</span>
            </div>

            <div style={{ fontSize: '13.5px', color: '#94A3B8', fontWeight: 500 }}>
              © 2026 Smart Civic Issue Management System. Built for Clean, Safe & Vibrant Communities.
            </div>
          </div>
        </footer>

        {/* Informational Modal */}
        <InfoModal 
          isOpen={infoModal.isOpen}
          type={infoModal.type}
          onClose={() => setInfoModal({ ...infoModal, isOpen: false })}
        />
      </div>
    </BrowserRouter>
  );
}

