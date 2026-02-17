'use client';

import { useState } from 'react';

interface SearchBarProps {
  onSearch: (query: string, method: 'semantic' | 'fulltext') => void;
  isSearching: boolean;
  isPro?: boolean;
}

export default function SearchBar({ onSearch, isSearching, isPro = false }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [searchMethod, setSearchMethod] = useState<'semantic' | 'fulltext'>('fulltext');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    onSearch(query, searchMethod);
  };

  return (
    <form onSubmit={handleSearch} className="relative">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search characters, arcs, or moments... (e.g., 'Luffy Gear Second')"
          className="w-full px-6 py-4 bg-slate-800 text-white rounded-xl border-2 border-slate-700 focus:border-amber-500 focus:outline-none placeholder-slate-500 text-lg"
          disabled={isSearching}
        />
        <button
          type="submit"
          disabled={isSearching || !query.trim()}
          className="absolute right-2 top-1/2 -translate-y-1/2 px-6 py-2 bg-amber-500 text-slate-900 font-semibold rounded-lg hover:bg-amber-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSearching ? 'Searching...' : 'Search'}
        </button>
      </div>

      {/* Search method toggle */}
      <div className="flex items-center gap-4 mt-3 text-sm text-slate-400 flex-wrap">
        <label className="flex items-center gap-2 cursor-pointer hover:text-white transition-colors">
          <input
            type="radio"
            name="searchMethod"
            checked={searchMethod === 'fulltext'}
            onChange={() => setSearchMethod('fulltext')}
            className="accent-amber-500"
          />
          <span>Fast Search (Free)</span>
        </label>

        <label
          className={`flex items-center gap-2 transition-colors ${
            isPro ? 'cursor-pointer hover:text-amber-400' : 'cursor-pointer hover:text-slate-300'
          }`}
          title={isPro ? 'Semantic AI search' : 'Requires Pro subscription'}
        >
          <input
            type="radio"
            name="searchMethod"
            checked={searchMethod === 'semantic'}
            onChange={() => setSearchMethod('semantic')}
            className="accent-amber-500"
          />
          <span className={isPro ? 'text-amber-300' : ''}>
            AI Search {isPro ? '✨' : '🔒'}
          </span>
          {!isPro && <span className="text-xs text-amber-600">(Pro)</span>}
        </label>
      </div>
    </form>
  );
}
