import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { 
  LayoutDashboard, 
  ListFilter, 
  UserCheck, 
  BarChart3, 
  User, 
  HelpCircle, 
  FileText, 
  Clock, 
  Users, 
  Settings, 
  CheckCircle2, 
  AlertCircle, 
  MapPin, 
  Lightbulb, 
  Trash2, 
  Wrench, 
  Droplet, 
  ArrowRight,
  ShieldCheck,
  UserPlus,
  History,
  Home
} from 'lucide-react';
import cleanerCityImg from '../assets/cleaner-city.png';
import ProfileModal from '../components/ProfileModal';

export default function OfficerDashboardPage({ user }) {
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  const officerName = user?.full_name || 'Municipal Officer Dave';

  const [complaints, setComplaints] = useState([]);
  const [analytics, setAnalytics] = useState(null);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const [analyticsRes, complaintsRes] = await Promise.all([
          api.getAnalytics().catch(() => null),
          api.listComplaints().catch(() => [])
        ]);
        if (analyticsRes) setAnalytics(analyticsRes);
        if (Array.isArray(complaintsRes)) setComplaints(complaintsRes);
      } catch (err) {
        console.log('Error loading dashboard data:', err.message);
      }
    }
    loadDashboardData();
  }, []);

  // Compute metric totals dynamically from live database or analytics
  const totalCount = analytics?.total_complaints ?? complaints.length;
  const newCount = analytics?.by_status?.New ?? complaints.filter(c => (c.status || '').toLowerCase() === 'new').length;
  const assignedCount = analytics?.by_status?.Assigned ?? complaints.filter(c => (c.status || '').toLowerCase() === 'assigned').length;
  const inProgressCount = analytics?.by_status?.['In Progress'] ?? complaints.filter(c => (c.status || '').toLowerCase().includes('progress')).length;
  const resolvedCount = analytics?.by_status?.Resolved ?? complaints.filter(c => (c.status || '').toLowerCase() === 'resolved').length;

  // 5 Essential Summary Metric Cards
  const metrics = [
    { id: 'total', label: 'Total Complaints', value: totalCount, icon: FileText, iconBg: '#EBF5FF', iconColor: '#2563EB' },
    { id: 'new', label: 'New', value: newCount, icon: Clock, iconBg: '#FFF7ED', iconColor: '#EA580C' },
    { id: 'assigned', label: 'Assigned', value: assignedCount, icon: Users, iconBg: '#FEF3C7', iconColor: '#D97706' },
    { id: 'in_progress', label: 'In Progress', value: inProgressCount, icon: Settings, iconBg: '#F3E8FF', iconColor: '#9333EA' },
    { id: 'resolved', label: 'Resolved', value: resolvedCount, icon: CheckCircle2, iconBg: '#ECFDF5', iconColor: '#059669' }
  ];

  // Simplified Donut Chart Data
  const donutData = [
    { label: 'New', count: newCount, color: '#3B82F6' },
    { label: 'Assigned', count: assignedCount, color: '#F59E0B' },
    { label: 'In Progress', count: inProgressCount, color: '#8B5CF6' },
    { label: 'Resolved', count: resolvedCount, color: '#10B981' },
  ];

  const totalDonutCount = donutData.reduce((acc, curr) => acc + curr.count, 0) || 1;

  // SVG Donut Math calculations (150px Donut)
  const donutRadius = 54;
  const strokeWidth = 22;
  const circumference = 2 * Math.PI * donutRadius;
  
  let accumulatedAngle = 0;
  const donutSlices = donutData.map((slice) => {
    const strokeDasharray = `${(slice.count / totalDonutCount) * circumference} ${circumference}`;
    const strokeDashoffset = -accumulatedAngle;
    accumulatedAngle += (slice.count / totalDonutCount) * circumference;
    return { ...slice, strokeDasharray, strokeDashoffset };
  });

  // Dynamic Priority Complaints List from API
  const priorityComplaints = complaints.map(c => ({
    id: c.id || c._id,
    ticketId: c.ticket_number || c.ticketId || c.id,
    issue: c.title || c.issue || c.category,
    category: c.category || 'General',
    categoryIcon: Lightbulb,
    categoryColor: '#EAB308',
    location: c.location || 'City Center',
    submittedOn: c.submitted_on || 'Recently',
    priority: c.priority || 'Medium',
    priorityBg: '#FFEDD5',
    priorityColor: '#EA580C',
    status: c.status || 'New',
    statusBg: '#FEF3C7',
    statusColor: '#D97706'
  }));

  const navigate = useNavigate();

  // Helper for Status Badge Styling
  const getStatusBadgeStyle = (status) => {
    switch (status) {
      case 'Resolved': return { bg: '#DCFCE7', color: '#16A34A' };
      case 'Completed': return { bg: '#E0F2FE', color: '#0284C7' };
      case 'In Progress': return { bg: '#F3E8FF', color: '#9333EA' };
      case 'Assigned': return { bg: '#DBEAFE', color: '#2563EB' };
      case 'New':
      default: return { bg: '#FEF3C7', color: '#D97706' };
    }
  };

  const sidebarNavItemsTop = [
    { label: 'Back to Home', icon: Home, path: '/' },
    { label: 'Dashboard', icon: LayoutDashboard, path: '/officer' },
    { label: 'Complaints Queue', icon: ListFilter, path: '/officer/complaints' },
    { label: 'Reports & Analytics', icon: BarChart3, path: '/officer/reports' },
  ];


  const sidebarNavItemsBottom = [
    { label: 'My Profile', icon: User, path: '#' },
    { label: 'Help & Support', icon: HelpCircle, path: '#' },
  ];

  return (
    <div className="citizen-dashboard-container">
      {/* Fixed Left Sidebar matching Citizen Dashboard */}
      <aside className="citizen-sidebar">
        <div>
          <nav className="sidebar-nav-list">
            {sidebarNavItemsTop.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.label;
              return (
                <button
                  key={item.label}
                  className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
                  onClick={() => {
                    if (item.path !== '#') {
                      navigate(item.path);
                    }
                  }}
                >
                  <Icon size={18} />
                  <span>{item.label}</span>
                </button>
              );
            })}

            <div style={{ margin: '12px 0', borderTop: '1px solid #E2E8F0' }} />

            {sidebarNavItemsBottom.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.label;
              return (
                <button
                  key={item.label}
                  className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
                  onClick={() => {
                    if (item.label === 'My Profile') {
                      setIsProfileModalOpen(true);
                    } else if (item.path !== '#') {
                      navigate(item.path);
                    }
                  }}
                >
                  <Icon size={18} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Banner Card */}
        <div className="sidebar-promo-card" style={{ padding: 0, overflow: 'hidden', border: '1px solid #C6EAD7', borderRadius: '16px', background: 'transparent' }}>
          <img 
            src={cleanerCityImg} 
            alt="Together for a Cleaner Greener City" 
            style={{ width: '100%', height: 'auto', display: 'block', borderRadius: '16px' }} 
          />
        </div>
      </aside>

      {/* Main Dashboard Content */}
      <main className="citizen-main-content fade-in-up" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* Header Banner */}
        <div className="citizen-dash-header" style={{ marginBottom: 0 }}>
          <div>
            <div style={{ fontSize: '11px', fontWeight: 800, color: '#059669', letterSpacing: '0.6px', textTransform: 'uppercase', marginBottom: '4px' }}>
              MUNICIPAL OFFICER PORTAL
            </div>
            <h1 className="citizen-dash-title" style={{ fontSize: '26px' }}>
              Municipal Officer Dashboard
            </h1>
            <p className="citizen-dash-subtitle">
              <strong style={{ color: '#0F172A' }}>Welcome, {officerName}</strong>
              <span style={{ margin: '0 6px', color: '#CBD5E1' }}>|</span>
              Manage and track citizen complaints to build a cleaner, better city.
            </p>
          </div>
        </div>

        {/* 5 ESSENTIAL SUMMARY CARDS GRID */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px' }}>
          {metrics.map((m) => {
            const Icon = m.icon;
            return (
              <div 
                key={m.id}
                className="citizen-stat-card"
                style={{
                  padding: '16px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  boxShadow: '0 2px 8px rgba(15, 23, 42, 0.03)'
                }}
              >
                <div className="stat-icon-box" style={{ background: m.iconBg, color: m.iconColor }}>
                  <Icon size={20} />
                </div>
                <div>
                  <div className="stat-num" style={{ fontSize: '24px' }}>
                    {m.value}
                  </div>
                  <div className="stat-label">
                    {m.label}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* COMPACT & BALANCED COMPLAINT STATUS OVERVIEW (Two-Part Layout) */}
        <div className="citizen-stat-card" style={{ padding: '20px 28px', flexDirection: 'column', alignItems: 'stretch' }}>
          {/* Card Section Title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <BarChart3 size={18} color="#0F172A" />
            <h3 style={{ fontSize: '15.5px', fontWeight: 800, color: '#0F172A', margin: 0 }}>
              Complaint Status Overview
            </h3>
          </div>

          {/* Balanced Two-Part Content */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '56px', padding: '4px 8px' }}>
            
            {/* Left: Donut Chart */}
            <div style={{ position: 'relative', width: '150px', height: '150px', flexShrink: 0 }}>
              <svg width="150" height="150" viewBox="0 0 150 150" style={{ transform: 'rotate(-90deg)' }}>
                <circle
                  cx="75"
                  cy="75"
                  r={donutRadius}
                  fill="transparent"
                  stroke="#F1F5F9"
                  strokeWidth={strokeWidth}
                />
                {donutSlices.map((slice, idx) => (
                  <circle
                    key={idx}
                    cx="75"
                    cy="75"
                    r={donutRadius}
                    fill="transparent"
                    stroke={slice.color}
                    strokeWidth={strokeWidth}
                    strokeDasharray={slice.strokeDasharray}
                    strokeDashoffset={slice.strokeDashoffset}
                    strokeLinecap="butt"
                  />
                ))}
              </svg>

              {/* Donut Center Label */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '24px', fontWeight: 800, color: '#0F172A', lineHeight: '1' }}>
                  {totalCount}
                </div>

                <div style={{ fontSize: '12px', color: '#64748B', fontWeight: 600, marginTop: '2px' }}>
                  Total
                </div>
              </div>
            </div>

            {/* Right: Compact Vertical Status List (Clean Rows without Card Box Backgrounds) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '280px', flexShrink: 0 }}>
              {donutData.map((item, index) => (
                <div 
                  key={item.label} 
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    padding: '6px 0',
                    borderBottom: index < donutData.length - 1 ? '1px solid #F1F5F9' : 'none'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: item.color, display: 'inline-block' }}></span>
                    <span style={{ color: '#334155', fontWeight: 600, fontSize: '14px' }}>{item.label}</span>
                  </div>
                  <span style={{ fontSize: '17px', fontWeight: 800, color: '#0F172A' }}>
                    {item.count}
                  </span>
                </div>
              ))}
            </div>

          </div>
        </div>

        {/* PRIORITY COMPLAINTS TABLE CARD */}
        <div className="citizen-table-card">
          
          {/* Table Header Bar */}
          <div style={{ padding: '16px 24px', borderBottom: '1.5px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: '#FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#EF4444' }}>
                <AlertCircle size={17} />
              </div>
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                Priority Complaints
              </h3>
            </div>

            <button 
              style={{ background: 'none', border: 'none', color: '#2563EB', fontWeight: 700, fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
              onClick={() => setActiveTab('Complaints Queue')}
            >
              View All <ArrowRight size={14} />
            </button>
          </div>

          {/* Table Body */}
          <div style={{ overflowX: 'auto' }}>
            <table className="citizen-complaints-table">
              <thead>
                <tr>
                  <th style={{ width: '40px' }}>#</th>
                  <th>Ticket ID</th>
                  <th>Issue Details</th>
                  <th>Category</th>
                  <th>Location</th>
                  <th>Submitted On</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {priorityComplaints.map((item) => {
                  const CatIcon = item.categoryIcon;
                  const stStyle = getStatusBadgeStyle(item.status);
                  return (
                    <tr key={item.id} className="table-row-hover">
                      <td style={{ color: '#64748B', fontWeight: 600 }}>{item.id}</td>
                      <td className="ticket-id-badge">{item.ticketId}</td>
                      <td style={{ color: '#334155', fontWeight: 600, maxWidth: '240px' }}>
                        {item.issue}
                      </td>
                      <td>
                        <div className="category-cell">
                          <CatIcon size={15} color={item.categoryColor} />
                          <span>{item.category}</span>
                        </div>
                      </td>
                      <td>
                        <div className="location-cell">
                          <MapPin size={14} color="#64748B" />
                          <span>{item.location}</span>
                        </div>
                      </td>
                      <td style={{ color: '#64748B', fontSize: '13px' }}>{item.submittedOn}</td>
                      <td>
                        <span className={`priority-pill ${item.priority === 'High' ? 'priority-high' : item.priority === 'Medium' ? 'priority-medium' : 'priority-low'}`}>
                          {item.priority}
                        </span>
                      </td>
                      <td>
                        <span style={{ 
                          background: stStyle.bg, 
                          color: stStyle.color,
                          padding: '4px 10px',
                          borderRadius: '12px',
                          fontWeight: 700,
                          fontSize: '12px',
                          display: 'inline-block'
                        }}>
                          {item.status}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                          {item.status === 'New' && (
                            <button 
                              className="btn-view-details-pill"
                              style={{ background: '#0F172A', color: 'white' }}
                              onClick={() => navigate(`/officer/complaints/${item.id}`)}
                            >
                              <UserPlus size={13} style={{ marginRight: '4px' }} /> Assign Crew
                            </button>
                          )}

                          {item.status === 'Completed' && (
                            <button 
                              className="btn-view-details-pill"
                              style={{ background: '#059669', color: 'white' }}
                              onClick={() => navigate(`/officer/complaints/${item.id}`)}
                            >
                              <ShieldCheck size={13} style={{ marginRight: '4px' }} /> Verify & Resolve
                            </button>
                          )}

                          {(item.status === 'Assigned' || item.status === 'In Progress' || item.status === 'Resolved') && (
                            <button 
                              className="btn-view-details-pill"
                              onClick={() => navigate(`/officer/complaints/${item.id}`)}
                            >
                              <History size={13} style={{ marginRight: '4px' }} /> View Updates
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

        </div>

      </main>

      {/* Profile Modal */}
      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        user={user}
      />
    </div>
  );
}
