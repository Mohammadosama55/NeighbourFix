import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import ComplaintCard from '../components/ComplaintCard';
import MapView from '../components/MapView';
import './Home.css';

const CATEGORIES = ['all', 'road', 'water', 'garbage', 'drainage', 'power', 'other'];
const STATUSES = ['all', 'reported', 'in_progress', 'resolved', 'rejected'];

export default function Home() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('list');
  const [filters, setFilters] = useState({ category: 'all', status: 'all', wardNumber: '' });
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchComplaints();
  }, [filters]);

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
    !search || c.title.toLowerCase().includes(search.toLowerCase()) ||
    (c.address || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="home-page">
      <div className="container">
        <div className="home-hero">
          <div>
            <h1>Civic Complaints</h1>
            <p>Report and track local issues in your neighbourhood</p>
          </div>
          <div className="stats-row">
            <div className="stat-chip">
              <span>{complaints.filter(c => c.status === 'reported').length}</span>
              <label>Reported</label>
            </div>
            <div className="stat-chip in-progress">
              <span>{complaints.filter(c => c.status === 'in_progress').length}</span>
              <label>In Progress</label>
            </div>
            <div className="stat-chip resolved">
              <span>{complaints.filter(c => c.status === 'resolved').length}</span>
              <label>Resolved</label>
            </div>
          </div>
        </div>

        <div className="filters-bar">
          <input
            className="search-input"
            placeholder="🔍 Search complaints..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <select value={filters.category} onChange={e => setFilters({ ...filters, category: e.target.value })}>
            {CATEGORIES.map(c => <option key={c} value={c}>{c === 'all' ? 'All Categories' : c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
          </select>
          <select value={filters.status} onChange={e => setFilters({ ...filters, status: e.target.value })}>
            {STATUSES.map(s => <option key={s} value={s}>{s === 'all' ? 'All Statuses' : s.replace('_', ' ')}</option>)}
          </select>
          <input
            className="ward-input"
            placeholder="Ward #"
            value={filters.wardNumber}
            onChange={e => setFilters({ ...filters, wardNumber: e.target.value })}
          />
          <div className="view-toggle">
            <button className={viewMode === 'list' ? 'active' : ''} onClick={() => setViewMode('list')}>☰ List</button>
            <button className={viewMode === 'map' ? 'active' : ''} onClick={() => setViewMode('map')}>🗺 Map</button>
          </div>
        </div>

        {viewMode === 'map' ? (
          <div className="map-wrapper">
            <MapView complaints={filtered} height="520px" />
            <p className="map-hint">{filtered.length} complaints shown on map</p>
          </div>
        ) : (
          <>
            {loading ? (
              <div className="loading-page">
                <div className="spinner spinner-dark"></div>
                <p>Loading complaints…</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="empty-state">
                <div style={{ fontSize: 48, marginBottom: 12 }}>📭</div>
                <h3>No complaints found</h3>
                <p>Try adjusting your filters or be the first to report an issue.</p>
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
