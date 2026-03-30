import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import './CreateComplaint.css';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

function LocationPicker({ onSelect }) {
  useMapEvents({
    click(e) {
      onSelect([e.latlng.lat, e.latlng.lng]);
    },
  });
  return null;
}

export default function CreateComplaint() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: '', description: '', category: 'road', wardNumber: user?.wardNumber || '', address: '',
  });
  const [coords, setCoords] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [gpsLoading, setGpsLoading] = useState(false);

  const useGPS = () => {
    if (!navigator.geolocation) { setError('Geolocation not supported.'); return; }
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      pos => { setCoords([pos.coords.latitude, pos.coords.longitude]); setGpsLoading(false); },
      () => { setError('Could not get location. Please click on the map.'); setGpsLoading(false); }
    );
  };

  const handlePhotos = (e) => {
    const files = Array.from(e.target.files);
    setPhotos(files);
    setPreviews(files.map(f => URL.createObjectURL(f)));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!coords) { setError('Please select a location on the map or use GPS.'); return; }
    if (!form.wardNumber) { setError('Ward number is required.'); return; }

    setLoading(true);
    setError('');

    const data = new FormData();
    Object.entries(form).forEach(([k, v]) => data.append(k, v));
    data.append('location', JSON.stringify({ type: 'Point', coordinates: [coords[1], coords[0]] }));
    photos.forEach(p => data.append('photos', p));

    try {
      const res = await api.post('/complaints', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      navigate(`/complaint/${res.data._id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit complaint.');
    } finally {
      setLoading(false);
    }
  };

  const mapCenter = coords || [28.4595, 77.0266];

  return (
    <div className="create-page">
      <div className="container">
        <h1 className="page-title">📋 Report a Civic Issue</h1>

        <div className="create-grid">
          <form onSubmit={handleSubmit} className="create-form card">
            <div className="form-group">
              <label>Issue Title *</label>
              <input type="text" placeholder="e.g. Large pothole on Main Street"
                value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required maxLength={120} />
            </div>

            <div className="form-row-2">
              <div className="form-group">
                <label>Category *</label>
                <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                  <option value="road">🛣️ Road</option>
                  <option value="water">💧 Water</option>
                  <option value="garbage">🗑️ Garbage</option>
                  <option value="drainage">🚿 Drainage</option>
                  <option value="power">⚡ Power</option>
                  <option value="other">📋 Other</option>
                </select>
              </div>
              <div className="form-group">
                <label>Ward Number *</label>
                <input type="text" placeholder="e.g. 12"
                  value={form.wardNumber} onChange={e => setForm({ ...form, wardNumber: e.target.value })} required />
              </div>
            </div>

            <div className="form-group">
              <label>Description *</label>
              <textarea placeholder="Describe the issue in detail…"
                value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} required rows={4} />
            </div>

            <div className="form-group">
              <label>Address / Landmark</label>
              <input type="text" placeholder="Near clock tower, opposite school…"
                value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} />
            </div>

            <div className="form-group">
              <label>Photos (up to 5)</label>
              <input type="file" accept="image/*" multiple onChange={handlePhotos} />
              {previews.length > 0 && (
                <div className="photo-previews">
                  {previews.map((p, i) => <img key={i} src={p} alt="" />)}
                </div>
              )}
            </div>

            {error && <p className="error-msg" style={{ marginBottom: 12 }}>{error}</p>}

            <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
              {loading ? <><span className="spinner"></span> Submitting…</> : '📤 Submit Complaint'}
            </button>
          </form>

          <div className="location-panel card">
            <div className="loc-header">
              <h3>📍 Select Location</h3>
              <button type="button" className="btn btn-outline btn-sm" onClick={useGPS} disabled={gpsLoading}>
                {gpsLoading ? <span className="spinner spinner-dark"></span> : '🎯 Use My GPS'}
              </button>
            </div>
            <p className="loc-hint">Click on the map to pin the issue location</p>
            {coords && <p className="loc-coords">Lat: {coords[0].toFixed(5)}, Lng: {coords[1].toFixed(5)}</p>}

            <MapContainer center={mapCenter} zoom={13} style={{ height: 360, borderRadius: 8, marginTop: 12 }}>
              <TileLayer
                attribution='&copy; OpenStreetMap'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <LocationPicker onSelect={setCoords} />
              {coords && <Marker position={coords} />}
            </MapContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
