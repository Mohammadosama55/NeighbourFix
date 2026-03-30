import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import './Profile.css';

export default function Profile() {
  const { user, logout } = useAuth();
  const [form, setForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    wardNumber: user?.wardNumber || '',
    address: user?.address || '',
    password: '',
  });
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    const updates = { name: form.name, phone: form.phone, wardNumber: form.wardNumber, address: form.address };
    if (form.password) updates.password = form.password;
    try {
      await api.put('/auth/profile', updates);
      setSuccess('Profile updated successfully!');
      setForm(f => ({ ...f, password: '' }));
    } catch (err) {
      setError(err.response?.data?.message || 'Update failed.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="profile-page">
      <div className="container">
        <div className="profile-header card">
          <div className="profile-avatar">{user?.name?.charAt(0).toUpperCase()}</div>
          <div>
            <h1>{user?.name}</h1>
            <p>{user?.email}</p>
            <span className={`badge ${user?.role === 'ward_admin' ? 'badge-resolved' : 'badge-in_progress'}`}>
              {user?.role === 'ward_admin' ? '🛡️ Ward Admin' : '👤 Resident'}
            </span>
          </div>
        </div>

        <div className="profile-form card">
          <h2>Edit Profile</h2>
          <form onSubmit={handleSave}>
            <div className="form-row-2">
              <div className="form-group">
                <label>Full Name *</label>
                <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Phone</label>
                <input type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
              </div>
            </div>
            <div className="form-row-2">
              <div className="form-group">
                <label>Ward Number</label>
                <input type="text" value={form.wardNumber} onChange={e => setForm({ ...form, wardNumber: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Address</label>
                <input type="text" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} />
              </div>
            </div>
            <div className="form-group">
              <label>New Password (leave blank to keep current)</label>
              <input type="password" placeholder="••••••••" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
            </div>

            {success && <p style={{ color: 'var(--secondary)', marginBottom: 12, fontSize: 14 }}>✓ {success}</p>}
            {error && <p className="error-msg" style={{ marginBottom: 12 }}>{error}</p>}

            <div style={{ display: 'flex', gap: 12 }}>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? <><span className="spinner"></span> Saving…</> : 'Save Changes'}
              </button>
              <button type="button" className="btn btn-danger" onClick={logout}>Logout</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
