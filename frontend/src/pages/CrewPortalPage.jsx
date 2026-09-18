import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { 
  Wrench, 
  Lightbulb, 
  Trash2, 
  Droplets, 
  Waves,
  Footprints,
  Construction,
  MapPin, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Tag, 
  UserCheck,
  ShieldCheck, 
  FileText, 
  X, 
  Play, 
  Upload, 
  ImageIcon, 
  History,
  Home,
  User,
  HelpCircle,
  Search,
  Check,
  Layers,
  Sparkles,
  Calendar,
  RefreshCw
} from 'lucide-react';
import cleanerCityImg from '../assets/cleaner-city.png';
import parkBgImg from '../assets/civic-park-bg.png';
import civicWorkerHeroImg from '../assets/civic-worker-hero.png';
import ImageCaptureUpload from '../components/ImageCaptureUpload';
import ProfileModal from '../components/ProfileModal';

export default function CrewPortalPage({ user }) {
  const navigate = useNavigate();
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // Logged-in Crew Profile Details
  const loggedInCrewId = user?.assigned_crew_id || user?.id || 'CREW-101';
  const loggedInCrewTeam = user?.assigned_team || user?.assignedTeam || 'Electrical Team - North Zone';
  const crewName = user?.full_name || 'Arun Kumar (Crew Member)';

  const [complaintsList, setComplaintsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);
  const [completingTicketId, setCompletingTicketId] = useState(null);
  const [completionPhoto, setCompletionPhoto] = useState(null);
  const [completionNote, setCompletionNote] = useState('');
  const [completionError, setCompletionError] = useState('');
  const [submittingComplete, setSubmittingComplete] = useState(false);

  // Helper function for formatted timestamp
  const formatCurrentTimestamp = () => {
    const now = new Date();
    const day = now.getDate().toString().padStart(2, '0');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[now.getMonth()];
    const year = now.getFullYear();
    let hours = now.getHours();
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    const formattedHours = hours.toString().padStart(2, '0');
    return `${day} ${month} ${year} • ${formattedHours}:${minutes} ${ampm}`;
  };

  const fetchCrewComplaints = async () => {
    setLoading(true);
    try {
      const data = await api.listComplaints();
      if (Array.isArray(data)) {
        const normalized = data.map(c => {
          const rawStatus = (c.status || '').toUpperCase().replace('_', ' ');
          let normStatus = 'ASSIGNED';
          if (rawStatus.includes('REJECT')) normStatus = 'REJECTED';
          else if (rawStatus.includes('IN PROGRESS') || rawStatus.includes('PROGRESS')) normStatus = 'IN_PROGRESS';
          else if (rawStatus.includes('COMPLETED')) normStatus = 'COMPLETED';
          else if (rawStatus.includes('RESOLVED')) normStatus = 'RESOLVED';
          else if (rawStatus.includes('NEW')) normStatus = 'NEW';

          // Extract latest rejection note if any
          const rejectionItem = (c.status_history || [])
            .slice()
            .reverse()
            .find(h => (h.status || '').toUpperCase().includes('REJECT') || (h.title || '').toUpperCase().includes('REJECT'));
          const rejectionNote = rejectionItem?.note || rejectionItem?.comment || null;

          return {
            id: c.id || c._id,
            ticketId: c.ticket_number || c.ticketId || c.id || 'CIVIC-COMPLAINT',
            ticket_number: c.ticket_number || c.ticketId || c.id,
            issue: c.description ? c.description.split('.')[0] : (c.category || 'Civic Issue'),
            description: c.description || 'No description provided.',
            category: c.category || 'General',
            location: c.location || 'City Center',
            priority: c.priority || 'Medium',
            status: normStatus,
            rejectionNote: rejectionNote,
            assignedCrewId: c.assigned_crew_id || loggedInCrewId,
            assignedTo: c.assigned_team || c.assigned_to || loggedInCrewTeam,
            submittedOn: c.created_at ? new Date(c.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Today',
            photo: c.image_url || c.photo_url || null,
            startedAt: c.started_at || null,
            completedAt: c.completed_at || null,
            completionPhoto: c.completion_photo || null,
            completionNote: c.completion_note || null,
            resolvedAt: c.resolved_at || null,
            verifiedBy: c.verified_by || null,
            statusHistory: c.status_history || [
              { status: normStatus, description: 'Complaint loaded from backend', timestamp: formatCurrentTimestamp() }
            ]
          };
        });
        setComplaintsList(normalized);
      }
    } catch (err) {
      console.error('Error fetching crew complaints:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCrewComplaints();
  }, [loggedInCrewId]);

  // Handle Start Work (ASSIGNED -> IN_PROGRESS)
  const handleStartWork = async (ticket) => {
    const complaintId = ticket.id;
    try {
      await api.startWork(complaintId, "Work started by crew member");
      await fetchCrewComplaints();
    } catch (err) {
      console.warn("Backend startWork notice:", err.message);
      // Fallback local update
      setComplaintsList(prev => prev.map(item => {
        if (item.id === complaintId) {
          return { ...item, status: 'IN_PROGRESS', startedAt: formatCurrentTimestamp() };
        }
        return item;
      }));
    }
  };

  // Open Complete Work Modal
  const openCompleteModal = (ticket) => {
    setCompletingTicketId(ticket.id);
    setCompletionPhoto(null);
    setCompletionNote('');
    setCompletionError('');
    setIsCompleteModalOpen(true);
  };

  // Handle Complete Work Submission
  const handleCompleteSubmit = async (e) => {
    e.preventDefault();
    if (!completionNote.trim()) {
      setCompletionError('Please enter a brief completion note describing the work done.');
      return;
    }
    if (!completionPhoto) {
      setCompletionError('Please attach or provide a completion proof photo.');
      return;
    }

    setSubmittingComplete(true);
    try {
      await api.completeWork(completingTicketId, {
        completion_photo: completionPhoto,
        completion_note: completionNote.trim()
      });
      setIsCompleteModalOpen(false);
      await fetchCrewComplaints();
    } catch (err) {
      setCompletionError(err.message || 'Failed to submit completion report.');
    } finally {
      setSubmittingComplete(false);
    }
  };

  // Compute Metrics
  const totalAssigned = complaintsList.length;
  const pendingCount = complaintsList.filter(c => c.status === 'ASSIGNED' || c.status === 'NEW' || c.status === 'REJECTED').length;
  const inProgressCount = complaintsList.filter(c => c.status === 'IN_PROGRESS').length;
  const completedCount = complaintsList.filter(c => c.status === 'COMPLETED' || c.status === 'RESOLVED').length;

  // Filter Tasks
  const filteredTasks = complaintsList.filter(item => {
    if (filterStatus === 'ASSIGNED' && item.status !== 'ASSIGNED' && item.status !== 'NEW' && item.status !== 'REJECTED') return false;
    if (filterStatus === 'IN_PROGRESS' && item.status !== 'IN_PROGRESS') return false;
    if (filterStatus === 'COMPLETED' && item.status !== 'COMPLETED' && item.status !== 'RESOLVED') return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTicket = item.ticketId.toLowerCase().includes(q);
      const matchIssue = item.issue.toLowerCase().includes(q);
      const matchLoc = item.location.toLowerCase().includes(q);
      const matchCat = item.category.toLowerCase().includes(q);
      if (!matchTicket && !matchIssue && !matchLoc && !matchCat) return false;
    }
    return true;
  });

  const getCategoryIcon = (category) => {
    const cat = (category || '').toLowerCase();
    if (cat.includes('street') || cat.includes('light')) return <Lightbulb size={16} color="#D97706" />;
    if (cat.includes('garb') || cat.includes('sanitat')) return <Trash2 size={16} color="#475569" />;
    if (cat.includes('pothole') || cat.includes('road')) return <Construction size={16} color="#2563EB" />;
    if (cat.includes('water')) return <Droplets size={16} color="#0284C7" />;
    if (cat.includes('foot') || cat.includes('walk')) return <Footprints size={16} color="#059669" />;
    if (cat.includes('sewag') || cat.includes('drain')) return <Waves size={16} color="#7C3AED" />;
    return <Wrench size={16} color="#3B82F6" />;
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'RESOLVED':
        return { bg: '#DCFCE7', color: '#16A34A', label: 'RESOLVED' };
      case 'COMPLETED':
        return { bg: '#E0F2FE', color: '#0284C7', label: 'COMPLETED' };
      case 'IN_PROGRESS':
        return { bg: '#F3E8FF', color: '#9333EA', label: 'IN PROGRESS' };
      case 'REJECTED':
        return { bg: '#FEE2E2', color: '#DC2626', label: 'REJECTED / REWORK' };
      case 'ASSIGNED':
      case 'NEW':
      default:
        return { bg: '#DBEAFE', color: '#2563EB', label: 'ASSIGNED' };
    }
  };

  const getPriorityStyle = (priority) => {
    const p = (priority || '').toLowerCase();
    if (p === 'critical') return { bg: '#FEF2F2', color: '#DC2626' };
    if (p === 'high') return { bg: '#FFF7ED', color: '#EA580C' };
    if (p === 'medium') return { bg: '#FEF3C7', color: '#D97706' };
    return { bg: '#F1F5F9', color: '#475569' };
  };

  return (
    <div className="citizen-dashboard-container">
      {/* Sidebar matching Clean Design System */}
      <aside className="citizen-sidebar">
        <div>
          <nav className="sidebar-nav-list">
            <button className="sidebar-nav-item" onClick={() => navigate('/')}>
              <Home size={18} />
              <span>Back to Home</span>
            </button>

            <button className="sidebar-nav-item active" onClick={() => navigate('/crew')}>
              <Wrench size={18} />
              <span>Assigned Tasks</span>
            </button>

            <div style={{ margin: '12px 0', borderTop: '1px solid #E2E8F0' }} />

            <button className="sidebar-nav-item" onClick={() => setIsProfileModalOpen(true)}>
              <User size={18} />
              <span>Crew Profile</span>
            </button>

            <button className="sidebar-nav-item" onClick={() => {}}>
              <HelpCircle size={18} />
              <span>Help & Protocols</span>
            </button>
          </nav>
        </div>

        {/* Promo Image Card */}
        <div className="sidebar-promo-card" style={{ padding: 0, overflow: 'hidden', border: '1px solid #C6EAD7', borderRadius: '16px', background: 'transparent' }}>
          <img 
            src={cleanerCityImg} 
            alt="Together for a Cleaner Greener City" 
            style={{ width: '100%', height: 'auto', display: 'block', borderRadius: '16px' }} 
          />
        </div>
      </aside>

      {/* Main Content */}
      <main className="citizen-main-content fade-in-up" style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
        
        {/* Full-Width Crew Portal Hero Banner with Civic Worker Background */}
        <div 
          className="crew-hero-banner"
          style={{
            backgroundImage: `url(${civicWorkerHeroImg})`
          }}
        >
          {/* Soft White/Transparent Gradient on Left */}
          <div className="crew-hero-overlay" />

          {/* Left-Aligned Overlay Content */}
          <div className="crew-hero-content">
            <div className="crew-hero-badge">
              <Sparkles size={13} />
              <span>MUNICIPAL FIELD OPERATIONS</span>
            </div>

            <div className="crew-hero-welcome">
              Welcome Back,
            </div>

            <h1 className="crew-hero-name">
              {crewName}
            </h1>

            <p className="crew-hero-message">
              Manage your daily assigned maintenance tasks, record on-site repairs, and keep our city communities safe, clean, and bright.
            </p>

            <div className="crew-hero-tags">
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: '#ECFDF5',
                color: '#065F46',
                border: '1px solid #A7F3D0',
                padding: '5px 12px',
                borderRadius: '8px',
                fontSize: '12.5px',
                fontWeight: 700
              }}>
                <Wrench size={13} />
                <span>{loggedInCrewTeam}</span>
              </span>

              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                background: '#F1F5F9',
                color: '#475569',
                border: '1px solid #E2E8F0',
                padding: '5px 10px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: 600
              }}>
                ID: {loggedInCrewId}
              </span>
            </div>
          </div>
        </div>

        {/* Summary Metric Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
          <div className="citizen-stat-card" style={{ padding: '16px 18px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div className="stat-icon-box" style={{ background: '#EBF5FF', color: '#2563EB' }}>
              <Layers size={20} />
            </div>
            <div>
              <div className="stat-num" style={{ fontSize: '24px' }}>{totalAssigned}</div>
              <div className="stat-label">Total Assigned</div>
            </div>
          </div>

          <div className="citizen-stat-card" style={{ padding: '16px 18px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div className="stat-icon-box" style={{ background: '#FFF7ED', color: '#EA580C' }}>
              <Clock size={20} />
            </div>
            <div>
              <div className="stat-num" style={{ fontSize: '24px' }}>{pendingCount}</div>
              <div className="stat-label">Pending Start</div>
            </div>
          </div>

          <div className="citizen-stat-card" style={{ padding: '16px 18px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div className="stat-icon-box" style={{ background: '#F3E8FF', color: '#9333EA' }}>
              <Wrench size={20} />
            </div>
            <div>
              <div className="stat-num" style={{ fontSize: '24px' }}>{inProgressCount}</div>
              <div className="stat-label">In Progress</div>
            </div>
          </div>

          <div className="citizen-stat-card" style={{ padding: '16px 18px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div className="stat-icon-box" style={{ background: '#ECFDF5', color: '#059669' }}>
              <CheckCircle2 size={20} />
            </div>
            <div>
              <div className="stat-num" style={{ fontSize: '24px' }}>{completedCount}</div>
              <div className="stat-label">Completed</div>
            </div>
          </div>
        </div>

        {/* Tasks Section Card */}
        <div className="citizen-table-card">
          {/* Search Box */}
          <div style={{ padding: '16px 24px', borderBottom: '1px solid #F1F5F9', background: '#FAFDFB' }}>
            <div className="input-with-icon" style={{ maxWidth: '420px' }}>
              <Search className="input-icon" size={16} />
              <input
                type="text"
                className="form-input"
                style={{ padding: '9px 12px 9px 36px', fontSize: '13px' }}
                placeholder="Search ticket, issue, or location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Tasks List */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '48px 20px', color: '#64748B' }}>
              Loading assigned tasks...
            </div>
          ) : filteredTasks.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '56px 20px', color: '#64748B' }}>
              <CheckCircle2 size={44} color="#059669" style={{ marginBottom: '12px', opacity: 0.8 }} />
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#0F172A', margin: '0 0 4px 0' }}>
                No Tasks Found
              </h3>
              <p style={{ fontSize: '13px', margin: 0 }}>
                {filterStatus === 'ALL' ? 'No work orders currently assigned to your crew.' : `No tasks matching status "${filterStatus}".`}
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', divideY: '1px solid #F1F5F9' }}>
              {filteredTasks.map((task) => {
                const stStyle = getStatusBadge(task.status);
                const prStyle = getPriorityStyle(task.priority);

                return (
                  <div 
                    key={task.id}
                    style={{
                      padding: '20px 24px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      borderBottom: '1px solid #F1F5F9',
                      transition: 'background 0.15s ease'
                    }}
                    className="table-row-hover"
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', flex: 1, paddingRight: '20px' }}>
                      <div style={{ 
                        width: '42px', 
                        height: '42px', 
                        borderRadius: '12px', 
                        background: '#F1F5F9', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        flexShrink: 0,
                        marginTop: '2px'
                      }}>
                        {getCategoryIcon(task.category)}
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <span className="ticket-id-badge" style={{ fontSize: '12px' }}>
                            {task.ticketId}
                          </span>
                          <span style={{ 
                            background: prStyle.bg, 
                            color: prStyle.color, 
                            padding: '2px 8px', 
                            borderRadius: '6px', 
                            fontWeight: 700, 
                            fontSize: '11.5px' 
                          }}>
                            {task.priority} Priority
                          </span>
                          <span style={{ 
                            background: stStyle.bg, 
                            color: stStyle.color, 
                            padding: '2px 8px', 
                            borderRadius: '6px', 
                            fontWeight: 700, 
                            fontSize: '11.5px' 
                          }}>
                            {stStyle.label}
                          </span>
                        </div>

                        <div style={{ fontSize: '15px', fontWeight: 700, color: '#0F172A' }}>
                          {task.issue}
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '12.5px', color: '#64748B', flexWrap: 'wrap', marginTop: '2px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <MapPin size={13} color="#94A3B8" />
                            <span>{task.location}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Calendar size={13} color="#94A3B8" />
                            <span>{task.submittedOn}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Tag size={13} color="#94A3B8" />
                            <span>{task.category}</span>
                          </div>
                        </div>

                        {/* Officer Rejection Feedback Banner */}
                        {task.status === 'REJECTED' && task.rejectionNote && (
                          <div style={{
                            marginTop: '8px',
                            padding: '8px 12px',
                            background: '#FEF2F2',
                            border: '1px solid #FECACA',
                            borderRadius: '8px',
                            fontSize: '12px',
                            color: '#991B1B',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                          }}>
                            <AlertCircle size={15} color="#DC2626" style={{ flexShrink: 0 }} />
                            <div>
                              <strong>Officer Feedback (Rework Needed):</strong> {task.rejectionNote}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                      <button
                        style={{
                          padding: '8px 14px',
                          borderRadius: '8px',
                          border: '1px solid #CBD5E1',
                          background: '#FFFFFF',
                          fontSize: '12.5px',
                          fontWeight: 700,
                          color: '#334155',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                        onClick={() => setSelectedComplaint(task)}
                      >
                        <FileText size={14} /> Details
                      </button>

                      {/* 1. START WORK Button for ASSIGNED */}
                      {(task.status === 'ASSIGNED' || task.status === 'NEW') && (
                        <button
                          style={{
                            padding: '8px 18px',
                            borderRadius: '8px',
                            border: 'none',
                            background: '#0F172A',
                            color: '#FFFFFF',
                            fontSize: '12.5px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            boxShadow: '0 2px 6px rgba(15, 23, 42, 0.15)'
                          }}
                          onClick={() => handleStartWork(task)}
                        >
                          <Play size={14} fill="#FFFFFF" /> Start Work
                        </button>
                      )}

                      {/* 2. REWORK Button for REJECTED */}
                      {task.status === 'REJECTED' && (
                        <button
                          style={{
                            padding: '8px 18px',
                            borderRadius: '8px',
                            border: 'none',
                            background: '#DC2626',
                            color: '#FFFFFF',
                            fontSize: '12.5px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            boxShadow: '0 2px 8px rgba(220, 38, 38, 0.25)'
                          }}
                          onClick={() => openCompleteModal(task)}
                        >
                          <RefreshCw size={14} /> Submit Rework
                        </button>
                      )}

                      {/* 3. COMPLETE WORK Button for IN_PROGRESS */}
                      {task.status === 'IN_PROGRESS' && (
                        <button
                          style={{
                            padding: '8px 18px',
                            borderRadius: '8px',
                            border: 'none',
                            background: '#059669',
                            color: '#FFFFFF',
                            fontSize: '12.5px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            boxShadow: '0 2px 8px rgba(5, 150, 105, 0.25)'
                          }}
                          onClick={() => openCompleteModal(task)}
                        >
                          <ImageIcon size={14} /> Complete Work
                        </button>
                      )}

                      {/* 4. COMPLETED or RESOLVED Badge */}
                      {(task.status === 'COMPLETED' || task.status === 'RESOLVED') && (
                        <button
                          style={{
                            padding: '8px 14px',
                            borderRadius: '8px',
                            border: '1px solid #A7F3D0',
                            background: '#ECFDF5',
                            color: '#065F46',
                            fontSize: '12.5px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}
                          onClick={() => setSelectedComplaint(task)}
                        >
                          <CheckCircle2 size={14} color="#059669" /> Completed
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* MODAL 1: Complete Work Dialog */}
      {isCompleteModalOpen && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: '520px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#059669' }}>
                  <ImageIcon size={18} />
                </div>
                <h2>Submit Work Completion</h2>
              </div>
              <button className="btn-close-modal" onClick={() => setIsCompleteModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <div className="modal-body">
              {completionError && (
                <div style={{ padding: '10px 14px', background: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626', borderRadius: '8px', fontSize: '13px', marginBottom: '16px' }}>
                  {completionError}
                </div>
              )}

              <form onSubmit={handleCompleteSubmit}>
                <ImageCaptureUpload
                  value={completionPhoto}
                  onChange={setCompletionPhoto}
                  label="Completion Proof Photo"
                  helperText="Attach photographic evidence of the completed repair work by uploading an image or using camera."
                  required={true}
                />

                <div className="form-group">
                  <label className="form-label">Work Summary & Completion Notes</label>
                  <textarea
                    className="form-input"
                    rows="3"
                    placeholder="Describe the repair work conducted (e.g., replaced 45W LED fixture, tested power supply)..."
                    value={completionNote}
                    onChange={(e) => setCompletionNote(e.target.value)}
                    required
                  />
                </div>

                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
                  <button 
                    type="button" 
                    className="btn-login" 
                    style={{ padding: '10px 16px' }}
                    onClick={() => setIsCompleteModalOpen(false)}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="btn-submit" 
                    style={{ padding: '10px 20px', width: 'auto' }}
                    disabled={submittingComplete}
                  >
                    {submittingComplete ? 'Submitting...' : 'Mark Completed'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Task Details & History Dialog */}
      {selectedComplaint && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <div>
                <span className="ticket-id-badge">{selectedComplaint.ticketId}</span>
                <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#0F172A', marginTop: '6px', margin: 0 }}>
                  {selectedComplaint.issue}
                </h2>
              </div>
              <button className="btn-close-modal" onClick={() => setSelectedComplaint(null)}>
                <X size={20} />
              </button>
            </div>

            <div className="modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '18px', background: '#F8FAFC', padding: '14px', borderRadius: '12px', border: '1px solid #E2E8F0', fontSize: '13px' }}>
                <div>
                  <span style={{ color: '#64748B' }}>Category: </span>
                  <strong style={{ color: '#0F172A' }}>{selectedComplaint.category}</strong>
                </div>
                <div>
                  <span style={{ color: '#64748B' }}>Location: </span>
                  <strong style={{ color: '#0F172A' }}>{selectedComplaint.location}</strong>
                </div>
                <div>
                  <span style={{ color: '#64748B' }}>Priority: </span>
                  <strong style={{ color: '#0F172A' }}>{selectedComplaint.priority}</strong>
                </div>
                <div>
                  <span style={{ color: '#64748B' }}>Status: </span>
                  <strong style={{ color: '#059669' }}>{selectedComplaint.status}</strong>
                </div>
              </div>

              <div style={{ marginBottom: '18px' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', marginBottom: '6px' }}>
                  Description
                </div>
                <p style={{ fontSize: '13.5px', color: '#334155', lineHeight: '1.5', margin: 0 }}>
                  {selectedComplaint.description}
                </p>
              </div>

              {selectedComplaint.completionNote && (
                <div style={{ marginBottom: '18px', padding: '12px 14px', background: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: '10px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#065F46', textTransform: 'uppercase', marginBottom: '4px' }}>
                    Completion Note
                  </div>
                  <p style={{ fontSize: '13px', color: '#065F46', margin: 0 }}>
                    {selectedComplaint.completionNote}
                  </p>
                </div>
              )}

              {/* Status History Timeline */}
              <div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', marginBottom: '10px' }}>
                  Status History & Updates
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {(selectedComplaint.statusHistory || []).map((h, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '12.5px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#059669' }} />
                        <strong style={{ color: '#0F172A' }}>{h.status || h.title}</strong>
                        {h.actor && <span style={{ color: '#64748B' }}>by {h.actor}</span>}
                      </div>
                      <span style={{ color: '#94A3B8', fontSize: '11.5px' }}>{h.timestamp}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Profile Modal */}
      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        user={user}
      />

    </div>
  );
}
