import React from 'react';
import Hero from '../components/Hero';
import FeatureCards from '../components/FeatureCards';
import VisionSection from '../components/VisionSection';
import { useNavigate } from 'react-router-dom';

export default function HomePage() {
  const navigate = useNavigate();

  return (
    <main>
      <Hero 
        onOpenReport={() => navigate('/report-issue')}
        onOpenTrack={() => navigate('/my-complaints')}
      />

      <FeatureCards 
        onOpenReport={() => navigate('/report-issue')}
        onOpenTrack={() => navigate('/my-complaints')}
      />

      <VisionSection />
    </main>
  );
}
