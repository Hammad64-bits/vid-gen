import React from 'react';
import './Footer.css';

export const Footer: React.FC = () => {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-content">
          <div className="footer-brand">
            <h2 className="footer-logo accent-font">vid<span className="text-gradient">Gen</span></h2>
            <p className="footer-tagline">
              The future of video generation is here. <br/>
              Stop typing scripts, start rendering dreams.
            </p>
          </div>
          <div className="footer-links-group">
            <div className="footer-col">
              <h4 className="footer-col-title">Product</h4>
              <ul className="footer-links">
                <li><a href="#features">Features</a></li>
                <li><a href="#pricing">Pricing</a></li>
                <li><a href="#showcase">Showcase</a></li>
                <li><a href="#api">API</a></li>
              </ul>
            </div>
            <div className="footer-col">
              <h4 className="footer-col-title">Company</h4>
              <ul className="footer-links">
                <li><a href="#about">About</a></li>
                <li><a href="#blog">Blog</a></li>
                <li><a href="#careers">Careers</a></li>
                <li><a href="#contact">Contact</a></li>
              </ul>
            </div>
            <div className="footer-col">
              <h4 className="footer-col-title">Legal</h4>
              <ul className="footer-links">
                <li><a href="#privacy">Privacy</a></li>
                <li><a href="#terms">Terms</a></li>
              </ul>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} vidGen Inc. All rights reserved.</p>
          <div className="social-links">
            <a href="#" className="social-icon">𝕏</a>
            <a href="#" className="social-icon">📸</a>
            <a href="#" className="social-icon">👾</a>
          </div>
        </div>
      </div>
    </footer>
  );
};
