import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import './FeedbackModal.css';

export default function FeedbackModal({ open, onClose }) {
  const [rating,  setRating]  = useState(0);
  const [hover,   setHover]   = useState(0);
  const [message, setMessage] = useState('');
  const [email,   setEmail]   = useState('');
  const [name,    setName]    = useState('');
  const [status,  setStatus]  = useState('idle'); // idle | loading | success | error

  useEffect(() => {
    if (open) {
      setRating(0); setHover(0); setMessage('');
      setEmail(''); setName(''); setStatus('idle');
    }
  }, [open]);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    if (open) document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!rating) return;
    setStatus('loading');
    try {
      await api.post('/feedback', { rating, message, email, name });
      setStatus('success');
    } catch {
      setStatus('error');
    }
  };

  const LABELS = ['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent'];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="fb-modal" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>✕</button>

        {status === 'success' ? (
          <div className="fb-success">
            <div className="fb-success-icon">🎉</div>
            <h2>Thank you for your feedback!</h2>
            <p>Your response helps us improve NeighbourFix for everyone in your community.</p>
            <button className="btn-primary-lg" onClick={onClose}>Close</button>
          </div>
        ) : (
          <>
            <div className="fb-header">
              <div className="fb-header-icon">💬</div>
              <h2>Share Your Feedback</h2>
              <p>How has your experience with NeighbourFix been?</p>
            </div>

            <form onSubmit={handleSubmit} className="fb-form">
              {/* Star Rating */}
              <div className="fb-stars-section">
                <label className="fb-label">Your rating <span className="required">*</span></label>
                <div className="fb-stars">
                  {[1,2,3,4,5].map(n => (
                    <button
                      key={n} type="button"
                      className={`fb-star ${(hover || rating) >= n ? 'filled' : ''}`}
                      onClick={() => setRating(n)}
                      onMouseEnter={() => setHover(n)}
                      onMouseLeave={() => setHover(0)}
                    >★</button>
                  ))}
                </div>
                {(hover || rating) > 0 && (
                  <span className="fb-star-label">{LABELS[hover || rating]}</span>
                )}
              </div>

              {/* Message */}
              <div className="fb-field">
                <label className="fb-label">Your message <span className="required">*</span></label>
                <textarea
                  className="fb-textarea"
                  placeholder="Tell us what you liked or how we can improve…"
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  rows={4}
                  maxLength={1000}
                  required
                />
                <span className="fb-char-count">{message.length}/1000</span>
              </div>

              {/* Optional fields */}
              <div className="fb-row">
                <div className="fb-field">
                  <label className="fb-label">Name <span className="optional">(optional)</span></label>
                  <input
                    className="fb-input"
                    placeholder="Your name"
                    value={name}
                    onChange={e => setName(e.target.value)}
                  />
                </div>
                <div className="fb-field">
                  <label className="fb-label">Email <span className="optional">(optional)</span></label>
                  <input
                    className="fb-input"
                    type="email"
                    placeholder="For follow-up"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                  />
                </div>
              </div>

              {status === 'error' && (
                <p className="fb-error">Something went wrong. Please try again.</p>
              )}

              <button
                type="submit"
                className="fb-submit"
                disabled={!rating || !message.trim() || status === 'loading'}
              >
                {status === 'loading' ? 'Sending…' : 'Send Feedback →'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
