import React from 'react';
import { MapPin, Calendar, Tag, MessageSquare, Image, ChevronRight } from 'lucide-react';

export default function CheckinCard({ item, onClick }) {
  const dateStr = item.createdAt
    ? new Date(item.createdAt * 1000).toLocaleDateString(undefined, {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : 'Unknown Date';

  const rawPhotos = item.raw_data?.photos?.items || [];
  const previewPhoto = rawPhotos.length > 0
    ? `${rawPhotos[0].prefix}300x300${rawPhotos[0].suffix}`
    : null;

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-xl border border-slate-200 p-4 hover:border-rose-300 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
    >
      <div>
        {previewPhoto && (
          <div className="w-full h-36 rounded-lg overflow-hidden mb-3 bg-slate-100">
            <img
              src={previewPhoto}
              alt={item.venueName}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
          </div>
        )}

        <div className="flex items-start justify-between gap-2 mb-1.5">
          <h3 className="font-bold text-slate-900 group-hover:text-rose-600 transition-colors leading-snug">
            {item.venueName || 'Unknown Venue'}
          </h3>
          {item.hasPhotos && (
            <span className="p-1 bg-emerald-50 text-emerald-600 rounded-md shrink-0" title="Has photos">
              <Image className="w-3.5 h-3.5" />
            </span>
          )}
        </div>

        {item.category && (
          <div className="flex items-center gap-1.5 text-xs font-medium text-rose-600 mb-2">
            <Tag className="w-3 h-3 shrink-0" />
            <span className="truncate">{item.category}</span>
          </div>
        )}

        {item.city && (
          <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-2">
            <MapPin className="w-3 h-3 shrink-0 text-slate-400" />
            <span className="truncate">{item.city}{item.country ? `, ${item.country}` : ''}</span>
          </div>
        )}

        {item.shout && (
          <div className="bg-slate-50 p-2 rounded-lg text-xs text-slate-600 italic mb-2 border border-slate-100 line-clamp-2">
            "{item.shout}"
          </div>
        )}
      </div>

      <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400 mt-2">
        <div className="flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          <span>{dateStr}</span>
        </div>
        <span className="text-slate-300 group-hover:text-rose-600 transition-colors">
          <ChevronRight className="w-4 h-4" />
        </span>
      </div>
    </div>
  );
}
