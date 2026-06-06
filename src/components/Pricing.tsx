import React from 'react';
import { Section } from './Section';
import './Pricing.css';

export const Pricing: React.FC = () => {
  return (
    <Section id="pricing" className="pricing-section">
      <div className="pricing-header">
        <h2 className="section-title">
          Simple <span className="accent-font highlight">Pricing</span>
        </h2>
        <p className="section-subtitle">
          Start for free. Upgrade when you need more power.
        </p>
      </div>

      <div className="pricing-grid">
        {/* Basic Tier */}
        <div className="pricing-card glass-panel">
          <h3 className="pricing-tier">Starter</h3>
          <div className="pricing-price">
            <span className="currency">$</span>0<span className="period">/mo</span>
          </div>
          <ul className="pricing-features">
            <li>✓ 10 generations per month</li>
            <li>✓ 720p export quality</li>
            <li>✓ Standard rendering speed</li>
            <li>✓ Community support</li>
          </ul>
          <button className="btn btn-outline btn-full">Get Started</button>
        </div>

        {/* Pro Tier */}
        <div className="pricing-card pro-card glass-panel">
          <div className="popular-badge accent-font">Most Popular</div>
          <h3 className="pricing-tier">Creator Pro</h3>
          <div className="pricing-price">
            <span className="currency">$</span>29<span className="period">/mo</span>
          </div>
          <ul className="pricing-features">
            <li>✓ Unlimited generations</li>
            <li>✓ 4K export quality</li>
            <li>✓ Priority rendering speed</li>
            <li>✓ Custom aspect ratios</li>
            <li>✓ Priority email support</li>
          </ul>
          <button className="btn btn-primary btn-full">Upgrade to Pro</button>
        </div>
      </div>
    </Section>
  );
};
