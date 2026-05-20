import { useState, useDeferredValue } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getSongs } from '../services/songService';
import { Music, Plus, Search, Hash, Lock, AlertCircle, LayoutGrid, List } from 'lucide-react';
import { Link } from 'react-router-dom';
import useAuthStore from '../store/authStore';

const CATEGORIES = ['Pre-Worship', 'Worship', 'Praise'];

function SongList() {
  const { user } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState(null);
  const [viewMode, setViewMode] = useState('cards'); // 'cards' or 'list'
  const deferredQuery = useDeferredValue(searchQuery);

  const { data: songs, isLoading, error } = useQuery({
    queryKey: ['songs', deferredQuery, activeCategory],
    queryFn: () => getSongs({ q: deferredQuery, category: activeCategory })
  });

  const isLimitReached = user?.plan === 'FREE' && (songs?.length >= 7);

  if (error) return <div className="p-8 text-center text-white">Error loading songs</div>;

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8 pb-32">
      <div className="space-y-2">
        <h1 className="text-4xl font-black text-white tracking-tight">Song Library</h1>
        <p className="text-zinc-500 font-medium">Manage your worship repertoire and setlists</p>
      </div>

      <div className="space-y-6">
        {/* Primary Search - Prominent at the top */}
        <div className="relative group">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-white transition-colors" size={24} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by title, artist, or lyrics..."
            className="w-full pl-14 pr-6 py-5 bg-zinc-900/50 border border-zinc-800 rounded-[2rem] focus:ring-2 focus:ring-white/10 focus:outline-none transition-all text-xl text-white placeholder:text-zinc-700"
          />
        </div>

        {/* Filters & Actions Row */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 lg:pb-0 scrollbar-hide">
            <button
              onClick={() => setActiveCategory(null)}
              className={`px-6 py-2.5 rounded-xl text-sm font-bold border transition-all whitespace-nowrap ${!activeCategory ? 'bg-white text-black border-white shadow-lg shadow-white/5' : 'bg-transparent text-zinc-500 border-zinc-800 hover:border-zinc-600'
                }`}
            >
              All Songs
            </button>
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat === activeCategory ? null : cat)}
                className={`px-6 py-2.5 rounded-xl text-sm font-bold border transition-all whitespace-nowrap ${activeCategory === cat ? 'bg-white text-black border-white shadow-lg shadow-white/5' : 'bg-transparent text-zinc-500 border-zinc-800 hover:border-zinc-600'
                  }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="flex w-fit bg-zinc-900 overflow-hidden rounded-xl p-1 border border-zinc-800">
            <button
              onClick={() => setViewMode('cards')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'cards' ? 'bg-white text-black shadow-lg' : 'text-zinc-500 hover:text-white'}`}
              title="Grid View"
            >
              <LayoutGrid size={20} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white text-black shadow-lg' : 'text-zinc-500 hover:text-white'}`}
              title="List View"
            >
              <List size={20} />
            </button>
          </div>
        </div>

        {isLimitReached && (
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-3xl p-6 flex items-start gap-4 animate-in slide-in-from-top duration-500">
            <div className="p-3 bg-amber-500/20 text-amber-500 rounded-2xl">
              <AlertCircle size={24} />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-black text-white italic tracking-tight">Song Limit Reached (7/7)</h3>
              <p className="text-zinc-400 text-sm mt-1">
                You've hit the maximum capacity for the FREE plan. Upgrade to <span className="text-white font-bold">Standard</span> for unlimited songs!
              </p>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-48 bg-zinc-900/50 rounded-3xl animate-pulse" />
            ))}
          </div>
        ) : viewMode === 'cards' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {songs?.map((song) => (
              <Link
                key={song.id}
                to={`/songs/${song.id}`}
                className="group relative flex flex-col p-6 bg-zinc-900 border border-zinc-800 rounded-[2rem] hover:border-zinc-500/50 hover:bg-zinc-800/20 transition-all duration-300"
              >
                <div className="flex items-start justify-between mb-6">
                  <div className="p-3 bg-black border border-zinc-800 text-zinc-400 rounded-2xl group-hover:bg-zinc-100 group-hover:text-black transition-all">
                    <Music size={24} />
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className="px-3 py-1 bg-zinc-950 text-white text-[10px] font-black rounded-lg border border-zinc-800 uppercase tracking-widest">
                      {song.key || 'TBD'}
                    </span>
                  </div>
                </div>

                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-white mb-1 group-hover:translate-x-1 transition-transform">
                    {song.title}
                  </h3>
                  <p className="text-zinc-500 text-sm">{song.artist || 'Unknown Artist'}</p>
                </div>

                <div className="mt-8 pt-4 border-t border-zinc-800/50 flex flex-wrap gap-2">
                  <span className="px-2.5 py-1 bg-zinc-950 text-zinc-400 text-[10px] font-bold rounded-lg border border-zinc-800 flex items-center gap-1 uppercase tracking-wider">
                    {song.category || 'Uncategorized'}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {songs?.map((song) => (
              <Link
                key={song.id}
                to={`/songs/${song.id}`}
                className="group flex items-center gap-4 px-6 py-4 bg-zinc-900/50 border border-zinc-800 rounded-2xl hover:border-zinc-600 hover:bg-zinc-900 transition-all"
              >
                <Music size={20} className="text-zinc-600 group-hover:text-white transition-colors" />
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-bold text-white truncate">{song.title}</h3>
                  <p className="text-xs text-zinc-500 truncate">{song.artist || 'Unknown Artist'}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="px-2.5 py-1 bg-black text-zinc-400 text-[10px] font-black rounded-lg border border-zinc-800 uppercase tracking-widest min-w-[3.5rem] text-center">
                    {song.key || 'TBD'}
                  </span>
                  <span className="hidden md:block px-2.5 py-1 bg-zinc-950 text-zinc-600 text-[9px] font-bold rounded-lg border border-zinc-800 uppercase tracking-widest whitespace-nowrap">
                    {song.category || 'Uncategorized'}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}

        {!isLoading && songs?.length === 0 && (
          <div className="text-center py-20 bg-zinc-900/20 border-2 border-dashed border-zinc-800 rounded-[3rem]">
            <Search className="mx-auto mb-4 text-zinc-700" size={48} />
            <h3 className="text-2xl font-bold text-zinc-500">No results found</h3>
            <p className="text-zinc-600 mt-2">Try adjusting your search query or filters</p>
          </div>
        )}
      </div>

      {/* Floating Action Button */}
      <Link
        to={isLimitReached ? '/pricing' : '/songs/new'}
        className={`fixed bottom-24 lg:bottom-12 right-6 lg:right-12 z-50 flex items-center justify-center gap-3 px-6 py-4 ${isLimitReached ? 'bg-zinc-800 text-zinc-500' : 'bg-white hover:bg-zinc-200 text-black'
          } rounded-[2rem] font-black uppercase text-sm tracking-widest transition-all shadow-[0_20px_50px_rgba(255,255,255,0.1)] hover:scale-105 active:scale-95 group overflow-hidden`}
      >
        <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/5 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
        {isLimitReached ? <Lock size={20} /> : <Plus size={20} />}
        <span>New Song</span>
      </Link>
    </div>
  );
}

export default SongList;
