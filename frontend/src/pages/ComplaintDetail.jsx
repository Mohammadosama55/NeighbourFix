import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import MapView from '../components/MapView';
import './ComplaintDetail.css';

const categoryEmoji = { road: '🛣️', water: '💧', garbage: '🗑️', drainage: '🚿', power: '⚡', other: '📋' };

export default function ComplaintDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [upvoting, setUpvoting] = useState(false);
  const [upvoted, setUpvoted] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get(`/complaints/${id}`)
      .then(res => {
        setComplaint(res.data);
        if (user) setUpvoted(res.data.upvotedBy?.includes(user._id));
      })
      .catch(() => navigate('/'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleUpvote = async () => {
    if (!user) { navigate('/login'); return; }
    if (upvoted) return;
    setUpvoting(true);
    try {
      const res = await api.post(`/complaints/${id}/upvote`);
      setComplaint(prev => ({ ...prev, upvotes: res.data.upvotes }));
      setUpvoted(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not upvote');
    } finally {
      setUpvoting(false);
    }
  };

  if (loading) return <div className="loading-page"><div className="spinner spinner-dark"></div><p>Loading…</p></div>;
  if (!complaint) return null;

  const coords = complaint.location?.coordinates;
  const center = coords ? [coords[1], coords[0]] : null;

  return (
    <div className="detail-page">
      <div className="container">
        <Link to="/" className="back-link">← Back to complaints</Link>

        <div className="detail-grid">
          <div className="detail-main">
            {complaint.photos?.length > 0 && (
              <div className="photo-gallery">
                {complaint.photos.map((p, i) => (
                  <img key={i} src={p} alt={`Photo ${i + 1}`} />
                ))}
              </div>
            )}

            <div className="card detail-card">
              <div className="detail-badges">
                <span className={`badge badge-${complaint.category}`}>
                  {categoryEmoji[complaint.category]} {complaint.category}
                </span>
                <span className={`badge badge-${complaint.status}`}>
                  {complaint.status.replace('_', ' ')}
                </span>
                {complaint.escalated && <span className="badge" style={{ background: '#fee2e2', color: '#b91c1c' }}>🚨 Escalated</span>}
              </div>

              <h1 className="detail-title">{complaint.title}</h1>
              <p className="detail-meta">
                📍 {complaint.address || `Ward ${complaint.wardNumber}`} &nbsp;·&nbsp;
                🗓 {new Date(complaint.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                {complaint.reportedBy && <> &nbsp;·&nbsp; 👤 {complaint.reportedBy.name}</>}
              </p>

              <p className="detail-description">{complaint.description}</p>

              <div className="upvote-section">
                <button
                  className={`upvote-btn ${upvoted ? 'upvoted' : ''}`}
                  onClick={handleUpvote}
                  disabled={upvoting || upvoted}
                >
                  {upvoting ? <span className="spinner"></span> : '▲'}
                  <span>{complaint.upvotes} Upvotes</span>
                </button>
                {!user && <span className="upvote-hint">Login to upvote this issue</span>}
                {upvoted && <span className="upvote-hint" style={{ color: 'var(--secondary)' }}>✓ You've upvoted this</span>}
                {error && <span className="error-msg">{error}</span>}
              </div>

              {complaint.escalated && (
                <div className="escalation-notice">
                  🚨 This complaint was escalated to ward authorities on {new Date(complaint.escalationDate).toLocaleDateString('en-IN')} after receiving {complaint.upvotes} upvotes.
                </div>
              )}

              {complaint.status === 'resolved' && complaint.resolutionNotes && (
                <div className="resolution-box">
                  <h3>✅ Resolution Notes</h3>
                  <p>{complaint.resolutionNotes}</p>
                  {complaint.resolvedAt && (
                    <p className="res-date">Resolved on {new Date(complaint.resolvedAt).toLocaleDateString('en-IN')}</p>
                  )}
                  {complaint.resolutionPhotos?.length > 0 && (
                    <div className="res-photos">
                      {complaint.resolutionPhotos.map((p, i) => <img key={i} src={p} alt="Resolution" />)}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="detail-side">
            <div className="card" style={{ marginBottom: 16 }}>
              <h3 className="side-title">📊 Details</h3>
              <dl className="details-list">
                <dt>Ward Number</dt><dd>{complaint.wardNumber}</dd>
                <dt>Category</dt><dd style={{ textTransform: 'capitalize' }}>{complaint.category}</dd>
                <dt>Status</dt><dd style={{ textTransform: 'capitalize' }}>{complaint.status.replace('_', ' ')}</dd>
                <dt>Upvotes</dt><dd>{complaint.upvotes}</dd>
                <dt>Reported</dt><dd>{new Date(complaint.createdAt).toLocaleDateString('en-IN')}</dd>
                {complaint.updatedAt !== complaint.createdAt && (
                  <><dt>Updated</dt><dd>{new Date(complaint.updatedAt).toLocaleDateString('en-IN')}</dd></>
                )}
              </dl>
            </div>

            {center && (
              <div className="card">
                <h3 className="side-title">📍 Location</h3>
                <div style={{ marginTop: 12 }}>
                  <MapView complaints={[complaint]} center={center} height="240px" />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
