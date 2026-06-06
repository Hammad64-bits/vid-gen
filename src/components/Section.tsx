import React from 'react';
import './Section.css';

interface SectionProps {
  children: React.ReactNode;
  className?: string;
  id?: string;
}

export const Section: React.FC<SectionProps> = ({ children, className = '', id }) => {
  return (
    <section id={id} className={`section ${className}`}>
      <div className="container">
        {children}
      </div>
    </section>
  );
};
