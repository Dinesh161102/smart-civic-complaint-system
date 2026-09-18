import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Send, MapPin, ArrowLeft, FileText, ChevronDown, 
  Leaf, Lock, Crosshair 
} from 'lucide-react';
import { api } from '../services/api';
import reportIssueBg from '../assets/report-issue-bg.png';
import ImageCaptureUpload from '../components/ImageCaptureUpload';

export default function ReportManualPage({ user }) {
  const [category, setCategory] = useState('Streetlight');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [urgency, setUrgency] = useState('Medium');
  const [photo, setPhoto] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleUseLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setLocation(`Lat: ${latitude.toFixed(4)}, Long: ${longitude.toFixed(4)} (Current Location)`);
        },
        () => {
          setError('Could not retrieve GPS coordinates. Please enter your location manually.');
        }
      );
    } else {
      setError('Geolocation is not supported by your browser. Please enter your location manually.');
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
              <div className="manual-header-icon">
                <FileText size={24} color="#0F9F59" />
              </div>
              <div>
                <h1 className="manual-header-title">Manual Issue Report</h1>
                <p className="manual-header-subtitle">
                  Fill in the details below to submit your complaint.
                </p>
              </div>
            </div>

            <div className="manual-header-badge">
              <Leaf size={14} color="#047857" />
              <span>Help us make our city better</span>
            </div>
          </div>

          {error && (
            <div className="alert alert-error" style={{ marginBottom: '20px' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Grid Row: Issue Category & Urgency Level */}
            <div className="manual-form-grid">
              {/* Category Dropdown */}
              <div className="manual-form-group">
                <label className="manual-field-label">
                  Issue Category <span className="required-star">*</span>
                </label>
                <div className="manual-input-wrapper">
                  <MapPin className="manual-input-icon" size={18} />
                  <select 
                    className="manual-select-field"
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
                  <ChevronDown className="manual-select-chevron" size={18} />
                </div>
              </div>

              {/* Urgency Level Buttons */}
              <div className="manual-form-group">
                <label className="manual-field-label">
                  Urgency Level <span className="required-star">*</span>
                </label>
                <div className="urgency-btn-grid">
                  {['Low', 'Medium', 'High', 'Critical'].map((level) => (
                    <button
                      key={level}
                      type="button"
                      className={`urgency-btn ${urgency === level ? 'active' : ''}`}
                      onClick={() => setUrgency(level)}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Issue Description Field */}
            <div className="manual-form-group">
              <label className="manual-field-label">
                Issue Description <span className="required-star">*</span>
              </label>
              <div className="manual-input-wrapper">
                <FileText className="manual-input-icon" size={18} style={{ top: '14px' }} />
                <textarea 
                  className="manual-textarea-field"
                  rows={4}
                  maxLength={500}
                  placeholder="Describe the issue in detail (e.g. Streetlight out near Gate 3 for 3 days...)"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                />
                <span className="manual-char-count">{description.length}/500</span>
              </div>
            </div>

            {/* Location / Address Field */}
            <div className="manual-form-group">
              <label className="manual-field-label">
                Location / Address <span className="required-star">*</span>
              </label>
              <div className="location-input-flex">
                <div className="manual-input-wrapper" style={{ flex: 1 }}>
                  <MapPin className="manual-input-icon" size={18} />
                  <input 
                    type="text"
                    className="manual-input-field"
                    placeholder="e.g. 5th Avenue & 42nd St near Metro Entrance"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    required
                  />
                </div>
                <button 
                  type="button" 
                  className="btn-use-location"
                  onClick={handleUseLocation}
                >
                  <Crosshair size={16} color="#0F9F59" />
                  <span>Use My Location</span>
                </button>
              </div>

              <div className="manual-info-notice">
                <MapPin size={15} color="#0F9F59" style={{ flexShrink: 0 }} />
                <span>Provide the exact location so we can assign the right team.</span>
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

            {/* Lock Footer Note */}
            <div className="manual-form-footer-note">
              <Lock size={13} color="#64748B" />
              <span>Your information is safe and will be used to resolve the issue.</span>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

