import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';

// Fix default leaflet marker icons in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

function MapBoundsUpdater({ items }) {
  const map = useMap();

  useEffect(() => {
    const validCoords = items
      .filter((i) => i.lat && i.lng)
      .map((i) => [parseFloat(i.lat), parseFloat(i.lng)]);

    if (validCoords.length > 0) {
      const bounds = L.latLngBounds(validCoords);
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    }
  }, [items, map]);

  return null;
}

export default function MapView({ items, onSelectCheckin }) {
  const validItems = items.filter((i) => i.lat && i.lng && !isNaN(i.lat) && !isNaN(i.lng));

  const center = validItems.length > 0
    ? [parseFloat(validItems[0].lat), parseFloat(validItems[0].lng)]
    : [37.7749, -122.4194]; // Default SF

  return (
    <div className="w-full h-[450px] bg-slate-100 rounded-xl overflow-hidden border border-slate-200 shadow-sm relative z-0">
      <MapContainer center={center} zoom={12} scrollWheelZoom={true} className="w-full h-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapBoundsUpdater items={validItems} />
        {validItems.slice(0, 300).map((item) => (
          <Marker
            key={item.PK || item.id}
            position={[parseFloat(item.lat), parseFloat(item.lng)]}
          >
            <Popup>
              <div className="text-xs p-1 space-y-1">
                <p className="font-bold text-slate-900 text-sm leading-tight">{item.venueName}</p>
                {item.category && <p className="text-rose-600 font-medium">{item.category}</p>}
                {item.city && <p className="text-slate-500">{item.city}, {item.country}</p>}
                {item.shout && <p className="italic text-slate-700 bg-slate-50 p-1 rounded">"{item.shout}"</p>}
                <p className="text-[10px] text-slate-400">
                  {new Date(item.createdAt * 1000).toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </p>
                <button
                  onClick={() => onSelectCheckin(item)}
                  className="mt-1 text-[11px] font-semibold text-rose-600 hover:text-rose-700 underline block"
                >
                  View Details & Photos
                </button>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
