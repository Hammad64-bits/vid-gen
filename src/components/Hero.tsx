import React from 'react';
import trippyVideo from '../assets/videos/trippy.mp4';
import './Hero.css';

export const Hero: React.FC = () => {
  return (
    <section className="hero">
      <video 
        autoPlay 
        loop 
        muted 
        playsInline 
        className="hero-video"
      >
        <source src={trippyVideo} type="video/mp4" />
      </video>
      <div className="hero-overlay"></div>
      
      <div className="container hero-content">
        <h1 className="hero-title">
          Create <span className="text-gradient">Magic</span> <br />
          with AI Video.
        </h1>
        <p className="hero-subtitle">
          Turn your wildest ideas into stunning visuals in seconds. <br/>
          No <span className="accent-font highlight">studio</span> required.
        </p>
        <div className="hero-actions">
          <button className="btn btn-primary btn-lg">Start Creating</button>
          <button className="btn btn-outline btn-lg glass-btn">Watch Demo</button>
        </div>
      </div>
    </section>
  );
};
