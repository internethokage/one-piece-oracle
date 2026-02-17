'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import SearchBar from '@/components/SearchBar';
import PanelGrid from '@/components/PanelGrid';
import AskQuestion from '@/components/AskQuestion';
import AuthModal from '@/components/AuthModal';
import UserMenu from '@/components/UserMenu';

interface Panel {
  id: string;
  chapter_number: number;
  chapter_title?: string;
  page_number: number;
  panel_number: number;
  image_url: string;
  dialogue?: string;
  characters?: string[];
  similarity?: number;
}

interface SBSEntry {
  id: string;
  volume: number;
  question: string;
  answer: string;
  similarity?: number;
}

interface SearchResults {
  panels: Panel[];
  sbs: SBSEntry[];
}

export default function Home() {
  const { user, isPro, isLoading } = useAuth();
  const [searchResults, setSearchResults] = useState<SearchResults>({ panels: [], sbs: [] });
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Auth modal state
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<'signin' | 'signup'>('signin');

  // Checkout notification state
  const [checkoutNotice, setCheckoutNotice] = useState<string | null>(null);

  // Handle checkout return params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('checkout') === 'success') {
      setCheckoutNotice('🎉 Welcome to Pro! Your subscription is now active.');
      window.history.replaceState({}, '', '/');
    } else if (params.get('checkout') === 'cancelled') {
      setCheckoutNotice('Checkout cancelled. Upgrade anytime to unlock Pro features.');
      window.history.replaceState({}, '', '/');
    }
  }, []);

  const handleSearch = async (query: string, method: 'semantic' | 'fulltext') => {
    if (!query.trim()) return;

    // Gate semantic search behind Pro
    if (method === 'semantic' && !isPro) {
      setAuthModalTab('signup');
      setAuthModalOpen(true);
      return;
    }

    setSearchQuery(query);
    setIsSearching(true);

    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, method }),
      });

      const data = await response.json();

      if (data.success) {
        setSearchResults(data.results);
      } else {
        console.error('Search failed:', data.error);
      }
    } catch (error) {
      console.error('Search request failed:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleUpgradeClick = async () => {
    if (!user) {
      // Need to sign in first
      setAuthModalTab('signup');
      setAuthModalOpen(true);
      return;
    }

    // Kick off Stripe checkout
    try {
      const response = await fetch('/api/checkout', { method: 'POST' });
      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Checkout failed:', error);
    }
  };

  const openSignIn = () => {
    setAuthModalTab('signin');
    setAuthModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-blue-950 to-slate-900">
      {/* Checkout notice banner */}
      {checkoutNotice && (
        <div className="bg-amber-500 text-slate-900 px-4 py-3 text-center text-sm font-semibold flex items-center justify-center gap-2">
          <span>{checkoutNotice}</span>
          <button
            onClick={() => setCheckoutNotice(null)}
            className="ml-2 opacity-70 hover:opacity-100"
          >
            ✕
          </button>
        </div>
      )}

      {/* Header */}
      <header className="border-b border-amber-500/20 bg-slate-900/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-4xl">🏴‍☠️</div>
              <div>
                <h1 className="text-2xl font-bold text-amber-400">One Piece Oracle</h1>
                <p className="text-xs text-slate-400">Search 1000+ chapters with AI precision</p>
              </div>
            </div>

            {/* Auth area */}
            {isLoading ? (
              <div className="w-8 h-8 rounded-full bg-slate-700 animate-pulse" />
            ) : user ? (
              <UserMenu onUpgradeClick={handleUpgradeClick} />
            ) : (
              <div className="flex items-center gap-3">
                <button
                  onClick={openSignIn}
                  className="px-4 py-2 text-slate-300 hover:text-white transition-colors text-sm font-medium"
                >
                  Sign In
                </button>
                <button
                  onClick={() => { setAuthModalTab('signup'); setAuthModalOpen(true); }}
                  className="px-4 py-2 bg-amber-500 text-slate-900 font-semibold rounded-lg hover:bg-amber-400 transition-colors text-sm"
                >
                  Get Started Free
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto text-center mb-12">
          <h2 className="text-5xl font-bold text-white mb-4">
            Find Any Panel. <span className="text-amber-400">Ask Anything.</span>
          </h2>
          <p className="text-xl text-slate-300 mb-8">
            RAG-powered search engine for One Piece manga. Get accurate answers with exact panel
            citations.
          </p>

          {/* Search Bar */}
          <SearchBar onSearch={handleSearch} isSearching={isSearching} isPro={isPro} />

          {/* Feature Pills */}
          <div className="flex flex-wrap justify-center gap-3 mt-8">
            <span className="px-4 py-2 bg-blue-900/50 text-blue-300 rounded-full text-sm border border-blue-700/50">
              📖 1000+ Chapters Indexed
            </span>
            <span className="px-4 py-2 bg-amber-900/50 text-amber-300 rounded-full text-sm border border-amber-700/50">
              🤖 AI-Powered Answers
            </span>
            <span className="px-4 py-2 bg-purple-900/50 text-purple-300 rounded-full text-sm border border-purple-700/50">
              📚 SBS Q&A Database
            </span>
          </div>
        </div>

        {/* Default state (no search results) */}
        {searchResults.panels.length === 0 && searchResults.sbs.length === 0 && !isSearching && (
          <>
            {/* Example Queries */}
            <div className="max-w-3xl mx-auto mb-12">
              <h3 className="text-lg font-semibold text-slate-300 mb-4">Try searching for:</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  "Luffy's Gear Second first appearance",
                  'All members of the Worst Generation',
                  "Zoro's swords timeline",
                  'Going Merry farewell scene',
                ].map((query) => (
                  <button
                    key={query}
                    onClick={() => handleSearch(query, 'fulltext')}
                    className="px-4 py-3 bg-slate-800/50 hover:bg-slate-800 text-left text-slate-300 rounded-lg border border-slate-700 hover:border-amber-500/50 transition-all"
                  >
                    &quot;{query}&quot;
                  </button>
                ))}
              </div>
            </div>

            {/* Ask AI Question — Pro feature */}
            <AskQuestion isPro={isPro} onSignInRequired={openSignIn} />
          </>
        )}

        {/* Search Results */}
        {(searchResults.panels.length > 0 || searchResults.sbs.length > 0) && (
          <div className="max-w-6xl mx-auto">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold text-white mb-1">
                  Results for &quot;{searchQuery}&quot;
                </h3>
                <p className="text-slate-400">
                  Found {searchResults.panels.length} panels and {searchResults.sbs.length} SBS
                  entries
                </p>
              </div>
              <button
                onClick={() => setSearchResults({ panels: [], sbs: [] })}
                className="text-sm text-slate-400 hover:text-white transition-colors"
              >
                Clear results
              </button>
            </div>

            {/* SBS Results */}
            {searchResults.sbs.length > 0 && (
              <div className="mb-8">
                <h4 className="text-xl font-semibold text-amber-400 mb-4">📚 SBS Entries</h4>
                <div className="space-y-4">
                  {searchResults.sbs.map((entry) => (
                    <div
                      key={entry.id}
                      className="bg-slate-800/50 rounded-lg border border-slate-700 p-6"
                    >
                      <div className="text-xs text-amber-400 font-semibold mb-2">
                        Volume {entry.volume}
                        {entry.similarity && (
                          <span className="ml-3 text-slate-400">
                            {Math.round(entry.similarity * 100)}% match
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-blue-300 mb-2 font-semibold">
                        Q: {entry.question}
                      </div>
                      <div className="text-sm text-slate-300">A: {entry.answer}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Panel Results */}
            {searchResults.panels.length > 0 && (
              <div>
                <h4 className="text-xl font-semibold text-amber-400 mb-4">📖 Manga Panels</h4>
                <PanelGrid panels={searchResults.panels} />
              </div>
            )}
          </div>
        )}

        {/* Loading State */}
        {isSearching && (
          <div className="text-center py-16">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mb-4" />
            <p className="text-slate-400">Searching the Grand Line...</p>
          </div>
        )}

        {/* Pricing CTA (unauthenticated users) */}
        {!user && !isLoading && (
          <div className="max-w-4xl mx-auto mt-16 p-8 bg-gradient-to-r from-amber-900/20 to-blue-900/20 rounded-2xl border border-amber-500/20">
            <div className="text-center">
              <h3 className="text-3xl font-bold text-white mb-3">
                Want AI-Powered Answers?
              </h3>
              <p className="text-slate-300 mb-6">
                Upgrade to{' '}
                <span className="text-amber-400 font-semibold">Pro</span> for LLM-powered Q&amp;A
                and agent-generated reports.
              </p>
              <div className="flex items-center justify-center gap-6 mb-6 flex-wrap">
                <div className="text-center">
                  <div className="text-4xl font-bold text-white">$5</div>
                  <div className="text-sm text-slate-400">per month</div>
                </div>
                <div className="h-12 w-px bg-slate-600 hidden sm:block" />
                <ul className="text-left text-slate-300 space-y-2">
                  <li>✨ AI answers with citations</li>
                  <li>📊 Agent-generated reports</li>
                  <li>🔍 Advanced theory validation</li>
                </ul>
              </div>
              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={() => { setAuthModalTab('signup'); setAuthModalOpen(true); }}
                  className="px-8 py-3 bg-amber-500 text-slate-900 font-bold rounded-lg hover:bg-amber-400 transition-colors"
                >
                  Get Started Free
                </button>
                <button
                  onClick={handleUpgradeClick}
                  className="px-8 py-3 border border-amber-500 text-amber-400 font-bold rounded-lg hover:bg-amber-500/10 transition-colors"
                >
                  Upgrade to Pro →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Upgrade CTA (free authenticated users) */}
        {user && !isPro && (
          <div className="max-w-4xl mx-auto mt-16 p-6 bg-gradient-to-r from-amber-900/20 to-purple-900/20 rounded-xl border border-amber-500/20 flex items-center justify-between gap-4">
            <div>
              <p className="text-white font-semibold">Unlock the full Oracle</p>
              <p className="text-slate-400 text-sm">
                AI answers, agent reports, semantic search — all for $5/mo
              </p>
            </div>
            <button
              onClick={handleUpgradeClick}
              className="shrink-0 px-6 py-2.5 bg-amber-500 text-slate-900 font-bold rounded-lg hover:bg-amber-400 transition-colors"
            >
              Upgrade to Pro
            </button>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-amber-500/20 bg-slate-900/80 mt-16">
        <div className="container mx-auto px-4 py-6 text-center text-slate-400 text-sm">
          <p>
            All content © Eiichiro Oda / Shueisha. For educational and reference purposes only.
          </p>
          <p className="mt-2">
            Built with ❤️ by fans, for fans. Not affiliated with Shueisha or VIZ Media.
          </p>
        </div>
      </footer>

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        defaultTab={authModalTab}
      />
    </div>
  );
}
