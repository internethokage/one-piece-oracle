'use client';

interface Panel {
  id: string;
  chapter_number: number;
  page_number: number;
  panel_number: number;
  image_url: string;
  dialogue?: string;
  characters?: string[];
}

interface PanelGridProps {
  panels: Panel[];
}

export default function PanelGrid({ panels }: PanelGridProps) {
  if (panels.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="text-6xl mb-4">🔍</div>
        <h3 className="text-xl font-semibold text-slate-300 mb-2">No results yet</h3>
        <p className="text-slate-400">Try searching for characters, arcs, or specific moments</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {panels.map((panel) => (
        <div
          key={panel.id}
          className="bg-slate-800/50 rounded-lg border border-slate-700 hover:border-amber-500/50 transition-all overflow-hidden group"
        >
          {/* Panel Image */}
          <div className="aspect-[3/4] bg-slate-900 relative overflow-hidden">
            <img
              src={panel.image_url}
              alt={`Chapter ${panel.chapter_number}, Page ${panel.page_number}, Panel ${panel.panel_number}`}
              className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
            />
            {/* Overlay with chapter info */}
            <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/80 to-transparent p-3">
              <div className="text-xs font-semibold text-amber-400">
                Chapter {panel.chapter_number}
              </div>
              <div className="text-xs text-slate-300">
                Page {panel.page_number} · Panel {panel.panel_number}
              </div>
            </div>
          </div>

          {/* Panel Info */}
          <div className="p-4">
            {panel.dialogue && (
              <p className="text-sm text-slate-300 mb-3 line-clamp-3">
                "{panel.dialogue}"
              </p>
            )}
            {panel.characters && panel.characters.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {panel.characters.map((char) => (
                  <span
                    key={char}
                    className="px-2 py-1 bg-blue-900/50 text-blue-300 rounded text-xs border border-blue-700/50"
                  >
                    {char}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
