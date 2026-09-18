import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { 
  LayoutDashboard, 
  ListFilter, 
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
  ShieldCheck, 
  TrendingUp, 
  AlertTriangle, 
  Layers, 
  PieChart,
  Calendar,
  Activity,
  Home
} from 'lucide-react';
import cleanerCityImg from '../assets/cleaner-city.png';
import ProfileModal from '../components/ProfileModal';

export default function OfficerReportsPage({ user }) {
  const navigate = useNavigate();
  const [activeTab] = useState('Reports & Analytics');
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const officerName = user?.full_name || 'Municipal Officer Dave';

  const [analytics, setAnalytics] = useState(null);
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchReportsData() {
      setLoading(true);
      try {
        const [analyticsRes, complaintsRes] = await Promise.all([
          api.getAnalytics().catch(() => null),
          api.listComplaints().catch(() => [])
        ]);
        if (analyticsRes) setAnalytics(analyticsRes);
        if (Array.isArray(complaintsRes)) setComplaints(complaintsRes);
      } catch (err) {
        console.error('Error loading reports & analytics data:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchReportsData();
  }, []);

  // Compute metric totals dynamically from live database or analytics
  const totalCount = analytics?.total_complaints ?? complaints.length;
  const newCount = analytics?.status_distribution?.New ?? complaints.filter(c => (c.status || '').toLowerCase() === 'new').length;
  const assignedCount = analytics?.status_distribution?.Assigned ?? complaints.filter(c => (c.status || '').toLowerCase() === 'assigned').length;
  const inProgressCount = analytics?.status_distribution?.['In Progress'] ?? complaints.filter(c => (c.status || '').toLowerCase().includes('progress')).length;
  const completedCount = analytics?.status_distribution?.Completed ?? complaints.filter(c => (c.status || '').toLowerCase() === 'completed').length;
  const resolvedCount = analytics?.status_distribution?.Resolved ?? complaints.filter(c => (c.status || '').toLowerCase() === 'resolved').length;

  // Category Distribution
  const categoryCounts = analytics?.category_distribution || {};
  if (Object.keys(categoryCounts).length === 0 && complaints.length > 0) {
    complaints.forEach(c => {
      const cat = c.category || 'Other';
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
    });
  }

  // Priority Distribution
  const priorityCounts = analytics?.priority_distribution || {
    Critical: complaints.filter(c => (c.priority || '').toLowerCase() === 'critical').length,
    High: complaints.filter(c => (c.priority || '').toLowerCase() === 'high').length,
    Medium: complaints.filter(c => (c.priority || '').toLowerCase() === 'medium').length,
    Low: complaints.filter(c => (c.priority || '').toLowerCase() === 'low').length,
  };

  // SLA & Aging Metrics
  const slaCompliance = analytics?.sla_compliance_rate ?? 100.0;
  const agingCount = analytics?.aging_complaints_count ?? complaints.filter(c => (c.aging_hours || 0) >= 24.0 && c.status !== 'Resolved').length;
  const slaBreachedCount = analytics?.sla_breached_count ?? complaints.filter(c => c.sla_status === 'BREACHED' && c.status !== 'Resolved').length;
  const topAgingComplaints = analytics?.top_aging_complaints || complaints
    .filter(c => c.status !== 'Resolved')
    .sort((a, b) => (b.aging_hours || 0) - (a.aging_hours || 0))
    .slice(0, 5)
    .map(c => ({
      ticket_number: c.ticket_number || c.ticketId || c.id,
      category: c.category || 'General',
      location: c.location || 'N/A',
      priority: c.priority || 'Medium',
      status: c.status || 'New',
      aging_hours: c.aging_hours || 0.0,
      sla_status: c.sla_status || 'ON_TIME'
    }));

  const metrics = [
    { id: 'total', label: 'Total Complaints', value: totalCount, icon: FileText, iconBg: '#EBF5FF', iconColor: '#2563EB' },
    { id: 'new', label: 'New', value: newCount, icon: Clock, iconBg: '#FFF7ED', iconColor: '#EA580C' },
    { id: 'assigned', label: 'Assigned', value: assignedCount, icon: Users, iconBg: '#FEF3C7', iconColor: '#D97706' },
    { id: 'in_progress', label: 'In Progress', value: inProgressCount, icon: Settings, iconBg: '#F3E8FF', iconColor: '#9333EA' },
    { id: 'completed', label: 'Completed', value: completedCount, icon: ShieldCheck, iconBg: '#E0F2FE', iconColor: '#0284C7' },
    { id: 'resolved', label: 'Resolved', value: resolvedCount, icon: CheckCircle2, iconBg: '#ECFDF5', iconColor: '#059669' }
  ];

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

  const getCategoryColor = (catName) => {
    const lower = (catName || '').toLowerCase();
    if (lower.includes('water')) return '#0284C7';
    if (lower.includes('street') || lower.includes('light')) return '#D97706';
    if (lower.includes('pothole') || lower.includes('road')) return '#2563EB';
    if (lower.includes('garb') || lower.includes('sanitat')) return '#475569';
    if (lower.includes('sewag') || lower.includes('drain')) return '#7C3AED';
    if (lower.includes('park') || lower.includes('tree')) return '#059669';
    return '#64748B';
  };

  const getSlaBadgeStyle = (status) => {
    switch (status) {
      case 'BREACHED': return { bg: '#FEE2E2', color: '#DC2626', label: 'Breached' };
      case 'NEAR_BREACH': return { bg: '#FEF3C7', color: '#D97706', label: 'Near Breach' };
      case 'RESOLVED': return { bg: '#DCFCE7', color: '#16A34A', label: 'Resolved' };
      case 'ON_TIME':
      default: return { bg: '#ECFDF5', color: '#059669', label: 'On Time' };
    }
  };

  return (
    <div className="citizen-dashboard-container">
      {/* Sidebar matching Officer Dashboard */}
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

        <div className="sidebar-promo-card" style={{ padding: 0, overflow: 'hidden', border: '1px solid #C6EAD7', borderRadius: '16px', background: 'transparent' }}>
          <img 
            src={cleanerCityImg} 
            alt="Together for a Cleaner Greener City" 
            style={{ width: '100%', height: 'auto', display: 'block', borderRadius: '16px' }} 
          />
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="citizen-main-content fade-in-up" style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
        
        {/* Header */}
        <div className="citizen-dash-header" style={{ marginBottom: 0 }}>
          <div>
            <div style={{ fontSize: '11px', fontWeight: 800, color: '#059669', letterSpacing: '0.6px', textTransform: 'uppercase', marginBottom: '4px' }}>
              EXECUTIVE INTELLIGENCE & PERFORMANCE
            </div>
            <h1 className="citizen-dash-title" style={{ fontSize: '26px' }}>
              Municipal Reports & Analytics
            </h1>
            <p className="citizen-dash-subtitle">
              Live complaint distributions, SLA compliance metrics, and operational performance from MongoDB.
            </p>
          </div>
        </div>

        {/* 6 Summary Metric Cards (Total, New, Assigned, In Progress, Completed, Resolved) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '14px' }}>
          {metrics.map((m) => {
            const Icon = m.icon;
            return (
              <div 
                key={m.id}
                className="citizen-stat-card"
                style={{
                  padding: '16px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  boxShadow: '0 2px 8px rgba(15, 23, 42, 0.03)'
                }}
              >
                <div className="stat-icon-box" style={{ background: m.iconBg, color: m.iconColor, width: '38px', height: '38px' }}>
                  <Icon size={18} />
                </div>
                <div>
                  <div className="stat-num" style={{ fontSize: '22px' }}>
                    {m.value}
                  </div>
                  <div className="stat-label" style={{ fontSize: '11.5px' }}>
                    {m.label}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* 2-Column Analytics Breakdown: Category & Priority */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          
          {/* Complaints by Category */}
          <div className="citizen-stat-card" style={{ padding: '22px 24px', flexDirection: 'column', alignItems: 'stretch' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Layers size={18} color="#059669" />
                <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                  Complaints by Category
                </h3>
              </div>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748B' }}>
                {Object.keys(categoryCounts).length} Categories
              </span>
            </div>

            {Object.keys(categoryCounts).length === 0 ? (
              <div style={{ padding: '30px 0', textAlign: 'center', color: '#94A3B8', fontSize: '13.5px' }}>
                No category data available yet.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {Object.entries(categoryCounts).map(([cat, count]) => {
                  const pct = totalCount > 0 ? Math.round((count / totalCount) * 100) : 0;
                  const barColor = getCategoryColor(cat);
                  return (
                    <div key={cat}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '5px' }}>
                        <span>{cat}</span>
                        <span style={{ color: '#0F172A', fontWeight: 700 }}>{count} ({pct}%)</span>
                      </div>
                      <div style={{ width: '100%', height: '8px', background: '#F1F5F9', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ width: `${Math.max(pct, 4)}%`, height: '100%', background: barColor, borderRadius: '4px', transition: 'width 0.3s ease' }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Priority & Status Distribution Breakdown */}
          <div className="citizen-stat-card" style={{ padding: '22px 24px', flexDirection: 'column', alignItems: 'stretch' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <PieChart size={18} color="#2563EB" />
                <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                  Priority & SLA Distribution
                </h3>
              </div>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#059669', background: '#ECFDF5', padding: '3px 8px', borderRadius: '8px' }}>
                {slaCompliance}% SLA Compliance
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '18px' }}>
              <div style={{ padding: '12px 14px', background: '#FEF2F2', borderRadius: '10px', border: '1px solid #FECACA' }}>
                <div style={{ fontSize: '11.5px', fontWeight: 700, color: '#991B1B', textTransform: 'uppercase' }}>Critical Priority</div>
                <div style={{ fontSize: '20px', fontWeight: 800, color: '#DC2626', marginTop: '2px' }}>{priorityCounts.Critical || 0}</div>
              </div>

              <div style={{ padding: '12px 14px', background: '#FFF7ED', borderRadius: '10px', border: '1px solid #FFEDD5' }}>
                <div style={{ fontSize: '11.5px', fontWeight: 700, color: '#9A3412', textTransform: 'uppercase' }}>High Priority</div>
                <div style={{ fontSize: '20px', fontWeight: 800, color: '#EA580C', marginTop: '2px' }}>{priorityCounts.High || 0}</div>
              </div>

              <div style={{ padding: '12px 14px', background: '#FEF3C7', borderRadius: '10px', border: '1px solid #FDE68A' }}>
                <div style={{ fontSize: '11.5px', fontWeight: 700, color: '#92400E', textTransform: 'uppercase' }}>Medium Priority</div>
                <div style={{ fontSize: '20px', fontWeight: 800, color: '#D97706', marginTop: '2px' }}>{priorityCounts.Medium || 0}</div>
              </div>

              <div style={{ padding: '12px 14px', background: '#F8FAFC', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: '11.5px', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>Low Priority</div>
                <div style={{ fontSize: '20px', fontWeight: 800, color: '#334155', marginTop: '2px' }}>{priorityCounts.Low || 0}</div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 14px', background: '#F8FAFC', borderRadius: '10px', border: '1px solid #E2E8F0', fontSize: '13px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Clock size={15} color="#EA580C" />
                <span style={{ color: '#475569', fontWeight: 600 }}>Aging Complaints (&gt; 24h):</span>
              </div>
              <strong style={{ color: '#0F172A' }}>{agingCount}</strong>
            </div>
          </div>

        </div>

        {/* COMPLAINT AGING & SLA TRACKING TABLE */}
        <div className="citizen-table-card">
          <div style={{ padding: '16px 24px', borderBottom: '1.5px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#D97706' }}>
                <Clock size={17} />
              </div>
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                Aging & Active SLA Tracking
              </h3>
            </div>
            <span style={{ fontSize: '12px', color: '#64748B', fontWeight: 600 }}>
              Calculated real-time via priority engine
            </span>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="citizen-complaints-table">
              <thead>
                <tr>
                  <th>Ticket ID</th>
                  <th>Category</th>
                  <th>Location</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Aging Hours</th>
                  <th>SLA Status</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {topAgingComplaints.length === 0 ? (
                  <tr>
                    <td colSpan="8" style={{ textAlign: 'center', padding: '36px', color: '#94A3B8' }}>
                      No active aging complaints in the queue.
                    </td>
                  </tr>
                ) : (
                  topAgingComplaints.map((item) => {
                    const slaStyle = getSlaBadgeStyle(item.sla_status);
                    return (
                      <tr key={item.ticket_number} className="table-row-hover">
                        <td className="ticket-id-badge">{item.ticket_number}</td>
                        <td style={{ fontWeight: 600, color: '#0F172A' }}>{item.category}</td>
                        <td>
                          <div className="location-cell">
                            <MapPin size={14} color="#64748B" />
                            <span>{item.location}</span>
                          </div>
                        </td>
                        <td>
                          <span className={`priority-pill priority-${(item.priority || 'medium').toLowerCase()}`}>
                            {item.priority}
                          </span>
                        </td>
                        <td>
                          <span style={{ 
                            background: item.status === 'Resolved' ? '#DCFCE7' : item.status === 'Completed' ? '#E0F2FE' : item.status === 'In Progress' ? '#F3E8FF' : item.status === 'Assigned' ? '#DBEAFE' : '#FEF3C7',
                            color: item.status === 'Resolved' ? '#16A34A' : item.status === 'Completed' ? '#0284C7' : item.status === 'In Progress' ? '#9333EA' : item.status === 'Assigned' ? '#2563EB' : '#D97706',
                            padding: '4px 10px',
                            borderRadius: '12px',
                            fontWeight: 700,
                            fontSize: '12px',
                            display: 'inline-block'
                          }}>
                            {item.status}
                          </span>
                        </td>
                        <td style={{ fontWeight: 700, color: item.aging_hours >= 24 ? '#DC2626' : '#334155' }}>
                          {item.aging_hours} hrs
                        </td>
                        <td>
                          <span style={{
                            background: slaStyle.bg,
                            color: slaStyle.color,
                            padding: '4px 10px',
                            borderRadius: '12px',
                            fontWeight: 700,
                            fontSize: '12px',
                            display: 'inline-block'
                          }}>
                            {slaStyle.label}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button 
                            className="btn-view-details-pill"
                            onClick={() => navigate(`/officer/complaints/${item.ticket_number}`)}
                          >
                            View Details
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
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
