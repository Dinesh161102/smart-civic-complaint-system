import React from 'react';
import { FileText, MapPin, Users } from 'lucide-react';

export default function FeatureCards({ onOpenReport, onOpenTrack }) {
  return (
    <section className="container features-section">
      <div className="features-grid">
        {/* Card 1: Submit a Complaint */}
        <div className="feature-card card-blue" onClick={onOpenReport} style={{ cursor: 'pointer' }}>
          <div className="feature-icon-circle">
            <FileText size={26} />
          </div>
          <div className="feature-card-content">
            <h3>Submit a Complaint</h3>
            <p>Report civic issues with description, location and photos.</p>
          </div>
        </div>

        {/* Card 2: Track Progress */}
        <div className="feature-card card-green" onClick={onOpenTrack} style={{ cursor: 'pointer' }}>
          <div className="feature-icon-circle">
            <MapPin size={26} />
          </div>
          <div className="feature-card-content">
            <h3>Track Progress</h3>
            <p>Stay updated on the status of your complaints.</p>
          </div>
        </div>

        {/* Card 3: Cleaner Communities */}
        <div className="feature-card card-orange">
          <div className="feature-icon-circle">
            <Users size={26} />
          </div>
          <div className="feature-card-content">
            <h3>Cleaner Communities</h3>
            <p>Together we build healthier and better neighborhoods.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
