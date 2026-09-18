import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FileText, List, MapPin, Edit3, Flag, 
  Bot, MessageSquare, Sparkles, CheckCircle, Send, 
  ArrowRight, Leaf 
} from 'lucide-react';
import reportIssueBg from '../assets/report-issue-bg.png';

export default function ReportIssuePage() {
  const navigate = useNavigate();

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

      <div className="container report-hub-content">
        {/* Top Header Section Matching Reference */}
        <div className="report-hub-header fade-in-up">
          <div className="report-pill-badge">
            <Leaf size={14} color="#0F9F59" style={{ display: 'inline', marginRight: '6px' }} />
            <span>CLEANER STREETS • SAFER NEIGHBORHOODS • STRONGER COMMUNITIES</span>
          </div>

          <h1 className="report-hub-title">
            Report a <span className="title-highlight">Civic Issue</span>
          </h1>
          <p className="report-hub-subtitle">Choose how you would like to report your issue.</p>
        </div>

        {/* 2 Clean Side-by-Side Cards Grid */}
        <div className="report-hub-grid fade-in-up-delay-1">
          {/* Card 1: Report Manually */}
          <div className="report-card report-card-green">
            <div>
              {/* Header with Icon & Tag */}
              <div className="card-header-row">
                <div className="card-icon-circle circle-green">
                  <FileText size={24} color="#059669" />
                </div>
                <span className="card-tag-badge tag-green">
                  Recommended if you know the details
                </span>
              </div>

              <h2 className="report-card-title">Report Manually</h2>
              <p className="report-card-desc">
                Fill in the complaint form yourself with the details you know.
              </p>

              {/* 2-Column Body: Steps on Left, Graphic on Right */}
              <div className="card-body-layout">
                <ul className="report-step-list">
                  <li>
                    <div className="step-icon-bg bg-green">
                      <List size={14} color="#059669" />
                    </div>
                    <span>Select category</span>
                  </li>
                  <li>
                    <div className="step-icon-bg bg-green">
                      <MapPin size={14} color="#059669" />
                    </div>
                    <span>Add location</span>
                  </li>
                  <li>
                    <div className="step-icon-bg bg-green">
                      <Edit3 size={14} color="#059669" />
                    </div>
                    <span>Write a description</span>
                  </li>
                  <li>
                    <div className="step-icon-bg bg-green">
                      <Flag size={14} color="#059669" />
                    </div>
                    <span>Set priority</span>
                  </li>
                </ul>

                {/* Right Illustration: Paper & Green Pencil Graphic */}
                <div className="card-graphic-wrapper">
                  <div className="paper-graphic">
                    <div className="paper-line long"></div>
                    <div className="paper-line medium"></div>
                    <div className="paper-line long"></div>
                    <div className="paper-line short"></div>
                    <div className="pencil-graphic"></div>
                  </div>
                </div>
              </div>
            </div>

            <button 
              className="btn-report-card btn-card-green"
              onClick={() => navigate('/report-issue/manual')}
            >
              Report Manually <ArrowRight size={17} />
            </button>
          </div>

          {/* Card 2: Describe the Issue (AI) */}
          <div className="report-card report-card-blue">
            <div>
              {/* Header with Robot Icon & Tag */}
              <div className="card-header-row">
                <div className="card-icon-circle circle-blue">
                  <Bot size={26} color="#2563EB" />
                </div>
                <span className="card-tag-badge tag-blue">
                  Try AI if you're not sure
                </span>
              </div>

              <h2 className="report-card-title">Describe the Issue</h2>
              <p className="report-card-desc">
                Just tell us what happened in your own words and let our AI assist you.
              </p>

              {/* 2-Column Body: Steps on Left, Speech Bubble Graphic on Right */}
              <div className="card-body-layout">
                <ul className="report-step-list">
                  <li>
                    <div className="step-icon-bg bg-blue">
                      <MessageSquare size={14} color="#2563EB" />
                    </div>
                    <span>Describe your problem</span>
                  </li>
                  <li>
                    <div className="step-icon-bg bg-blue">
                      <Sparkles size={14} color="#2563EB" />
                    </div>
                    <span>AI helps identify category and location</span>
                  </li>
                  <li>
                    <div className="step-icon-bg bg-blue">
                      <CheckCircle size={14} color="#2563EB" />
                    </div>
                    <span>Review and confirm</span>
                  </li>
                  <li>
                    <div className="step-icon-bg bg-blue">
                      <Send size={14} color="#2563EB" />
                    </div>
                    <span>Submit your complaint</span>
                  </li>
                </ul>

                {/* Right Illustration: Speech Bubble Quote Graphic */}
                <div className="card-graphic-wrapper">
                  <div className="ai-speech-bubble">
                    “The streetlight near my house hasn't worked for a week.”
                    <div className="speech-tail"></div>
                  </div>
                </div>
              </div>
            </div>

            <button 
              className="btn-report-card btn-card-blue"
              onClick={() => navigate('/report-issue/ai')}
            >
              Describe with AI <ArrowRight size={17} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
