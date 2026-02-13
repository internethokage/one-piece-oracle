import SearchBar from '@/components/SearchBar';
import PanelGrid from '@/components/PanelGrid';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-blue-950 to-slate-900">
      {/* Header */}
      <header className="border-b border-amber-500/20 bg-slate-900/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-4xl">🏴‍☠️</div>
              <div>
                <h1 className="text-2xl font-bold text-amber-400">One Piece Oracle</h1>
                <p className="text-sm text-slate-400">Search 1000+ chapters with AI-powered precision</p>
              </div>
            </div>
            <button className="px-4 py-2 bg-amber-500 text-slate-900 font-semibold rounded-lg hover:bg-amber-400 transition-colors">
              Sign In
            </button>
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
            RAG-powered search engine for One Piece manga. Get accurate answers with exact panel citations.
          </p>
          
          {/* Search Bar */}
          <SearchBar />

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

        {/* Example Queries */}
        <div className="max-w-3xl mx-auto mb-12">
          <h3 className="text-lg font-semibold text-slate-300 mb-4">Try searching for:</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              "Luffy's Gear Second first appearance",
              "All members of the Worst Generation",
              "Zoro's swords timeline",
              "Going Merry farewell scene"
            ].map((query) => (
              <button
                key={query}
                className="px-4 py-3 bg-slate-800/50 hover:bg-slate-800 text-left text-slate-300 rounded-lg border border-slate-700 hover:border-amber-500/50 transition-all"
              >
                "{query}"
              </button>
            ))}
          </div>
        </div>

        {/* Panel Grid (placeholder for now) */}
        <PanelGrid panels={[]} />

        {/* Pricing Teaser */}
        <div className="max-w-4xl mx-auto mt-16 p-8 bg-gradient-to-r from-amber-900/20 to-blue-900/20 rounded-2xl border border-amber-500/20">
          <div className="text-center">
            <h3 className="text-3xl font-bold text-white mb-3">Want AI-Powered Answers?</h3>
            <p className="text-slate-300 mb-6">
              Upgrade to <span className="text-amber-400 font-semibold">Pro</span> for LLM-powered Q&A and agent-generated reports.
            </p>
            <div className="flex items-center justify-center gap-6 mb-6">
              <div className="text-center">
                <div className="text-4xl font-bold text-white">$5</div>
                <div className="text-sm text-slate-400">per month</div>
              </div>
              <div className="h-12 w-px bg-slate-600"></div>
              <ul className="text-left text-slate-300 space-y-2">
                <li>✨ AI answers with citations</li>
                <li>📊 Agent-generated reports</li>
                <li>🔍 Advanced theory validation</li>
              </ul>
            </div>
            <button className="px-8 py-3 bg-amber-500 text-slate-900 font-bold rounded-lg hover:bg-amber-400 transition-colors">
              Upgrade to Pro
            </button>
          </div>
        </div>
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
    </div>
  );
}
