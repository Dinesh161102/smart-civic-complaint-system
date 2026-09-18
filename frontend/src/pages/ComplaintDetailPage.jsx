import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Home, PlusCircle, FileText, User, HelpCircle, Leaf, 
  Clock, CheckCircle2, Send, MapPin, ArrowLeft, Tag, 
  BarChart2, Calendar, Settings, AlertCircle, Grid, Edit3, 
  MessageSquare, Check, X, Save, ChevronDown
} from 'lucide-react';
import { api } from '../services/api';
import cleanerCityImg from '../assets/cleaner-city.png';
import ImageCaptureUpload from '../components/ImageCaptureUpload';
import ProfileModal from '../components/ProfileModal';

export default function ComplaintDetailPage({ user }) {
  const { id } = useParams();
  const navigate = useNavigate();

  const [complaint, setComplaint] = useState(null);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [error, setError] = useState('');

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editCategory, setEditCategory] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editUrgency, setEditUrgency] = useState('Medium');
  const [editPhoto, setEditPhoto] = useState(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');

  // Profile Modal State
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  useEffect(() => {
    fetchComplaintDetails(true);
    const interval = setInterval(() => {
      fetchComplaintDetails(false);
    }, 4000);
    return () => clearInterval(interval);
  }, [id]);

  const fetchComplaintDetails = async (showLoading = false) => {
    if (showLoading) setLoading(true);
    setError('');
    try {
      const data = await api.getComplaint(id);
      setComplaint(data);
    } catch (err) {
      if (showLoading) setError(err.message || 'Failed to load complaint details.');
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const openEditModal = () => {
    if (!complaint) return;
    setEditCategory(complaint.category || 'Streetlight');
    setEditDescription(complaint.description || '');
    setEditLocation(complaint.location || '');
    setEditUrgency(complaint.urgency || 'Medium');
    setEditPhoto(complaint.image_url || complaint.photo_url || null);
    setEditError('');
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editDescription.trim() || !editLocation.trim()) {
      setEditError('Description and location fields cannot be empty.');
      return;
    }
    setEditLoading(true);
    setEditError('');
    try {
      const updated = await api.updateComplaint(complaint.id, {
        category: editCategory,
        description: editDescription.trim(),
        location: editLocation.trim(),
        urgency: editUrgency,
        image_url: editPhoto || undefined,
        photo_url: editPhoto || undefined
      });
      setComplaint(updated);
      setIsEditModalOpen(false);
    } catch (err) {
      setEditError(err.message || 'Failed to update complaint details.');
    } finally {
      setEditLoading(false);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !complaint) return;
    setSubmittingComment(true);
    try {
      const updated = await api.addComment(complaint.id, {
        author: user?.full_name || user?.email || 'Citizen',
        content: newComment.trim()
      });
      setComplaint(updated);
      setNewComment('');
    } catch (err) {
      alert(err.message || 'Failed to add comment.');
    } finally {
      setSubmittingComment(false);
    }
  };

  const getStatusStep = (status) => {
    if (!status) return 1;
    const s = String(status).toUpperCase().replace(/_/g, ' ').replace(/-/g, ' ').trim();
    if (s.includes('RESOLV')) return 4;
    if (s.includes('COMPLET')) return 3;
    if (s.includes('PROGRESS')) return 3;
    if (s.includes('ASSIGN')) return 2;
    return 1;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    if (typeof dateStr === 'string' && (dateStr.includes('•') || dateStr.includes('pm') || dateStr.includes('am') || dateStr.includes('PM') || dateStr.includes('AM'))) {
      return dateStr;
    }
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) + 
        ', ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return dateStr;
    }
  };

  const getTimelineStepInfo = (stepNum) => {
    const history = complaint?.status_history || [];
    
    if (stepNum === 1) {
      const entry = history.find(h => {
        const s = (h.status || h.title || '').toLowerCase();
        return s.includes('new') || s.includes('create') || s.includes('submit');
      });
      return {
        timestamp: entry?.timestamp || complaint?.created_at,
        desc: 'Your complaint has been received and registered.'
      };
    }
    
    if (stepNum === 2) {
      const entry = history.find(h => (h.status || h.title || '').toLowerCase().includes('assign'));
      const teamName = complaint?.assigned_team || complaint?.assigned_to || (entry?.description ? entry.description.replace('Assigned to ', '') : null);
      return {
        timestamp: entry?.timestamp || complaint?.assigned_at,
        desc: teamName ? `Assigned to ${teamName}.` : 'Assigned to field maintenance team.'
      };
    }
    
    if (stepNum === 3) {
      const entry = history.find(h => {
        const s = (h.status || h.title || '').toLowerCase();
        return s.includes('progress') || s.includes('start') || s.includes('complet');
      });
      const isCompleted = (complaint?.status || '').toLowerCase().includes('complet');
      return {
        timestamp: entry?.timestamp || complaint?.started_at || complaint?.completed_at,
        desc: isCompleted
          ? 'Work completed by field crew. Awaiting officer verification.'
          : (entry?.note && !entry.note.toLowerCase().includes('updated to')) 
            ? entry.note 
            : 'Work is currently in progress by field operations crew.'
      };
    }
    
    if (stepNum === 4) {
      const entry = history.find(h => (h.status || h.title || '').toLowerCase().includes('resolv'));
      const isResolved = (complaint?.status || '').toLowerCase().includes('resolv');
      return {
        timestamp: entry?.timestamp || complaint?.resolved_at,
        desc: isResolved
          ? `Issue verified and resolved${complaint?.verified_by ? ` by ${complaint.verified_by}` : ''}.`
          : 'Pending final officer verification & resolution.'
      };
    }
    
    return { timestamp: null, desc: '' };
  };

  if (loading) {
    return (
      <div className="citizen-dashboard-container">
        <aside className="citizen-sidebar">
          <nav className="sidebar-nav-list">
            <button className="sidebar-nav-item" onClick={() => navigate('/')}><Home size={18} /><span>Home</span></button>
            <button className="sidebar-nav-item" onClick={() => navigate('/report-issue')}><PlusCircle size={18} /><span>Report an Issue</span></button>
            <button className="sidebar-nav-item active" onClick={() => navigate('/my-complaints')}><FileText size={18} /><span>My Complaints</span></button>
            <button className="sidebar-nav-item" onClick={() => setIsProfileModalOpen(true)}><User size={18} /><span>My Profile</span></button>
            <button className="sidebar-nav-item" onClick={() => navigate('/')}><HelpCircle size={18} /><span>Help & Support</span></button>
          </nav>
        </aside>
        <main className="citizen-main-content" style={{ textAlign: 'center', padding: '60px 20px', color: '#64748B' }}>
          Loading complaint details...
        </main>
      </div>
    );
  }

  if (error || !complaint) {
    return (
      <div className="citizen-dashboard-container">
        <aside className="citizen-sidebar">
          <nav className="sidebar-nav-list">
            <button className="sidebar-nav-item" onClick={() => navigate('/')}><Home size={18} /><span>Home</span></button>
            <button className="sidebar-nav-item" onClick={() => navigate('/report-issue')}><PlusCircle size={18} /><span>Report an Issue</span></button>
            <button className="sidebar-nav-item active" onClick={() => navigate('/my-complaints')}><FileText size={18} /><span>My Complaints</span></button>
          </nav>
        </aside>
        <main className="citizen-main-content">
          <button className="report-back-btn" onClick={() => navigate('/my-complaints')} style={{ marginBottom: '20px' }}>
            <ArrowLeft size={16} /> Back to My Complaints
          </button>
          <div className="alert alert-error">
            {error || 'Complaint ticket not found.'}
          </div>
        </main>
      </div>
    );
  }

  const currentStep = getStatusStep(complaint.status);
  const latestComment = complaint.comments && complaint.comments.length > 0 
    ? complaint.comments[complaint.comments.length - 1] 
    : null;

  const timelineSteps = [
    { stepNum: 1, name: 'New' },
    { stepNum: 2, name: 'Assigned' },
    { stepNum: 3, name: 'In Progress' },
    { stepNum: 4, name: 'Resolved' }
  ];

  return (
    <div className="citizen-dashboard-container">
      {/* Sidebar Navigation */}
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

        <div className="sidebar-promo-card" style={{ padding: 0, overflow: 'hidden', border: '1px solid #C6EAD7', borderRadius: '16px', background: 'transparent' }}>
          <img 
            src={cleanerCityImg} 
            alt="Together for a Cleaner Greener City" 
            style={{ width: '100%', height: 'auto', display: 'block', borderRadius: '16px' }} 
          />
        </div>
      </aside>

      {/* Main Content */}
      <main className="citizen-main-content fade-in-up">
        {/* Back Link */}
        <button 
          className="report-back-btn" 
          onClick={() => navigate('/my-complaints')}
          style={{ marginBottom: '18px' }}
        >
          <ArrowLeft size={16} /> Back to My Complaints
        </button>

        {/* Top Header Banner */}
        <div className="citizen-dash-header" style={{ marginBottom: '20px' }}>
          <div>
            <h1 className="citizen-dash-title">Complaint Details</h1>
            <p className="citizen-dash-subtitle">
              Here are the details of the complaint you have reported.
            </p>
          </div>

          <div className="citizen-voice-banner">
            <Leaf size={20} color="#059669" />
            <div className="citizen-voice-text">
              <span className="citizen-voice-title">Thank you for being an active citizen!</span>
              <span>Your complaints help us build a better city.</span>
            </div>
          </div>
        </div>

        {/* Top Ticket Hero Box */}
        <div className="detail-top-card">
          <div>
            <div className="ticket-id-pill-lg">
              <Grid size={14} />
              <span>{complaint.ticket_number}</span>
            </div>

            <h2 className="detail-issue-title">
              {complaint.description ? complaint.description.split('.')[0] : `${complaint.category} Issue`}
            </h2>

            <p className="detail-issue-subtext">
              Reported on {formatDate(complaint.created_at)}
            </p>
          </div>

          <div className="detail-top-badges">
            <span className={`status-pill-lg status-${(complaint.status || 'pending').toLowerCase().replace(' ', '-')}`}>
              <Settings size={15} />
              <span>{complaint.status}</span>
            </span>

            <span className={`priority-pill-lg priority-${(complaint.priority || 'medium').toLowerCase()}`}>
              <AlertCircle size={15} />
              <span>{complaint.priority} Priority</span>
            </span>

            {complaint.reporting_method && (
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '4px 10px',
                borderRadius: '8px',
                background: complaint.reporting_method === 'AI' ? '#EFF6FF' : '#F8FAFC',
                color: complaint.reporting_method === 'AI' ? '#1D4ED8' : '#475569',
                border: complaint.reporting_method === 'AI' ? '1px solid #BFDBFE' : '1px solid #E2E8F0',
                fontSize: '11.5px',
                fontWeight: 700
              }}>
                {complaint.reporting_method === 'AI' ? '🤖 AI Report' : '📝 Manual Report'}
              </span>
            )}

            {complaint.is_duplicate && (
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '4px 10px',
                borderRadius: '8px',
                background: '#FEF3C7',
                color: '#D97706',
                border: '1px solid #FDE68A',
                fontSize: '11.5px',
                fontWeight: 700
              }}>
                ⚠️ Duplicate of #{complaint.duplicate_of}
              </span>
            )}
          </div>
        </div>

        {/* Duplicate Notice Banner */}
        {complaint.is_duplicate && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '14px 18px',
            background: '#FFFBEB',
            border: '1.5px solid #FDE68A',
            borderRadius: '16px',
            marginBottom: '20px',
            color: '#92400E'
          }}>
            <AlertCircle size={20} color="#D97706" style={{ flexShrink: 0 }} />
            <div>
              <div style={{ fontWeight: 800, fontSize: '13.5px', marginBottom: '2px' }}>
                Duplicate Submission Detected (Manual ↔ AI)
              </div>
              <div style={{ fontSize: '12.5px', color: '#B45309' }}>
                {complaint.duplicate_reason || `This complaint matches your previous report (#${complaint.duplicate_of}) submitted through another method.`}
              </div>
            </div>
          </div>
        )}

        {/* 2-Column Section */}
        <div className="detail-two-col-grid">
          {/* Left Column: Your Complaint Details */}
          <div className="detail-card">
            <div className="detail-card-header">
              <div className="detail-card-header-left">
                <div className="detail-card-header-icon icon-box-green">
                  <FileText size={18} />
                </div>
                <h3 className="detail-card-title">Your Complaint Details</h3>
              </div>

              {complaint.status !== 'Resolved' && (
                <button 
                  className="btn-edit-details"
                  onClick={openEditModal}
                  style={{ cursor: 'pointer' }}
                >
                  <Edit3 size={13} />
                  <span>Edit</span>
                </button>
              )}
            </div>

            <div className="detail-kv-list">
              <div className="detail-kv-item">
                <div className="detail-kv-label-box">
                  <Tag size={16} />
                  <span>Category</span>
                </div>
                <div style={{ color: '#64748B', fontWeight: 600, marginRight: '8px' }}>:</div>
                <div className="detail-kv-value">{complaint.category}</div>
              </div>

              <div className="detail-kv-item">
                <div className="detail-kv-label-box">
                  <MapPin size={16} />
                  <span>Location</span>
                </div>
                <div style={{ color: '#64748B', fontWeight: 600, marginRight: '8px' }}>:</div>
                <div className="detail-kv-value">{complaint.location}</div>
              </div>

              <div className="detail-kv-item">
                <div className="detail-kv-label-box">
                  <BarChart2 size={16} />
                  <span>Priority</span>
                </div>
                <div style={{ color: '#64748B', fontWeight: 600, marginRight: '8px' }}>:</div>
                <div className="detail-kv-value">
                  <span className={`priority-pill priority-${(complaint.priority || 'medium').toLowerCase()}`}>
                    {complaint.priority || 'Medium'}
                  </span>
                </div>
              </div>

              <div className="detail-kv-item">
                <div className="detail-kv-label-box">
                  <Calendar size={16} />
                  <span>Submitted On</span>
                </div>
                <div style={{ color: '#64748B', fontWeight: 600, marginRight: '8px' }}>:</div>
                <div className="detail-kv-value">{formatDate(complaint.created_at)}</div>
              </div>
            </div>
          </div>

          {/* Right Column: Current Status (Vertical Timeline) */}
          <div className="detail-card">
            <div className="detail-card-header">
              <div className="detail-card-header-left">
                <div className="detail-card-header-icon icon-box-blue">
                  <Clock size={18} />
                </div>
                <h3 className="detail-card-title">Current Status</h3>
              </div>
            </div>

            <div className="vertical-timeline">
              {timelineSteps.map((step, idx) => {
                const isCompleted = step.stepNum < currentStep;
                const isActive = step.stepNum === currentStep;
                const stepInfo = getTimelineStepInfo(step.stepNum);

                return (
                  <div key={step.name} className={`timeline-step ${isCompleted ? 'completed' : isActive ? 'active' : ''}`}>
                    {idx < timelineSteps.length - 1 && <div className="timeline-connector" />}
                    
                    <div className="timeline-icon-node">
                      {isCompleted ? <Check size={14} strokeWidth={3} /> : isActive ? '●' : ''}
                    </div>

                    <div className="timeline-content">
                      <div className="timeline-title-row">
                        <span className="timeline-step-name">{step.name}</span>
                        {(isCompleted || isActive) && stepInfo.timestamp && (
                          <span className="timeline-step-date">{formatDate(stepInfo.timestamp)}</span>
                        )}
                      </div>
                      <p className="timeline-step-desc">
                        {stepInfo.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Description Card */}
        <div className="detail-card" style={{ marginBottom: '20px' }}>
          <div className="detail-card-header">
            <div className="detail-card-header-left">
              <div className="detail-card-header-icon icon-box-blue">
                <FileText size={18} />
              </div>
              <h3 className="detail-card-title">Description</h3>
            </div>
          </div>
          <p style={{ fontSize: '14px', color: '#334155', lineHeight: '1.6', margin: 0 }}>
            {complaint.description}
          </p>
        </div>

        {/* Photographic Evidence (Citizen Photo & Crew Completion Photo) */}
        {(complaint.image_url || complaint.photo_url || complaint.completion_photo) && (
          <div className="detail-card" style={{ marginBottom: '20px' }}>
            <div className="detail-card-header">
              <div className="detail-card-header-left">
                <div className="detail-card-header-icon icon-box-green">
                  <FileText size={18} />
                </div>
                <h3 className="detail-card-title">Photographic Evidence</h3>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: complaint.completion_photo && (complaint.image_url || complaint.photo_url) ? '1fr 1fr' : '1fr', gap: '16px' }}>
              {(complaint.image_url || complaint.photo_url) && (
                <div style={{ borderRadius: '12px', border: '1px solid #CBD5E1', overflow: 'hidden', background: '#0F172A' }}>
                  <div style={{ padding: '8px 12px', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', fontSize: '12px', fontWeight: 700, color: '#475569' }}>
                    Citizen Uploaded Photo
                  </div>
                  <img
                    src={complaint.image_url || complaint.photo_url}
                    alt="Citizen complaint photo"
                    style={{ width: '100%', maxHeight: '220px', objectFit: 'contain', display: 'block' }}
                  />
                </div>
              )}

              {complaint.completion_photo && (
                <div style={{ borderRadius: '12px', border: '1px solid #A7F3D0', overflow: 'hidden', background: '#0F172A' }}>
                  <div style={{ padding: '8px 12px', background: '#ECFDF5', borderBottom: '1px solid #A7F3D0', fontSize: '12px', fontWeight: 700, color: '#065F46' }}>
                    Crew Work Completion Proof
                  </div>
                  <img
                    src={complaint.completion_photo}
                    alt="Crew completion proof"
                    style={{ width: '100%', maxHeight: '220px', objectFit: 'contain', display: 'block' }}
                  />
                  {complaint.completion_note && (
                    <div style={{ padding: '8px 12px', background: '#F0FDF4', fontSize: '12.5px', color: '#166534', borderTop: '1px solid #DCFCE7' }}>
                      <strong>Crew Note:</strong> {complaint.completion_note}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Updates from Municipal Team */}
        <div className="detail-card" style={{ marginBottom: '20px' }}>
          <div className="detail-card-header">
            <div className="detail-card-header-left">
              <div className="detail-card-header-icon icon-box-orange">
                <MessageSquare size={18} />
              </div>
              <h3 className="detail-card-title">Updates from Municipal Team</h3>
            </div>
          </div>

          {latestComment ? (
            <div style={{ background: '#F0F7FF', border: '1px solid #BAE6FD', borderRadius: '14px', padding: '16px 20px', display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#DBEAFE', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563EB', flexShrink: 0 }}>
                <User size={18} />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                  <span style={{ fontSize: '13.5px', fontWeight: 700, color: '#0F172A' }}>
                    {latestComment.author || 'Municipal Desk'}
                  </span>
                  <span style={{ fontSize: '12px', color: '#64748B' }}>
                    {formatDate(latestComment.created_at)}
                  </span>
                </div>
                <p style={{ fontSize: '13.5px', color: '#1E293B', margin: 0, lineHeight: 1.5 }}>
                  {latestComment.content}
                </p>
              </div>
            </div>
          ) : (
            <div style={{ background: '#F8FAFC', border: '1px dashed #CBD5E1', borderRadius: '14px', padding: '16px 20px', textAlign: 'center', color: '#64748B', fontSize: '13px' }}>
              No municipal updates or comments posted for this ticket yet.
            </div>
          )}
        </div>

        {/* Add a Comment */}
        <div className="detail-card">
          <div className="detail-card-header">
            <div className="detail-card-header-left">
              <div className="detail-card-header-icon icon-box-purple">
                <MessageSquare size={18} />
              </div>
              <h3 className="detail-card-title">Add a Comment</h3>
            </div>
          </div>

          <form onSubmit={handleAddComment}>
            <div className="manual-input-wrapper" style={{ marginBottom: '16px' }}>
              <textarea 
                className="comment-input-area"
                rows={3}
                maxLength={500}
                placeholder="Write a comment or additional information..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
              />
              <span className="manual-char-count">{newComment.length}/500</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button 
                type="submit" 
                className="btn-manual-submit" 
                disabled={submittingComment || !newComment.trim()}
                style={{ width: 'auto', padding: '0 24px', height: '46px', fontSize: '14px', marginTop: 0 }}
              >
                <Send size={16} />
                <span>{submittingComment ? 'Sending...' : 'Send'}</span>
              </button>
            </div>
          </form>
        </div>

      </main>

      {/* EDIT COMPLAINT MODAL */}
      {isEditModalOpen && (
        <div className="modal-overlay" style={{ zIndex: 1150 }}>
          <div className="modal-card" style={{ maxWidth: '560px', borderRadius: '18px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#059669' }}>
                  <Edit3 size={18} />
                </div>
                <div>
                  <h2 style={{ fontSize: '17px', fontWeight: 800, margin: 0, color: '#0F172A' }}>
                    Edit Issue Details
                  </h2>
                  <span style={{ fontSize: '12px', color: '#64748B' }}>Ticket: {complaint.ticket_number}</span>
                </div>
              </div>
              <button className="btn-close-modal" onClick={() => setIsEditModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <div className="modal-body">
              {editError && (
                <div className="alert alert-error" style={{ marginBottom: '16px' }}>
                  {editError}
                </div>
              )}

              <form onSubmit={handleEditSubmit}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                  {/* Category */}
                  <div className="manual-form-group" style={{ margin: 0 }}>
                    <label className="manual-field-label">Issue Category</label>
                    <div className="manual-input-wrapper">
                      <select
                        className="manual-select-field"
                        value={editCategory}
                        onChange={(e) => setEditCategory(e.target.value)}
                        required
                      >
                        <option value="Streetlight">Streetlight</option>
                        <option value="Pothole / Road">Pothole / Road</option>
                        <option value="Garbage / Sanitation">Garbage / Sanitation</option>
                        <option value="Water Supply">Water Supply</option>
                        <option value="Sewage / Drainage">Sewage / Drainage</option>
                        <option value="Other">Other Civic Issue</option>
                      </select>
                      <ChevronDown className="manual-select-chevron" size={16} />
                    </div>
                  </div>

                  {/* Urgency */}
                  <div className="manual-form-group" style={{ margin: 0 }}>
                    <label className="manual-field-label">Urgency Level</label>
                    <div className="manual-input-wrapper">
                      <select
                        className="manual-select-field"
                        value={editUrgency}
                        onChange={(e) => setEditUrgency(e.target.value)}
                        required
                      >
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                        <option value="Critical">Critical</option>
                      </select>
                      <ChevronDown className="manual-select-chevron" size={16} />
                    </div>
                  </div>
                </div>

                {/* Location */}
                <div className="manual-form-group" style={{ marginBottom: '14px' }}>
                  <label className="manual-field-label">Location / Address</label>
                  <div className="manual-input-wrapper">
                    <MapPin className="manual-input-icon" size={16} />
                    <input
                      type="text"
                      className="manual-input-field"
                      value={editLocation}
                      onChange={(e) => setEditLocation(e.target.value)}
                      placeholder="Enter location / street address..."
                      required
                    />
                  </div>
                </div>

                {/* Description */}
                <div className="manual-form-group" style={{ marginBottom: '14px' }}>
                  <label className="manual-field-label">Issue Description</label>
                  <div className="manual-input-wrapper">
                    <textarea
                      className="manual-textarea-field"
                      rows={3}
                      maxLength={500}
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      placeholder="Describe the issue..."
                      required
                    />
                  </div>
                </div>

                {/* Photo Update */}
                <ImageCaptureUpload
                  value={editPhoto}
                  onChange={setEditPhoto}
                  label="Update Photo Evidence"
                  helperText="You can upload a new picture or capture a photo with your camera."
                />

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                  <button
                    type="button"
                    className="btn-login"
                    style={{ padding: '9px 16px' }}
                    onClick={() => setIsEditModalOpen(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-submit"
                    style={{ width: 'auto', padding: '9px 22px' }}
                    disabled={editLoading}
                  >
                    {editLoading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* PROFILE MODAL */}
      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        user={user}
      />
    </div>
  );
}

