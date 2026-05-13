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

export default function Community() {
  const { user } = useAuth();
  const [wards,        setWards]        = useState(WARD_RANGE);
  const [activeWard,   setActiveWard]   = useState(null);
  const [messages,     setMessages]     = useState([]);
  const [onlineUsers,  setOnlineUsers]  = useState([]);
  const [input,        setInput]        = useState('');
  const [sending,      setSending]      = useState(false);
  const [unreadMap,    setUnreadMap]    = useState({});
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
        setMessages(prev => [...prev, msg]);
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

    socket.on('wardHistory',    onHistory);
    socket.on('newWardMessage', onNewMsg);
    socket.on('wardOnlineUsers', onOnline);

    return () => {
      socket.off('wardHistory',    onHistory);
      socket.off('newWardMessage', onNewMsg);
      socket.off('wardOnlineUsers', onOnline);
    };
  }, [activeWard, user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = (e) => {
    e.preventDefault();
    if (!input.trim() || !user || !activeWard || sending) return;
    const socket = getSocket();
    if (!socket) return;
    setSending(true);
    socket.emit('wardMessage', {
      wardNumber: activeWard,
      text:       input.trim(),
      userId:     user._id,
      userName:   user.name,
    });
    setInput('');
    setSending(false);
    inputRef.current?.focus();
  };

  const handleWardClick = (ward) => {
    setActiveWard(ward);
    setUnreadMap(prev => ({ ...prev, [ward]: 0 }));
  };

  return (
    <div className="community-page">

      {/* ── Ward Sidebar ── */}
      <aside className="ward-sidebar">
        <div className="ward-sidebar-header">
          <h2>Ward Chats</h2>
          <p>Join your ward to talk with neighbours</p>
        </div>
        <div className="ward-list">
          {wards.map(w => (
            <button
              key={w}
              className={`ward-item ${activeWard === w ? 'active' : ''}`}
              onClick={() => handleWardClick(w)}
            >
              <div className="ward-item-avatar">W{w}</div>
              <div className="ward-item-info">
                <span className="ward-item-name">Ward {w}</span>
                <span className="ward-item-sub">Community Chat</span>
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
            <div className="chat-empty-icon">💬</div>
            <h3>Select a Ward to Start Chatting</h3>
            <p>Join your local ward community and connect with neighbours, discuss civic issues, and stay updated on what's happening near you.</p>
            {!user && (
              <p className="chat-login-prompt">
                <Link to="/login">Log in</Link> to send messages and be part of the conversation.
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
                  <h3>Ward {activeWard} Community</h3>
                  <span className="chat-online-count">
                    <span className="online-dot" />
                    {onlineUsers.length} online
                  </span>
                </div>
              </div>
              <Link to={`/complaints?ward=${activeWard}`} className="chat-view-issues">
                View Issues →
              </Link>
            </div>

            {/* Messages */}
            <div className="chat-messages">
              {messages.length === 0 && (
                <div className="chat-no-msgs">
                  No messages yet — be the first to say something!
                </div>
              )}
              {messages.map((msg, i) => {
                if (msg.type === 'system') {
                  return (
                    <div key={msg._id || i} className="msg-system">
                      {msg.text}
                    </div>
                  );
                }
                const isMe = user && msg.userId?.toString() === user._id?.toString();
                const initials = (msg.userName || 'U').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
                return (
                  <div key={msg._id || i} className={`msg-row ${isMe ? 'msg-me' : 'msg-other'}`}>
                    {!isMe && (
                      <div className="msg-avatar" title={msg.userName}>{initials}</div>
                    )}
                    <div className="msg-bubble-wrap">
                      {!isMe && <span className="msg-name">{msg.userName}</span>}
                      <div className="msg-bubble">{msg.text}</div>
                      <span className="msg-time">{timeLabel(msg.createdAt)}</span>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            {user ? (
              <form className="chat-input-bar" onSubmit={sendMessage}>
                <input
                  ref={inputRef}
                  className="chat-input"
                  placeholder={`Message Ward ${activeWard}…`}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  maxLength={1000}
                  autoComplete="off"
                />
                <button
                  type="submit"
                  className="chat-send-btn"
                  disabled={!input.trim() || sending}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                  </svg>
                </button>
              </form>
            ) : (
              <div className="chat-login-bar">
                <Link to="/login" className="btn btn-primary btn-sm">Log in to chat</Link>
                <span>Join the conversation in Ward {activeWard}</span>
              </div>
            )}
          </>
        )}
      </main>

      {/* ── Online Members Sidebar ── */}
      {activeWard && (
        <aside className="online-sidebar">
          <div className="online-sidebar-header">
            <h4>Online Now</h4>
            <span className="online-pill">{onlineUsers.length}</span>
          </div>
          <div className="online-list">
            {onlineUsers.length === 0 && (
              <p className="online-empty">No one online yet</p>
            )}
            {onlineUsers.map(u => {
              const initials = (u.userName || 'U').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
              return (
                <div key={u.userId} className="online-member">
                  <div className="online-member-avatar">{initials}</div>
                  <div className="online-member-info">
                    <span>{u.userName}</span>
                    <span className="online-status"><span className="online-dot" />online</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="ward-news">
            <h4>Ward {activeWard} News</h4>
            <Link to={`/complaints?ward=${activeWard}&status=resolved`} className="news-item news-resolved">
              <span>✅</span>
              <span>View resolved issues</span>
            </Link>
            <Link to={`/complaints?ward=${activeWard}&status=in_progress`} className="news-item news-progress">
              <span>🔧</span>
              <span>Issues in progress</span>
            </Link>
            <Link to={`/complaints?ward=${activeWard}`} className="news-item news-all">
              <span>📋</span>
              <span>All ward complaints</span>
            </Link>
            <Link to="/create" className="news-item news-report">
              <span>📍</span>
              <span>Report a new issue</span>
            </Link>
          </div>
        </aside>
      )}
    </div>
  );
}
