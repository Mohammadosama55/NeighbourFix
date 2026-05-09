import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import ComplaintCard from '../components/ComplaintCard';
import MapView from '../components/MapView';
import './Complaints.css';

const CATEGORIES = ['all', 'road', 'water', 'garbage', 'drainage', 'power', 'other'];
const STATUSES   = ['all', 'reported', 'in_progress', 'resolved', 'rejected'];

export default function Complaints() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();

  const initialWard = searchParams.get('ward') || '';

  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [viewMode, setViewMode]     = useState('list');
  const [filters, setFilters]       = useState({
    category: 'all',
    status: 'all',
    wardNumber: initialWard,
  });
  const [search, setSearch] = useState('');

  useEffect(() => { fetchComplaints(); }, [filters]);

  const fetchComplaints = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.category   !== 'all') params.category   = filters.category;
      if (filters.status     !== 'all') params.status     = filters.status;
      if (filters.wardNumber)           params.wardNumber = filters.wardNumber;
      const res = await api.get('/complaints', { params });
      setComplaints(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const clearWardFilter = () => setFilters(f => ({ ...f, wardNumber: '' }));

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
    <div className="complaints-page">

      {/* ── PAGE HEADER ── */}
      <div className="cp-header">
        <div className="container">
          <div className="cp-header-inner">
            <div className="cp-header-text">
              <p className="section-eyebrow">Live Reports</p>
              <h1>
                {filters.wardNumber
                  ? <>Issues in <span>Ward {filters.wardNumber}</span></>
                  : 'All Civic Complaints'}
              </h1>
              <p className="cp-sub">
                Real complaints filed by residents across wards — filtered, searchable, and updated live.
              </p>
            </div>

            <div className="cp-header-actions">
              {user ? (
                <Link to="/create" className="btn-primary-lg">+ Report an Issue</Link>
              ) : (
                <Link to="/register" className="btn-primary-lg">Sign Up to Report</Link>
              )}
            </div>
          </div>

          {/* Stats strip */}
          <div className="cp-stats">
            <div className="cp-stat s-orange">
              <span className="cp-stat-num">{reported}</span>
              <span className="cp-stat-lbl">Reported</span>
            </div>
            <div className="cp-stat s-amber">
              <span className="cp-stat-num">{inProgress}</span>
              <span className="cp-stat-lbl">In Progress</span>
            </div>
            <div className="cp-stat s-green">
              <span className="cp-stat-num">{resolved}</span>
              <span className="cp-stat-lbl">Resolved</span>
            </div>
            <div className="cp-stat">
              <span className="cp-stat-num">{total}</span>
              <span className="cp-stat-lbl">Total</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── BODY ── */}
      <div className="cp-body container">

        {/* Filters */}
        <div className="filters-bar">
          <div className="search-wrap">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input
              className="search-input"
              placeholder="Search complaints…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          <select className="filter-select" value={filters.category}
            onChange={e => setFilters({ ...filters, category: e.target.value })}>
            {CATEGORIES.map(c => (
              <option key={c} value={c}>
                {c === 'all' ? 'All Categories' : c.charAt(0).toUpperCase() + c.slice(1)}
              </option>
            ))}
          </select>

          <select className="filter-select" value={filters.status}
            onChange={e => setFilters({ ...filters, status: e.target.value })}>
            {STATUSES.map(s => (
              <option key={s} value={s}>
                {s === 'all' ? 'All Statuses' : s.replace('_', ' ')}
              </option>
            ))}
          </select>

          <div className="ward-filter-wrap">
            <input
              className="ward-input"
              placeholder="Ward #"
              value={filters.wardNumber}
              onChange={e => setFilters({ ...filters, wardNumber: e.target.value })}
            />
            {filters.wardNumber && (
              <button className="ward-clear-x" onClick={clearWardFilter} title="Clear ward filter">✕</button>
            )}
          </div>

          <div className="view-toggle">
            <button className={viewMode === 'list' ? 'active' : ''} onClick={() => setViewMode('list')}>☰ List</button>
            <button className={viewMode === 'map'  ? 'active' : ''} onClick={() => setViewMode('map')}>🗺 Map</button>
          </div>
        </div>

        {/* Active ward tag */}
        {filters.wardNumber && (
          <div className="ward-active-banner">
            <span>📍 Showing complaints in <strong>Ward {filters.wardNumber}</strong></span>
            <button onClick={clearWardFilter}>Clear ✕</button>
          </div>
        )}

        {/* Results */}
        {viewMode === 'map' ? (
          <div className="map-wrapper">
            <MapView complaints={filtered} height="540px" />
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
                {user && <Link to="/create" className="btn-primary-lg" style={{ marginTop: 16, display: 'inline-flex' }}>+ Report an Issue</Link>}
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
