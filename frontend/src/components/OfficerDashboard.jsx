import React, { useState, useEffect } from 'react';
import { X, ShieldAlert, CheckCircle, Clock, AlertTriangle, Users, Database, Filter, RefreshCw, Edit3, UserCheck } from 'lucide-react';
import { api } from '../services/api';

export default function OfficerDashboard({ isOpen, onClose, user }) {
  const [analytics, setAnalytics] = useState(null);
  const [complaints, setComplaints] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Modals inside dashboard
  const [assigningComp, setAssigningComp] = useState(null);
  const [crewName, setCrewName] = useState('');
  const [assignNote, setAssignNote] = useState('');

  const [updatingComp, setUpdatingComp] = useState(null);
  const [nextStatus, setNextStatus] = useState('Assigned');
  const [statusNote, setStatusNote] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchDashboardData();
    }
  }, [isOpen]);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError('');
    try {
      const [analyticsData, complaintsList] = await Promise.all([
        api.getAnalytics(),
        api.listComplaints()
      ]);
      setAnalytics(analyticsData);
      setComplaints(complaintsList);
    } catch (err) {
      setError(err.message || 'Failed to load officer dashboard metrics.');
    } finally {
      setLoading(false);
    }
  };

  const handleSeedDataset = async () => {
    if (!window.confirm('Sync and verify standard Officer, Citizen, and Crew role accounts in MongoDB?')) return;
    setLoading(true);
    try {
      await api.seedDataset();
      await fetchDashboardData();
      alert('Role accounts successfully synced and verified in MongoDB!');
    } catch (err) {
      alert(err.message || 'Account sync failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignCrewSubmit = async (e) => {
    e.preventDefault();
    if (!assigningComp || !crewName.trim()) return;
    try {
      await api.assignCrew(assigningComp.id, {
        assigned_to: crewName.trim(),
        note: assignNote || undefined
      });
      setAssigningComp(null);
      setCrewName('');
      setAssignNote('');
      fetchDashboardData();
    } catch (err) {
      alert(err.message || 'Failed to assign crew.');
    }
  };

  const handleUpdateStatusSubmit = async (e) => {
    e.preventDefault();
    if (!updatingComp) return;
    try {
      await api.updateStatus(updatingComp.id, {
        status: nextStatus,
        note: statusNote || undefined
      });
      setUpdatingComp(null);
      setStatusNote('');
      fetchDashboardData();
    } catch (err) {
      alert(err.message || 'Failed to update workflow status.');
    }
  };

  if (!isOpen) return null;

  const filteredComplaints = selectedStatus === 'All' 
    ? complaints 
    : complaints.filter(c => c.status === selectedStatus);

  return (
    <div className="modal-overlay">
      <div className="modal-card large" style={{ maxWidth: '1150px' }}>
        <div className="modal-header" style={{ background: '#0F172A', color: 'white', borderTopLeftRadius: '24px', borderTopRightRadius: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ShieldAlert size={24} color="#0F9F59" />
            <h2 style={{ color: 'white', margin: 0 }}>Municipal Officer Operations Portal</h2>
          </div>
          <button className="btn-close-modal" style={{ background: '#334155', color: 'white' }} onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          {error && (
            <div style={{ padding: '12px 16px', background: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626', borderRadius: '10px', fontSize: '14px', marginBottom: '20px' }}>
              {error}
            </div>
          )}

          {/* Analytics Summary Metric Cards */}
          {analytics && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px', marginBottom: '28px' }}>
              <div style={{ background: '#F8FAFC', padding: '18px', borderRadius: '16px', border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: '12px', fontWeight: 600, color: '#64748B', marginBottom: '4px' }}>Total Complaints</div>
                <div style={{ fontSize: '28px', fontWeight: 800, color: '#0F172A' }}>{analytics.total_complaints}</div>
              </div>

              <div style={{ background: '#FFFBEB', padding: '18px', borderRadius: '16px', border: '1px solid #FDE68A' }}>
                <div style={{ fontSize: '12px', fontWeight: 600, color: '#D97706', marginBottom: '4px' }}>Unresolved</div>
                <div style={{ fontSize: '28px', fontWeight: 800, color: '#D97706' }}>{analytics.unresolved_complaints}</div>
              </div>

              <div style={{ background: '#ECFDF5', padding: '18px', borderRadius: '16px', border: '1px solid #A7F3D0' }}>
                <div style={{ fontSize: '12px', fontWeight: 600, color: '#059669', marginBottom: '4px' }}>Resolved</div>
                <div style={{ fontSize: '28px', fontWeight: 800, color: '#059669' }}>{analytics.resolved_complaints}</div>
              </div>

              <div style={{ background: '#EFF6FF', padding: '18px', borderRadius: '16px', border: '1px solid #BFDBFE' }}>
                <div style={{ fontSize: '12px', fontWeight: 600, color: '#2563EB', marginBottom: '4px' }}>SLA Compliance</div>
                <div style={{ fontSize: '28px', fontWeight: 800, color: '#2563EB' }}>{analytics.sla_compliance_rate}%</div>
              </div>

              <div style={{ background: '#FEF2F2', padding: '18px', borderRadius: '16px', border: '1px solid #FECACA' }}>
                <div style={{ fontSize: '12px', fontWeight: 600, color: '#DC2626', marginBottom: '4px' }}>SLA Breached</div>
                <div style={{ fontSize: '28px', fontWeight: 800, color: '#DC2626' }}>{analytics.sla_breached_count}</div>
              </div>
            </div>
          )}

          {/* Action Bar & Filter Tabs */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              {['All', 'New', 'Assigned', 'In Progress', 'Resolved'].map(st => (
                <button
                  key={st}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '20px',
                    border: 'none',
                    background: selectedStatus === st ? '#0F9F59' : '#F1F5F9',
                    color: selectedStatus === st ? 'white' : '#475569',
                    fontWeight: selectedStatus === st ? 700 : 500,
                    fontSize: '13px',
                    cursor: 'pointer'
                  }}
                  onClick={() => setSelectedStatus(st)}
                >
                  {st}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '10px', border: '1px solid #CBD5E1', background: 'white', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}
                onClick={fetchDashboardData}
              >
                <RefreshCw size={14} /> Refresh
              </button>
              <button 
                style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '10px', border: 'none', background: '#0F172A', color: 'white', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}
                onClick={handleSeedDataset}
              >
                <Database size={14} /> Sync Role Accounts
              </button>
            </div>
          </div>

          {/* Complaints Table */}
          <div style={{ overflowX: 'auto', borderRadius: '16px', border: '1px solid #E2E8F0' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#475569', fontWeight: 700 }}>
                  <th style={{ padding: '14px 16px' }}>Ticket #</th>
                  <th style={{ padding: '14px 16px' }}>Category</th>
                  <th style={{ padding: '14px 16px' }}>Location</th>
                  <th style={{ padding: '14px 16px' }}>Priority</th>
                  <th style={{ padding: '14px 16px' }}>Status</th>
                  <th style={{ padding: '14px 16px' }}>Assigned Crew</th>
                  <th style={{ padding: '14px 16px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredComplaints.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ padding: '24px', textAlign: 'center', color: '#94A3B8' }}>
                      No complaints found in this view.
                    </td>
                  </tr>
                ) : (
                  filteredComplaints.map(c => (
                    <tr key={c.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '14px 16px', fontWeight: 700, color: '#0F172A' }}>{c.ticket_number}</td>
                      <td style={{ padding: '14px 16px' }}>{c.category}</td>
                      <td style={{ padding: '14px 16px', color: '#475569' }}>{c.location}</td>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{ fontWeight: 700, color: c.priority === 'Critical' ? '#DC2626' : c.priority === 'High' ? '#EA580C' : '#059669' }}>
                          {c.priority} ({c.priority_score})
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <span className={`badge-status badge-${c.status.toLowerCase().replace(' ', '-')}`}>
                          {c.status}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px', fontWeight: 600, color: c.assigned_to ? '#0F9F59' : '#94A3B8' }}>
                        {c.assigned_to || 'Unassigned'}
                      </td>
                      <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                          <button
                            style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', background: 'white', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
                            onClick={() => { setAssigningComp(c); setCrewName(c.assigned_to || ''); }}
                          >
                            <UserCheck size={14} style={{ display: 'inline', marginRight: '4px' }} /> Assign
                          </button>
                          <button
                            style={{ padding: '6px 12px', borderRadius: '8px', border: 'none', background: '#0F9F59', color: 'white', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
                            onClick={() => { setUpdatingComp(c); setNextStatus(c.status === 'New' ? 'Assigned' : c.status === 'Assigned' ? 'In Progress' : 'Resolved'); }}
                          >
                            <Edit3 size={14} style={{ display: 'inline', marginRight: '4px' }} /> Status
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Inner Sub-Modal: Assign Field Crew */}
        {assigningComp && (
          <div className="modal-overlay" style={{ zIndex: 1100 }}>
            <div className="modal-card" style={{ maxWidth: '450px' }}>
              <div className="modal-header">
                <h3>Assign Crew: {assigningComp.ticket_number}</h3>
                <button className="btn-close-modal" onClick={() => setAssigningComp(null)}><X size={18} /></button>
              </div>
              <div className="modal-body">
                <form onSubmit={handleAssignCrewSubmit}>
                  <div className="form-group">
                    <label className="form-label">Field Crew / Team Name</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="e.g. Electrical Dept Crew #4"
                      value={crewName}
                      onChange={(e) => setCrewName(e.target.value)}
                      required 
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Note / Instructions</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="e.g. Dispatched for immediate field repair."
                      value={assignNote}
                      onChange={(e) => setAssignNote(e.target.value)}
                    />
                  </div>
                  <button type="submit" className="btn-submit">Save Crew Assignment</button>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Inner Sub-Modal: Update Status */}
        {updatingComp && (
          <div className="modal-overlay" style={{ zIndex: 1100 }}>
            <div className="modal-card" style={{ maxWidth: '450px' }}>
              <div className="modal-header">
                <h3>Update Status: {updatingComp.ticket_number}</h3>
                <button className="btn-close-modal" onClick={() => setUpdatingComp(null)}><X size={18} /></button>
              </div>
              <div className="modal-body">
                <form onSubmit={handleUpdateStatusSubmit}>
                  <div className="form-group">
                    <label className="form-label">Current Status: <strong>{updatingComp.status}</strong></label>
                    <select 
                      className="form-select"
                      value={nextStatus}
                      onChange={(e) => setNextStatus(e.target.value)}
                    >
                      <option value="Assigned">Assigned</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Resolved">Resolved</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Official Status Note</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="e.g. Work completed and site inspected."
                      value={statusNote}
                      onChange={(e) => setStatusNote(e.target.value)}
                    />
                  </div>
                  <button type="submit" className="btn-submit">Update Status</button>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
