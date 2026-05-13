import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications, STATUS_LABEL } from '../context/NotificationsContext';
import './NotificationToast.css';

export default function NotificationToast() {
  const { toasts, removeToast } = useNotifications();
  const navigate = useNavigate();

  if (!toasts.length) return null;

  return (
    <div className="toast-stack">
      {toasts.map((toast) => {
        const meta = STATUS_LABEL[toast.status] || STATUS_LABEL.reported;
        return (
          <div
            key={toast.id}
            className={`toast-card toast-${toast.status}`}
            onClick={() => {
              if (toast.complaintId) navigate(`/complaints/${toast.complaintId}`);
              removeToast(toast.id);
            }}
          >
            <div className="toast-icon">{meta.icon}</div>
            <div className="toast-body">
              <p className="toast-title">Complaint {meta.text}!</p>
              <p className="toast-msg">
                {toast.complaintTitle
                  ? `"${toast.complaintTitle}"`
                  : 'Your complaint status has been updated.'}
              </p>
              {toast.status === 'resolved' && (
                <p className="toast-cta">Tap to view resolution →</p>
              )}
            </div>
            <button
              className="toast-close"
              onClick={(e) => { e.stopPropagation(); removeToast(toast.id); }}
            >✕</button>
          </div>
        );
      })}
    </div>
  );
}
