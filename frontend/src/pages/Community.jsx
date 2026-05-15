import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { connectSocket, getSocket } from '../socket';
import api from '../api/axios';
import './Community.css';

function timeLabel(dateStr) {
  const d    = new Date(dateStr);
  const diff = Date.now() - d;
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h ago`;
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

function getInitials(name) {
  return (name || 'U').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

export default function Community() {
  const { user } = useAuth();

  const [activeWard,  setActiveWard]  = useState(null);
  const [wardInput,   setWardInput]   = useState('');
  const [messages,    setMessages]    = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [input,       setInput]       = useState('');
  const [localVotes,  setLocalVotes]  = useState({});
  const [wardStats,   setWardStats]   = useState({ total: 0, resolved: 0 });

  const messagesEndRef = useRef(null);
  const inputRef       = useRef(null);
  const prevWardRef    = useRef(null);

  // Auto-join the user's own ward on load
  useEffect(() => {
    if (user?.wardNumber) {
      setActiveWard(String(user.wardNumber));
    }
  }, [user]);

  // Fetch ward-level complaint stats when ward changes
  useEffect(() => {
    if (!activeWard) return;
    api.get('/complaints', { params: { wardNumber: activeWard } })
      .then(res => {
        const all = Array.isArray(res.data) ? res.data : (res.data.complaints || []);
        setWardStats({
          total:    all.length,
          resolved: all.filter(c => c.status === 'resolved').length,
        });
      })
      .catch(() => {});
  }, [activeWard]);

  const joinWard = useCallback((wardNumber) => {
    const socket = user ? connectSocket(user._id) : getSocket();
    if (!socket) return;

    if (prevWardRef.current && prevWardRef.current !== wardNumber) {
      socket.emit('leaveWard', {
        wardNumber: prevWardRef.current,
        userId:     user?._id,
        userName:   user?.name,
      });
    }

    setMessages([]);
    setOnlineUsers([]);
    prevWardRef.current = wardNumber;

    socket.emit('joinWard', {
      wardNumber,
      userId:   user?._id   || null,
      userName: user?.name   || null,
    });
  }, [user]);

  useEffect(() => {
    if (!activeWard) return;
    joinWard(activeWard);
  }, [activeWard, joinWard]);

  useEffect(() => {
    const socket = user ? connectSocket(user._id) : getSocket();
    if (!socket) return;

    const onHistory = ({ wardNumber, messages: msgs }) => {
      if (wardNumber === activeWard) setMessages(msgs);
    };

    const onNewMsg = (msg) => {
      if (msg.wardNumber === activeWard) {
        setMessages(prev => {
          const exists = prev.some(m => m._id && m._id === msg._id);
          if (exists) return prev;
          return [...prev.filter(m => !m._optimistic), msg];
        });
      }
    };

    const onOnline = ({ wardNumber, users }) => {
      if (wardNumber === activeWard) setOnlineUsers(users);
    };

    socket.on('wardHistory',     onHistory);
    socket.on('newWardMessage',  onNewMsg);
    socket.on('wardOnlineUsers', onOnline);

    return () => {
      socket.off('wardHistory',     onHistory);
      socket.off('newWardMessage',  onNewMsg);
      socket.off('wardOnlineUsers', onOnline);
    };
  }, [activeWard, user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = (e) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || !user || !activeWard) return;
    const socket = getSocket();
    if (!socket) return;

    setMessages(prev => [...prev, {
      _id: null, _optimistic: true,
      wardNumber: activeWard,
      userId: user._id, userName: user.name,
      text, createdAt: new Date().toISOString(), type: 'message',
    }]);
    setInput('');
    inputRef.current?.focus();

    socket.emit('wardMessage', {
      wardNumber: activeWard, text,
      userId: user._id, userName: user.name,
    });
  };

  const handleVote = (idx, dir) => {
    setLocalVotes(prev => ({ ...prev, [idx]: prev[idx] === dir ? null : dir }));
  };

  const handleWardSearch = (e) => {
    e.preventDefault();
    const w = wardInput.trim();
    if (w) setActiveWard(w);
  };

  // ── LANDING: not logged in or no ward ──
  if (!activeWard) {
    return (
      <div className="pv-landing">
        <div className="pv-landing-inner">
          <div className="pv-landing-icon">🏘️</div>
          <h1>People's Voice</h1>
          <p>Your ward's real-time civic discussion board. Talk with neighbours, raise issues, and make your voice heard.</p>

          {user && !user.wardNumber && (
            <div className="pv-no-ward-note">
              Your profile doesn't have a ward number set. Enter one below to join your community.
            </div>
          )}

          <form className="pv-ward-form" onSubmit={handleWardSearch}>
            <input
              className="pv-ward-input"
              placeholder="Enter your ward number (e.g. 7)"
              value={wardInput}
              onChange={e => setWardInput(e.target.value)}
              type="number"
              min="1"
            />
            <button type="submit" className="pv-ward-btn">
              Enter →
            </button>
          </form>

          {!user && (
            <p className="pv-login-hint">
              <Link to="/login">Log in</Link> to automatically join your ward and post messages.
            </p>
          )}

          <div className="pv-features">
            <div className="pv-feature">
              <span>💬</span>
              <span>Real-time ward chat</span>
            </div>
            <div className="pv-feature">
              <span>📍</span>
              <span>Report civic issues</span>
            </div>
            <div className="pv-feature">
              <span>👥</span>
              <span>See who's online</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── MAIN COMMUNITY VIEW ──
  return (
    <div className="community-page">

      {/* ── Feed Panel ── */}
      <main className="chat-panel">

        {/* Header */}
        <div className="chat-header">
          <div className="chat-header-left">
            <div className="chat-ward-avatar">
              <span className="chat-ward-emoji">🏘️</span>
            </div>
            <div>
              <h3>People's Voice <span className="pv-ward-tag">Ward {activeWard}</span></h3>
              <span className="chat-online-count">
                <span className="online-dot" />
                {onlineUsers.length} neighbour{onlineUsers.length !== 1 ? 's' : ''} online
              </span>
            </div>
          </div>
          <div className="chat-header-right">
            <Link to={`/complaints?ward=${activeWard}`} className="chat-view-issues">
              📋 Ward Issues →
            </Link>
            {user && String(user.wardNumber) !== activeWard && (
              <button
                className="pv-switch-btn"
                onClick={() => setActiveWard(String(user.wardNumber))}
                title="Go back to your ward"
              >
                ← My Ward
              </button>
            )}
          </div>
        </div>

        {/* Compose */}
        {user ? (
          <form className="compose-box" onSubmit={sendMessage}>
            <div className="compose-avatar">{getInitials(user.name)}</div>
            <input
              ref={inputRef}
              className="compose-input"
              placeholder={`Share something with Ward ${activeWard} neighbours…`}
              value={input}
              onChange={e => setInput(e.target.value)}
              maxLength={1000}
              autoComplete="off"
            />
            <button type="submit" className="compose-btn" disabled={!input.trim()}>
              Post
            </button>
          </form>
        ) : (
          <div className="compose-login-bar">
            <Link to="/login">Log in</Link> to share your voice with Ward {activeWard} residents
          </div>
        )}

        {/* Messages feed */}
        <div className="chat-messages">
          {messages.length === 0 && (
            <div className="chat-no-msgs">
              <span>🗣️</span>
              <p>No voices yet — be the first to speak up for Ward {activeWard}!</p>
            </div>
          )}

          {messages.map((msg, i) => {
            if (msg.type === 'system') {
              return (
                <div key={msg._id || `sys-${i}`} className="msg-system">
                  {msg.text}
                </div>
              );
            }
            const isMe  = user && msg.userId?.toString() === user._id?.toString();
            const vote  = localVotes[i];
            const score = vote === 'up' ? 1 : vote === 'down' ? -1 : 0;

            return (
              <div
                key={msg._id || `opt-${i}`}
                className={`reddit-msg ${isMe ? 'reddit-msg-mine' : ''} ${msg._optimistic ? 'reddit-msg-optimistic' : ''}`}
              >
                <div className="vote-col">
                  <button
                    className={`vote-btn vote-up ${vote === 'up' ? 'voted' : ''}`}
                    onClick={() => handleVote(i, 'up')}
                    type="button"
                  >▲</button>
                  <span className={`vote-score ${vote === 'up' ? 'score-up' : vote === 'down' ? 'score-down' : ''}`}>
                    {score}
                  </span>
                  <button
                    className={`vote-btn vote-down ${vote === 'down' ? 'voted' : ''}`}
                    onClick={() => handleVote(i, 'down')}
                    type="button"
                  >▼</button>
                </div>

                <div className="reddit-msg-content">
                  <div className="reddit-msg-meta">
                    <div className="msg-avatar-sm">{getInitials(msg.userName)}</div>
                    <span className="reddit-msg-author">{isMe ? 'You' : msg.userName}</span>
                    {isMe && <span className="msg-mine-badge">You</span>}
                    <span className="reddit-msg-time">{timeLabel(msg.createdAt)}</span>
                    {msg._optimistic && <span className="msg-sending">posting…</span>}
                  </div>
                  <p className="reddit-msg-text">{msg.text}</p>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* ── Right Sidebar ── */}
      <aside className="online-sidebar">

        {/* Ward card */}
        <div className="ward-about-box">
          <div className="ward-about-title">
            <span className="ward-about-emoji">🏘️</span>
            <div>
              <strong>Ward {activeWard}</strong>
              <span>People's Voice</span>
            </div>
          </div>
          <p className="ward-about-desc">
            A live space for Ward {activeWard} residents to speak up, report issues, and hold local authorities accountable — together.
          </p>
          <div className="ward-about-stats">
            <div className="was-item">
              <strong>{wardStats.total}</strong>
              <span>Complaints</span>
            </div>
            <div className="was-item">
              <strong>{wardStats.resolved}</strong>
              <span>Resolved</span>
            </div>
            <div className="was-item">
              <strong>{onlineUsers.length}</strong>
              <span>Online now</span>
            </div>
          </div>
          {user ? (
            <Link to="/create" className="ward-create-btn">📍 Report an Issue</Link>
          ) : (
            <Link to="/login" className="ward-create-btn">Join the conversation</Link>
          )}
        </div>

        {/* Online members */}
        <div className="online-sidebar-header">
          <h4>Neighbours Online</h4>
          <span className="online-pill">{onlineUsers.length}</span>
        </div>
        <div className="online-list">
          {onlineUsers.length === 0 ? (
            <p className="online-empty">No one online yet</p>
          ) : (
            onlineUsers.map(u => (
              <div key={u.userId} className="online-member">
                <div className="online-member-avatar">{getInitials(u.userName)}</div>
                <div className="online-member-info">
                  <span>{u.userName}</span>
                  <span className="online-status"><span className="online-dot" />online</span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Quick links */}
        <div className="ward-news">
          <h4>Quick Links</h4>
          <Link to={`/complaints?ward=${activeWard}&status=resolved`} className="news-item">
            <span>✅</span><span>Resolved issues</span>
          </Link>
          <Link to={`/complaints?ward=${activeWard}&status=in_progress`} className="news-item">
            <span>🔧</span><span>In progress</span>
          </Link>
          <Link to={`/complaints?ward=${activeWard}`} className="news-item">
            <span>📋</span><span>All complaints</span>
          </Link>
          <Link to="/heatmap" className="news-item">
            <span>🗺️</span><span>Ward heatmap</span>
          </Link>
        </div>

      </aside>
    </div>
  );
}
