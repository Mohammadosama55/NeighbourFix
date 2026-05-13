import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getSocket } from '../socket';

const NotificationsContext = createContext(null);

const STATUS_LABEL = {
  resolved:    { text: 'Resolved',    icon: '✅', color: '#16a34a' },
  in_progress: { text: 'In Progress', icon: '🔧', color: '#d97706' },
  rejected:    { text: 'Rejected',    icon: '❌', color: '#dc2626' },
  reported:    { text: 'Reported',    icon: '📋', color: '#6b7280' },
};

export function NotificationsProvider({ children }) {
  const [toasts,      setToasts]      = useState([]);
  const [unreadCount, setUnreadCount] = useState(
    () => parseInt(localStorage.getItem('nf_unread') || '0', 10)
  );

  const addToast = useCallback((data) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, ...data }]);
    setUnreadCount(prev => {
      const next = prev + 1;
      localStorage.setItem('nf_unread', next);
      return next;
    });
    setTimeout(() => removeToast(id), 6000);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const clearUnread = useCallback(() => {
    setUnreadCount(0);
    localStorage.setItem('nf_unread', '0');
  }, []);

  useEffect(() => {
    let interval;
    const attach = () => {
      const s = getSocket();
      if (!s) return;
      s.off('statusUpdate');
      s.on('statusUpdate', (data) => addToast(data));
    };

    attach();
    interval = setInterval(attach, 3000);
    return () => clearInterval(interval);
  }, [addToast]);

  return (
    <NotificationsContext.Provider value={{ toasts, removeToast, unreadCount, clearUnread }}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  return useContext(NotificationsContext);
}

export { STATUS_LABEL };
