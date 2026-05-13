import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './SOSModal.css';

const EMERGENCY_NUMBERS = [
  { number: '112', label: 'All Emergencies', desc: 'Police · Ambulance · Fire', icon: '🆘', primary: true },
  { number: '100', label: 'Police',          desc: 'Report crime or violence',  icon: '👮' },
  { number: '108', label: 'Ambulance',       desc: 'Medical emergency',         icon: '🚑' },
  { number: '101', label: 'Fire Brigade',    desc: 'Fire & rescue services',    icon: '🚒' },
  { number: '1091', label: 'Women Helpline', desc: '24/7 women in distress',    icon: '🤝' },
  { number: '1800111565', label: 'Disaster Mgmt', desc: 'NDRF national helpline', icon: '⚠️' },
];

export default function SOSModal({ open, onClose }) {
  const [copied, setCopied] = useState('');

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    if (open) document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const handleCopy = (num) => {
    navigator.clipboard.writeText(num).then(() => {
      setCopied(num);
      setTimeout(() => setCopied(''), 2000);
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="sos-modal" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>✕</button>

        <div className="sos-header">
          <div className="sos-pulse-ring">
            <span className="sos-header-icon">🆘</span>
          </div>
          <h2>Emergency Helplines</h2>
          <p>India — tap any number to call directly</p>
        </div>

        <div className="sos-numbers">
          {EMERGENCY_NUMBERS.map(({ number, label, desc, icon, primary }) => (
            <div key={number} className={`sos-card ${primary ? 'sos-primary' : ''}`}>
              <div className="sos-card-left">
                <span className="sos-icon">{icon}</span>
                <div className="sos-info">
                  <span className="sos-label">{label}</span>
                  <span className="sos-desc">{desc}</span>
                </div>
              </div>
              <div className="sos-card-right">
                <a href={`tel:${number}`} className="sos-call-btn">
                  📞 {number}
                </a>
                <button
                  className="sos-copy-btn"
                  onClick={() => handleCopy(number)}
                  title="Copy number"
                >
                  {copied === number ? '✓' : '⎘'}
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="sos-divider">
          <span>For non-emergency civic issues</span>
        </div>

        <div className="sos-report-block">
          <div className="sos-report-text">
            <strong>Report a Civic Issue</strong>
            <p>Broken roads, power outages, drainage — report and track resolution.</p>
          </div>
          <Link to="/create" className="sos-report-btn" onClick={onClose}>
            + Report Issue
          </Link>
        </div>
      </div>
    </div>
  );
}
