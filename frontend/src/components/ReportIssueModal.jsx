import React, { useState, useEffect } from 'react';
import { X, Sparkles, Send, MapPin, AlertCircle, CheckCircle } from 'lucide-react';
import { api } from '../services/api';

export default function ReportIssueModal({ isOpen, initialCategory = 'Streetlight', onClose, onSuccess, user }) {
  const [category, setCategory] = useState(initialCategory);
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [urgency, setUrgency] = useState('Medium');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSummary, setAiSummary] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successTicket, setSuccessTicket] = useState(null);

  useEffect(() => {
    if (initialCategory) {
      setCategory(initialCategory);
    }
  }, [initialCategory]);

  if (!isOpen) return null;

  const handleAIClassify = async () => {
    if (!description.trim()) {
      setError('Please type a description first to run AI classification.');
      return;
    }
    setError('');
    setAiLoading(true);
    try {
      const res = await api.classifyAI(description);
      if (res.category) setCategory(res.category);
      if (res.urgency) setUrgency(res.urgency);
      if (res.location && !location) setLocation(res.location);
      if (res.summary) setAiSummary(res.summary);
    } catch (err) {
      setError('AI classification unavailable. Please set fields manually.');
    } finally {
      setAiLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const payload = {
        category,
        description,
        location,
        urgency,
        reporting_method: 'Manual',
        reporter_name: user?.full_name || undefined,
        reporter_contact: user?.email || undefined,
      };
      const res = await api.createComplaint(payload);
      setSuccessTicket(res.ticket_number);
      if (onSuccess) onSuccess(res);
    } catch (err) {
      setError(err.message || 'Failed to submit complaint. Make sure you are logged in.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setDescription('');
    setLocation('');
    setUrgency('Medium');
    setAiSummary('');
    setError('');
    setSuccessTicket(null);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-card">
        <div className="modal-header">
          <h2>Report a Civic Issue</h2>
          <button className="btn-close-modal" onClick={() => { resetForm(); onClose(); }}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          {successTicket ? (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ width: '64px', height: '64px', background: '#D1FAE5', color: '#059669', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto' }}>
                <CheckCircle size={36} />
              </div>
              <h3 style={{ fontSize: '22px', fontWeight: 800, color: '#0F172A', marginBottom: '8px' }}>Complaint Submitted!</h3>
              <p style={{ fontSize: '15px', color: '#475569', marginBottom: '20px' }}>Your issue has been registered under ticket number:</p>
              <div style={{ background: '#F8FAFC', border: '1px dashed #0F9F59', padding: '12px 24px', borderRadius: '12px', fontSize: '20px', fontWeight: 800, color: '#0F9F59', display: 'inline-block', marginBottom: '24px' }}>
                {successTicket}
              </div>
              <p style={{ fontSize: '13px', color: '#64748B', marginBottom: '24px' }}>
                Initial Status: <strong>NEW</strong>. Municipal officers have been notified for priority assignment.
              </p>
              <button 
                className="btn-submit" 
                onClick={() => { resetForm(); onClose(); }}
              >
                Done
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {error && (
                <div style={{ padding: '12px 16px', background: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626', borderRadius: '10px', fontSize: '14px', marginBottom: '20px' }}>
                  {error}
                </div>
              )}

              {/* Category Selector */}
              <div className="form-group">
                <label className="form-label">Issue Category</label>
                <select 
                  className="form-select"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  required
                >
                  <option value="Streetlight">Streetlight</option>
                  <option value="Pothole / Road">Pothole / Road</option>
                  <option value="Garbage / Sanitation">Garbage / Sanitation</option>
                  <option value="Water Supply">Water Supply</option>
                  <option value="Sewage / Drainage">Sewage / Drainage</option>
                  <option value="Other">Other Civic Issue</option>
                </select>
              </div>

              {/* Description Input */}
              <div className="form-group">
                <label className="form-label">Description of Issue</label>
                <textarea 
                  className="form-textarea"
                  rows={4}
                  placeholder="Describe the issue in detail (e.g. Streetlight non-functional near Gate 3 for a week...)"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                />
                
                <button
                  type="button"
                  className="btn-ai-classify"
                  onClick={handleAIClassify}
                  disabled={aiLoading}
                >
                  <Sparkles size={14} color="#0F9F59" />
                  {aiLoading ? 'AI Analyzing...' : '✨ Auto-Classify with AI'}
                </button>
              </div>

              {aiSummary && (
                <div style={{ padding: '12px 16px', background: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: '10px', fontSize: '13px', color: '#065F46', marginBottom: '20px' }}>
                  <strong>AI Summary:</strong> {aiSummary}
                </div>
              )}

              {/* Location Input */}
              <div className="form-group">
                <label className="form-label">Location / Address</label>
                <input 
                  type="text"
                  className="form-input"
                  placeholder="e.g. Gate 3, Central Park West & 72nd St"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  required
                />
              </div>

              {/* Urgency Input */}
              <div className="form-group">
                <label className="form-label">Urgency Level</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                  {['Low', 'Medium', 'High', 'Critical'].map((level) => (
                    <button
                      key={level}
                      type="button"
                      style={{
                        padding: '10px',
                        borderRadius: '10px',
                        border: urgency === level ? '2px solid #0F9F59' : '1.5px solid #CBD5E1',
                        background: urgency === level ? '#E6F5ED' : 'white',
                        color: urgency === level ? '#0F9F59' : '#475569',
                        fontWeight: urgency === level ? 700 : 500,
                        cursor: 'pointer',
                        fontSize: '13px'
                      }}
                      onClick={() => setUrgency(level)}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>

              <button type="submit" className="btn-submit" disabled={loading} style={{ marginTop: '24px' }}>
                <Send size={18} />
                {loading ? 'Submitting...' : 'Submit Complaint Ticket'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
