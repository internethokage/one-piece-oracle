import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '404 — Lost at Sea | One Piece Oracle',
  description: 'This page sailed off the edge of the map.',
};

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#0a0e1a] flex flex-col items-center justify-center px-4 text-center">
      {/* Skull & Crossbones decorative */}
      <div className="text-8xl mb-6 select-none" aria-hidden="true">
        💀
      </div>

      {/* Error code */}
      <h1 className="text-[#d4af37] font-black text-7xl md:text-9xl mb-2 tracking-tight leading-none">
        4<span className="text-white">0</span>4
      </h1>

      {/* Flavor text */}
      <p className="text-[#d4af37] text-xl md:text-2xl font-bold mb-2">
        Lost at Sea
      </p>
      <p className="text-slate-400 text-base md:text-lg max-w-md mb-8">
        This page sailed off the edge of the Grand Line. Even the Log Pose
        can&apos;t find it.
      </p>

      {/* Jolly Roger divider */}
      <div className="flex items-center gap-3 mb-10 text-slate-600">
        <div className="h-px w-16 bg-slate-700" />
        <span className="text-lg">🏴‍☠️</span>
        <div className="h-px w-16 bg-slate-700" />
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Link
          href="/"
          className="px-6 py-3 bg-[#d4af37] text-[#0a0e1a] font-bold rounded-lg hover:bg-[#e6c84a] transition-colors text-sm"
        >
          ← Return to Port
        </Link>
        <Link
          href="/?q=help"
          className="px-6 py-3 border border-slate-600 text-slate-300 font-medium rounded-lg hover:border-[#d4af37] hover:text-[#d4af37] transition-colors text-sm"
        >
          Ask the Oracle
        </Link>
      </div>

      {/* Subtle lore quote */}
      <p className="mt-16 text-slate-600 text-xs italic max-w-xs">
        &ldquo;I don&apos;t wanna conquer anything. I just think the guy with the
        most freedom in the whole ocean is the Pirate King!&rdquo;
        <br />
        <span className="not-italic text-slate-700">— Monkey D. Luffy</span>
      </p>
    </div>
  );
}
