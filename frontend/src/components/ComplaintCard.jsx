import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './ComplaintCard.css';

const CAT_ICONS = { road:'🛣️', water:'💧', garbage:'🗑️', drainage:'🚿', power:'⚡', other:'📋' };

const STATUS_INFO = {
  reported:    { label:'Reported',    color:'#e8500a', bg:'#fff3ed' },
  in_progress: { label:'In Progress', color:'#d97706', bg:'#fffbeb' },
  resolved:    { label:'Resolved',    color:'#16a34a', bg:'#f0fdf4' },
  rejected:    { label:'Rejected',    color:'#9ca3af', bg:'#f9fafb' },
};

const CAT_COLORS = {
  road:     '#475569',
  water:    '#2563eb',
  garbage:  '#a16207',
  drainage: '#0f766e',
  power:    '#c2410c',
  other:    '#6b7280',
};

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr);
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-IN', { day:'numeric', month:'short' });
}

export default function ComplaintCard({ complaint, hasUpvoted, onUpvote }) {
  const { user } = useAuth();
  const navigate  = useNavigate();
  const [copied,  setCopied]  = useState(false);

  const {
    _id, title, description, category, status, wardNumber,
    upvotes, address, createdAt, photos, escalated, reportedBy,
  } = complaint;

  const stat    = STATUS_INFO[status]   || STATUS_INFO.reported;
  const catColor = CAT_COLORS[category] || '#6b7280';
  const authorName = reportedBy?.name || 'Anonymous';

  const handleUpvote = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) { navigate('/login'); return; }
    onUpvote(_id);
  };

  const handleShare = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const url = `${window.location.origin}/complaint/${_id}`;
    navigator.clipboard?.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className={`rc-card ${hasUpvoted ? 'rc-upvoted' : ''}`}>

      {/* ── Vote column ── */}
      <div className="rc-vote-col">
        <button
          className={`rc-vote-btn rc-vote-up ${hasUpvoted ? 'voted' : ''}`}
          onClick={handleUpvote}
          title={hasUpvoted ? 'Upvoted' : 'Upvote this issue'}
          type="button"
        >▲</button>
        <span className={`rc-score ${hasUpvoted ? 'score-up' : ''}`}>{upvotes}</span>
      </div>

      {/* ── Content column ── */}
      <div className="rc-content">

        {/* Meta row */}
        <div className="rc-meta">
          <span className="rc-ward">r/ward{wardNumber}</span>
          <span className="rc-sep">·</span>
          <span className="rc-cat" style={{ color: catColor }}>
            {CAT_ICONS[category]} {category}
          </span>
          <span className="rc-sep">·</span>
          <span className="rc-author">u/{authorName}</span>
          <span className="rc-sep">·</span>
          <span className="rc-time">{timeAgo(createdAt)}</span>
          {escalated && <span className="rc-esc-badge">🚨 Escalated</span>}
        </div>

        {/* Title + thumbnail row */}
        <div className="rc-title-row">
          <div className="rc-title-block">
            <Link to={`/complaint/${_id}`} className="rc-title">
              {title}
            </Link>
            {description && (
              <p className="rc-desc">{description}</p>
            )}
          </div>
          {photos?.length > 0 && (
            <Link to={`/complaint/${_id}`} className="rc-thumb-wrap">
              <img src={photos[0]} alt={title} className="rc-thumb" loading="lazy" />
            </Link>
          )}
        </div>

        {/* Address */}
        {address && (
          <p className="rc-address">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
            </svg>
            {address}
          </p>
        )}

        {/* Status + actions bar */}
        <div className="rc-actions-bar">
          <span className="rc-status-pill" style={{ color: stat.color, background: stat.bg }}>
            <span className="rc-status-dot" style={{ background: stat.color }}></span>
            {stat.label}
          </span>

          <div className="rc-actions">
            <button
              className={`rc-action-btn rc-upvote-action ${hasUpvoted ? 'upvoted' : ''}`}
              onClick={handleUpvote}
              type="button"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 4l8 8h-5v8H9v-8H4l8-8z"/>
              </svg>
              {hasUpvoted ? 'Upvoted' : 'Upvote'} · {upvotes}
            </button>

            <Link to={`/complaint/${_id}`} className="rc-action-btn">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
              View Details
            </Link>

            <button
              className={`rc-action-btn ${copied ? 'copied' : ''}`}
              onClick={handleShare}
              type="button"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/>
                <circle cx="18" cy="19" r="3"/>
                <path d="m8.59 13.51 6.83 3.98M15.41 6.51l-6.82 3.98"/>
              </svg>
              {copied ? 'Link Copied!' : 'Share'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
