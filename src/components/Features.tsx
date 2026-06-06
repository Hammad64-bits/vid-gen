import React from 'react';
import { Section } from './Section';
import './Features.css';

const features = [
  {
    title: "AI-Powered Generation",
    description: "Describe what you want to see, and our advanced models will generate high-fidelity video in seconds.",
    icon: "✨"
  },
  {
    title: "Infinite Styles",
    description: "From realistic cinematic shots to 3D animation and anime, generate videos in any style imaginable.",
    icon: "🎨"
  },
  {
    title: "Seamless Editing",
    description: "Refine your generations with prompt-based editing. No complex timelines or keyframes needed.",
    icon: "✂️"
  },
  {
    title: "Instant Export",
    description: "Render in up to 4K resolution and export directly to your favorite social platforms.",
    icon: "🚀"
  }
];

export const Features: React.FC = () => {
  return (
    <Section id="features" className="features-section">
      <div className="features-header">
        <h2 className="section-title">
          Features that feel like <span className="text-gradient">Cheating</span>
        </h2>
        <p className="section-subtitle">
          Everything you need to create professional videos without the professional budget.
        </p>
      </div>

      <div className="features-grid">
        {features.map((feature, index) => (
          <div key={index} className="feature-card glass-panel">
            <div className="feature-icon">{feature.icon}</div>
            <h3 className="feature-title">{feature.title}</h3>
            <p className="feature-description">{feature.description}</p>
          </div>
        ))}
      </div>
    </Section>
  );
};
