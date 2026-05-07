import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

export default function Footer() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (email) { setSubscribed(true); setEmail(''); }
  };

  return (
    <footer className="site-footer">
      <div className="footer-main">
        <div className="footer-container">

          {/* Brand col */}
          <div className="footer-brand-col">
            <Link to="/" className="footer-brand">
              <div className="footer-logo">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                </svg>
              </div>
              <span>NeighbourFix</span>
            </Link>
            <p className="footer-tagline">
              Empowering Indian residents to report civic issues and hold ward authorities accountable.
            </p>
            <div className="footer-contact">
              <a href="mailto:hello@neighbourfix.in">hello@neighbourfix.in</a>
              <a href="tel:112" className="sos-small">🚨 Emergency: 112</a>
            </div>
          </div>

          {/* Nav cols */}
          <div className="footer-nav-col">
            <h4>Platform</h4>
            <Link to="/">Browse Complaints</Link>
            <Link to="/heatmap">Ward Heatmap</Link>
            <Link to="/create">Report Issue</Link>
            <a href="#about">About</a>
          </div>

          <div className="footer-nav-col">
            <h4>Account</h4>
            <Link to="/login">Sign In</Link>
            <Link to="/register">Create Account</Link>
            <Link to="/profile">My Profile</Link>
            <a href="mailto:feedback@neighbourfix.in">Feedback</a>
          </div>

          {/* Newsletter */}
          <div className="footer-newsletter-col">
            <h4>Stay Updated</h4>
            <p>Get notified about new civic developments in your ward.</p>
            {subscribed ? (
              <div className="subscribed-msg">
                ✅ You're subscribed! We'll keep you updated.
              </div>
            ) : (
              <form className="newsletter-form" onSubmit={handleSubscribe}>
                <input
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
                <button type="submit">Subscribe</button>
              </form>
            )}
            <p className="newsletter-note">No spam. Unsubscribe anytime.</p>
          </div>

        </div>
      </div>

      <div className="footer-bottom">
        <div className="footer-container footer-bottom-inner">
          <span>© {new Date().getFullYear()} NeighbourFix. All rights reserved.</span>
          <div className="footer-bottom-links">
            <a href="#about">Privacy Policy</a>
            <a href="#about">Terms of Service</a>
            <a href="tel:112" className="footer-sos">🚨 SOS</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
