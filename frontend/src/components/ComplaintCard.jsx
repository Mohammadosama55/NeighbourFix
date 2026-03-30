import React from 'react';
import { Link } from 'react-router-dom';
import './ComplaintCard.css';

const categoryEmoji = {
  road: '🛣️', water: '💧', garbage: '🗑️',
  drainage: '🚿', power: '⚡', other: '📋',
};

export default function ComplaintCard({ complaint }) {
  const { _id, title, category, status, wardNumber, upvotes, address, createdAt, photos, escalated } = complaint;

  return (
    <Link to={`/complaint/${_id}`} className="complaint-card">
      {photos && photos.length > 0 && (
        <div className="card-img">
          <img src={photos[0]} alt={title} />
          {escalated && <span className="escalated-badge">🚨 Escalated</span>}
        </div>
      )}
      {(!photos || photos.length === 0) && escalated && (
        <div className="escalated-pill">🚨 Escalated</div>
      )}
      <div className="card-body">
        <div className="card-top">
          <span className={`badge badge-${category}`}>{categoryEmoji[category]} {category}</span>
          <span className={`badge badge-${status}`}>{status.replace('_', ' ')}</span>
        </div>
        <h3 className="card-title">{title}</h3>
        <p className="card-addr">📍 {address || `Ward ${wardNumber}`}</p>
        <div className="card-footer">
          <span className="upvotes">▲ {upvotes} upvotes</span>
          <span className="date">{new Date(createdAt).toLocaleDateString()}</span>
        </div>
      </div>
    </Link>
  );
}
