import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { NotificationsProvider } from './context/NotificationsContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import NotificationToast from './components/NotificationToast';
import PageTransition from './components/PageTransition';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Complaints from './pages/Complaints';
import Login from './pages/Login';
import Register from './pages/Register';
import CreateComplaint from './pages/CreateComplaint';
import ComplaintDetail from './pages/ComplaintDetail';
import AdminDashboard from './pages/AdminDashboard';
import HeatmapPage from './pages/HeatmapPage';
import Profile from './pages/Profile';
import Community from './pages/Community';

export default function App() {
  return (
    <AuthProvider>
      <NotificationsProvider>
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <Navbar />
          <PageTransition>
            <Routes>
              <Route path="/"              element={<Home />} />
              <Route path="/complaints"    element={<Complaints />} />
              <Route path="/login"         element={<Login />} />
              <Route path="/register"      element={<Register />} />
              <Route path="/heatmap"       element={<HeatmapPage />} />
              <Route path="/complaint/:id" element={<ComplaintDetail />} />
              <Route path="/create"        element={<ProtectedRoute><CreateComplaint /></ProtectedRoute>} />
              <Route path="/admin"         element={<ProtectedRoute adminOnly><AdminDashboard /></ProtectedRoute>} />
              <Route path="/profile"       element={<ProtectedRoute><Profile /></ProtectedRoute>} />
              <Route path="/community"     element={<Community />} />
              <Route path="*"              element={<Navigate to="/" />} />
            </Routes>
          </PageTransition>
          <Footer />
          <NotificationToast />
        </BrowserRouter>
      </NotificationsProvider>
    </AuthProvider>
  );
}
