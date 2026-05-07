import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/'); setMenuOpen(false); };
  const isActive = (path) => location.pathname === path;
  const close = () => setMenuOpen(false);

  const handleComplaintsClick = (e) => {
    e.preventDefault();
    close();
    if (location.pathname === '/') {
      document.getElementById('complaints')?.scrollIntoView({ behavior: 'instant', block: 'start' });
    } else {
      navigate('/');
      setTimeout(() => {
        document.getElementById('complaints')?.scrollIntoView({ behavior: 'instant', block: 'start' });
      }, 350);
    }
  };

  return (
    <nav className="navbar">
      <div className="navbar-inner">

        {/* LEFT: Brand */}
        <Link to="/" className="navbar-brand" onClick={close}>
          <div className="brand-logo">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
            </svg>
          </div>
          <span className="brand-name">NeighbourFix</span>
        </Link>

        {/* HAMBURGER */}
        <button className="menu-toggle" onClick={() => setMenuOpen(!menuOpen)} aria-label="Menu">
          {menuOpen ? '✕' : '☰'}
        </button>

        {/* CENTER: Main nav links */}
        <div className={`navbar-center ${menuOpen ? 'open' : ''}`}>
          <a href="/#complaints" className={`nav-link ${isActive('/') ? 'active' : ''}`} onClick={handleComplaintsClick}>Complaints</a>
          <Link to="/heatmap" className={`nav-link ${isActive('/heatmap') ? 'active' : ''}`} onClick={close}>Heatmap</Link>
          <a href="#about" className="nav-link" onClick={close}>About</a>
          {user?.role === 'ward_admin' && (
            <Link to="/admin" className={`nav-link ${isActive('/admin') ? 'active' : ''}`} onClick={close}>Dashboard</Link>
          )}
        </div>

        {/* RIGHT: Actions */}
        <div className={`navbar-right ${menuOpen ? 'open' : ''}`}>
          <a href="mailto:feedback@neighbourfix.in" className="nav-link feedback-link" onClick={close}>Feedback</a>
          <a href="tel:112" className="sos-btn" onClick={close}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
            SOS
          </a>

          {user ? (
            <>
              {user.role === 'resident' && (
                <Link to="/create" className="btn btn-primary btn-sm" onClick={close}>+ Report Issue</Link>
              )}
              <div className="user-menu">
                <Link to="/profile" className="user-avatar" onClick={close} title={user.name}>
                  {user.name.charAt(0).toUpperCase()}
                </Link>
                <div className="user-dropdown">
                  <div className="user-info">
                    <strong>{user.name}</strong>
                    <span>{user.role === 'ward_admin' ? 'Ward Admin' : 'Resident'}</span>
                  </div>
                  <Link to="/profile" onClick={close}>Profile</Link>
                  <button onClick={handleLogout}>Logout</button>
                </div>
              </div>
            </>
          ) : (
            <>
              <Link to="/login" className={`nav-link ${isActive('/login') ? 'active' : ''}`} onClick={close}>Login</Link>
              <Link to="/register" className="btn btn-primary btn-sm" onClick={close}>Sign Up</Link>
            </>
          )}
        </div>

      </div>
    </nav>
  );
}
