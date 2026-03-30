import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import MapView from '../components/MapView';
import './HeatmapPage.css';

const STATUS_COLORS = {
  reported: '#ef4444',
  in_progress: '#f59e0b',
  resolved: '#10b981',
  rejected: '#6b7280',
};

const STATUS_LABELS = {
  reported: 'Reported',
  in_progress: 'In Progress',
  resolved: 'Resolved',
  rejected: 'Rejected',
};

const CATEGORY_EMOJIS = { road: '🛣️', water: '💧', garbage: '🗑️', drainage: '🚿', power: '⚡', other: '📋' };

export default function HeatmapPage() {
  const [heatmap, setHeatmap] = useState({});
  const [complaints, setComplaints] = useState([]);
  const [categoryStats, setCategoryStats] = useState({});
  const [wardStats, setWardStats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/complaints/heatmap'),
      api.get('/complaints'),
    ]).then(([hmRes, cRes]) => {
      setHeatmap(hmRes.data.heatmap);
      const all = cRes.data;
      setComplaints(all);

      const catMap = {};
      const wardMap = {};
      all.forEach(c => {
        catMap[c.category] = (catMap[c.category] || 0) + 1;
        wardMap[c.wardNumber] = wardMap[c.wardNumber] || { total: 0, resolved: 0 };
        wardMap[c.wardNumber].total++;
        if (c.status === 'resolved') wardMap[c.wardNumber].resolved++;
      });
      setCategoryStats(catMap);
      const wards = Object.entries(wardMap).map(([num, data]) => ({
        num, ...data, rate: data.total ? Math.round((data.resolved / data.total) * 100) : 0,
      })).sort((a, b) => b.total - a.total).slice(0, 10);
      setWardStats(wards);
    }).finally(() => setLoading(false));
  }, []);

  const total = Object.values(heatmap).reduce((a, b) => a + b, 0);
  const resolvedPct = total ? Math.round(((heatmap.resolved || 0) / total) * 100) : 0;

  if (loading) return <div className="loading-page"><div className="spinner spinner-dark"></div><p>Loading heatmap…</p></div>;

  return (
    <div className="heatmap-page">
      <div className="container">
        <div className="heatmap-header">
          <div>
            <h1 className="page-title">🗺 Public Accountability Heatmap</h1>
            <p className="heatmap-sub">Civic transparency — see how your ward is performing</p>
          </div>
        </div>

        <div className="hm-stats-row">
          {Object.entries(STATUS_LABELS).map(([key, label]) => (
            <div key={key} className="hm-stat" style={{ borderTopColor: STATUS_COLORS[key] }}>
              <span>{heatmap[key] || 0}</span>
              <label>{label}</label>
              {total > 0 && <div className="hm-bar"><div style={{ width: `${((heatmap[key] || 0) / total) * 100}%`, background: STATUS_COLORS[key] }}></div></div>}
            </div>
          ))}
        </div>

        <div className="resolution-banner">
          <div className="res-circle" style={{ '--pct': `${resolvedPct}%` }}>
            <span>{resolvedPct}%</span>
          </div>
          <div>
            <h2>Resolution Rate</h2>
            <p>{heatmap.resolved || 0} out of {total} complaints have been resolved</p>
            {resolvedPct >= 70 ? (
              <span className="perf-good">✅ Great civic performance!</span>
            ) : resolvedPct >= 40 ? (
              <span className="perf-avg">⚠️ Moderate performance — room to improve</span>
            ) : (
              <span className="perf-bad">🚨 Low resolution rate — needs attention</span>
            )}
          </div>
        </div>

        <div className="hm-grid">
          <div className="card">
            <h2 className="section-title">📊 Issues by Category</h2>
            <div className="cat-bars">
              {Object.entries(categoryStats).sort((a, b) => b[1] - a[1]).map(([cat, count]) => (
                <div key={cat} className="cat-row">
                  <span className="cat-label">{CATEGORY_EMOJIS[cat]} {cat}</span>
                  <div className="cat-bar-wrap">
                    <div className="cat-bar" style={{ width: `${(count / Math.max(...Object.values(categoryStats))) * 100}%` }}></div>
                  </div>
                  <span className="cat-count">{count}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <h2 className="section-title">🏘 Ward Performance (Top 10)</h2>
            <div className="ward-list">
              {wardStats.length === 0 ? (
                <p style={{ color: 'var(--muted)', fontSize: 14 }}>No ward data available</p>
              ) : wardStats.map(w => (
                <div key={w.num} className="ward-row">
                  <div className="ward-info">
                    <strong>Ward {w.num}</strong>
                    <span>{w.resolved}/{w.total} resolved</span>
                  </div>
                  <div className="ward-bar-wrap">
                    <div className="ward-bar" style={{ width: `${w.rate}%`, background: w.rate >= 70 ? '#10b981' : w.rate >= 40 ? '#f59e0b' : '#ef4444' }}></div>
                  </div>
                  <span className="ward-rate" style={{ color: w.rate >= 70 ? '#10b981' : w.rate >= 40 ? '#f59e0b' : '#ef4444' }}>{w.rate}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="card" style={{ marginTop: 24 }}>
          <h2 className="section-title">🗺 All Complaints on Map</h2>
          <div className="map-legend">
            {Object.entries(STATUS_COLORS).map(([s, c]) => (
              <span key={s} className="legend-item">
                <span className="legend-dot" style={{ background: c }}></span>
                {STATUS_LABELS[s]}
              </span>
            ))}
          </div>
          <div style={{ marginTop: 14 }}>
            <MapView complaints={complaints} height="440px" />
          </div>
        </div>
      </div>
    </div>
  );
}
