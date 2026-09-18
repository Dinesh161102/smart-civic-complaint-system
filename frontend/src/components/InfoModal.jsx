import React from 'react';
import { X, Building2, CheckCircle2, ShieldCheck, Phone, Mail, MapPin } from 'lucide-react';

export default function InfoModal({ isOpen, type = 'about', onClose }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-card">
        <div className="modal-header">
          <h2>
            {type === 'about' && 'About Smart Civic'}
            {type === 'how' && 'How Smart Civic Works'}
            {type === 'services' && 'Municipal Civic Services'}
            {type === 'contact' && 'Contact Support & City Hall'}
          </h2>
          <button className="btn-close-modal" onClick={onClose}><X size={20} /></button>
        </div>

        <div className="modal-body" style={{ lineHeight: '1.6', color: '#334155' }}>
          {type === 'about' && (
            <div>
              <p style={{ marginBottom: '16px' }}>
                <strong>Smart Civic</strong> is a state-of-the-art municipal issue reporting platform engineered to empower citizens and streamline municipal operations.
              </p>
              <p style={{ marginBottom: '16px' }}>
                By connecting citizens directly with municipal officers and field teams, we ensure rapid resolution of road potholes, broken streetlights, water pipe bursts, garbage accumulation, and drainage issues.
              </p>
              <div style={{ background: '#ECFDF5', padding: '16px', borderRadius: '12px', border: '1px solid #A7F3D0', color: '#065F46' }}>
                <strong>Our Mission:</strong> Report Today for a Better Tomorrow — building cleaner, safer, and healthier communities together.
              </div>
            </div>
          )}

          {type === 'how' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#0F9F59', color: 'white', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>1</div>
                <div>
                  <h4 style={{ fontWeight: 700, color: '#0F172A', marginBottom: '2px' }}>Report an Issue</h4>
                  <p style={{ fontSize: '14px' }}>Citizens submit complaints with location, photos, and optional AI description auto-classification.</p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#0F9F59', color: 'white', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>2</div>
                <div>
                  <h4 style={{ fontWeight: 700, color: '#0F172A', marginBottom: '2px' }}>Priority & SLA Scoring</h4>
                  <p style={{ fontSize: '14px' }}>The system calculates real-time priority scores based on urgency, age, category risk, and geographic clusters.</p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#0F9F59', color: 'white', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>3</div>
                <div>
                  <h4 style={{ fontWeight: 700, color: '#0F172A', marginBottom: '2px' }}>Field Crew Dispatch</h4>
                  <p style={{ fontSize: '14px' }}>Municipal officers assign specialized field crews and update ticket status through the linear state machine.</p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#0F9F59', color: 'white', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>4</div>
                <div>
                  <h4 style={{ fontWeight: 700, color: '#0F172A', marginBottom: '2px' }}>Verified Resolution</h4>
                  <p style={{ fontSize: '14px' }}>Work is completed, verified on site, and ticket is marked RESOLVED with full audit trail logs.</p>
                </div>
              </div>
            </div>
          )}

          {type === 'services' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div style={{ padding: '14px', background: '#F8FAFC', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                <h4 style={{ color: '#0F9F59', fontWeight: 700, marginBottom: '4px' }}>🛣️ Roads & Potholes</h4>
                <p style={{ fontSize: '13px' }}>Repairs for deep crater potholes, damaged asphalt, and road hazards.</p>
              </div>
              <div style={{ padding: '14px', background: '#F8FAFC', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                <h4 style={{ color: '#0F9F59', fontWeight: 700, marginBottom: '4px' }}>💡 Electrical & Streetlights</h4>
                <p style={{ fontSize: '13px' }}>Replacement of dark, flickering, or damaged lamp post fixtures.</p>
              </div>
              <div style={{ padding: '14px', background: '#F8FAFC', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                <h4 style={{ color: '#0F9F59', fontWeight: 700, marginBottom: '4px' }}>🗑️ Garbage & Sanitation</h4>
                <p style={{ fontSize: '13px' }}>Overflowing bin collection, illegal dumping, and public cleanliness.</p>
              </div>
              <div style={{ padding: '14px', background: '#F8FAFC', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                <h4 style={{ color: '#0F9F59', fontWeight: 700, marginBottom: '4px' }}>💧 Water & Drainage</h4>
                <p style={{ fontSize: '13px' }}>Main pipe burst repairs, storm drain unclogging, and flood control.</p>
              </div>
            </div>
          )}

          {type === 'contact' && (
            <div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Phone size={20} color="#0F9F59" />
                  <div>
                    <div style={{ fontSize: '12px', color: '#64748B' }}>24/7 Helpline</div>
                    <div style={{ fontWeight: 700, color: '#0F172A' }}>311 (Civic Hotline) / +1-800-CIVIC-GOV</div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Mail size={20} color="#0F9F59" />
                  <div>
                    <div style={{ fontSize: '12px', color: '#64748B' }}>Email Support</div>
                    <div style={{ fontWeight: 700, color: '#0F172A' }}>support@civic.gov</div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <MapPin size={20} color="#0F9F59" />
                  <div>
                    <div style={{ fontSize: '12px', color: '#64748B' }}>City Hall Address</div>
                    <div style={{ fontWeight: 700, color: '#0F172A' }}>100 Municipal Plaza, City Hall Complex</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
