import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { Link } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const statusColors = {
  reported: '#ef4444',
  in_progress: '#f59e0b',
  resolved: '#10b981',
  rejected: '#6b7280',
};

function createIcon(status) {
  const color = statusColors[status] || '#3b82f6';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 36" width="24" height="36">
    <path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 24 12 24s12-15 12-24C24 5.4 18.6 0 12 0z" fill="${color}"/>
    <circle cx="12" cy="12" r="5" fill="white"/>
  </svg>`;
  return L.divIcon({
    html: svg,
    className: '',
    iconSize: [24, 36],
    iconAnchor: [12, 36],
    popupAnchor: [0, -36],
  });
}

function FlyTo({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.flyTo(center, 13, { duration: 1 });
  }, [center, map]);
  return null;
}

export default function MapView({ complaints, center, height = '420px' }) {
  const defaultCenter = center || [28.4595, 77.0266];

  return (
    <MapContainer center={defaultCenter} zoom={12} style={{ height, width: '100%', borderRadius: '10px' }}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {center && <FlyTo center={center} />}
      {complaints.map(c => {
        if (!c.location?.coordinates) return null;
        const [lng, lat] = c.location.coordinates;
        return (
          <Marker key={c._id} position={[lat, lng]} icon={createIcon(c.status)}>
            <Popup>
              <div style={{ minWidth: 180 }}>
                <strong style={{ fontSize: 14 }}>{c.title}</strong>
                <br />
                <span style={{ fontSize: 12, color: '#64748b' }}>{c.category} • Ward {c.wardNumber}</span>
                <br />
                <span style={{ fontSize: 12 }}>▲ {c.upvotes} upvotes</span>
                <br />
                <Link to={`/complaint/${c._id}`} style={{ fontSize: 12, color: '#2563eb', marginTop: 4, display: 'inline-block' }}>
                  View details →
                </Link>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
