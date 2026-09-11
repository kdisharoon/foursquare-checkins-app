import React from 'react';
import { MapPin, Globe, Tag, Image } from 'lucide-react';

export default function StatsBar({ items }) {
  const total = items.length;
  const uniqueVenues = new Set(items.map((i) => i.venueId || i.venueName).filter(Boolean)).size;
  const uniqueCities = new Set(items.map((i) => i.city).filter(Boolean)).size;
  const withPhotos = items.filter((i) => i.hasPhotos).length;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4">
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
          <MapPin className="w-5 h-5" />
        </div>
        <div>
          <p className="text-xs text-slate-500 font-medium">Venues</p>
          <p className="text-lg font-bold text-slate-900 leading-tight">{uniqueVenues.toLocaleString()}</p>
        </div>
      </div>

      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
          <Globe className="w-5 h-5" />
        </div>
        <div>
          <p className="text-xs text-slate-500 font-medium">Cities</p>
          <p className="text-lg font-bold text-slate-900 leading-tight">{uniqueCities.toLocaleString()}</p>
        </div>
      </div>

      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
          <Tag className="w-5 h-5" />
        </div>
        <div>
          <p className="text-xs text-slate-500 font-medium">Total Check-ins</p>
          <p className="text-lg font-bold text-slate-900 leading-tight">{total.toLocaleString()}</p>
        </div>
      </div>

      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
          <Image className="w-5 h-5" />
        </div>
        <div>
          <p className="text-xs text-slate-500 font-medium">With Photos</p>
          <p className="text-lg font-bold text-slate-900 leading-tight">{withPhotos.toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
}
