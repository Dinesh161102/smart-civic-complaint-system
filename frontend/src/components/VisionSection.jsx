import React from 'react';
import { Leaf } from 'lucide-react';

export default function VisionSection() {
  return (
    <section className="vision-outer-container">
      {/* Background Organic Wave Layers & Floating Leaves */}
      <div className="vision-waves-bg">
        {/* Floating Green Accent Leaves on Left & Right */}
        <div className="floating-leaf leaf-left">
          <Leaf size={32} />
        </div>
        <div className="floating-leaf leaf-right">
          <Leaf size={32} />
        </div>

        {/* Soft Multi-Layered Organic Green Wave Graphics */}
        <svg className="vision-wave-svg" viewBox="0 0 1440 220" preserveAspectRatio="none" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M0,130 C360,190 720,70 1080,150 C1280,190 1440,120 1440,120 V220 H0 Z" fill="#ECFDF5" fillOpacity="0.8" />
          <path d="M0,160 C480,90 840,210 1440,140 V220 H0 Z" fill="#E6F5ED" fillOpacity="0.95" />
          <path d="M0,180 C360,150 1080,200 1440,170 V220 H0 Z" fill="#D1FAE5" fillOpacity="0.5" />
        </svg>
      </div>

      <div className="container vision-container-relative">
        {/* Centered Green Leaf Divider Line */}
        <div className="vision-leaf-divider">
          <span className="divider-line line-left"></span>
          <div className="leaf-center-badge">
            <Leaf size={20} className="leaf-icon-center" />
          </div>
          <span className="divider-line line-right"></span>
        </div>

        <h3 className="vision-badge-title">OUR VISION</h3>

        <p className="vision-main-subtitle">
          Civic Issues Solved, Communities Strengthened
        </p>
      </div>
    </section>
  );
}
