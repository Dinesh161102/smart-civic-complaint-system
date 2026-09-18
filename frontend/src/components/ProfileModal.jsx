import React from 'react';
import { X, User, Mail, Shield, Building, CheckCircle, Award, Calendar, LogOut } from 'lucide-react';

export default function ProfileModal({ isOpen, onClose, user, onLogout }) {
  if (!isOpen || !user) return null;

  const roleName = user.role || 'Citizen';
  const roleLower = roleName.toLowerCase();
  
  const getRoleBadge = () => {
    if (roleLower.includes('officer')) {
      return { bg: '#EBF5FF', color: '#1E40AF', border: '#BFDBFE', label: 'Municipal Officer' };
    }
    if (roleLower === 'crew') {
      return { bg: '#F3E8FF', color: '#7E22CE', border: '#E9D5FF', label: 'Field Operations Crew' };
    }
    return { bg: '#ECFDF5', color: '#065F46', border: '#A7F3D0', label: 'Verified Citizen' };
  };

  const getDepartmentInfo = () => {
    if (roleLower.includes('officer')) {
      return 'Municipal Administration • Public Works & Urban Infrastructure';
    }
    if (roleLower === 'crew') {
      return user.assigned_team || user.assignedTeam || 'Electrical Team - North Zone (ID: CREW-101)';
    }
    return 'Civic Resident • Smart City Community Member';
  };

  const badge = getRoleBadge();
  const initials = (user.full_name || 'U')
    .split(' ')
    .map(n => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  return (
    <div className="modal-overlay" style={{ zIndex: 1200 }} onClick={onClose}>
      <div 
        className="modal-card" 
        style={{ maxWidth: '440px', padding: 0, overflow: 'hidden', borderRadius: '18px' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Header Banner */}
        <div style={{
          background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
          padding: '24px 24px 20px 24px',
          color: '#FFFFFF',
          position: 'relative'
        }}>
          <button 
            onClick={onClose}
            style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              background: 'rgba(255, 255, 255, 0.12)',
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              cursor: 'pointer'
            }}
          >
            <X size={18} />
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '16px',
              background: '#059669',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px',
              fontWeight: 800,
              boxShadow: '0 4px 12px rgba(5, 150, 105, 0.4)'
            }}>
              {initials}
            </div>

            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 4px 0', color: '#FFFFFF' }}>
                {user.full_name || 'User Profile'}
              </h2>
              <span style={{
                display: 'inline-block',
                background: badge.bg,
                color: badge.color,
                border: `1px solid ${badge.border}`,
                padding: '2px 8px',
                borderRadius: '6px',
                fontSize: '11.5px',
                fontWeight: 700
              }}>
                {badge.label}
              </span>
            </div>
          </div>
        </div>

        {/* Modal Body / Profile Details */}
        <div style={{ padding: '22px 24px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* Email */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '10px 14px',
              background: '#F8FAFC',
              borderRadius: '10px',
              border: '1px solid #E2E8F0'
            }}>
              <Mail size={16} color="#64748B" style={{ flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 600, textTransform: 'uppercase' }}>
                  Email Address
                </div>
                <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#0F172A' }}>
                  {user.email || 'N/A'}
                </div>
              </div>
            </div>

            {/* Department / Assigned Role Details */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '10px 14px',
              background: '#F8FAFC',
              borderRadius: '10px',
              border: '1px solid #E2E8F0'
            }}>
              <Building size={16} color="#64748B" style={{ flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 600, textTransform: 'uppercase' }}>
                  Department / Assignment
                </div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A' }}>
                  {getDepartmentInfo()}
                </div>
              </div>
            </div>

            {/* Account Status */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 14px',
              background: '#F0FDF4',
              borderRadius: '10px',
              border: '1px solid #DCFCE7'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle size={16} color="#059669" />
                <span style={{ fontSize: '12.5px', fontWeight: 700, color: '#166534' }}>
                  Account Status: Active & Verified
                </span>
              </div>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#059669' }} />
            </div>
          </div>

          {/* Action Row */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '22px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '9px 24px',
                borderRadius: '8px',
                border: 'none',
                background: '#0F172A',
                color: '#FFFFFF',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 2px 6px rgba(15, 23, 42, 0.15)'
              }}
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
