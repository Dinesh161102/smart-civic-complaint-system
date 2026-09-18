import React, { useState } from 'react';
import { Megaphone, Search, ArrowRight, Construction, Trash2, Lightbulb, Droplets, MoreHorizontal, Building2, Clock, ShieldCheck } from 'lucide-react';
import civicParkBg from '../assets/civic-park-bg.png';

export default function Hero({ onOpenReport, onOpenTrack }) {
  const categoryShortcuts = [
    { 
      name: 'Pothole', 
      icon: Construction, 
      color: '#2563EB', 
      bg: '#EFF6FF',
      sla: '24-48h',
      dept: 'Roads & Asphalt',
      status: 'Patrol Active',
      desc: 'Crater & road repairs'
    },
    { 
      name: 'Garbage', 
      icon: Trash2, 
      color: '#059669', 
      bg: '#ECFDF5',
      sla: '12-24h',
      dept: 'Sanitation Div.',
      status: 'Daily Clearance',
      desc: 'Bin clearing & dumping'
    },
    { 
      name: 'Streetlight', 
      icon: Lightbulb, 
      color: '#D97706', 
      bg: '#FEF3C7',
      sla: '24h',
      dept: 'Electrical Dept',
      status: 'Night Dispatch',
      desc: 'Dark or broken lamps'
    },
    { 
      name: 'Water Supply', 
      icon: Droplets, 
      color: '#0891B2', 
      bg: '#CFFAFE',
      sla: '6-12h',
      dept: 'Water & Utilities',
      status: 'Rapid Response',
      desc: 'Pipe leaks & pressure'
    },
    { 
      name: 'Others', 
      icon: MoreHorizontal, 
      color: '#4B5563', 
      bg: '#F3F4F6',
      sla: '48h',
      dept: 'Civic Help Desk',
      status: 'Triage Team',
      desc: 'Parks & public assets'
    }
  ];

  const [activeCat, setActiveCat] = useState(categoryShortcuts[0]);

  const ActiveIcon = activeCat.icon;

  return (
    <section className="hero-outer-container">
      {/* Panoramic Civic Park Visual Background Layer */}
      <div className="hero-bg-layer">
        <img 
          src={civicParkBg} 
          alt="Civic Park Skyline Background" 
          className="hero-bg-image" 
        />
        <div className="hero-bg-overlay-mask"></div>
      </div>

      <div className="container hero-container-relative">
        <div className="hero-section">
          {/* Left Content Column */}
          <div className="hero-content fade-in-up">
            <div className="hero-pill-badge">
              <span className="badge-dot"></span>
              Cleaner Communities, Brighter Tomorrows
            </div>
            
            <h1 className="hero-headline">
              Report Today<br />
              for a <span className="headline-highlight">Better Tomorrow</span>
            </h1>

            <p className="hero-subtitle">
              A smarter way to report civic issues, track resolution progress, and work together for cleaner, safer, and healthier neighborhoods.
            </p>

            <div className="hero-cta-group">
              <button className="btn-hero-primary" onClick={onOpenReport}>
                <Megaphone size={19} />
                Report an Issue
                <ArrowRight size={17} />
              </button>
              <button className="btn-hero-secondary" onClick={onOpenTrack}>
                <Search size={17} />
                Track Your Complaint
              </button>
            </div>
          </div>

          {/* Right Visual Phone Mockup Column */}
          <div className="hero-visual-wrapper fade-in-up-delay-1">
            <div className="scene-glow-orb"></div>

            {/* Smartphone Frame Showcase */}
            <div className="phone-mockup">
              <div className="phone-speaker"></div>
              
              <div className="phone-screen">
                {/* Mobile App Header */}
                <div className="phone-screen-bar">
                  <div className="phone-app-brand">
                    <div className="phone-app-logo">
                      <Building2 size={12} />
                    </div>
                    <div className="phone-app-titles">
                      <span className="phone-app-title">Smart Civic</span>
                      <span className="phone-app-subtitle">Issue Explorer</span>
                    </div>
                  </div>
                  <span className="phone-status-dot" title="System Online"></span>
                </div>

                {/* Interactive Category Hover List */}
                <div className="phone-categories-list">
                  {categoryShortcuts.map((cat, idx) => {
                    const IconComponent = cat.icon;
                    const isSelected = activeCat.name === cat.name;
                    return (
                      <div 
                        key={idx} 
                        className={`phone-category-item ${isSelected ? 'active-hover' : ''}`}
                        onMouseEnter={() => setActiveCat(cat)}
                      >
                        <div className="category-icon-badge" style={{ background: cat.bg, color: cat.color }}>
                          <IconComponent size={13} />
                        </div>
                        <span className="category-name">{cat.name}</span>
                        <span className="category-arrow" style={{ opacity: isSelected ? 1 : 0.4 }}>›</span>
                      </div>
                    );
                  })}
                </div>

                {/* Interactive Preview Panel showing on Hover */}
                <div className="phone-preview-card">
                  <div className="phone-preview-header">
                    <div className="phone-preview-badge" style={{ background: activeCat.bg, color: activeCat.color }}>
                      <ActiveIcon size={11} />
                      <span>{activeCat.name}</span>
                    </div>
                    <span className="phone-preview-sla">
                      <Clock size={10} style={{ display: 'inline', marginRight: '2px' }} />
                      {activeCat.sla}
                    </span>
                  </div>
                  <div className="phone-preview-dept">{activeCat.dept}</div>
                  <div className="phone-preview-desc">{activeCat.desc}</div>
                  <div className="phone-preview-status">
                    <ShieldCheck size={11} color="#0F9F59" />
                    <span>{activeCat.status}</span>
                  </div>
                </div>

                <div className="phone-home-indicator"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

