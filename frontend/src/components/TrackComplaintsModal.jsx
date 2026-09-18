import React, { useState, useEffect } from 'react';
import { X, Search, Clock, CheckCircle2, AlertTriangle, ShieldCheck, MessageSquare, Send, User } from 'lucide-react';
import { api } from '../services/api';

export default function TrackComplaintsModal({ isOpen, onClose, user }) {
  const [complaints, setComplaints] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchComplaints();
    }
  }, [isOpen]);

  const fetchComplaints = async (query = '') => {
    setLoading(true);
    setError('');
    try {
      const data = await api.listComplaints(query ? { search: query } : {});
      setComplaints(data);
      if (data.length > 0 && !selectedTicket) {
        setSelectedTicket(data[0]);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch complaints queue.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchComplaints(searchQuery);
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !selectedTicket) return;
    try {
      const updated = await api.addComment(selectedTicket.id, {
        author: user?.full_name || 'Citizen',
        content: newComment.trim()
      });
      setSelectedTicket(updated);
      setComplaints(complaints.map(c => c.id === updated.id ? updated : c));
      setNewComment('');
    } catch (err) {
      alert(err.message || 'Failed to add comment.');
    }
  };

  if (!isOpen) return null;

  const getStatusStep = (status) => {
    switch (status) {
      case 'New': return 1;
      case 'Assigned': return 2;
      case 'In Progress': return 3;
      case 'Resolved': return 4;
      default: return 1;
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-card large">
        <div className="modal-header">
          <h2>Track Civic Complaints</h2>
          <button className="btn-close-modal" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body" style={{ padding: '24px' }}>
          {/* Search Bar */}
          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
            <input 
              type="text" 
              className="form-input" 
              placeholder="Search by ticket number (e.g. CIVIC-20260915-...) or keyword" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button type="submit" className="btn-submit" style={{ width: 'auto', padding: '0 24px' }}>
              <Search size={18} /> Search
            </button>
          </form>

          <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '24px', minHeight: '420px' }}>
            {/* Left Complaints List Sidebar */}
            <div style={{ borderRight: '1px solid #E2E8F0', paddingRight: '16px', overflowY: 'auto', maxHeight: '500px' }}>
              <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', marginBottom: '12px' }}>
                {user ? `Your Complaints (${complaints.length})` : `All Public Tickets (${complaints.length})`}
              </h4>

              {loading ? (
                <p style={{ fontSize: '14px', color: '#64748B', padding: '20px 0' }}>Loading tickets...</p>
              ) : complaints.length === 0 ? (
                <p style={{ fontSize: '14px', color: '#64748B', padding: '20px 0' }}>No complaint tickets found.</p>
              ) : (
                complaints.map(comp => (
                  <div
                    key={comp.id}
                    style={{
                      padding: '14px',
                      borderRadius: '12px',
                      background: selectedTicket?.id === comp.id ? '#E6F5ED' : '#F8FAFC',
                      border: selectedTicket?.id === comp.id ? '1.5px solid #0F9F59' : '1px solid #E2E8F0',
                      marginBottom: '10px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onClick={() => setSelectedTicket(comp)}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 800, color: '#0F172A' }}>{comp.ticket_number}</span>
                      <span className={`badge-status badge-${comp.status.toLowerCase().replace(' ', '-')}`}>
                        {comp.status}
                      </span>
                    </div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {comp.category}
                    </div>
                    <div style={{ fontSize: '11px', color: '#64748B' }}>
                      Priority Score: {comp.priority_score} | {comp.priority}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Right Ticket Details & Stepper */}
            {selectedTicket ? (
              <div style={{ overflowY: 'auto', maxHeight: '500px', paddingRight: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                  <div>
                    <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#0F172A', marginBottom: '4px' }}>
                      {selectedTicket.category}
                    </h3>
                    <p style={{ fontSize: '13px', color: '#64748B' }}>Ticket #{selectedTicket.ticket_number} | Reported {new Date(selectedTicket.created_at).toLocaleDateString()}</p>
                  </div>

                  <span className={`badge-status badge-${selectedTicket.status.toLowerCase().replace(' ', '-')}`} style={{ fontSize: '14px', padding: '6px 16px' }}>
                    {selectedTicket.status}
                  </span>
                </div>

                {/* Workflow Stepper */}
                <div style={{ background: '#F8FAFC', padding: '20px', borderRadius: '16px', border: '1px solid #E2E8F0', marginBottom: '24px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', marginBottom: '16px' }}>
                    Workflow Resolution Lifecycle
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
                    {['New', 'Assigned', 'In Progress', 'Resolved'].map((stepName, idx) => {
                      const currentStepNum = getStatusStep(selectedTicket.status);
                      const isDone = idx + 1 <= currentStepNum;
                      return (
                        <div key={stepName} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 2 }}>
                          <div style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '50%',
                            background: isDone ? '#0F9F59' : '#E2E8F0',
                            color: isDone ? 'white' : '#64748B',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            fontSize: '14px',
                            marginBottom: '8px'
                          }}>
                            {isDone ? '✓' : idx + 1}
                          </div>
                          <span style={{ fontSize: '12px', fontWeight: isDone ? 700 : 500, color: isDone ? '#0F172A' : '#94A3B8' }}>
                            {stepName}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Issue Details Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                  <div style={{ background: '#F1F5F9', padding: '16px', borderRadius: '12px' }}>
                    <div style={{ fontSize: '12px', color: '#64748B', marginBottom: '4px' }}>Location</div>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: '#0F172A' }}>{selectedTicket.location}</div>
                  </div>
                  <div style={{ background: '#F1F5F9', padding: '16px', borderRadius: '12px' }}>
                    <div style={{ fontSize: '12px', color: '#64748B', marginBottom: '4px' }}>Assigned Field Crew</div>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: selectedTicket.assigned_to ? '#0F9F59' : '#94A3B8' }}>
                      {selectedTicket.assigned_to || 'Pending Assignment'}
                    </div>
                  </div>
                  <div style={{ background: '#F1F5F9', padding: '16px', borderRadius: '12px' }}>
                    <div style={{ fontSize: '12px', color: '#64748B', marginBottom: '4px' }}>Priority & SLA Deadline</div>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: '#0F172A' }}>
                      {selectedTicket.priority} ({selectedTicket.sla_status})
                    </div>
                  </div>
                  <div style={{ background: '#F1F5F9', padding: '16px', borderRadius: '12px' }}>
                    <div style={{ fontSize: '12px', color: '#64748B', marginBottom: '4px' }}>Aging Hours</div>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: '#0F172A' }}>
                      {selectedTicket.aging_hours.toFixed(1)} hrs
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div style={{ marginBottom: '24px' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#0F172A', marginBottom: '6px' }}>Description</h4>
                  <p style={{ fontSize: '14px', color: '#334155', lineHeight: '1.6', background: '#F8FAFC', padding: '14px', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                    {selectedTicket.description}
                  </p>
                </div>

                {/* Comments / Audit Trail */}
                <div>
                  <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#0F172A', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <MessageSquare size={16} /> Audit Trail & Comments ({selectedTicket.comments?.length || 0})
                  </h4>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
                    {selectedTicket.comments?.map((c, i) => (
                      <div key={i} style={{ padding: '12px 14px', background: '#F8FAFC', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <span style={{ fontSize: '12px', fontWeight: 700, color: '#0F9F59' }}>{c.author}</span>
                          <span style={{ fontSize: '11px', color: '#94A3B8' }}>{new Date(c.created_at).toLocaleString()}</span>
                        </div>
                        <p style={{ fontSize: '13px', color: '#334155' }}>{c.content}</p>
                      </div>
                    ))}
                  </div>

                  {/* Add Comment Input */}
                  <form onSubmit={handleAddComment} style={{ display: 'flex', gap: '10px' }}>
                    <input 
                      type="text"
                      className="form-input"
                      placeholder="Add a comment or update..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                    />
                    <button type="submit" className="btn-submit" style={{ width: 'auto', padding: '0 20px' }}>
                      <Send size={16} /> Send
                    </button>
                  </form>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8', fontSize: '15px' }}>
                Select a complaint from the list to view tracking details.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
