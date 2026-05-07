import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import ComplaintCard from '../components/ComplaintCard';
import MapView from '../components/MapView';
import './Home.css';

const CATEGORIES = ['all', 'road', 'water', 'garbage', 'drainage', 'power', 'other'];
const STATUSES = ['all', 'reported', 'in_progress', 'resolved', 'rejected'];

export default function Home() {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('list');
  const [filters, setFilters] = useState({ category: 'all', status: 'all', wardNumber: '' });
  const [search, setSearch] = useState('');

  useEffect(() => { fetchComplaints(); }, [filters]);

  const fetchComplaints = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.category !== 'all') params.category = filters.category;
      if (filters.status !== 'all') params.status = filters.status;
      if (filters.wardNumber) params.wardNumber = filters.wardNumber;
      const res = await api.get('/complaints', { params });
      setComplaints(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = complaints.filter(c =>
    !search ||
    c.title.toLowerCase().includes(search.toLowerCase()) ||
    (c.address || '').toLowerCase().includes(search.toLowerCase())
  );

  const total      = complaints.length;
  const reported   = complaints.filter(c => c.status === 'reported').length;
  const inProgress = complaints.filter(c => c.status === 'in_progress').length;
  const resolved   = complaints.filter(c => c.status === 'resolved').length;

  return (
    <div className="home-page">
      {/* Hero */}
      <div className="home-hero">
        <div className="container">
          <div className="hero-inner">
            <div className="hero-left">
              <div className="hero-eyebrow">🇮🇳 Civic Platform for Indian Residents</div>
              <h1>Report Local Issues.<br /><span>Hold Your Ward Accountable.</span></h1>
              <p>Report civic problems, upvote community issues, and track resolution progress in your neighbourhood.</p>
              <div className="hero-cta">
                {user ? (
                  <Link to="/create" className="btn btn-primary btn-lg">+ Report an Issue</Link>
                ) : (
                  <>
                    <Link to="/register" className="btn btn-primary btn-lg">Get Started →</Link>
                    <Link to="/heatmap" className="btn btn-outline btn-lg">View Heatmap</Link>
                  </>
                )}
              </div>
            </div>

            <div className="hero-stats">
              <div className="hstat s-orange">
                <span className="hstat-num">{reported}</span>
                <span className="hstat-label">Reported</span>
              </div>
              <div className="hstat s-amber">
                <span className="hstat-num">{inProgress}</span>
                <span className="hstat-label">In Progress</span>
              </div>
              <div className="hstat s-green">
                <span className="hstat-num">{resolved}</span>
                <span className="hstat-label">Resolved</span>
              </div>
              <div className="hstat">
                <span className="hstat-num">{total}</span>
                <span className="hstat-label">Total</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container">
        {/* Filters */}
        <div className="filters-section">
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
              <button className={viewMode === 'map' ? 'active' : ''} onClick={() => setViewMode('map')}>🗺 Map</button>
            </div>
          </div>
        </div>

        {/* Results */}
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
    </div>
  );
}
