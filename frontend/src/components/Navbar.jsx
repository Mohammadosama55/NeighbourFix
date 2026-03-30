import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    setMenuOpen(false);
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="navbar">
      <div className="container navbar-inner">
        <Link to="/" className="navbar-brand">
          <span className="brand-icon">📍</span>
          <span>NeighbourFix</span>
        </Link>

        <button className="menu-toggle" onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? '✕' : '☰'}
        </button>

        <div className={`navbar-links ${menuOpen ? 'open' : ''}`}>
          <Link to="/" className={isActive('/') ? 'active' : ''} onClick={() => setMenuOpen(false)}>Complaints</Link>
          <Link to="/heatmap" className={isActive('/heatmap') ? 'active' : ''} onClick={() => setMenuOpen(false)}>Heatmap</Link>

          {user ? (
            <>
              {user.role === 'resident' && (
                <Link to="/create" className={`btn btn-primary btn-sm ${isActive('/create') ? 'active' : ''}`} onClick={() => setMenuOpen(false)}>
                  + Report Issue
                </Link>
              )}
              {user.role === 'ward_admin' && (
                <Link to="/admin" className={`btn btn-secondary btn-sm ${isActive('/admin') ? 'active' : ''}`} onClick={() => setMenuOpen(false)}>
                  Dashboard
                </Link>
              )}
              <div className="user-menu">
                <Link to="/profile" className="user-avatar" onClick={() => setMenuOpen(false)}>
                  {user.name.charAt(0).toUpperCase()}
                </Link>
                <div className="user-dropdown">
                  <div className="user-info">
                    <strong>{user.name}</strong>
                    <span>{user.role === 'ward_admin' ? 'Ward Admin' : 'Resident'}</span>
                  </div>
                  <Link to="/profile" onClick={() => setMenuOpen(false)}>Profile</Link>
                  <button onClick={handleLogout}>Logout</button>
                </div>
              </div>
            </>
          ) : (
            <>
              <Link to="/login" className={isActive('/login') ? 'active' : ''} onClick={() => setMenuOpen(false)}>Login</Link>
              <Link to="/register" className="btn btn-primary btn-sm" onClick={() => setMenuOpen(false)}>Sign Up</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
