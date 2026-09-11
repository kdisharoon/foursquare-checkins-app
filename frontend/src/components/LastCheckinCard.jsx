import React from 'react';
import { MapPin, Calendar, Clock, Tag, MessageSquare, Image, Sparkles, ChevronRight } from 'lucide-react';

function getRelativeTime(timestamp) {
  if (!timestamp) return '';
  const now = Math.floor(Date.now() / 1000);
  const diff = now - timestamp;
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  if (diff < 2592000) return `${Math.floor(diff / 604800)}w ago`;
  if (diff < 31536000) return `${Math.floor(diff / 2592000)}mo ago`;
  return `${Math.floor(diff / 31536000)}y ago`;
}

export default function LastCheckinCard({ item, onClick }) {
  if (!item) return null;

  const dateStr = item.createdAt
    ? new Date(item.createdAt * 1000).toLocaleString(undefined, {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      })
    : 'Unknown Date';

  const relativeTime = getRelativeTime(item.createdAt);

  const rawPhotos = item.raw_data?.photos?.items || [];
  const previewPhoto = rawPhotos.length > 0
    ? `${rawPhotos[0].prefix}300x300${rawPhotos[0].suffix}`
    : null;

  return (
    <div
      onClick={onClick}
      className="bg-gradient-to-r from-rose-500 via-pink-600 to-indigo-600 rounded-2xl p-0.5 shadow-lg shadow-rose-500/10 hover:shadow-xl hover:shadow-rose-500/20 transition-all cursor-pointer group"
    >
      <div className="bg-white rounded-[14px] p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
        <div className="flex items-start sm:items-center gap-4 flex-1">
          {previewPhoto ? (
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-slate-100 shrink-0 border border-slate-200">
              <img
                src={previewPhoto}
                alt={item.venueName}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </div>
          ) : (
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-gradient-to-tr from-rose-100 to-pink-100 text-rose-600 flex items-center justify-center shrink-0 shadow-inner">
              <MapPin className="w-7 h-7" />
            </div>
          )}

          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-rose-50 text-rose-700 border border-rose-200">
                <Sparkles className="w-3 h-3 text-rose-500" />
                Latest Check-in
              </span>
              {relativeTime && (
                <span className="text-xs font-semibold text-slate-400">
                  {relativeTime}
                </span>
              )}
            </div>

            <h3 className="text-lg sm:text-xl font-bold text-slate-900 group-hover:text-rose-600 transition-colors truncate">
              {item.venueName}
            </h3>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
              {item.category && (
                <span className="flex items-center gap-1 font-medium text-rose-600">
                  <Tag className="w-3 h-3" />
                  {item.category}
                </span>
              )}
              {item.city && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-slate-400" />
                  {item.city}{item.country ? `, ${item.country}` : ''}
                </span>
              )}
              <span className="flex items-center gap-1 text-slate-400">
                <Calendar className="w-3 h-3" />
                {dateStr}
              </span>
            </div>

            {item.shout && (
              <p className="text-xs italic text-slate-700 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-100 mt-1 line-clamp-1">
                "{item.shout}"
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center text-xs font-semibold text-rose-600 group-hover:text-rose-700 bg-rose-50 group-hover:bg-rose-100 px-3.5 py-2 rounded-xl transition-colors shrink-0">
          <span>View Details</span>
          <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
        </div>
      </div>
    </div>
  );
}
