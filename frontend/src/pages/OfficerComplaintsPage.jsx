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
  Search, 
  MapPin, 
  Lightbulb, 
  Trash2, 
  Wrench, 
  Droplet, 
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  History,
  ShieldCheck,
  UserPlus,
  Home
} from 'lucide-react';
import cleanerCityImg from '../assets/cleaner-city.png';
import ProfileModal from '../components/ProfileModal';

export default function OfficerComplaintsPage({ user }) {
  const navigate = useNavigate();
  const [activeTab] = useState('Complaints Queue');
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Statuses');
  const [categoryFilter, setCategoryFilter] = useState('All Categories');
  const [priorityFilter, setPriorityFilter] = useState('All Priorities');
  const [currentPage, setCurrentPage] = useState(1);

  const [complaints, setComplaints] = useState([]);

  useEffect(() => {
    async function fetchComplaints() {
      try {
        const data = await api.listComplaints();
        if (Array.isArray(data)) {
          const normalized = data.map(c => ({
            id: c.id || c._id,
            ticketId: c.ticket_number || c.ticketId || c.id,
            issue: c.title || c.issue || c.category,
            category: c.category || 'General',
            categoryIcon: Lightbulb,
            categoryColor: '#EAB308',
            location: c.location || 'City Center',
            submittedOn: c.submitted_on || 'Today',
            priority: c.priority || 'Medium',
            priorityBg: '#FFEDD5',
            priorityColor: '#EA580C',
            status: c.status || 'New',
            statusBg: '#FEF3C7',
            statusColor: '#D97706',
            reporting_method: c.reporting_method || 'Manual',
            is_duplicate: Boolean(c.is_duplicate),
            duplicate_of: c.duplicate_of || null,
            duplicate_reason: c.duplicate_reason || null
          }));
          setComplaints(normalized);
        }
      } catch (err) {
        console.log('Error loading complaints queue:', err.message);
      }
    }
    fetchComplaints();
  }, []);

  const allComplaints = complaints;

  // Filtering Logic
  const filteredComplaints = allComplaints.filter(item => {
    if (statusFilter !== 'All Statuses' && item.status.toLowerCase() !== statusFilter.toLowerCase()) {
      return false;
    }
    if (categoryFilter !== 'All Categories' && item.category.toLowerCase() !== categoryFilter.toLowerCase()) {
      return false;
    }
    if (priorityFilter !== 'All Priorities' && item.priority.toLowerCase() !== priorityFilter.toLowerCase()) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTicket = item.ticketId.toLowerCase().includes(q);
      const matchIssue = item.issue.toLowerCase().includes(q);
      const matchLoc = item.location.toLowerCase().includes(q);
      if (!matchTicket && !matchIssue && !matchLoc) return false;
    }
    return true;
  });

  // Display top 5 per pagination page
  const itemsPerPage = 5;
  const totalItems = filteredComplaints.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const displayedComplaints = filteredComplaints.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

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

  return (
    <div className="citizen-dashboard-container">
      {/* Fixed Left Sidebar matching Officer Dashboard */}
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
              Complaints Queue
            </h1>
            <p className="citizen-dash-subtitle">
              View and manage citizen complaints.
            </p>
          </div>
        </div>

        {/* SEARCH AND FILTER CARDS BAR */}
        <div 
          className="citizen-stat-card" 
          style={{ 
            padding: '16px 20px', 
            display: 'grid', 
            gridTemplateColumns: '2fr 1fr 1fr 1fr', 
            gap: '16px',
            alignItems: 'center'
          }}
        >
          {/* Search Input Box */}
          <div className="citizen-search-wrapper" style={{ minWidth: 'auto' }}>
            <Search className="citizen-search-icon" size={17} />
            <input 
              type="text"
              className="citizen-search-input"
              placeholder="Search by ticket ID, issue or location..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            />
          </div>

          {/* Status Dropdown */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '11px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.3px' }}>
              Status
            </label>
            <div style={{ position: 'relative' }}>
              <select 
                className="citizen-filter-select"
                style={{ width: '100%' }}
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
              >
                <option value="All Statuses">All Statuses</option>
                <option value="New">New</option>
                <option value="Assigned">Assigned</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
                <option value="Resolved">Resolved</option>
              </select>
              <ChevronDown size={15} color="#64748B" style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
            </div>
          </div>

          {/* Category Dropdown */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '11px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.3px' }}>
              Category
            </label>
            <div style={{ position: 'relative' }}>
              <select 
                className="citizen-filter-select"
                style={{ width: '100%' }}
                value={categoryFilter}
                onChange={(e) => { setCategoryFilter(e.target.value); setCurrentPage(1); }}
              >
                <option value="All Categories">All Categories</option>
                <option value="Streetlight">Streetlight</option>
                <option value="Waste">Waste</option>
                <option value="Road">Road</option>
                <option value="Water Supply">Water Supply</option>
                <option value="Drainage">Drainage</option>
              </select>
              <ChevronDown size={15} color="#64748B" style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
            </div>
          </div>

          {/* Priority Dropdown */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '11px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.3px' }}>
              Priority
            </label>
            <div style={{ position: 'relative' }}>
              <select 
                className="citizen-filter-select"
                style={{ width: '100%' }}
                value={priorityFilter}
                onChange={(e) => { setPriorityFilter(e.target.value); setCurrentPage(1); }}
              >
                <option value="All Priorities">All Priorities</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
              <ChevronDown size={15} color="#64748B" style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
            </div>
          </div>
        </div>

        {/* COMPLAINTS QUEUE TABLE CARD */}
        <div className="citizen-table-card">
          
          {/* Table Header Bar */}
          <div style={{ padding: '16px 24px', borderBottom: '1.5px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ListFilter size={18} color="#0F172A" />
            <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#0F172A', margin: 0 }}>
              Complaints Queue ({filteredComplaints.length})
            </h3>
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
                {displayedComplaints.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ padding: '32px', textAlign: 'center', color: '#94A3B8' }}>
                      No complaints match the current filter criteria.
                    </td>
                  </tr>
                ) : (
                  displayedComplaints.map((item) => {
                    const CatIcon = item.categoryIcon;
                    const stStyle = getStatusBadgeStyle(item.status);
                    return (
                      <tr key={item.id} className="table-row-hover">
                        <td style={{ color: '#64748B', fontWeight: 600 }}>{item.id}</td>
                        <td className="ticket-id-badge">
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-start' }}>
                            <span>{item.ticketId}</span>
                            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                              <span style={{
                                display: 'inline-block',
                                fontSize: '10px',
                                fontWeight: 700,
                                padding: '1px 6px',
                                borderRadius: '4px',
                                background: item.reporting_method === 'AI' ? '#EFF6FF' : '#F1F5F9',
                                color: item.reporting_method === 'AI' ? '#1D4ED8' : '#475569',
                                border: item.reporting_method === 'AI' ? '1px solid #BFDBFE' : '1px solid #CBD5E1'
                              }}>
                                {item.reporting_method === 'AI' ? '🤖 AI' : '📝 Manual'}
                              </span>
                              {item.is_duplicate && (
                                <span style={{
                                  display: 'inline-block',
                                  fontSize: '10px',
                                  fontWeight: 700,
                                  padding: '1px 6px',
                                  borderRadius: '4px',
                                  background: '#FEF3C7',
                                  color: '#B45309',
                                  border: '1px solid #FDE68A'
                                }}>
                                  ⚠️ Duplicate (#{item.duplicate_of})
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td style={{ color: '#334155', fontWeight: 600, maxWidth: '240px' }}>
                          <div>{item.issue}</div>
                          {item.is_duplicate && item.duplicate_reason && (
                            <div style={{ fontSize: '11px', color: '#B45309', marginTop: '2px', fontWeight: 500 }}>
                              {item.duplicate_reason}
                            </div>
                          )}
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
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Table Footer / Pagination Bar */}
          <div className="citizen-table-footer">
            <div>
              Showing {displayedComplaints.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} to {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} complaints
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {/* Prev Button */}
              <button 
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  border: '1px solid #E2E8F0',
                  background: '#F1F5F9',
                  color: currentPage === 1 ? '#CBD5E1' : '#475569',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: currentPage === 1 ? 'not-allowed' : 'pointer'
                }}
              >
                <ChevronLeft size={16} />
              </button>

              {/* Page Numbers */}
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    border: pageNum === currentPage ? 'none' : '1px solid #E2E8F0',
                    background: pageNum === currentPage ? '#059669' : '#F1F5F9',
                    color: pageNum === currentPage ? '#FFFFFF' : '#475569',
                    fontWeight: 700,
                    fontSize: '13px',
                    cursor: 'pointer'
                  }}
                >
                  {pageNum}
                </button>
              ))}

              {/* Next Button */}
              <button 
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  border: '1px solid #E2E8F0',
                  background: '#F1F5F9',
                  color: currentPage === totalPages ? '#CBD5E1' : '#475569',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: currentPage === totalPages ? 'not-allowed' : 'pointer'
                }}
              >
                <ChevronRight size={16} />
              </button>
            </div>
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

