import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import ComplaintCard from '../components/ComplaintCard';
import MapView from '../components/MapView';
import './Home.css';

const CATEGORIES = ['all', 'road', 'water', 'garbage', 'drainage', 'power', 'other'];
const STATUSES   = ['all', 'reported', 'in_progress', 'resolved', 'rejected'];
const CAT_ICONS  = { road:'🛣️', water:'💧', garbage:'🗑️', drainage:'🚿', power:'⚡', other:'📋' };
const HERO_IMAGE = 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?auto=format&fit=crop&w=900&q=80';

export default function Home() {
  const { user } = useAuth();
  const complaintsRef = useRef(null);

  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [viewMode, setViewMode]     = useState('list');
  const [filters, setFilters]       = useState({ category: 'all', status: 'all', wardNumber: '' });
  const [search, setSearch]         = useState('');
  const [wardInput, setWardInput]   = useState('');

  useEffect(() => { fetchComplaints(); }, [filters]);

  const fetchComplaints = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.category !== 'all') params.category = filters.category;
      if (filters.status   !== 'all') params.status   = filters.status;
      if (filters.wardNumber)         params.wardNumber = filters.wardNumber;
      const res = await api.get('/complaints', { params });
      setComplaints(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // "Check My Area" — apply ward filter and scroll to complaints
  const handleWardSearch = (e) => {
    e.preventDefault();
    const ward = wardInput.trim();
    if (!ward) return;
    setFilters(f => ({ ...f, wardNumber: ward }));
    setTimeout(() => {
      complaintsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 80);
  };

  const clearWardFilter = () => {
    setWardInput('');
    setFilters(f => ({ ...f, wardNumber: '' }));
  };

  const filtered = complaints.filter(c =>
    !search ||
    c.title.toLowerCase().includes(search.toLowerCase()) ||
    (c.address || '').toLowerCase().includes(search.toLowerCase())
  );

  // Live feed: 3 most recently resolved complaints
  const allComplaints = complaints.length === 0 ? [] : complaints;
  const liveFeed = [...allComplaints]
    .filter(c => c.status === 'resolved')
    .slice(0, 3);

  const total      = complaints.length;
  const reported   = complaints.filter(c => c.status === 'reported').length;
  const inProgress = complaints.filter(c => c.status === 'in_progress').length;
  const resolved   = complaints.filter(c => c.status === 'resolved').length;

  return (
    <div className="home-page">

      {/* ══════════════════════════
          STEP 1 — HERO (The Vision)
         ══════════════════════════ */}
      <section className="home-hero">
        <div className="container">
          <div className="hero-inner">

            <div className="hero-left">
              <div className="hero-eyebrow">🇮🇳 Civic Platform for Indian Residents</div>

              <h1>
                Report Local Issues.<br />
                <span>Make Your City Better.</span>
              </h1>

              <p className="hero-sub">
                NeighbourFix helps citizens report and track local civic issues like potholes, broken lights, and garbage collection. Join thousands making their communities better.
              </p>

              <div className="hero-cta">
                {user ? (
                  <Link to="/create" className="btn-primary-lg">Get Started →</Link>
                ) : (
                  <>
                    <Link to="/register" className="btn-primary-lg">Get Started →</Link>
                    <a href="#how-it-works" className="btn-outline-lg">
                      <span className="play-icon">▶</span>
                      Watch Demo
                    </a>
                  </>
                )}
              </div>

              <div className="hero-social-proof">
                <div className="stars">
                  <span className="star full">★</span><span className="star full">★</span>
                  <span className="star full">★</span><span className="star full">★</span>
                  <span className="star half">★</span>
                </div>
                <span className="proof-text"><strong>4.8/5</strong> from 2,500+ users</span>
              </div>

              {/* ── LIVE FEED ── */}
              {liveFeed.length > 0 && (
                <div className="live-feed">
                  <div className="live-feed-header">
                    <span className="live-feed-dot"></span>
                    <span className="live-feed-label">Recently Resolved</span>
                  </div>
                  <div className="live-feed-cards">
                    {liveFeed.map(c => {
                      const daysAgo = Math.floor((Date.now() - new Date(c.createdAt)) / 86400000);
                      const timeStr = daysAgo === 0 ? 'Today' : daysAgo === 1 ? 'Yesterday' : `${daysAgo}d ago`;
                      return (
                        <Link key={c._id} to={`/complaint/${c._id}`} className="lf-card">
                          <span className="lf-icon">{CAT_ICONS[c.category] || '📋'}</span>
                          <div className="lf-body">
                            <span className="lf-title">{c.title}</span>
                            <span className="lf-meta">Ward {c.wardNumber} · {timeStr}</span>
                          </div>
                          <span className="lf-check">✓</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="hero-right">
              <div className="hero-img-wrap">
                <img src={HERO_IMAGE} alt="City skyline — NeighbourFix civic platform" loading="eager" />
                <div className="live-demo-badge">
                  <span className="live-dot"></span>
                  Live Demo
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ══════════════════════════
          STEP 2 — HOW IT WORKS
         ══════════════════════════ */}
      <section id="how-it-works" className="how-section">
        <div className="container">
          <div className="how-header">
            <p className="section-eyebrow">How It Works</p>
            <h2>Three steps to fix your neighbourhood</h2>
            <p className="section-sub">No paperwork. No queues. Just report and watch it get resolved.</p>
          </div>

          <div className="how-steps">
            <div className="how-step">
              <div className="step-num">1</div>
              <div className="step-icon">📍</div>
              <h3>Pin It</h3>
              <p>Take a photo and drop a GPS pin on the map. Your report is logged instantly with full location data.</p>
            </div>
            <div className="how-connector">→</div>
            <div className="how-step">
              <div className="step-num">2</div>
              <div className="step-icon">▲</div>
              <h3>Rally Votes</h3>
              <p>Neighbours upvote issues they care about. 10 upvotes triggers an automatic escalation to your ward officer.</p>
            </div>
            <div className="how-connector">→</div>
            <div className="how-step">
              <div className="step-num">3</div>
              <div className="step-icon">✅</div>
              <h3>Watch It Get Fixed</h3>
              <p>Track status updates in real time. When resolved, you get notified and the ward's accountability score updates.</p>
            </div>
          </div>

          {/* ── CHECK MY AREA HOOK ── */}
          <div className="ward-hook">
            <div className="ward-hook-content">
              <div className="ward-hook-icon">🔍</div>
              <div>
                <h3>Check Your Area</h3>
                <p>Enter your ward number to instantly see all civic issues reported near you.</p>
              </div>
            </div>
            <form className="ward-hook-form" onSubmit={handleWardSearch}>
              <input
                type="text"
                className="ward-hook-input"
                placeholder="Enter Ward # (e.g. 16)"
                value={wardInput}
                onChange={e => setWardInput(e.target.value)}
              />
              <button type="submit" className="ward-hook-btn">
                See Issues Near Me →
              </button>
            </form>
            {filters.wardNumber && (
              <div className="ward-active-tag">
                Filtered: Ward {filters.wardNumber}
                <button onClick={clearWardFilter}>✕ Clear</button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ══════════════════════════
          STEP 3 — LIVE DATA
         ══════════════════════════ */}
      <div className="stats-bar">
        <div className="stats-bar-inner">
          <div className="sbar-item s-orange">
            <span className="sbar-num">{reported}</span>
            <span className="sbar-label">Reported</span>
          </div>
          <div className="sbar-item s-amber">
            <span className="sbar-num">{inProgress}</span>
            <span className="sbar-label">In Progress</span>
          </div>
          <div className="sbar-item s-green">
            <span className="sbar-num">{resolved}</span>
            <span className="sbar-label">Resolved</span>
          </div>
          <div className="sbar-item">
            <span className="sbar-num">{total}</span>
            <span className="sbar-label">Total Issues</span>
          </div>
        </div>
      </div>

      {/* ══════════════════════════
          STEP 4 — COMPLAINTS LIST
         ══════════════════════════ */}
      <section id="complaints" ref={complaintsRef} className="complaints-dedicated">
        <div className="complaints-section-intro">
          <p className="section-eyebrow">Live Reports</p>
          <h2>
            {filters.wardNumber
              ? <>Issues in <span className="ward-highlight">Ward {filters.wardNumber}</span></>
              : 'All Civic Complaints'}
          </h2>
          <p className="section-sub">
            Real complaints filed by residents across wards — filtered, searchable, and updated live.
          </p>
          {filters.wardNumber && (
            <button className="clear-ward-btn" onClick={clearWardFilter}>Clear Ward filter ✕</button>
          )}
        </div>

        <div className="complaints-section-body">
        <div className="filters-bar">
          <div className="search-wrap">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input className="search-input" placeholder="Search complaints…"
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>

          <select className="filter-select" value={filters.category}
            onChange={e => setFilters({ ...filters, category: e.target.value })}>
            {CATEGORIES.map(c => (
              <option key={c} value={c}>{c === 'all' ? 'All Categories' : c.charAt(0).toUpperCase() + c.slice(1)}</option>
            ))}
          </select>

          <select className="filter-select" value={filters.status}
            onChange={e => setFilters({ ...filters, status: e.target.value })}>
            {STATUSES.map(s => (
              <option key={s} value={s}>{s === 'all' ? 'All Statuses' : s.replace('_', ' ')}</option>
            ))}
          </select>

          <input className="ward-input" placeholder="Ward #"
            value={filters.wardNumber}
            onChange={e => setFilters({ ...filters, wardNumber: e.target.value })} />

          <div className="view-toggle">
            <button className={viewMode === 'list' ? 'active' : ''} onClick={() => setViewMode('list')}>☰ List</button>
            <button className={viewMode === 'map'  ? 'active' : ''} onClick={() => setViewMode('map')}>🗺 Map</button>
          </div>
        </div>

        {viewMode === 'map' ? (
          <div className="map-wrapper">
            <MapView complaints={filtered} height="520px" />
            <p className="map-hint">{filtered.length} complaints shown on map</p>
          </div>
        ) : (
          <>
            <div className="results-header">
              <p className="results-count">
                Showing <strong>{filtered.length}</strong> complaint{filtered.length !== 1 ? 's' : ''}
              </p>
            </div>
            {loading ? (
              <div className="loading-page">
                <div className="spinner spinner-dark"></div>
                <p>Loading complaints…</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="empty-state">
                <div style={{ fontSize: 52, marginBottom: 14 }}>📭</div>
                <h3>No complaints found</h3>
                <p>Try adjusting your filters or be the first to report an issue in your ward.</p>
              </div>
            ) : (
              <div className="complaints-grid">
                {filtered.map(c => <ComplaintCard key={c._id} complaint={c} />)}
              </div>
            )}
          </>
        )}
        </div>
      </section>

      {/* ── ABOUT SECTION ── */}
      <section id="about" className="about-section">
        <div className="about-inner">
          <p className="about-label">About NeighbourFix</p>
          <h2>Making civic accountability<br />accessible to everyone</h2>
          <p>We built NeighbourFix so every resident has a voice. Report issues, rally community upvotes, and watch your ward authorities respond — all in one transparent platform.</p>
          <div className="about-features">
            <div className="about-feat">
              <div className="about-feat-icon">📍</div>
              <h3>GPS-Pinned Reports</h3>
              <p>Pin the exact location of any issue on an interactive map so authorities know precisely where to act.</p>
            </div>
            <div className="about-feat">
              <div className="about-feat-icon">▲</div>
              <h3>Community Upvoting</h3>
              <p>Neighbours upvote issues they care about. High-priority complaints auto-escalate to ward officers at 10 votes.</p>
            </div>
            <div className="about-feat">
              <div className="about-feat-icon">📊</div>
              <h3>Ward Heatmap</h3>
              <p>A public accountability dashboard showing resolution rates ward-by-ward.</p>
            </div>
            <div className="about-feat">
              <div className="about-feat-icon">📧</div>
              <h3>Auto Escalation</h3>
              <p>When an issue reaches the threshold, a formal PDF complaint letter is emailed directly to your ward officer.</p>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
