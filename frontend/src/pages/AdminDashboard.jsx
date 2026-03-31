import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import './AdminDashboard.css';

const STATUSES = ['reported', 'in_progress', 'resolved', 'rejected'];
const categoryEmoji = { road: '🛣️', water: '💧', garbage: '🗑️', drainage: '🚿', power: '⚡', other: '📋' };

export default function AdminDashboard() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: 'all', category: 'all' });
  const [updating, setUpdating] = useState(null);
  const [resolveModal, setResolveModal] = useState(null);
  const [resolveData, setResolveData] = useState({ notes: '', photos: [] });
  const [resolving, setResolving] = useState(false);
  const [emailTest, setEmailTest] = useState({ loading: false, result: null, error: null });

  useEffect(() => { fetchComplaints(); }, [filters]);

  const fetchComplaints = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.status !== 'all') params.status = filters.status;
      if (filters.category !== 'all') params.category = filters.category;
      const res = await api.get('/complaints', { params });
      setComplaints(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id, status) => {
    setUpdating(id);
    try {
      await api.put(`/complaints/${id}/status`, { status });
      setComplaints(prev => prev.map(c => c._id === id ? { ...c, status } : c));
    } catch (err) {
      alert(err.response?.data?.message || 'Update failed');
    } finally {
      setUpdating(null);
    }
  };

  const handleResolve = async () => {
    setResolving(true);
    const data = new FormData();
    data.append('resolutionNotes', resolveData.notes);
    resolveData.photos.forEach(p => data.append('resolutionPhotos', p));
    try {
      await api.post(`/complaints/${resolveModal}/resolve`, data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setComplaints(prev => prev.map(c => c._id === resolveModal ? { ...c, status: 'resolved', resolutionNotes: resolveData.notes } : c));
      setResolveModal(null);
      setResolveData({ notes: '', photos: [] });
    } catch (err) {
      alert(err.response?.data?.message || 'Resolve failed');
    } finally {
      setResolving(false);
    }
  };

  const handleTestEmail = async () => {
    setEmailTest({ loading: true, result: null, error: null });
    try {
      const res = await api.post('/complaints/admin/test-email');
      setEmailTest({ loading: false, result: res.data, error: null });
    } catch (err) {
      setEmailTest({ loading: false, result: null, error: err.response?.data?.message || 'Failed to send test email' });
    }
  };

  const stats = {
    total: complaints.length,
    reported: complaints.filter(c => c.status === 'reported').length,
    in_progress: complaints.filter(c => c.status === 'in_progress').length,
    resolved: complaints.filter(c => c.status === 'resolved').length,
    escalated: complaints.filter(c => c.escalated).length,
  };

  return (
    <div className="admin-page">
      <div className="container">
        <h1 className="page-title">🛡️ Ward Admin Dashboard</h1>

        <div className="admin-stats">
          <div className="admin-stat"><span>{stats.total}</span><label>Total</label></div>
          <div className="admin-stat danger"><span>{stats.reported}</span><label>Reported</label></div>
          <div className="admin-stat warning"><span>{stats.in_progress}</span><label>In Progress</label></div>
          <div className="admin-stat success"><span>{stats.resolved}</span><label>Resolved</label></div>
          <div className="admin-stat escalated"><span>{stats.escalated}</span><label>Escalated</label></div>
        </div>

        {/* Email Configuration Panel */}
        <div className="email-config-panel">
          <div className="email-config-info">
            <div className="email-config-icon">📧</div>
            <div>
              <h3>Escalation Email</h3>
              <p>Complaints auto-escalate via email when they reach <strong>10 upvotes</strong>. Send a test to verify your email configuration is working.</p>
            </div>
          </div>
          <div className="email-config-actions">
            <button
              className="btn btn-test-email"
              onClick={handleTestEmail}
              disabled={emailTest.loading}
            >
              {emailTest.loading
                ? <><span className="spinner"></span> Sending…</>
                : '🔔 Send Test Email'}
            </button>
            {emailTest.result && (
              <div className="email-result success">
                ✅ Test email sent to <strong>{emailTest.result.sentTo}</strong>
              </div>
            )}
            {emailTest.error && (
              <div className="email-result error">
                ❌ {emailTest.error}
              </div>
            )}
          </div>
        </div>

        <div className="admin-filters">
          <select value={filters.status} onChange={e => setFilters({ ...filters, status: e.target.value })}>
            <option value="all">All Statuses</option>
            {STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
          </select>
          <select value={filters.category} onChange={e => setFilters({ ...filters, category: e.target.value })}>
            <option value="all">All Categories</option>
            {['road','water','garbage','drainage','power','other'].map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {loading ? (
          <div className="loading-page"><div className="spinner spinner-dark"></div><p>Loading…</p></div>
        ) : complaints.length === 0 ? (
          <div className="empty-state"><div style={{ fontSize: 48 }}>📭</div><h3>No complaints found</h3></div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Complaint</th>
                  <th>Category</th>
                  <th>Ward</th>
                  <th>Upvotes</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {complaints.map(c => (
                  <tr key={c._id} className={c.escalated ? 'escalated-row' : ''}>
                    <td>
                      <div className="comp-title">{c.title}</div>
                      <div className="comp-date">{new Date(c.createdAt).toLocaleDateString('en-IN')}
                        {c.escalated && <span className="esc-tag">🚨 Escalated</span>}
                      </div>
                    </td>
                    <td><span className={`badge badge-${c.category}`}>{categoryEmoji[c.category]} {c.category}</span></td>
                    <td>{c.wardNumber}</td>
                    <td><strong>▲ {c.upvotes}</strong></td>
                    <td><span className={`badge badge-${c.status}`}>{c.status.replace('_', ' ')}</span></td>
                    <td>
                      <div className="action-btns">
                        {c.status !== 'in_progress' && c.status !== 'resolved' && (
                          <button className="btn btn-outline btn-sm" disabled={updating === c._id}
                            onClick={() => updateStatus(c._id, 'in_progress')}>
                            {updating === c._id ? <span className="spinner spinner-dark"></span> : 'In Progress'}
                          </button>
                        )}
                        {c.status !== 'resolved' && (
                          <button className="btn btn-secondary btn-sm" onClick={() => setResolveModal(c._id)}>
                            Resolve
                          </button>
                        )}
                        {c.status !== 'rejected' && c.status !== 'resolved' && (
                          <button className="btn btn-danger btn-sm" disabled={updating === c._id}
                            onClick={() => updateStatus(c._id, 'rejected')}>
                            Reject
                          </button>
                        )}
                        <a href={`/complaint/${c._id}`} className="btn btn-outline btn-sm" target="_blank" rel="noreferrer">View</a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {resolveModal && (
        <div className="modal-overlay" onClick={() => setResolveModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>✅ Resolve Complaint</h2>
            <div className="form-group" style={{ marginTop: 16 }}>
              <label>Resolution Notes *</label>
              <textarea rows={4} placeholder="Describe what action was taken…"
                value={resolveData.notes} onChange={e => setResolveData({ ...resolveData, notes: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Resolution Photos (optional)</label>
              <input type="file" accept="image/*" multiple
                onChange={e => setResolveData({ ...resolveData, photos: Array.from(e.target.files) })} />
            </div>
            <div className="modal-actions">
              <button className="btn btn-outline" onClick={() => setResolveModal(null)}>Cancel</button>
              <button className="btn btn-secondary" onClick={handleResolve} disabled={resolving || !resolveData.notes}>
                {resolving ? <><span className="spinner"></span> Resolving…</> : 'Mark Resolved'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
