import React, { useEffect, useState, useMemo } from 'react';
import LoginGate from './components/LoginGate';
import Header from './components/Header';
import StatsBar from './components/StatsBar';
import LastCheckinCard from './components/LastCheckinCard';
import Filters from './components/Filters';
import MapView from './components/MapView';
import CheckinCard from './components/CheckinCard';
import CheckinModal from './components/CheckinModal';
import { LayoutGrid, Map, Loader2, ChevronDown } from 'lucide-react';

const CARDS_PAGE_SIZE = 48;

export default function App() {
  const [checkins, setCheckins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('split'); // 'split', 'map', 'grid'
  const [cardLimit, setCardLimit] = useState(CARDS_PAGE_SIZE);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedCheckin, setSelectedCheckin] = useState(null);

  const apiEndpoint = import.meta.env.VITE_SEARCH_API_URL || 'https://gitlrtgnfojlzrnha5wxanjdse0etfcv.lambda-url.us-east-1.on.aws/';

  const fetchCheckins = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('Fetching all check-ins from API:', apiEndpoint);
      const res = await fetch(`${apiEndpoint}?all=true`);
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      const data = await res.json();
      console.log(`Fetched ${data.count || (data.items || []).length} check-ins from backend.`);

      // Ensure reverse chronological sorting (newest first)
      const sorted = (data.items || []).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      setCheckins(sorted);
    } catch (err) {
      console.error('Fetch error:', err);
      setError(err.message || 'Unable to load check-ins from search API.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCheckins();
  }, [apiEndpoint]);

  // Derived filter options across full dataset
  const cities = useMemo(() => {
    const list = Array.from(new Set(checkins.map((i) => i.city).filter(Boolean)));
    return list.sort();
  }, [checkins]);

  const categories = useMemo(() => {
    const list = Array.from(new Set(checkins.map((i) => i.category).filter(Boolean)));
    return list.sort();
  }, [checkins]);

  // Filtered list (sorted newest first)
  const filteredCheckins = useMemo(() => {
    return checkins.filter((item) => {
      if (selectedCity && item.city !== selectedCity) return false;
      if (selectedCategory && item.category !== selectedCategory) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const venue = (item.venueName || '').toLowerCase();
        const shout = (item.shout || '').toLowerCase();
        const city = (item.city || '').toLowerCase();
        const category = (item.category || '').toLowerCase();
        if (!venue.includes(q) && !shout.includes(q) && !city.includes(q) && !category.includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [checkins, searchQuery, selectedCity, selectedCategory]);

  // Reset pagination when filters change
  useEffect(() => {
    setCardLimit(CARDS_PAGE_SIZE);
  }, [searchQuery, selectedCity, selectedCategory]);

  const latestCheckin = filteredCheckins.length > 0 ? filteredCheckins[0] : (checkins[0] || null);
  const displayedCards = useMemo(() => {
    return filteredCheckins.slice(0, cardLimit);
  }, [filteredCheckins, cardLimit]);

  return (
    <LoginGate>
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Header
          totalCount={filteredCheckins.length}
          onRefresh={fetchCheckins}
          loading={loading}
        />

        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          {/* Latest Check-in Highlight Card */}
          {latestCheckin && !loading && (
            <LastCheckinCard
              item={latestCheckin}
              onClick={() => setSelectedCheckin(latestCheckin)}
            />
          )}

          {/* Aggregate Stats across complete dataset */}
          <StatsBar items={filteredCheckins} />

          {/* Search & Facet Filters */}
          <Filters
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            selectedCity={selectedCity}
            setSelectedCity={setSelectedCity}
            categories={categories}
            cities={cities}
            onClear={() => {
              setSearchQuery('');
              setSelectedCity('');
              setSelectedCategory('');
            }}
          />

          {/* View Mode Controls */}
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider">
              {filteredCheckins.length.toLocaleString()} Check-ins {filteredCheckins.length > 0 ? '(Newest First)' : ''}
            </h2>
            <div className="flex bg-white p-1 rounded-lg border border-slate-200 text-xs shadow-sm">
              <button
                onClick={() => setViewMode('split')}
                className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                  viewMode === 'split' ? 'bg-rose-500 text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Split View
              </button>
              <button
                onClick={() => setViewMode('map')}
                className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                  viewMode === 'map' ? 'bg-rose-500 text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Map Only
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                  viewMode === 'grid' ? 'bg-rose-500 text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Cards Only
              </button>
            </div>
          </div>

          {/* Main Content Layout */}
          {loading ? (
            <div className="h-64 flex flex-col items-center justify-center text-slate-400 gap-3">
              <Loader2 className="w-9 h-9 animate-spin text-rose-500" />
              <p className="text-sm font-medium">Loading check-in history...</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 text-red-700 p-6 rounded-xl border border-red-200 text-center">
              <p className="font-semibold">{error}</p>
              <button
                onClick={fetchCheckins}
                className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg text-xs font-semibold hover:bg-red-700"
              >
                Retry
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {(viewMode === 'split' || viewMode === 'map') && (
                <MapView
                  items={filteredCheckins}
                  onSelectCheckin={(item) => setSelectedCheckin(item)}
                />
              )}

              {(viewMode === 'split' || viewMode === 'grid') && (
                <div>
                  {filteredCheckins.length === 0 ? (
                    <div className="bg-white p-12 text-center rounded-2xl border border-slate-200">
                      <p className="text-slate-500 text-sm">No check-ins match your current filters.</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {displayedCards.map((item) => (
                          <CheckinCard
                            key={item.PK || item.id}
                            item={item}
                            onClick={() => setSelectedCheckin(item)}
                          />
                        ))}
                      </div>

                      {cardLimit < filteredCheckins.length && (
                        <div className="text-center pt-2 pb-6">
                          <button
                            onClick={() => setCardLimit((prev) => prev + CARDS_PAGE_SIZE)}
                            className="inline-flex items-center gap-2 px-6 py-2.5 bg-white border border-slate-300 hover:border-rose-300 hover:bg-rose-50 text-slate-700 hover:text-rose-600 font-semibold text-sm rounded-xl shadow-sm transition-all"
                          >
                            <span>Load More Check-ins (Showing {displayedCards.length} of {filteredCheckins.length.toLocaleString()})</span>
                            <ChevronDown className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </main>

        <CheckinModal
          item={selectedCheckin}
          onClose={() => setSelectedCheckin(null)}
        />
      </div>
    </LoginGate>
  );
}
