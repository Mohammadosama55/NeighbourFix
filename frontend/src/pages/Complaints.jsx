import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import ComplaintCard from '../components/ComplaintCard';
import MapView from '../components/MapView';
import './Complaints.css';

const CATEGORIES = ['all', 'road', 'water', 'garbage', 'drainage', 'power', 'other'];
const STATUSES   = ['all', 'reported', 'in_progress', 'resolved', 'rejected'];
const PAGE_SIZE  = 10;

const SORT_TABS = [
  { key: 'hot',  label: '🔥 Hot' },
  { key: 'new',  label: '🆕 New' },
  { key: 'top',  label: '🏆 Top' },
];

export default function Complaints() {
  const { user }     = useAuth();
  const navigate     = useNavigate();
  const [searchParams] = useSearchParams();
  const initialWard  = searchParams.get('ward') || '';

  const [complaints,   setComplaints]   = useState([]);
  const [total,        setTotal]        = useState(0);
  const [hasMore,      setHasMore]      = useState(true);
  const [loading,      setLoading]      = useState(true);
  const [loadingMore,  setLoadingMore]  = useState(false);
  const [sort,         setSort]         = useState('hot');
  const [viewMode,     setViewMode]     = useState('list');
  const [localUpvoted, setLocalUpvoted] = useState(new Set());

  const [filters, setFilters] = useState({
    category:   'all',
    status:     'all',
    wardNumber: initialWard,
  });
  const [search,    setSearch]    = useState('');
  const [searchQ,   setSearchQ]   = useState('');

  const sentinelRef  = useRef(null);
  const pageRef      = useRef(1);
  const fetchingRef  = useRef(false);

  // Debounce search input → searchQ
  useEffect(() => {
    const t = setTimeout(() => setSearchQ(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  const buildParams = useCallback((pg) => {
    const p = { page: pg, limit: PAGE_SIZE, sort };
    if (filters.category   !== 'all') p.category   = filters.category;
    if (filters.status     !== 'all') p.status     = filters.status;
    if (filters.wardNumber)           p.wardNumber = filters.wardNumber;
    if (searchQ)                      p.q          = searchQ;
    return p;
  }, [filters, sort, searchQ]);

  // Fetch page 1 (reset) whenever filters/sort/search change
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      fetchingRef.current = true;
      setLoading(true);
      try {
        const res = await api.get('/complaints', { params: buildParams(1) });
        if (cancelled) return;
        const data = res.data;
        const c    = Array.isArray(data) ? data : (data.complaints || []);
        const t    = Array.isArray(data) ? data.length : (data.total ?? data.length ?? 0);
        const more = Array.isArray(data) ? false : (data.hasMore ?? false);
        setComplaints(c);
        setTotal(t);
        setHasMore(more);
        pageRef.current = 1;
      } catch (e) {
        if (!cancelled) console.error(e);
      } finally {
        if (!cancelled) {
          setLoading(false);
          fetchingRef.current = false;
        }
      }
    };
    run();
    return () => { cancelled = true; };
  }, [filters, sort, searchQ]);

  // Load next page
  const loadMore = useCallback(async () => {
    if (fetchingRef.current || !hasMore) return;
    fetchingRef.current = true;
    setLoadingMore(true);
    const nextPage = pageRef.current + 1;
    try {
      const res  = await api.get('/complaints', { params: buildParams(nextPage) });
      const data = res.data;
      const c    = Array.isArray(data) ? data : (data.complaints || []);
      const more = Array.isArray(data) ? false : (data.hasMore ?? false);
      setComplaints(prev => [...prev, ...c]);
      setHasMore(more);
      pageRef.current = nextPage;
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingMore(false);
      fetchingRef.current = false;
    }
  }, [hasMore, buildParams]);

  // IntersectionObserver sentinel
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) loadMore(); },
      { rootMargin: '300px' }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [loadMore]);

  // Upvote handler (optimistic)
  const handleUpvote = useCallback(async (id) => {
    if (!user) { navigate('/login'); return; }
    if (localUpvoted.has(id)) return;
    const alreadyUpvoted = complaints.find(c => c._id === id)?.upvotedBy
      ?.some(uid => uid.toString() === user._id?.toString());
    if (alreadyUpvoted) return;

    setLocalUpvoted(prev => new Set([...prev, id]));
    setComplaints(prev =>
      prev.map(c => c._id === id ? { ...c, upvotes: c.upvotes + 1 } : c)
    );
    try {
      const res = await api.post(`/complaints/${id}/upvote`);
      setComplaints(prev =>
        prev.map(c => c._id === id ? { ...c, upvotes: res.data.upvotes } : c)
      );
    } catch {
      setLocalUpvoted(prev => { const s = new Set(prev); s.delete(id); return s; });
      setComplaints(prev =>
        prev.map(c => c._id === id ? { ...c, upvotes: c.upvotes - 1 } : c)
      );
    }
  }, [user, complaints, localUpvoted, navigate]);

  const hasUpvotedFn = useCallback((c) =>
    localUpvoted.has(c._id) ||
    c.upvotedBy?.some(uid => uid.toString() === user?._id?.toString()),
  [localUpvoted, user]);

  const clearWardFilter = () => setFilters(f => ({ ...f, wardNumber: '' }));

  const reported   = useMemo(() => complaints.filter(c => c.status === 'reported').length,   [complaints]);
  const inProgress = useMemo(() => complaints.filter(c => c.status === 'in_progress').length, [complaints]);
  const resolved   = useMemo(() => complaints.filter(c => c.status === 'resolved').length,   [complaints]);

  return (
    <div className="complaints-page">

      {/* ── Page Header ── */}
      <div className="cp-header">
        <div className="container">
          <div className="cp-header-inner">
            <div className="cp-header-text">
              <p className="section-eyebrow">Live Reports</p>
              <h1>
                {filters.wardNumber
                  ? <>Issues in <span>Ward {filters.wardNumber}</span></>
                  : 'Civic Complaints Feed'}
              </h1>
              <p className="cp-sub">
                Real complaints filed by residents — scroll to explore, upvote to escalate.
              </p>
            </div>
            <div className="cp-header-actions">
              {user
                ? <Link to="/create" className="btn-primary-lg">+ Report an Issue</Link>
                : <Link to="/register" className="btn-primary-lg">Sign Up to Report</Link>
              }
            </div>
          </div>

          <div className="cp-stats">
            <div className="cp-stat s-orange">
              <span className="cp-stat-num">{reported}</span>
              <span className="cp-stat-lbl">Reported</span>
            </div>
            <div className="cp-stat s-amber">
              <span className="cp-stat-num">{inProgress}</span>
              <span className="cp-stat-lbl">In Progress</span>
            </div>
            <div className="cp-stat s-green">
              <span className="cp-stat-num">{resolved}</span>
              <span className="cp-stat-lbl">Resolved</span>
            </div>
            <div className="cp-stat">
              <span className="cp-stat-num">{total}</span>
              <span className="cp-stat-lbl">Total</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="cp-body container">
        <div className="cp-layout">

          {/* ═══ CENTER FEED ═══ */}
          <div className="cp-feed">

            {/* Sort + View toggle bar */}
            <div className="cp-sort-bar">
              <div className="sort-tabs">
                {SORT_TABS.map(s => (
                  <button
                    key={s.key}
                    className={`sort-tab ${sort === s.key ? 'active' : ''}`}
                    onClick={() => setSort(s.key)}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
              <div className="view-toggle">
                <button className={viewMode === 'list' ? 'active' : ''} onClick={() => setViewMode('list')}>☰ List</button>
                <button className={viewMode === 'map'  ? 'active' : ''} onClick={() => setViewMode('map')}>🗺 Map</button>
              </div>
            </div>

            {/* Active ward tag */}
            {filters.wardNumber && (
              <div className="ward-active-banner">
                <span>📍 Showing complaints in <strong>Ward {filters.wardNumber}</strong></span>
                <button onClick={clearWardFilter}>Clear ✕</button>
              </div>
            )}

            {/* ── MAP VIEW ── */}
            {viewMode === 'map' ? (
              <div className="map-wrapper">
                <MapView complaints={complaints} height="540px" />
                <p className="map-hint">{complaints.length} complaints shown on map</p>
              </div>
            ) : (
              <>
                {/* Loading state */}
                {loading ? (
                  <div className="loading-page">
                    <div className="spinner spinner-dark"></div>
                    <p>Loading complaints…</p>
                  </div>
                ) : complaints.length === 0 ? (
                  <div className="empty-state">
                    <div style={{ fontSize: 52, marginBottom: 14 }}>📭</div>
                    <h3>No complaints found</h3>
                    <p>Try adjusting your filters or be the first to report an issue.</p>
                    {user && (
                      <Link to="/create" className="btn-primary-lg" style={{ marginTop: 16, display: 'inline-flex' }}>
                        + Report an Issue
                      </Link>
                    )}
                  </div>
                ) : (
                  <>
                    <div className="cp-feed-count">
                      Showing <strong>{complaints.length}</strong> of <strong>{total}</strong> complaints
                    </div>

                    <div className="rc-feed">
                      {complaints.map(c => (
                        <ComplaintCard
                          key={c._id}
                          complaint={c}
                          hasUpvoted={hasUpvotedFn(c)}
                          onUpvote={handleUpvote}
                        />
                      ))}
                    </div>

                    {/* Infinite scroll sentinel */}
                    <div ref={sentinelRef} style={{ height: 4 }} />

                    {loadingMore && (
                      <div className="load-more-spinner">
                        <div className="spinner spinner-dark"></div>
                        <span>Loading more…</span>
                      </div>
                    )}

                    {!hasMore && complaints.length > 0 && (
                      <div className="feed-end">
                        ✓ You've seen all {total} complaints
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </div>

          {/* ═══ RIGHT SIDEBAR ═══ */}
          <aside className="cp-sidebar">

            {/* Search */}
            <div className="sidebar-card">
              <h4 className="sidebar-card-title">Search</h4>
              <div className="search-wrap">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                </svg>
                <input
                  className="search-input"
                  placeholder="Search complaints…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
            </div>

            {/* Filters */}
            <div className="sidebar-card">
              <h4 className="sidebar-card-title">Filters</h4>

              <label className="sidebar-label">Category</label>
              <select className="sidebar-select" value={filters.category}
                onChange={e => setFilters(f => ({ ...f, category: e.target.value }))}>
                {CATEGORIES.map(c => (
                  <option key={c} value={c}>
                    {c === 'all' ? 'All Categories' : c.charAt(0).toUpperCase() + c.slice(1)}
                  </option>
                ))}
              </select>

              <label className="sidebar-label">Status</label>
              <select className="sidebar-select" value={filters.status}
                onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}>
                {STATUSES.map(s => (
                  <option key={s} value={s}>
                    {s === 'all' ? 'All Statuses' : s.replace('_', ' ')}
                  </option>
                ))}
              </select>

              <label className="sidebar-label">Ward Number</label>
              <div className="ward-filter-wrap">
                <input
                  className="ward-input"
                  placeholder="e.g. 7"
                  value={filters.wardNumber}
                  onChange={e => setFilters(f => ({ ...f, wardNumber: e.target.value }))}
                />
                {filters.wardNumber && (
                  <button className="ward-clear-x" onClick={clearWardFilter}>✕</button>
                )}
              </div>
            </div>

            {/* Community info */}
            <div className="sidebar-card sidebar-community">
              <h4 className="sidebar-card-title">About This Feed</h4>
              <p className="sidebar-community-desc">
                Civic complaints filed by residents across wards. Upvote issues you care about — at 10 upvotes, a formal complaint is auto-sent to your ward officer.
              </p>
              <div className="sidebar-community-stats">
                <div className="sc-stat">
                  <strong>{total}</strong>
                  <span>Total Issues</span>
                </div>
                <div className="sc-stat">
                  <strong>{resolved}</strong>
                  <span>Resolved</span>
                </div>
              </div>
              {user ? (
                <Link to="/create" className="sidebar-report-btn">📍 Report an Issue</Link>
              ) : (
                <Link to="/register" className="sidebar-report-btn">Join NeighbourFix</Link>
              )}
            </div>

          </aside>
        </div>
      </div>
    </div>
  );
}
