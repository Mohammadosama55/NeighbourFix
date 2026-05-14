import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { connectSocket, getSocket } from '../socket';
import api from '../api/axios';
import './Community.css';

const WARD_RANGE = Array.from({ length: 20 }, (_, i) => String(i + 1));

function timeLabel(dateStr) {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now - d;
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1)  return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHrs = Math.floor(diffMins / 60);
  if (diffHrs < 24)  return `${diffHrs}h ago`;
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

function getInitials(name) {
  return (name || 'U').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

export default function Community() {
  const { user } = useAuth();

  const [wards,        setWards]        = useState(WARD_RANGE);
  const [activeWard,   setActiveWard]   = useState(null);
  const [messages,     setMessages]     = useState([]);
  const [onlineUsers,  setOnlineUsers]  = useState([]);
  const [input,        setInput]        = useState('');
  const [unreadMap,    setUnreadMap]    = useState({});
  const [localVotes,   setLocalVotes]   = useState({});

  const messagesEndRef = useRef(null);
  const inputRef       = useRef(null);
  const prevWardRef    = useRef(null);

  useEffect(() => {
    api.get('/complaints').then(res => {
      const wardSet = new Set(res.data.map(c => c.wardNumber).filter(Boolean));
      const sorted = [...wardSet].sort((a, b) => parseInt(a) - parseInt(b));
      if (sorted.length) setWards(sorted);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (user?.wardNumber && !activeWard) {
      setActiveWard(String(user.wardNumber));
    }
  }, [user]);

  const joinWard = useCallback((wardNumber) => {
    const socket = user ? connectSocket(user._id) : getSocket();
    if (!socket) return;

    if (prevWardRef.current && prevWardRef.current !== wardNumber) {
      socket.emit('leaveWard', {
        wardNumber: prevWardRef.current,
        userId:   user?._id,
        userName: user?.name,
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
          const filtered = prev.filter(m => !m._optimistic);
          return [...filtered, msg];
        });
      } else {
        setUnreadMap(prev => ({
          ...prev,
          [msg.wardNumber]: (prev[msg.wardNumber] || 0) + 1,
        }));
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

    const optimisticMsg = {
      _id:         null,
      _optimistic: true,
      wardNumber:  activeWard,
      userId:      user._id,
      userName:    user.name,
      text,
      createdAt:   new Date().toISOString(),
      type:        'message',
    };
    setMessages(prev => [...prev, optimisticMsg]);
    setInput('');
    inputRef.current?.focus();

    socket.emit('wardMessage', {
      wardNumber: activeWard,
      text,
      userId:     user._id,
      userName:   user.name,
    });
  };

  const handleWardClick = (ward) => {
    setActiveWard(ward);
    setUnreadMap(prev => ({ ...prev, [ward]: 0 }));
  };

  const handleVote = (msgIdx, dir) => {
    setLocalVotes(prev => {
      const cur = prev[msgIdx];
      const next = cur === dir ? null : dir;
      return { ...prev, [msgIdx]: next };
    });
  };

  const myWard = user?.wardNumber ? String(user.wardNumber) : null;

  return (
    <div className="community-page">

      {/* ── Ward Sidebar ── */}
      <aside className="ward-sidebar">
        <div className="ward-sidebar-header">
          <h2>Ward Groups</h2>
          {myWard && (
            <p>Your ward: <strong>Ward {myWard}</strong></p>
          )}
          {!myWard && (
            <p>Select a ward to join</p>
          )}
        </div>
        <div className="ward-list">
          {myWard && (
            <div className="ward-group-label">YOUR WARD</div>
          )}
          {myWard && (
            <button
              className={`ward-item ${activeWard === myWard ? 'active' : ''} ward-item-mine`}
              onClick={() => handleWardClick(myWard)}
            >
              <div className="ward-item-avatar">W{myWard}</div>
              <div className="ward-item-info">
                <span className="ward-item-name">Ward {myWard}</span>
                <span className="ward-item-sub">Your community</span>
              </div>
              {unreadMap[myWard] > 0 && (
                <span className="ward-unread">{unreadMap[myWard] > 9 ? '9+' : unreadMap[myWard]}</span>
              )}
            </button>
          )}
          {wards.filter(w => w !== myWard).length > 0 && (
            <div className="ward-group-label" style={{ marginTop: myWard ? 10 : 0 }}>ALL WARDS</div>
          )}
          {wards.filter(w => w !== myWard).map(w => (
            <button
              key={w}
              className={`ward-item ${activeWard === w ? 'active' : ''}`}
              onClick={() => handleWardClick(w)}
            >
              <div className="ward-item-avatar">W{w}</div>
              <div className="ward-item-info">
                <span className="ward-item-name">Ward {w}</span>
                <span className="ward-item-sub">Community</span>
              </div>
              {unreadMap[w] > 0 && (
                <span className="ward-unread">{unreadMap[w] > 9 ? '9+' : unreadMap[w]}</span>
              )}
            </button>
          ))}
        </div>
      </aside>

      {/* ── Chat Panel ── */}
      <main className="chat-panel">
        {!activeWard ? (
          <div className="chat-empty">
            <div className="chat-empty-icon">🏘️</div>
            <h3>Join Your Ward Community</h3>
            <p>Select a ward from the left to see civic discussions, report issues, and connect with your neighbours.</p>
            {!user && (
              <p className="chat-login-prompt">
                <Link to="/login">Log in</Link> to send messages and participate.
              </p>
            )}
          </div>
        ) : (
          <>
            {/* Chat Header */}
            <div className="chat-header">
              <div className="chat-header-left">
                <div className="chat-ward-avatar">W{activeWard}</div>
                <div>
                  <h3>r/ward{activeWard}</h3>
                  <span className="chat-online-count">
                    <span className="online-dot" />
                    {onlineUsers.length} online · Ward {activeWard} Community
                  </span>
                </div>
              </div>
              <Link to={`/complaints?ward=${activeWard}`} className="chat-view-issues">
                View Issues →
              </Link>
            </div>

            {/* Compose Box (Reddit-style at top) */}
            {user ? (
              <form className="compose-box" onSubmit={sendMessage}>
                <div className="compose-avatar">{getInitials(user.name)}</div>
                <input
                  ref={inputRef}
                  className="compose-input"
                  placeholder={`Share something with Ward ${activeWard}…`}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  maxLength={1000}
                  autoComplete="off"
                />
                <button
                  type="submit"
                  className="compose-btn"
                  disabled={!input.trim()}
                >
                  Post
                </button>
              </form>
            ) : (
              <div className="compose-login-bar">
                <Link to="/login">Log in</Link> to join the conversation in Ward {activeWard}
              </div>
            )}

            {/* Messages — Reddit-style feed */}
            <div className="chat-messages">
              {messages.length === 0 && (
                <div className="chat-no-msgs">
                  No posts yet — be the first to share something!
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
                const isMe = user && msg.userId?.toString() === user._id?.toString();
                const vote = localVotes[i];
                const score = vote === 'up' ? 1 : vote === 'down' ? -1 : 0;
                return (
                  <div
                    key={msg._id || `opt-${i}`}
                    className={`reddit-msg ${isMe ? 'reddit-msg-mine' : ''} ${msg._optimistic ? 'reddit-msg-optimistic' : ''}`}
                  >
                    {/* Vote column */}
                    <div className="vote-col">
                      <button
                        className={`vote-btn vote-up ${vote === 'up' ? 'voted' : ''}`}
                        onClick={() => handleVote(i, 'up')}
                        title="Upvote"
                        type="button"
                      >▲</button>
                      <span className={`vote-score ${vote === 'up' ? 'score-up' : vote === 'down' ? 'score-down' : ''}`}>
                        {score}
                      </span>
                      <button
                        className={`vote-btn vote-down ${vote === 'down' ? 'voted' : ''}`}
                        onClick={() => handleVote(i, 'down')}
                        title="Downvote"
                        type="button"
                      >▼</button>
                    </div>

                    {/* Content column */}
                    <div className="reddit-msg-content">
                      <div className="reddit-msg-meta">
                        <div className="msg-avatar-sm">{getInitials(msg.userName)}</div>
                        <span className="reddit-msg-author">{isMe ? 'you' : msg.userName}</span>
                        {isMe && <span className="msg-mine-badge">OP</span>}
                        <span className="reddit-msg-time">{timeLabel(msg.createdAt)}</span>
                        {msg._optimistic && <span className="msg-sending">sending…</span>}
                      </div>
                      <p className="reddit-msg-text">{msg.text}</p>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          </>
        )}
      </main>

      {/* ── Online Members Sidebar ── */}
      {activeWard && (
        <aside className="online-sidebar">
          <div className="online-sidebar-header">
            <h4>About Ward {activeWard}</h4>
          </div>

          <div className="ward-about-box">
            <div className="ward-about-stat">
              <span className="online-dot" style={{ flexShrink: 0 }} />
              <span><strong>{onlineUsers.length}</strong> online now</span>
            </div>
            <p className="ward-about-desc">
              A community for Ward {activeWard} residents to discuss civic issues, share updates, and hold local authorities accountable.
            </p>
            {user ? (
              <Link to="/create" className="ward-create-btn">📍 Report an Issue</Link>
            ) : (
              <Link to="/login" className="ward-create-btn">Join Community</Link>
            )}
          </div>

          <div className="online-sidebar-header" style={{ marginTop: 8 }}>
            <h4>Online Now</h4>
            <span className="online-pill">{onlineUsers.length}</span>
          </div>
          <div className="online-list">
            {onlineUsers.length === 0 && (
              <p className="online-empty">No one online yet</p>
            )}
            {onlineUsers.map(u => (
              <div key={u.userId} className="online-member">
                <div className="online-member-avatar">{getInitials(u.userName)}</div>
                <div className="online-member-info">
                  <span>{u.userName}</span>
                  <span className="online-status"><span className="online-dot" />online</span>
                </div>
              </div>
            ))}
          </div>

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
      )}
    </div>
  );
}
