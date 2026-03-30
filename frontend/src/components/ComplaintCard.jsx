import React from 'react';
import { Link } from 'react-router-dom';
import './ComplaintCard.css';

const CAT_ICONS = { road:'🛣️', water:'💧', garbage:'🗑️', drainage:'🚿', power:'⚡', other:'📋' };

const CAT_COLORS = {
  road:     { bg:'#f1f5f9', icon:'#475569' },
  water:    { bg:'#eff6ff', icon:'#2563eb' },
  garbage:  { bg:'#fefce8', icon:'#a16207' },
  drainage: { bg:'#f0fdfa', icon:'#0f766e' },
  power:    { bg:'#fff7ed', icon:'#c2410c' },
  other:    { bg:'#f9fafb', icon:'#6b7280' },
};

const STATUS_INFO = {
  reported:    { label:'Reported',    dot:'#e8500a' },
  in_progress: { label:'In Progress', dot:'#d97706' },
  resolved:    { label:'Resolved',    dot:'#16a34a' },
  rejected:    { label:'Rejected',    dot:'#9ca3af' },
};

export default function ComplaintCard({ complaint }) {
  const { _id, title, category, status, wardNumber, upvotes, address, createdAt, photos, escalated } = complaint;
  const cat   = CAT_COLORS[category] || CAT_COLORS.other;
  const stat  = STATUS_INFO[status]   || STATUS_INFO.reported;
  const daysAgo = Math.floor((Date.now() - new Date(createdAt)) / 86400000);
  const timeStr = daysAgo === 0 ? 'Today' : daysAgo === 1 ? 'Yesterday' : `${daysAgo}d ago`;

  return (
    <Link to={`/complaint/${_id}`} className="cc-card">
      {/* Image */}
      {photos?.length > 0 ? (
        <div className="cc-img">
          <img src={photos[0]} alt={title} loading="lazy" />
          {escalated && <div className="cc-esc">🚨 Escalated</div>}
        </div>
      ) : (
        <div className="cc-no-img" style={{ background: cat.bg }}>
          <span style={{ color: cat.icon }}>{CAT_ICONS[category]}</span>
          {escalated && <div className="cc-esc">🚨 Escalated</div>}
        </div>
      )}

      <div className="cc-body">
        {/* Category + Status row */}
        <div className="cc-meta-row">
          <span className="cc-cat" style={{ background: cat.bg, color: cat.icon }}>
            {CAT_ICONS[category]} {category}
          </span>
          <span className="cc-status">
            <span className="cc-dot" style={{ background: stat.dot }}></span>
            {stat.label}
          </span>
        </div>

        {/* Title */}
        <h3 className="cc-title">{title}</h3>

        {/* Location */}
        <p className="cc-loc">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
          </svg>
          {address || `Ward ${wardNumber}`}
        </p>

        {/* Footer */}
        <div className="cc-footer">
          <span className="cc-upvotes">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 4l8 8h-5v8H9v-8H4l8-8z"/>
            </svg>
            {upvotes} upvote{upvotes !== 1 ? 's' : ''}
          </span>
          <span className="cc-time">{timeStr}</span>
        </div>
      </div>
    </Link>
  );
}
