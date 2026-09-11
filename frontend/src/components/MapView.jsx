import React, { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';

function MapBoundsUpdater({ items }) {
  const map = useMap();

  useEffect(() => {
    const validCoords = items
      .filter((i) => i.lat && i.lng && !isNaN(i.lat) && !isNaN(i.lng))
      .slice(0, 1000)
      .map((i) => [parseFloat(i.lat), parseFloat(i.lng)]);

    if (validCoords.length > 0) {
      const bounds = L.latLngBounds(validCoords);
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
    }
  }, [items, map]);

  return null;
}

export default function MapView({ items, onSelectCheckin }) {
  const validItems = useMemo(() => {
    return items.filter((i) => i.lat && i.lng && !isNaN(i.lat) && !isNaN(i.lng));
  }, [items]);

  const center = validItems.length > 0
    ? [parseFloat(validItems[0].lat), parseFloat(validItems[0].lng)]
    : [40.4406, -79.9959];

  return (
    <div className="w-full h-[480px] bg-slate-100 rounded-2xl overflow-hidden border border-slate-200 shadow-sm relative z-0">
      <MapContainer
        center={center}
        zoom={12}
        scrollWheelZoom={true}
        preferCanvas={true}
        className="w-full h-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapBoundsUpdater items={validItems} />

        {validItems.map((item) => (
          <CircleMarker
            key={item.PK || item.id}
            center={[parseFloat(item.lat), parseFloat(item.lng)]}
            radius={item.hasPhotos ? 6 : 4.5}
            pathOptions={{
              color: item.hasPhotos ? '#E11D48' : '#FA4778',
              fillColor: item.hasPhotos ? '#BE123C' : '#FB7185',
              fillOpacity: 0.75,
              weight: 1.5,
            }}
          >
            <Popup>
              <div className="text-xs p-1 space-y-1 min-w-[180px]">
                <p className="font-bold text-slate-900 text-sm leading-tight">{item.venueName}</p>
                {item.category && <p className="text-rose-600 font-medium">{item.category}</p>}
                {item.city && <p className="text-slate-500">{item.city}{item.country ? `, ${item.country}` : ''}</p>}
                {item.shout && (
                  <p className="italic text-slate-700 bg-slate-50 p-1.5 rounded border border-slate-100">
                    "{item.shout}"
                  </p>
                )}
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
                  View Full Details & Photos
                </button>
              </div>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  );
}
