import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Home, PlusCircle, FileText, User, HelpCircle, Leaf, 
  Clock, CheckCircle2, AlertCircle, Plus, Search, 
  ChevronRight, MapPin, Lightbulb, Trash2, Construction, 
  Droplets, Footprints, Waves, Tag, ArrowUpDown, ChevronLeft 
} from 'lucide-react';
import { api } from '../services/api';
import cleanerCityImg from '../assets/cleaner-city.png';
import ProfileModal from '../components/ProfileModal';

export default function MyComplaintsPage({ user }) {
  const [complaints, setComplaints] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [sortOrder, setSortOrder] = useState('newest');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchComplaints(true);
    const interval = setInterval(() => {
      fetchComplaints(false);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchComplaints = async (showLoading = false) => {
    if (showLoading) setLoading(true);
    setError('');
    try {
      const data = await api.listComplaints();
      setComplaints(data || []);
    } catch (err) {
      if (showLoading) setError(err.message || 'Failed to fetch complaints.');
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  // Helper for category icon
  const getCategoryIcon = (category) => {
    const cat = (category || '').toLowerCase();
    if (cat.includes('street') || cat.includes('light')) return <Lightbulb size={15} color="#D97706" />;
    if (cat.includes('garb') || cat.includes('sanitat')) return <Trash2 size={15} color="#475569" />;
    if (cat.includes('pothole') || cat.includes('road')) return <Construction size={15} color="#2563EB" />;
    if (cat.includes('water')) return <Droplets size={15} color="#0284C7" />;
    if (cat.includes('foot') || cat.includes('walk')) return <Footprints size={15} color="#059669" />;
    if (cat.includes('sewag') || cat.includes('drain')) return <Waves size={15} color="#7C3AED" />;
    return <Tag size={15} color="#64748B" />;
  };

  // Format date helper
  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) + 
        ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return dateStr;
    }
  };

  // Calculate summary metrics
  const totalCount = complaints.length;
  const inProgressCount = complaints.filter(c => {
    const s = (c.status || '').toLowerCase();
    return s === 'in progress' || s === 'assigned';
  }).length;
  const resolvedCount = complaints.filter(c => (c.status || '').toLowerCase() === 'resolved').length;
  const pendingCount = complaints.filter(c => {
    const s = (c.status || '').toLowerCase();
    return s === 'pending' || s === 'new';
  }).length;

  // Filtered and sorted complaints
  const filteredComplaints = complaints.filter(comp => {
    if (statusFilter !== 'All') {
      const s = (comp.status || '').toLowerCase();
      const filterS = statusFilter.toLowerCase();
      if (filterS === 'pending' && !(s === 'pending' || s === 'new')) return false;
      if (filterS === 'in progress' && !(s === 'in progress' || s === 'assigned')) return false;
      if (filterS === 'resolved' && s !== 'resolved') return false;
      if (filterS === 'rejected' && s !== 'rejected') return false;
    }
    if (categoryFilter !== 'All') {
      if (!comp.category || !comp.category.toLowerCase().includes(categoryFilter.toLowerCase())) return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTicket = (comp.ticket_number || '').toLowerCase().includes(q);
      const matchCategory = (comp.category || '').toLowerCase().includes(q);
      const matchLocation = (comp.location || '').toLowerCase().includes(q);
      const matchDesc = (comp.description || '').toLowerCase().includes(q);
      if (!matchTicket && !matchCategory && !matchLocation && !matchDesc) return false;
    }
    return true;
  }).sort((a, b) => {
    const dateA = new Date(a.created_at || 0).getTime();
    const dateB = new Date(b.created_at || 0).getTime();
    return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
  });

  return (
    <div className="citizen-dashboard-container">
      {/* Fixed Left Sidebar */}
      <aside className="citizen-sidebar">
        <div>
          <nav className="sidebar-nav-list">
            <button className="sidebar-nav-item" onClick={() => navigate('/')}>
              <Home size={18} />
              <span>Home</span>
            </button>
            
            <button className="sidebar-nav-item" onClick={() => navigate('/report-issue')}>
              <PlusCircle size={18} />
              <span>Report an Issue</span>
            </button>
            
            <button className="sidebar-nav-item active" onClick={() => navigate('/my-complaints')}>
              <FileText size={18} />
              <span>My Complaints</span>
            </button>

            <button className="sidebar-nav-item" onClick={() => setIsProfileModalOpen(true)}>
              <User size={18} />
              <span>My Profile</span>
            </button>

            <button className="sidebar-nav-item" onClick={() => navigate('/')}>
              <HelpCircle size={18} />
              <span>Help & Support</span>
            </button>
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
      <main className="citizen-main-content fade-in-up">
        {/* Page Header Row */}
        <div className="citizen-dash-header">
          <div>
            <h1 className="citizen-dash-title">My Complaints</h1>
            <p className="citizen-dash-subtitle">
              Track the status of the issues you have reported.
            </p>
          </div>

          <div className="citizen-voice-banner">
            <Leaf size={20} color="#059669" />
            <div className="citizen-voice-text">
              <span className="citizen-voice-title">Your voice matters!</span>
              <span>Thank you for helping us build a better city.</span>
            </div>
          </div>
        </div>

        {/* 4 Stat Summary Cards & CTA Button */}
        <div className="citizen-stats-row">
          {/* Card 1: Total */}
          <div className="citizen-stat-card">
            <div className="stat-icon-box stat-icon-blue">
              <FileText size={22} />
            </div>
            <div>
              <div className="stat-num">{totalCount}</div>
              <div className="stat-label">Total Complaints</div>
            </div>
          </div>

          {/* Card 2: In Progress */}
          <div className="citizen-stat-card">
            <div className="stat-icon-box stat-icon-orange">
              <Clock size={22} />
            </div>
            <div>
              <div className="stat-num">{inProgressCount}</div>
              <div className="stat-label">In Progress</div>
            </div>
          </div>

          {/* Card 3: Resolved */}
          <div className="citizen-stat-card">
            <div className="stat-icon-box stat-icon-green">
              <CheckCircle2 size={22} />
            </div>
            <div>
              <div className="stat-num">{resolvedCount}</div>
              <div className="stat-label">Resolved</div>
            </div>
          </div>

          {/* Card 4: Pending */}
          <div className="citizen-stat-card">
            <div className="stat-icon-box stat-icon-red">
              <AlertCircle size={22} />
            </div>
            <div>
              <div className="stat-num">{pendingCount}</div>
              <div className="stat-label">Pending</div>
            </div>
          </div>

          {/* Report New Issue CTA */}
          <button 
            className="btn-report-new-issue"
            onClick={() => navigate('/report-issue')}
          >
            <Plus size={18} />
            <span>Report a New Issue</span>
          </button>
        </div>

        {/* Controls Bar: Search & Filters */}
        <div className="citizen-controls-bar">
          <div className="citizen-search-wrapper">
            <Search className="citizen-search-icon" size={17} />
            <input 
              type="text"
              className="citizen-search-input"
              placeholder="Search by issue, location or ticket ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <select 
            className="citizen-filter-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="All">All Status</option>
            <option value="Pending">Pending</option>
            <option value="In Progress">In Progress</option>
            <option value="Resolved">Resolved</option>
            <option value="Rejected">Rejected</option>
          </select>

          <select 
            className="citizen-filter-select"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="All">All Categories</option>
            <option value="Streetlight">Streetlight</option>
            <option value="Garbage">Garbage / Sanitation</option>
            <option value="Road">Pothole / Road</option>
            <option value="Water Supply">Water Supply</option>
            <option value="Footpath">Footpath</option>
            <option value="Sewage">Sewage / Drainage</option>
            <option value="Other">Other Civic Issue</option>
          </select>

          <select 
            className="citizen-filter-select"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
          </select>
        </div>

        {error && (
          <div className="alert alert-error" style={{ marginBottom: '20px' }}>
            {error}
          </div>
        )}

        {/* Complaints Table Container */}
        <div className="citizen-table-card">
          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: '#64748B' }}>
              Loading complaints from backend...
            </div>
          ) : filteredComplaints.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748B' }}>
              <FileText size={42} color="#94A3B8" style={{ marginBottom: '12px' }} />
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0F172A', marginBottom: '4px' }}>
                No Complaints Found
              </h3>
              <p style={{ fontSize: '13.5px', marginBottom: '20px' }}>
                {searchQuery || statusFilter !== 'All' || categoryFilter !== 'All' 
                  ? 'No tickets match your filter criteria.' 
                  : 'You have not submitted any complaints yet.'}
              </p>
              <button 
                className="btn-report-new-issue"
                style={{ height: '42px', padding: '0 18px', fontSize: '13.5px', margin: '0 auto' }}
                onClick={() => navigate('/report-issue')}
              >
                <Plus size={16} /> Report an Issue Now
              </button>
            </div>
          ) : (
            <>
              <div style={{ overflowX: 'auto' }}>
                <table className="citizen-complaints-table">
                  <thead>
                    <tr>
                      <th style={{ width: '40px' }}>#</th>
                      <th>Ticket ID</th>
                      <th>Issue Details</th>
                      <th>Category</th>
                      <th>Location</th>
                      <th>Date Submitted</th>
                      <th>Status</th>
                      <th>Priority</th>
                      <th style={{ textAlign: 'right' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredComplaints.map((comp, index) => (
                      <tr 
                        key={comp.id} 
                        className="table-row-hover"
                        style={{ cursor: 'pointer' }}
                        onClick={() => navigate(`/complaints/${comp.id}`)}
                      >
                        <td style={{ color: '#64748B', fontWeight: 600 }}>{index + 1}</td>
                        
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                            <span className="ticket-id-badge">{comp.ticket_number}</span>
                            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                              {comp.reporting_method === 'AI' ? (
                                <span style={{ fontSize: '10px', fontWeight: 700, color: '#1D4ED8', background: '#EFF6FF', padding: '1px 5px', borderRadius: '4px', border: '1px solid #BFDBFE' }}>
                                  AI
                                </span>
                              ) : (
                                <span style={{ fontSize: '10px', fontWeight: 600, color: '#475569', background: '#F1F5F9', padding: '1px 5px', borderRadius: '4px', border: '1px solid #E2E8F0' }}>
                                  Manual
                                </span>
                              )}
                              {comp.is_duplicate && (
                                <span style={{ fontSize: '10px', fontWeight: 800, color: '#B45309', background: '#FEF3C7', padding: '1px 5px', borderRadius: '4px', border: '1px solid #FDE68A' }}>
                                  Duplicate ({comp.duplicate_of})
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        
                        <td>
                          <div>
                            <span className="issue-title-text">
                              {comp.category} issue reported
                            </span>
                            <span className="issue-desc-snippet">
                              {comp.description}
                            </span>
                          </div>
                        </td>

                        <td>
                          <div className="category-cell">
                            {getCategoryIcon(comp.category)}
                            <span>{comp.category}</span>
                          </div>
                        </td>

                        <td>
                          <div className="location-cell">
                            <MapPin size={14} color="#64748B" />
                            <span>{comp.location}</span>
                          </div>
                        </td>

                        <td style={{ color: '#475569', fontSize: '13px', whiteSpace: 'nowrap' }}>
                          {formatDate(comp.created_at)}
                        </td>

                        <td>
                          <span className={`status-badge-pill status-${(comp.status || 'pending').toLowerCase().replace(' ', '-')}`}>
                            {comp.status || 'Pending'}
                          </span>
                        </td>

                        <td>
                          <span className={`priority-pill priority-${(comp.priority || 'medium').toLowerCase()}`}>
                            {comp.priority || 'Medium'}
                          </span>
                        </td>

                        <td style={{ textAlign: 'right' }}>
                          <button 
                            className="btn-view-details-pill"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/complaints/${comp.id}`);
                            }}
                          >
                            <span>View Details</span>
                            <ChevronRight size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Table Footer / Pagination Info */}
              <div className="citizen-table-footer">
                <div>
                  Showing 1 to {filteredComplaints.length} of {totalCount} complaints
                </div>

                <div style={{ display: 'flex', items: 'center', gap: '6px' }}>
                  <button 
                    disabled 
                    style={{ 
                      width: '32px', height: '32px', borderRadius: '8px', border: '1px solid #E2E8F0', 
                      background: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center', 
                      color: '#94A3B8', cursor: 'not-allowed' 
                    }}
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button 
                    style={{ 
                      width: '32px', height: '32px', borderRadius: '8px', border: 'none', 
                      background: '#059669', color: 'white', fontWeight: 700, fontSize: '13px' 
                    }}
                  >
                    1
                  </button>
                  <button 
                    disabled 
                    style={{ 
                      width: '32px', height: '32px', borderRadius: '8px', border: '1px solid #E2E8F0', 
                      background: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center', 
                      color: '#94A3B8', cursor: 'not-allowed' 
                    }}
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </>
          )}
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

