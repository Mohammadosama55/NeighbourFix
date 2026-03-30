import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, adminOnly = false }) {
  const { user, loading } = useAuth();

  if (loading) return <div className="loading-page"><div className="spinner spinner-dark"></div><p>Loading…</p></div>;
  if (!user) return <Navigate to="/login" />;
  if (adminOnly && user.role !== 'ward_admin') return <Navigate to="/" />;

  return children;
}
