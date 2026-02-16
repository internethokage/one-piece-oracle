'use client';

import { useState } from 'react';

interface SearchBarProps {
  onSearch: (query: string, method: 'semantic' | 'fulltext') => void;
  isSearching: boolean;
}

export default function SearchBar({ onSearch, isSearching }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [searchPanels, setSearchPanels] = useState(true);
  const [searchSBS, setSearchSBS] = useState(true);
  const [useAI, setUseAI] = useState(false);
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
          placeholder="Search for characters, arcs, or moments... (e.g., 'Luffy Gear Second')"
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
      
      <div className="flex items-center gap-4 mt-3 text-sm text-slate-400">
        <label className="flex items-center gap-2 cursor-pointer">
          <input 
            type="checkbox" 
            className="rounded" 
            checked={searchPanels}
            onChange={(e) => setSearchPanels(e.target.checked)}
          />
          <span>Search panels</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input 
            type="checkbox" 
            className="rounded"
            checked={searchSBS}
            onChange={(e) => setSearchSBS(e.target.checked)}
          />
          <span>Include SBS</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer hover:text-amber-400 transition-colors">
          <input 
            type="radio" 
            name="searchMethod"
            className="rounded-full" 
            checked={searchMethod === 'fulltext'}
            onChange={() => setSearchMethod('fulltext')}
          />
          <span>Fast Search (Free)</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer hover:text-amber-400 transition-colors">
          <input 
            type="radio" 
            name="searchMethod"
            className="rounded-full" 
            checked={searchMethod === 'semantic'}
            onChange={() => setSearchMethod('semantic')}
          />
          <span>AI Search (Pro) 🔒</span>
        </label>
      </div>
    </form>
  );
}
