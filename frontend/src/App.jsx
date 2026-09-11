import React, { useEffect, useState, useMemo } from 'react';
import LoginGate from './components/LoginGate';
import Header from './components/Header';
import StatsBar from './components/StatsBar';
import Filters from './components/Filters';
import MapView from './components/MapView';
import CheckinCard from './components/CheckinCard';
import CheckinModal from './components/CheckinModal';
import { LayoutGrid, Map, Loader2 } from 'lucide-react';

export default function App() {
  const [checkins, setCheckins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('split'); // 'split', 'map', 'grid'

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedCheckin, setSelectedCheckin] = useState(null);

  const apiEndpoint = import.meta.env.VITE_SEARCH_API_URL || 'https://gitlrtgnfojlzrnha5wxanjdse0etfcv.lambda-url.us-east-1.on.aws/';

  const fetchCheckins = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('Fetching check-ins from API:', apiEndpoint);
      const res = await fetch(`${apiEndpoint}?limit=250`);
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      const data = await res.json();
      console.log('Fetched check-ins response:', data);
      setCheckins(data.items || []);
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

  // Derived filter options
  const cities = useMemo(() => {
    const list = Array.from(new Set(checkins.map((i) => i.city).filter(Boolean)));
    return list.sort();
  }, [checkins]);

  const categories = useMemo(() => {
    const list = Array.from(new Set(checkins.map((i) => i.category).filter(Boolean)));
    return list.sort();
  }, [checkins]);

  // Filtered list
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

  return (
    <LoginGate>
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Header
          totalCount={filteredCheckins.length}
          onRefresh={fetchCheckins}
          loading={loading}
        />

        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          <StatsBar items={filteredCheckins} />

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

          {/* View Mode Toggle */}
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider">
              Check-ins ({filteredCheckins.length})
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
            <div className="h-64 flex flex-col items-center justify-center text-slate-400 gap-2">
              <Loader2 className="w-8 h-8 animate-spin text-rose-500" />
              <p className="text-sm">Loading your check-ins...</p>
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
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {filteredCheckins.map((item) => (
                        <CheckinCard
                          key={item.PK || item.id}
                          item={item}
                          onClick={() => setSelectedCheckin(item)}
                        />
                      ))}
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
