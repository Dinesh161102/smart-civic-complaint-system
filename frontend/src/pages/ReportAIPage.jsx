import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Bot, Sparkles, Send, MapPin, ArrowLeft, 
  Check, Edit3, ChevronDown, BarChart2 
} from 'lucide-react';
import { api } from '../services/api';
import reportIssueBg from '../assets/report-issue-bg.png';
import ImageCaptureUpload from '../components/ImageCaptureUpload';

export default function ReportAIPage({ user }) {
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Streetlight');
  const [location, setLocation] = useState('');
  const [urgency, setUrgency] = useState('Medium');
  const [photo, setPhoto] = useState(null);

  const [aiLoading, setAiLoading] = useState(false);
  const [aiSummary, setAiSummary] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleAIClassify = async () => {
    if (!description.trim()) {
      setError('Please type an issue description first before running AI classification.');
      return;
    }
    setError('');
    setAiLoading(true);
    try {
      const res = await api.analyzeComplaint(description);
      if (res.category) setCategory(res.category);
      if (res.urgency) setUrgency(res.urgency);
      if (res.location) {
        setLocation(res.location);
      } else {
        setLocation('');
      }
      if (res.issue || res.summary) setAiSummary(res.issue || res.summary);
    } catch (err) {
      setError('AI backend classification unavailable. Please set fields manually or switch to manual reporting.');
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
        reporting_method: 'AI',
        image_url: photo || undefined,
        photo_url: photo || undefined,
        reporter_name: user?.full_name || undefined,
        reporter_contact: user?.email || undefined,
      };

      await api.createComplaint(payload);
      navigate('/my-complaints');
    } catch (err) {
      setError(err.message || 'Failed to submit complaint ticket.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="report-hub-container">
      {/* Subtle Civic Background Layer */}
      <div className="report-hub-bg-layer">
        <img 
          src={reportIssueBg} 
          alt="Civic Background" 
          className="report-hub-bg-image" 
        />
        <div className="report-hub-bg-overlay"></div>
      </div>

      <div className="container report-manual-content fade-in-up">
        {/* Back to Report Options Button */}
        <button 
          className="report-back-btn" 
          onClick={() => navigate('/report-issue')}
        >
          <ArrowLeft size={16} /> Back to Report Options
        </button>

        {/* Main Form Card */}
        <div className="manual-form-card">
          {/* Card Header Row */}
          <div className="manual-card-header">
            <div className="manual-header-left">
              <div className="ai-header-icon">
                <Bot size={26} color="#2563EB" />
              </div>
              <div>
                <h1 className="manual-header-title">Describe the Issue</h1>
                <p className="manual-header-subtitle">
                  Tell us what happened in your own words. Our AI will identify the category, location, and urgency for you.
                </p>
              </div>
            </div>

            <div className="ai-header-badge">
              <Sparkles size={14} color="#2563EB" />
              <span>AI-Powered</span>
            </div>
          </div>

          {error && (
            <div className="alert alert-error" style={{ marginBottom: '20px' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Describe your issue Field */}
            <div className="manual-form-group" style={{ marginBottom: '12px' }}>
              <label className="manual-field-label">
                Describe your issue
              </label>
              <div className="manual-input-wrapper">
                <textarea 
                  className="manual-textarea-field"
                  rows={4}
                  maxLength={1000}
                  placeholder="E.g. The streetlight near Gate 3 has not been working for three days. It is very dark at night and causing safety issues for pedestrians..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  style={{ paddingLeft: '16px' }}
                  required
                />
                <span className="manual-char-count">{description.length}/1000</span>
              </div>
            </div>

            {/* Analyze with AI Button */}
            <button
              type="button"
              className="btn-ai-analyze"
              onClick={handleAIClassify}
              disabled={aiLoading}
            >
              <Sparkles size={17} />
              {aiLoading ? 'Analyzing with AI...' : 'Analyze with AI →'}
            </button>

            {aiSummary && (
              <div className="alert alert-success" style={{ marginBottom: '20px', fontSize: '13px' }}>
                <strong>AI Summary:</strong> {aiSummary}
              </div>
            )}

            {/* AI Detected Details Box */}
            <div className="ai-detected-card">
              <div className="ai-detected-header">
                <div className="ai-detected-header-left">
                  <div className="ai-check-icon">
                    <Check size={16} strokeWidth={3} />
                  </div>
                  <div>
                    <h3 className="ai-detected-title">AI Detected Details</h3>
                    <p className="ai-detected-subtitle">
                      Review and edit the details identified by AI before submitting.
                    </p>
                  </div>
                </div>

                <button type="button" className="btn-edit-details">
                  <Edit3 size={13} />
                  <span>Edit Details</span>
                </button>
              </div>

              <div className="ai-detected-grid">
                {/* Issue Category */}
                <div className="manual-form-group" style={{ marginBottom: 0 }}>
                  <label className="manual-field-label" style={{ fontSize: '12.5px', marginBottom: '6px' }}>
                    Issue Category
                  </label>
                  <div className="manual-input-wrapper">
                    <MapPin className="manual-input-icon" size={16} />
                    <select 
                      className="manual-select-field"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      style={{ height: '42px', fontSize: '13.5px', paddingLeft: '38px' }}
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

                {/* Location / Address */}
                <div className="manual-form-group" style={{ marginBottom: 0 }}>
                  <label className="manual-field-label" style={{ fontSize: '12.5px', marginBottom: '6px' }}>
                    Location / Address
                  </label>
                  <div className="manual-input-wrapper">
                    <MapPin className="manual-input-icon" size={16} />
                    <input 
                      type="text"
                      className="manual-input-field"
                      placeholder="Gate 3, Anna Nagar"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      style={{ height: '42px', fontSize: '13.5px', paddingLeft: '38px' }}
                      required
                    />
                  </div>
                </div>

                {/* Urgency Level */}
                <div className="manual-form-group" style={{ marginBottom: 0 }}>
                  <label className="manual-field-label" style={{ fontSize: '12.5px', marginBottom: '6px' }}>
                    Urgency Level
                  </label>
                  <div className="manual-input-wrapper">
                    <BarChart2 className="manual-input-icon" size={16} />
                    <select 
                      className="manual-select-field"
                      value={urgency}
                      onChange={(e) => setUrgency(e.target.value)}
                      style={{ height: '42px', fontSize: '13.5px', paddingLeft: '38px' }}
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
            </div>

            {/* Photo / Camera Attachment */}
            <ImageCaptureUpload
              value={photo}
              onChange={setPhoto}
              label="Attach Issue Photo / Evidence (Optional)"
              helperText="Provide a clear photo of the civic problem by uploading a file or capturing live with your camera."
            />

            {/* Submit Button */}
            <button 
              type="submit" 
              className="btn-manual-submit" 
              disabled={loading}
            >
              <Send size={18} />
              {loading ? 'Submitting Ticket...' : 'Submit Complaint Ticket'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

