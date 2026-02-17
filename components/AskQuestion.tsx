'use client';

import { useState } from 'react';

interface Citation {
  type: 'panel' | 'sbs';
  chapter?: number;
  page?: number;
  panel?: number;
  title?: string;
  volume?: number;
  question?: string;
}

interface Answer {
  question: string;
  answer: string;
  citations: Citation[];
  model: string;
}

export default function AskQuestion() {
  const [question, setQuestion] = useState('');
  const [isAsking, setIsAsking] = useState(false);
  const [answer, setAnswer] = useState<Answer | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAsk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;

    setIsAsking(true);
    setError(null);
    setAnswer(null);

    try {
      const response = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          question,
          user_tier: 'free' // TODO: Get from auth context
        }),
      });

      const data = await response.json();

      if (data.success) {
        setAnswer(data);
      } else {
        setError(data.error || 'Failed to get answer');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Ask failed:', err);
    } finally {
      setIsAsking(false);
    }
  };

  const exampleQuestions = [
    "What is the Will of D?",
    "How does Gear Second work?",
    "Who are the Yonko?",
    "What happened at Marineford?",
  ];

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 rounded-2xl border border-purple-500/30 p-8 mb-12">
        <div className="flex items-start gap-4 mb-6">
          <div className="text-4xl">🤖</div>
          <div>
            <h3 className="text-2xl font-bold text-white mb-2">Ask the Oracle</h3>
            <p className="text-slate-300">
              Get AI-powered answers with citations from the manga and SBS entries.
            </p>
          </div>
        </div>

        <form onSubmit={handleAsk} className="mb-6">
          <div className="relative">
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask any One Piece question... (e.g., 'What is the Will of D?')"
              rows={3}
              className="w-full px-4 py-3 bg-slate-800 text-white rounded-lg border-2 border-slate-700 focus:border-purple-500 focus:outline-none placeholder-slate-500 resize-none"
              disabled={isAsking}
            />
            <button
              type="submit"
              disabled={isAsking || !question.trim()}
              className="absolute right-2 bottom-2 px-6 py-2 bg-purple-500 text-white font-semibold rounded-lg hover:bg-purple-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isAsking ? 'Thinking...' : 'Ask Oracle'}
            </button>
          </div>
        </form>

        {/* Example Questions */}
        <div className="mb-6">
          <p className="text-sm text-slate-400 mb-2">Example questions:</p>
          <div className="flex flex-wrap gap-2">
            {exampleQuestions.map((q) => (
              <button
                key={q}
                onClick={() => setQuestion(q)}
                className="px-3 py-1.5 bg-slate-800/50 hover:bg-slate-800 text-slate-300 text-sm rounded-md border border-slate-700 hover:border-purple-500/50 transition-all"
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* Loading State */}
        {isAsking && (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-purple-500 mb-3"></div>
            <p className="text-slate-400">The Oracle is consulting the manga...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-900/30 border border-red-500/50 rounded-lg p-6">
            <div className="flex items-start gap-3">
              <div className="text-2xl">⚠️</div>
              <div>
                <h4 className="text-red-400 font-semibold mb-2">
                  {error.includes('upgrade') || error.includes('Pro') ? 'Pro Feature' : 'Error'}
                </h4>
                <p className="text-red-300 text-sm mb-4">{error}</p>
                {(error.includes('upgrade') || error.includes('Pro')) && (
                  <button className="px-4 py-2 bg-amber-500 text-slate-900 font-semibold rounded-lg hover:bg-amber-400 transition-colors">
                    Upgrade to Pro ($5/mo)
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Answer Display */}
        {answer && (
          <div className="bg-slate-800/50 border border-purple-500/30 rounded-lg p-6">
            <h4 className="text-purple-400 font-semibold mb-2 text-sm">ORACLE'S ANSWER</h4>
            <div className="prose prose-invert max-w-none">
              <div 
                className="text-slate-200 whitespace-pre-wrap mb-4"
                dangerouslySetInnerHTML={{ __html: answer.answer.replace(/\n/g, '<br/>') }}
              />
            </div>

            {/* Citations */}
            {answer.citations.length > 0 && (
              <div className="mt-6 pt-6 border-t border-slate-700">
                <h5 className="text-sm font-semibold text-slate-400 mb-3">Citations:</h5>
                <div className="space-y-2">
                  {answer.citations.map((citation, idx) => (
                    <div key={idx} className="text-xs text-slate-400">
                      {citation.type === 'panel' ? (
                        <span>
                          📖 Chapter {citation.chapter}, Page {citation.page}, Panel {citation.panel}
                          {citation.title && ` - "${citation.title}"`}
                        </span>
                      ) : (
                        <span>
                          📚 SBS Volume {citation.volume}
                          {citation.question && ` - "${citation.question}"`}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-4 text-xs text-slate-500">
              Powered by {answer.model}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
