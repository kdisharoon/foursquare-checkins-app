import React from 'react';
import { X, MapPin, Calendar, Tag, ExternalLink, Image, Heart, Award } from 'lucide-react';

export default function CheckinModal({ item, onClose }) {
  if (!item) return null;

  const raw = item.raw_data || {};
  const photos = raw.photos?.items || [];
  const dateStr = item.createdAt
    ? new Date(item.createdAt * 1000).toLocaleString(undefined, {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      })
    : 'Unknown Date';

  const venueUrl = raw.venue?.id ? `https://foursquare.com/v/${raw.venue.id}` : null;
  const likesCount = raw.likes?.count || 0;
  const isMayor = raw.isMayor || false;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-100 flex flex-col relative animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="sticky top-0 bg-white/95 backdrop-blur-sm border-b border-slate-100 p-4 flex items-center justify-between z-10">
          <div>
            <h2 className="text-xl font-bold text-slate-900">{item.venueName}</h2>
            <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>{dateStr}</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6">
          {/* Metadata badges */}
          <div className="flex flex-wrap gap-2 text-xs">
            {item.category && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 text-rose-700 font-medium border border-rose-100">
                <Tag className="w-3 h-3" />
                {item.category}
              </span>
            )}

            {item.city && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 font-medium border border-blue-100">
                <MapPin className="w-3 h-3" />
                {item.city}{item.country ? `, ${item.country}` : ''}
              </span>
            )}

            {isMayor && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-700 font-medium border border-amber-100">
                <Award className="w-3 h-3" />
                Mayor Check-in
              </span>
            )}

            {likesCount > 0 && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-pink-50 text-pink-700 font-medium border border-pink-100">
                <Heart className="w-3 h-3" />
                {likesCount} Likes
              </span>
            )}
          </div>

          {/* Shout comment */}
          {item.shout && (
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Shout / Note</p>
              <p className="text-slate-800 text-sm italic">"{item.shout}"</p>
            </div>
          )}

          {/* Photos Grid */}
          {photos.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Image className="w-4 h-4 text-slate-600" />
                <h3 className="text-sm font-bold text-slate-900">Photos ({photos.length})</h3>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {photos.map((photo, i) => (
                  <a
                    key={photo.id || i}
                    href={`${photo.prefix}original${photo.suffix}`}
                    target="_blank"
                    rel="noreferrer"
                    className="group rounded-xl overflow-hidden bg-slate-100 aspect-square block relative border border-slate-200"
                  >
                    <img
                      src={`${photo.prefix}500x500${photo.suffix}`}
                      alt={`Photo ${i + 1}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                      <ExternalLink className="w-5 h-5" />
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Venue & Location Details */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
            <h4 className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">Venue Information</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-600">
              <div>
                <span className="text-slate-400">Address:</span> {raw.venue?.location?.address || 'N/A'}
              </div>
              <div>
                <span className="text-slate-400">Coordinates:</span> {item.lat}, {item.lng}
              </div>
              <div>
                <span className="text-slate-400">Checkin ID:</span> {item.id}
              </div>
              {venueUrl && (
                <div>
                  <a
                    href={venueUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-rose-600 font-semibold hover:underline inline-flex items-center gap-1"
                  >
                    View on Foursquare <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
