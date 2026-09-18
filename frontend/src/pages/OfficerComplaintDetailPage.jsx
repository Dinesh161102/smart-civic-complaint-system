import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { 
  ArrowLeft, 
  LayoutDashboard, 
  ListFilter, 
  UserCheck, 
  BarChart3, 
  User, 
  HelpCircle, 
  MapPin, 
  Lightbulb, 
  Trash2, 
  Wrench, 
  Droplet, 
  X, 
  FileText,
  Calendar,
  Tag,
  Users,
  ImageIcon,
  CheckCircle2,
  Clock,
  History,
  ShieldCheck,
  Check,
  XCircle,
  AlertTriangle,
  Home
} from 'lucide-react';
import cleanerCityImg from '../assets/cleaner-city.png';
import parkBgImg from '../assets/civic-park-bg.png';
import ProfileModal from '../components/ProfileModal';

export default function OfficerComplaintDetailPage({ user }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // Department & Team Mapping for Assign Crew
  const departmentMapping = {
    'Streetlight': {
      department: 'Electrical Maintenance',
      teams: [
        'Electrical Team - North Zone',
        'Electrical Team - South Zone',
        'Streetlight Maintenance Team'
      ]
    },
    'Waste': {
      department: 'Sanitation',
      teams: [
        'Sanitation Team - North Zone',
        'Sanitation Team - South Zone',
        'Solid Waste Management Team'
      ]
    },
    'Road': {
      department: 'Roads & Pothole Repair',
      teams: [
        'Road Repair Team - Zone 1',
        'Pothole Patching Squad',
        'Public Works Department'
      ]
    },
    'Water Supply': {
      department: 'Water Supply Repair',
      teams: [
        'Water Supply Maintenance Team',
        'Pipe Leakage Emergency Crew',
        'Water Utilities Team'
      ]
    },
    'Drainage': {
      department: 'Drainage Operations',
      teams: [
        'Drainage Maintenance Team',
        'Sewerage Clearance Team',
        'Flood Response Squad'
      ]
    }
  };

  const [complaint, setComplaint] = useState({
    id: id,
    ticketId: id,
    issue: 'Loading Issue...',
    category: 'General',
    categoryIcon: Lightbulb,
    categoryColor: '#EAB308',
    location: 'Loading Location...',
    submittedOn: 'Recently',
    priority: 'Medium',
    priorityBg: '#FFEDD5',
    priorityColor: '#EA580C',
    status: 'New',
    description: 'Fetching complaint details from server...',
    assignedTo: '',
    photo: null,
    photoCaption: 'No Photo Provided',
    completionPhoto: null,
    completedAt: null,
    resolvedAt: null,
    verifiedBy: null,
    statusHistory: []
  });

  const [currentStatus, setCurrentStatus] = useState(complaint.status);
  const [assignedCrew, setAssignedCrew] = useState(complaint.assignedTo);
  const [statusHistory, setStatusHistory] = useState([]);
  const [completionPhoto, setCompletionPhoto] = useState(null);
  const [completedAt, setCompletedAt] = useState(null);
  const [resolvedAt, setResolvedAt] = useState(null);
  const [verifiedBy, setVerifiedBy] = useState(null);

  useEffect(() => {
    async function loadComplaintDetail() {
      try {
        const c = await api.getComplaint(id);
        if (c) {
          const formatted = {
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
            description: c.description || 'No description provided.',
            assignedTo: c.assigned_team || c.assignedTo || '',
            photo: c.image_url || c.photo_url || null,
            photoCaption: c.image_url || c.photo_url ? 'Citizen Uploaded Photo' : 'No Photo Provided',
            completionPhoto: c.completion_photo || null,
            completedAt: c.completed_at || null,
            resolvedAt: c.resolved_at || null,
            verifiedBy: c.verified_by || null,
            reporting_method: c.reporting_method || 'Manual',
            is_duplicate: Boolean(c.is_duplicate),
            duplicate_of: c.duplicate_of || null,
            duplicate_reason: c.duplicate_reason || null,
            statusHistory: c.status_history || [
              { status: c.status || 'New', description: 'Complaint logged in database', timestamp: c.submitted_on || 'Today' }
            ]
          };

          setComplaint(formatted);
          setCurrentStatus(formatted.status);
          setAssignedCrew(formatted.assignedTo);
          setStatusHistory(formatted.statusHistory);
          setCompletionPhoto(formatted.completionPhoto);
          setCompletedAt(formatted.completedAt);
          setResolvedAt(formatted.resolvedAt);
          setVerifiedBy(formatted.verifiedBy);
        }
      } catch (err) {
        console.log('Error loading complaint detail:', err.message);
      }
    }

    loadComplaintDetail();
  }, [id]);

  // Department info from category
  const mappedDeptInfo = departmentMapping[complaint.category] || {
    department: 'General Municipal Operations',
    teams: ['Municipal Field Crew #1', 'Municipal Field Crew #2']
  };

  // Modals state
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isUpdatesModalOpen, setIsUpdatesModalOpen] = useState(false);
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState(mappedDeptInfo.teams[0] || '');

  // Officer Verification Comment State
  const [verificationComment, setVerificationComment] = useState('');
  const [verificationError, setVerificationError] = useState('');

  // Helper function to generate current timestamp string
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

  // Handle Assign Crew Submission
  const handleAssignTeamSubmit = async (e) => {
    e.preventDefault();
    if (!selectedTeam) return;

    const timestamp = formatCurrentTimestamp();
    const complaintId = complaint.id;

    try {
      const updated = await api.assignCrew(complaintId, {
        assigned_crew_id: "CREW-101",
        assigned_team: selectedTeam,
        assigned_to: selectedTeam
      });

      if (updated) {
        setComplaint(prev => ({
          ...prev,
          status: 'Assigned',
          assignedTo: updated.assigned_team || updated.assigned_to || selectedTeam,
          statusHistory: updated.status_history || prev.statusHistory
        }));
        setAssignedCrew(updated.assigned_team || updated.assigned_to || selectedTeam);
        setCurrentStatus('Assigned');
        if (updated.status_history) {
          setStatusHistory(updated.status_history);
        }
      }
    } catch (err) {
      console.warn("Backend sync error for assignCrew:", err.message);
      setAssignedCrew(selectedTeam);
      setCurrentStatus('Assigned');
      const newHistoryItem = {
        status: 'Assigned',
        title: 'Assigned',
        description: `Assigned to ${selectedTeam}`,
        timestamp: timestamp,
        actor: user?.full_name || 'Municipal Officer Dave'
      };
      setStatusHistory(prev => [...prev, newHistoryItem]);
    }

    setIsAssignModalOpen(false);
  };


  // Handle Verify & Mark Resolved
  const handleVerifyAndResolveSubmit = async () => {
    const timestamp = formatCurrentTimestamp();
    const officerName = user?.full_name || 'Municipal Officer Dave';
    const commentText = verificationComment.trim() || 'Work inspected and verified successfully.';
    const complaintId = complaint.id;

    try {
      await api.verifyResolution(complaintId, commentText);
    } catch (err) {
      console.warn("Backend sync notice for verifyResolution:", err.message);
    }

    setCurrentStatus('Resolved');
    setResolvedAt(timestamp);
    setVerifiedBy(officerName);

    const newHistoryItem = {
      status: 'Resolved',
      title: 'Resolved',
      description: 'Verified by Municipal Officer',
      comment: commentText,
      timestamp: timestamp,
      actor: officerName
    };

    setStatusHistory(prev => [...prev, newHistoryItem]);
    setIsVerifyModalOpen(false);
    setVerificationComment('');
    setVerificationError('');
  };

  // Handle Rejection (Rework Comment Required)
  const handleRejectSubmit = async () => {
    if (!verificationComment.trim()) {
      setVerificationError('Rejection comment is required to send complaint back for crew rework.');
      return;
    }

    const timestamp = formatCurrentTimestamp();
    const officerName = user?.full_name || 'Municipal Officer Dave';
    const rejectionText = verificationComment.trim();
    const complaintId = complaint.id;

    try {
      await api.rejectWork(complaintId, rejectionText);
    } catch (err) {
      console.warn("Backend sync notice for rejectWork:", err.message);
    }

    // Status is explicitly marked as Rejected for crew rework
    setCurrentStatus('Rejected');

    const newHistoryItem = {
      status: 'Rejected',
      title: 'Verification Rejected',
      description: 'Verification Rejected by Officer - Rework Required',
      comment: rejectionText,
      note: rejectionText,
      timestamp: timestamp,
      actor: officerName
    };

    setStatusHistory(prev => [...prev, newHistoryItem]);
    setIsVerifyModalOpen(false);
    setVerificationComment('');
    setVerificationError('');
  };

  // Status Badge Helper
  const getStatusBadgeStyle = (status) => {
    switch (status) {
      case 'Resolved': return { bg: '#DCFCE7', color: '#16A34A' };
      case 'Completed': return { bg: '#E0F2FE', color: '#0284C7' };
      case 'In Progress': return { bg: '#F3E8FF', color: '#9333EA' };
      case 'Rejected': return { bg: '#FEE2E2', color: '#DC2626' };
      case 'Assigned': return { bg: '#DBEAFE', color: '#2563EB' };
      case 'New':
      default: return { bg: '#FEF3C7', color: '#D97706' };
    }
  };

  const statusBadgeStyle = getStatusBadgeStyle(currentStatus);
  const CatIcon = complaint.categoryIcon;

  // 1. MAIN COMPLAINT DETAILS PAGE: 4 STAGES ONLY (New -> Assigned -> In Progress -> Resolved)
  const mainPage4Stages = ['New', 'Assigned', 'In Progress', 'Resolved'];
  
  // Calculate active index on 4-stage view
  const getActive4StageIndex = (status) => {
    if (status === 'New') return 0;
    if (status === 'Assigned') return 1;
    if (status === 'In Progress' || status === 'Completed') return 2; // In Progress is active stage until verified
    if (status === 'Resolved') return 3;
    return 0;
  };

  const active4StageIndex = getActive4StageIndex(currentStatus);

  // 2. VIEW UPDATES MODAL: FULL 5 WORKFLOW STAGES (New -> Assigned -> In Progress -> Completed -> Resolved)
  const modal5Stages = [
    {
      key: 'New',
      title: 'New',
      defaultDesc: 'Complaint submitted by Citizen',
      actor: 'Citizen',
      defaultTime: '16 Sep 2026 • 09:15 AM'
    },
    {
      key: 'Assigned',
      title: 'Assigned',
      defaultDesc: assignedCrew ? `Assigned to ${assignedCrew}` : 'Assigned to Electrical Team - North Zone',
      actor: 'Municipal Officer Dave',
      defaultTime: '16 Sep 2026 • 09:32 AM'
    },
    {
      key: 'In Progress',
      title: 'In Progress',
      defaultDesc: 'Work started by Crew Member',
      actor: 'Crew Member',
      defaultTime: '17 Sep 2026 • 10:05 AM'
    },
    {
      key: 'Completed',
      title: 'Completed',
      defaultDesc: 'Work completed by Crew Member',
      extraDesc: 'Completion photo uploaded',
      actor: 'Crew Member',
      defaultTime: completedAt || '17 Sep 2026 • 12:20 PM'
    },
    {
      key: 'Resolved',
      title: 'Resolved',
      defaultDesc: currentStatus === 'Resolved' ? 'Verified by Municipal Officer' : 'Pending Officer Verification',
      actor: verifiedBy || 'Municipal Officer Dave',
      defaultTime: resolvedAt || '17 Sep 2026 • 12:45 PM'
    }
  ];

  const fullWorkflowOrder = ['New', 'Assigned', 'In Progress', 'Completed', 'Resolved'];
  const currentFullIndex = fullWorkflowOrder.indexOf(currentStatus);

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
      {/* Fixed Left Sidebar matching Officer Dashboard */}
      <aside className="citizen-sidebar">
        <div>
          <nav className="sidebar-nav-list">
            {sidebarNavItemsTop.map((item) => {
              const Icon = item.icon;
              const isActive = item.label === 'Complaints Queue';
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
              const isActive = false;
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
        
        {/* Back Navigation & Page Header */}
        <div>
          <button 
            onClick={() => navigate('/officer/complaints')}
            style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '6px', 
              background: 'none', 
              border: 'none', 
              color: '#059669', 
              fontWeight: 700, 
              fontSize: '13.5px', 
              cursor: 'pointer',
              marginBottom: '12px',
              padding: 0
            }}
          >
            <ArrowLeft size={16} /> Back to Complaints Queue
          </button>

          <div style={{ fontSize: '11px', fontWeight: 800, color: '#059669', letterSpacing: '0.6px', textTransform: 'uppercase', marginBottom: '4px' }}>
            MUNICIPAL OFFICER PORTAL
          </div>
          <h1 className="citizen-dash-title" style={{ fontSize: '26px' }}>
            Complaint Details
          </h1>
        </div>

        {/* COMPLAINT DETAILS TOP CARD */}
        <div className="citizen-table-card" style={{ padding: '24px 28px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <span className="ticket-id-pill-lg" style={{ marginBottom: '8px' }}>
                {complaint.ticketId}
              </span>
              <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#0F172A', margin: '4px 0 6px 0' }}>
                {complaint.issue}
              </h2>
              <p style={{ color: '#64748B', fontSize: '13px', margin: 0 }}>
                Submitted on <strong>{complaint.submittedOn}</strong>
              </p>
            </div>

            {/* Status & Priority Badges */}
            <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '6px 12px',
                borderRadius: '20px',
                background: complaint.reporting_method === 'AI' ? '#EFF6FF' : '#F8FAFC',
                color: complaint.reporting_method === 'AI' ? '#1D4ED8' : '#475569',
                border: complaint.reporting_method === 'AI' ? '1px solid #BFDBFE' : '1px solid #E2E8F0',
                fontSize: '12px',
                fontWeight: 700
              }}>
                {complaint.reporting_method === 'AI' ? '🤖 AI Report' : '📝 Manual Report'}
              </span>

              {complaint.is_duplicate && (
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '6px 12px',
                  borderRadius: '20px',
                  background: '#FEF3C7',
                  color: '#B45309',
                  border: '1px solid #FDE68A',
                  fontSize: '12px',
                  fontWeight: 700
                }}>
                  ⚠️ Duplicate (#{complaint.duplicate_of})
                </span>
              )}

              <span style={{ 
                background: complaint.priorityBg, 
                color: complaint.priorityColor, 
                padding: '6px 14px', 
                borderRadius: '20px', 
                fontWeight: 700, 
                fontSize: '12.5px' 
              }}>
                Priority: {complaint.priority}
              </span>
              <span style={{ 
                background: statusBadgeStyle.bg, 
                color: statusBadgeStyle.color, 
                padding: '6px 14px', 
                borderRadius: '20px', 
                fontWeight: 700, 
                fontSize: '12.5px' 
              }}>
                Status: {currentStatus}
              </span>
            </div>
          </div>

          {/* DUPLICATE BANNER NOTICE FOR OFFICER */}
          {complaint.is_duplicate && (
            <div style={{
              marginTop: '16px',
              padding: '14px 18px',
              background: '#FFFBEB',
              border: '1.5px solid #FCD34D',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              flexWrap: 'wrap'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <AlertTriangle size={20} color="#D97706" style={{ flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: '13.5px', fontWeight: 800, color: '#92400E' }}>
                    Duplicate Cross-Method Report Detected (Same Citizen)
                  </div>
                  <div style={{ fontSize: '12.5px', color: '#B45309', marginTop: '2px' }}>
                    {complaint.duplicate_reason || `The same citizen reported this issue via both AI and Manual channels (Original: #${complaint.duplicate_of}).`}
                  </div>
                </div>
              </div>
              {complaint.duplicate_of && (
                <button
                  onClick={() => navigate(`/officer/complaints/${complaint.duplicate_of}`)}
                  style={{
                    background: '#D97706',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '6px 14px',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap'
                  }}
                >
                  View Original #{complaint.duplicate_of} →
                </button>
              )}
            </div>
          )}

          {/* 1. MAIN PAGE TIMELINE: 4 STAGES ONLY (New -> Assigned -> In Progress -> Resolved) */}
          <div style={{ background: '#F8FAFC', padding: '16px 22px', borderRadius: '14px', border: '1px solid #E2E8F0', marginTop: '18px' }}>
            <div style={{ fontSize: '11px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '12px' }}>
              Status Timeline
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              {mainPage4Stages.map((step, idx) => {
                const isCompleted = idx < active4StageIndex || (idx === active4StageIndex && currentStatus === 'Resolved');
                const isCurrent = idx === active4StageIndex && currentStatus !== 'Resolved';
                return (
                  <React.Fragment key={step}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        background: isCompleted ? '#059669' : isCurrent ? '#059669' : '#FFFFFF',
                        border: isCompleted ? 'none' : isCurrent ? '3px solid #059669' : '2px solid #CBD5E1',
                        color: isCompleted ? '#FFFFFF' : isCurrent ? '#FFFFFF' : '#94A3B8',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '12px',
                        fontWeight: 800
                      }}>
                        {isCompleted ? '✓' : isCurrent ? '●' : '○'}
                      </div>
                      <span style={{
                        fontSize: '13px',
                        fontWeight: isCurrent ? 800 : isCompleted ? 700 : 500,
                        color: isCurrent ? '#0F172A' : isCompleted ? '#059669' : '#64748B'
                      }}>
                        {step}
                      </span>
                    </div>
                    {idx < mainPage4Stages.length - 1 && (
                      <div style={{
                        flex: 1,
                        height: '2px',
                        margin: '0 14px',
                        background: idx < active4StageIndex ? '#059669' : '#CBD5E1'
                      }} />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>

          {/* ACTION BUTTONS BAR */}
          <div style={{ 
            marginTop: '20px', 
            paddingTop: '18px', 
            borderTop: '1px solid #F1F5F9', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px' 
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              
              {/* 1. NEW STATUS: Assign Crew Button */}
              {currentStatus === 'New' && (
                <button 
                  onClick={() => setIsAssignModalOpen(true)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    background: '#0F172A',
                    color: 'white',
                    border: 'none',
                    padding: '10px 22px',
                    borderRadius: '10px',
                    fontWeight: 700,
                    fontSize: '13.5px',
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(15, 23, 42, 0.15)',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <UserCheck size={17} /> Assign Crew
                </button>
              )}

              {/* 2. ASSIGNED, IN_PROGRESS, COMPLETED, RESOLVED: View Updates Button */}
              {currentStatus !== 'New' && (
                <button 
                  onClick={() => setIsUpdatesModalOpen(true)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    background: '#FFFFFF',
                    color: '#0F172A',
                    border: '1.5px solid #CBD5E1',
                    padding: '9px 18px',
                    borderRadius: '10px',
                    fontWeight: 700,
                    fontSize: '13.5px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <History size={17} color="#059669" /> View Updates
                </button>
              )}

              {/* 4. COMPLETED STATUS: Verify & Resolve Button */}
              {currentStatus === 'Completed' && (
                <button 
                  onClick={() => setIsVerifyModalOpen(true)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    background: '#059669',
                    color: 'white',
                    border: 'none',
                    padding: '10px 22px',
                    borderRadius: '10px',
                    fontWeight: 700,
                    fontSize: '13.5px',
                    cursor: 'pointer',
                    boxShadow: '0 2px 10px rgba(5, 150, 105, 0.25)',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <ShieldCheck size={18} /> Verify & Resolve
                </button>
              )}

            </div>

            {/* Resolved Notice Badge */}
            {currentStatus === 'Resolved' && (
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: '#ECFDF5',
                border: '1px solid #A7F3D0',
                color: '#065F46',
                padding: '8px 16px',
                borderRadius: '20px',
                fontWeight: 700,
                fontSize: '13px'
              }}>
                <CheckCircle2 size={16} color="#059669" /> Verified by Municipal Officer
              </div>
            )}
          </div>
        </div>

        {/* 2-COLUMN MAIN DETAILS GRID */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: '20px' }}>
          
          {/* Left Card: Essential Metadata */}
          <div className="citizen-stat-card" style={{ padding: '24px', flexDirection: 'column', alignItems: 'stretch' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#0F172A', marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Tag size={18} color="#059669" /> Complaint Overview
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #F1F5F9', paddingBottom: '10px' }}>
                <span style={{ color: '#64748B', fontWeight: 500 }}>Category:</span>
                <span style={{ fontWeight: 700, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <CatIcon size={16} color={complaint.categoryColor} /> {complaint.category}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #F1F5F9', paddingBottom: '10px' }}>
                <span style={{ color: '#64748B', fontWeight: 500 }}>Location:</span>
                <span style={{ fontWeight: 700, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <MapPin size={15} color="#64748B" /> {complaint.location}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #F1F5F9', paddingBottom: '10px' }}>
                <span style={{ color: '#64748B', fontWeight: 500 }}>Submitted Date:</span>
                <span style={{ fontWeight: 700, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Calendar size={15} color="#64748B" /> {complaint.submittedOn}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748B', fontWeight: 500 }}>Assigned Team:</span>
                <span style={{ fontWeight: 700, color: assignedCrew ? '#059669' : '#94A3B8', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Users size={16} /> {assignedCrew || 'Unassigned'}
                </span>
              </div>
            </div>
          </div>

          {/* Right Card: Description & Authentic Compact Photo Attachment */}
          <div className="citizen-stat-card" style={{ padding: '24px', flexDirection: 'column', alignItems: 'stretch' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#0F172A', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileText size={18} color="#059669" /> Description & Attachment
            </h3>

            <div style={{ background: '#F8FAFC', padding: '14px 16px', borderRadius: '12px', border: '1px solid #E2E8F0', marginBottom: '16px' }}>
              <p style={{ color: '#334155', fontSize: '13.5px', lineHeight: '1.5', margin: 0, fontWeight: 500 }}>
                {complaint.description}
              </p>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#475569', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <ImageIcon size={15} color="#64748B" /> Complaint Photo
                </div>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#059669', background: '#ECFDF5', padding: '2px 8px', borderRadius: '10px', border: '1px solid #A7F3D0' }}>
                  Attached by Citizen
                </span>
              </div>
              
              {complaint.photo ? (
                <div style={{ 
                  borderRadius: '12px', 
                  overflow: 'hidden', 
                  border: '1px solid #CBD5E1', 
                  position: 'relative',
                  background: '#0F172A',
                  maxHeight: '180px'
                }}>
                  <img 
                    src={complaint.photo} 
                    alt="Civic complaint photo evidence" 
                    style={{ width: '100%', height: '180px', objectFit: 'contain', display: 'block' }} 
                  />
                  <div style={{ 
                    position: 'absolute', 
                    bottom: 0, 
                    left: 0, 
                    right: 0, 
                    background: 'rgba(15, 23, 42, 0.75)', 
                    color: 'white', 
                    fontSize: '11.5px', 
                    fontWeight: 600, 
                    padding: '4px 10px',
                    backdropFilter: 'blur(3px)'
                  }}>
                    {complaint.photoCaption}
                  </div>
                </div>
              ) : (
                <div style={{
                  padding: '24px 16px',
                  background: '#F8FAFC',
                  borderRadius: '12px',
                  border: '1.5px dashed #E2E8F0',
                  textAlign: 'center',
                  color: '#94A3B8'
                }}>
                  <ImageIcon size={28} style={{ marginBottom: '6px', opacity: 0.7 }} />
                  <div style={{ fontSize: '12.5px', fontWeight: 600, color: '#64748B' }}>
                    No Photo Attached
                  </div>
                  <div style={{ fontSize: '11.5px' }}>
                    Citizen submitted this complaint without a photo
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>

      </main>

      {/* MODAL 1: ASSIGN CREW POPUP */}
      {isAssignModalOpen && (
        <div className="modal-overlay" style={{ zIndex: 1100 }}>
          <div className="modal-card" style={{ maxWidth: '460px', borderRadius: '20px' }}>
            <div className="modal-header">
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                Assign Crew
              </h3>
              <button className="btn-close-modal" onClick={() => setIsAssignModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <div className="modal-body" style={{ padding: '24px' }}>
              <form onSubmit={handleAssignTeamSubmit}>
                
                {/* Category & Department Context */}
                <div style={{ background: '#F8FAFC', padding: '14px 16px', borderRadius: '12px', border: '1px solid #E2E8F0', marginBottom: '18px' }}>
                  <div style={{ fontSize: '12px', color: '#64748B', fontWeight: 600 }}>
                    Ticket #{complaint.ticketId}
                  </div>
                  <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#0F172A', marginTop: '2px' }}>
                    Category: <span style={{ color: '#059669' }}>{complaint.category}</span>
                  </div>
                  <div style={{ fontSize: '12.5px', color: '#475569', fontWeight: 600, marginTop: '4px' }}>
                    Department: <strong>{mappedDeptInfo.department}</strong>
                  </div>
                </div>

                {/* Team Selection List */}
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 700, marginBottom: '8px' }}>
                    Select Available Team
                  </label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {mappedDeptInfo.teams.map((teamName) => {
                      const isSelected = selectedTeam === teamName;
                      return (
                        <div
                          key={teamName}
                          onClick={() => setSelectedTeam(teamName)}
                          style={{
                            padding: '12px 14px',
                            borderRadius: '10px',
                            border: isSelected ? '2px solid #059669' : '1px solid #E2E8F0',
                            background: isSelected ? '#ECFDF5' : '#FFFFFF',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <input 
                            type="radio" 
                            name="assignedTeamRadio" 
                            checked={isSelected}
                            onChange={() => setSelectedTeam(teamName)}
                            style={{ accentColor: '#059669', cursor: 'pointer' }}
                          />
                          <span style={{ fontSize: '13.5px', fontWeight: isSelected ? 700 : 500, color: isSelected ? '#065F46' : '#334155' }}>
                            {teamName}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Modal Actions: [Cancel] [Assign Team] */}
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '24px' }}>
                  <button 
                    type="button" 
                    onClick={() => setIsAssignModalOpen(false)}
                    style={{ padding: '10px 18px', borderRadius: '10px', border: '1px solid #CBD5E1', background: 'white', fontWeight: 600, fontSize: '13.5px', cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    style={{ padding: '10px 20px', borderRadius: '10px', border: 'none', background: '#059669', color: 'white', fontWeight: 700, fontSize: '13.5px', cursor: 'pointer' }}
                  >
                    Assign Team
                  </button>
                </div>

              </form>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: VIEW UPDATES - DETAILED AMAZON-STYLE TRACKING TIMELINE (ALL 5 STAGES) */}
      {isUpdatesModalOpen && (
        <div className="modal-overlay" style={{ zIndex: 1100 }}>
          <div className="modal-card" style={{ maxWidth: '540px', borderRadius: '20px' }}>
            <div className="modal-header">
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0F172A', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <History size={20} color="#059669" /> Detailed Workflow Tracker
                </h3>
                <div style={{ fontSize: '12px', color: '#64748B', fontWeight: 600, marginTop: '2px' }}>
                  Amazon-Style Order & Resolution History for Ticket #{complaint.ticketId}
                </div>
              </div>
              <button className="btn-close-modal" onClick={() => setIsUpdatesModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <div className="modal-body" style={{ padding: '24px' }}>
              
              {/* Amazon-style Vertical Timeline Container */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0', position: 'relative' }}>
                {modal5Stages.map((stage, idx) => {
                  const stageIndexInFull = fullWorkflowOrder.indexOf(stage.key);
                  const isCompleted = stageIndexInFull < currentFullIndex || (stageIndexInFull === currentFullIndex && currentStatus === 'Resolved');
                  const isCurrent = stageIndexInFull === currentFullIndex && currentStatus !== 'Resolved';
                  const isPending = stageIndexInFull > currentFullIndex;

                  // Find history item if recorded
                  const historyItem = statusHistory.find(h => h.status === stage.key);
                  const timeStr = historyItem ? historyItem.timestamp : (isCompleted || isCurrent ? stage.defaultTime : null);
                  const descStr = historyItem ? historyItem.description : stage.defaultDesc;
                  const actorStr = historyItem ? historyItem.actor : stage.actor;

                  return (
                    <div 
                      key={stage.key}
                      style={{
                        display: 'flex',
                        gap: '16px',
                        position: 'relative',
                        paddingBottom: idx < modal5Stages.length - 1 ? '20px' : '0'
                      }}
                    >
                      {/* Vertical line connector */}
                      {idx < modal5Stages.length - 1 && (
                        <div style={{
                          position: 'absolute',
                          left: '14px',
                          top: '28px',
                          bottom: '0',
                          width: '2px',
                          background: stageIndexInFull < currentFullIndex ? '#059669' : '#E2E8F0',
                          zIndex: 1
                        }} />
                      )}

                      {/* Step Circle Node */}
                      <div style={{
                        width: '30px',
                        height: '30px',
                        borderRadius: '50%',
                        background: isCompleted ? '#059669' : isCurrent ? '#059669' : '#FFFFFF',
                        border: isCompleted ? 'none' : isCurrent ? '3px solid #059669' : '2px solid #CBD5E1',
                        color: isCompleted ? '#FFFFFF' : isCurrent ? '#FFFFFF' : '#94A3B8',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '13.5px',
                        fontWeight: 800,
                        zIndex: 2,
                        flexShrink: 0,
                        boxShadow: isCurrent ? '0 0 0 4px rgba(5, 150, 105, 0.15)' : 'none'
                      }}>
                        {isCompleted ? '✓' : isCurrent ? '●' : '○'}
                      </div>

                      {/* Content Card */}
                      <div style={{
                        flex: 1,
                        background: isCurrent ? '#ECFDF5' : '#F8FAFC',
                        border: isCurrent ? '1.5px solid #A7F3D0' : '1px solid #E2E8F0',
                        borderRadius: '12px',
                        padding: '12px 16px'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                          <div style={{
                            fontSize: '14px',
                            fontWeight: 800,
                            color: isCompleted || isCurrent ? '#0F172A' : '#94A3B8',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}>
                            {isCompleted ? (
                              <span style={{ color: '#059669', fontWeight: 900 }}>✓</span>
                            ) : isCurrent ? (
                              <span style={{ color: '#059669', fontWeight: 900 }}>●</span>
                            ) : (
                              <span style={{ color: '#94A3B8' }}>○</span>
                            )}
                            {stage.title}
                          </div>

                          <div style={{ fontSize: '11.5px', fontWeight: 700, color: isCurrent ? '#047857' : isCompleted ? '#475569' : '#94A3B8' }}>
                            {timeStr ? timeStr : (isPending ? 'Pending' : stage.defaultTime)}
                          </div>
                        </div>

                        <div style={{ fontSize: '13px', fontWeight: isCurrent ? 700 : 500, color: isCurrent ? '#065F46' : isCompleted ? '#334155' : '#94A3B8', marginBottom: '4px' }}>
                          {descStr}
                        </div>

                        {stage.extraDesc && (isCompleted || isCurrent || currentStatus === 'Completed' || currentStatus === 'Resolved') && (
                          <div style={{
                            fontSize: '11.5px',
                            fontWeight: 700,
                            color: '#0284C7',
                            background: '#E0F2FE',
                            padding: '2px 8px',
                            borderRadius: '6px',
                            display: 'inline-block',
                            marginBottom: '4px'
                          }}>
                            {stage.extraDesc}
                          </div>
                        )}

                        <div style={{ fontSize: '11.5px', fontWeight: 600, color: '#64748B' }}>
                          {isPending ? 'Awaiting action' : `Action by: ${actorStr}`}
                        </div>

                        {/* Display Officer Verification Comment if present */}
                        {(() => {
                          const itemComment = historyItem?.comment || (stage.key === 'Resolved' && (currentStatus === 'Resolved' || isCompleted) ? 'Work inspected and verified successfully.' : null);
                          if (!itemComment) return null;
                          return (
                            <div style={{
                              fontSize: '12.5px',
                              fontWeight: 600,
                              color: '#0F172A',
                              background: isCurrent ? '#FFFFFF' : '#F1F5F9',
                              padding: '6px 12px',
                              borderRadius: '8px',
                              marginTop: '6px',
                              marginBottom: '4px',
                              borderLeft: stage.key === 'In Progress' ? '3px solid #EF4444' : '3px solid #059669'
                            }}>
                              <span style={{ fontWeight: 700, color: '#475569' }}>Comment:</span> "{itemComment}"
                            </div>
                          );
                        })()}

                        {/* [ VERIFY ] BUTTON UNDER COMPLETED STAGE */}
                        {stage.key === 'Completed' && currentStatus === 'Completed' && (
                          <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: '1px dashed #A7F3D0' }}>
                            <button
                              onClick={() => {
                                setIsUpdatesModalOpen(false);
                                setIsVerifyModalOpen(true);
                              }}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                background: '#059669',
                                color: 'white',
                                border: 'none',
                                padding: '8px 18px',
                                borderRadius: '8px',
                                fontWeight: 800,
                                fontSize: '12.5px',
                                cursor: 'pointer',
                                boxShadow: '0 2px 8px rgba(5, 150, 105, 0.20)',
                                transition: 'all 0.15s ease'
                              }}
                            >
                              <ShieldCheck size={16} /> VERIFY
                            </button>
                          </div>
                        )}

                      </div>

                    </div>
                  );
                })}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px' }}>
                <button 
                  onClick={() => setIsUpdatesModalOpen(false)}
                  style={{ padding: '10px 20px', borderRadius: '10px', border: '1px solid #CBD5E1', background: '#FFFFFF', color: '#0F172A', fontWeight: 700, fontSize: '13.5px', cursor: 'pointer' }}
                >
                  Close
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: DEDICATED VERIFICATION PAGE / VIEW MODAL */}
      {isVerifyModalOpen && (
        <div className="modal-overlay" style={{ zIndex: 1100 }}>
          <div className="modal-card" style={{ maxWidth: '620px', borderRadius: '20px' }}>
            <div className="modal-header">
              <div>
                <h3 style={{ fontSize: '19px', fontWeight: 800, color: '#0F172A', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ShieldCheck size={22} color="#059669" /> Verify Field Work & Resolution
                </h3>
                <div style={{ fontSize: '12.5px', color: '#64748B', fontWeight: 600, marginTop: '2px' }}>
                  Inspect crew completion evidence for Ticket #{complaint.ticketId}
                </div>
              </div>
              <button 
                className="btn-close-modal" 
                onClick={() => {
                  setIsVerifyModalOpen(false);
                  setShowRejectInput(false);
                  setRejectionReason('');
                }}
              >
                <X size={18} />
              </button>
            </div>

            <div className="modal-body" style={{ padding: '24px' }}>
              
              {/* Comprehensive Metadata Summary Grid */}
              <div style={{ 
                background: '#F8FAFC', 
                padding: '16px 18px', 
                borderRadius: '14px', 
                border: '1px solid #E2E8F0', 
                marginBottom: '18px',
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '10px 20px',
                fontSize: '13px'
              }}>
                <div>
                  <span style={{ color: '#64748B', fontWeight: 500 }}>Ticket ID:</span>
                  <div style={{ fontWeight: 800, color: '#0F172A' }}>{complaint.ticketId}</div>
                </div>

                <div>
                  <span style={{ color: '#64748B', fontWeight: 500 }}>Category:</span>
                  <div style={{ fontWeight: 700, color: '#059669' }}>{complaint.category}</div>
                </div>

                <div style={{ gridColumn: 'span 2' }}>
                  <span style={{ color: '#64748B', fontWeight: 500 }}>Complaint Title:</span>
                  <div style={{ fontWeight: 800, color: '#0F172A', fontSize: '14px' }}>{complaint.issue}</div>
                </div>

                <div>
                  <span style={{ color: '#64748B', fontWeight: 500 }}>Location:</span>
                  <div style={{ fontWeight: 700, color: '#334155' }}>{complaint.location}</div>
                </div>

                <div>
                  <span style={{ color: '#64748B', fontWeight: 500 }}>Assigned Team:</span>
                  <div style={{ fontWeight: 700, color: '#059669' }}>{assignedCrew || 'Field Crew'}</div>
                </div>

                <div style={{ gridColumn: 'span 2', borderTop: '1px solid #E2E8F0', paddingTop: '8px', marginTop: '2px' }}>
                  <span style={{ color: '#64748B', fontWeight: 500 }}>Work Completed Timestamp:</span>
                  <div style={{ fontWeight: 700, color: '#0284C7' }}>{completedAt || '17 Sep 2026 • 12:20 PM'}</div>
                </div>
              </div>

              {/* LARGE CREW COMPLETION PHOTO PROOF DISPLAY */}
              <div style={{ marginBottom: '18px' }}>
                <div style={{ fontSize: '13.5px', fontWeight: 800, color: '#0F172A', marginBottom: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <ImageIcon size={17} color="#059669" /> Crew Completion Photo Proof
                  </span>
                  <span style={{ fontSize: '11.5px', fontWeight: 700, color: '#059669', background: '#ECFDF5', padding: '2px 8px', borderRadius: '10px', border: '1px solid #A7F3D0' }}>
                    Uploaded by Assigned Crew
                  </span>
                </div>
                
                {completionPhoto ? (
                  <div style={{ 
                    borderRadius: '14px', 
                    overflow: 'hidden', 
                    border: '2px solid #059669', 
                    position: 'relative',
                    background: '#0F172A',
                    boxShadow: '0 4px 14px rgba(5, 150, 105, 0.12)'
                  }}>
                    <img 
                      src={completionPhoto} 
                      alt="Crew completion proof" 
                      style={{ width: '100%', height: '250px', objectFit: 'contain', display: 'block' }} 
                    />
                    <div style={{ 
                      position: 'absolute', 
                      bottom: 0, 
                      left: 0, 
                      right: 0, 
                      background: 'rgba(5, 150, 105, 0.92)', 
                      color: 'white', 
                      fontSize: '12.5px', 
                      fontWeight: 700, 
                      padding: '8px 14px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      backdropFilter: 'blur(3px)'
                    }}>
                      <span>Field Work Completed Evidence</span>
                      <Check size={17} />
                    </div>
                  </div>
                ) : (
                  <div style={{
                    padding: '28px 16px',
                    background: '#F8FAFC',
                    borderRadius: '14px',
                    border: '1.5px dashed #CBD5E1',
                    textAlign: 'center',
                    color: '#94A3B8'
                  }}>
                    <ImageIcon size={32} style={{ marginBottom: '8px', opacity: 0.7 }} />
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#64748B' }}>
                      No Completion Photo Attached
                    </div>
                    <div style={{ fontSize: '12px' }}>
                      Crew completed the work order without attaching a photo proof.
                    </div>
                  </div>
                )}
              </div>

              {/* OFFICER VERIFICATION COMMENT */}
              <div style={{ marginTop: '18px', marginBottom: '18px' }}>
                <label style={{ 
                  display: 'block', 
                  fontSize: '12px', 
                  fontWeight: 800, 
                  color: '#475569', 
                  marginBottom: '6px',
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase'
                }}>
                  OFFICER VERIFICATION COMMENT
                </label>
                <textarea
                  rows={3}
                  placeholder="Add a comment about the completed work..."
                  value={verificationComment}
                  onChange={(e) => {
                    setVerificationComment(e.target.value);
                    if (verificationError) setVerificationError('');
                  }}
                  style={{
                    width: '100%',
                    borderRadius: '10px',
                    border: verificationError ? '1.5px solid #EF4444' : '1px solid #CBD5E1',
                    padding: '10px 14px',
                    fontSize: '13.5px',
                    outline: 'none',
                    fontFamily: 'inherit',
                    resize: 'none',
                    boxSizing: 'border-box',
                    background: '#FFFFFF',
                    boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.03)'
                  }}
                />
                {verificationError && (
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#DC2626', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <AlertTriangle size={14} /> {verificationError}
                  </div>
                )}
              </div>

              {/* Action Buttons: [Cancel] [ Reject ] [ Verify & Resolve ] */}
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
                <button 
                  type="button" 
                  onClick={() => {
                    setIsVerifyModalOpen(false);
                    setVerificationComment('');
                    setVerificationError('');
                  }}
                  style={{ padding: '10px 18px', borderRadius: '10px', border: '1px solid #CBD5E1', background: 'white', fontWeight: 600, fontSize: '13.5px', cursor: 'pointer' }}
                >
                  Cancel
                </button>

                <button 
                  type="button" 
                  onClick={handleRejectSubmit}
                  style={{ 
                    padding: '10px 20px', 
                    borderRadius: '10px', 
                    border: '1.5px solid #EF4444', 
                    background: '#FFFFFF', 
                    color: '#DC2626', 
                    fontWeight: 800, 
                    fontSize: '13.5px', 
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <XCircle size={17} /> Reject
                </button>

                <button 
                  type="button" 
                  onClick={handleVerifyAndResolveSubmit}
                  style={{ 
                    padding: '10px 22px', 
                    borderRadius: '10px', 
                    border: 'none', 
                    background: '#059669', 
                    color: 'white', 
                    fontWeight: 800, 
                    fontSize: '13.5px', 
                    cursor: 'pointer', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '6px',
                    boxShadow: '0 2px 10px rgba(5, 150, 105, 0.25)',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <CheckCircle2 size={17} /> Verify & Resolve
                </button>
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


