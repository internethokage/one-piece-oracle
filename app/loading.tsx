export default function Loading() {
  return (
    <div className="min-h-screen bg-[#0a0e1a] flex flex-col items-center justify-center">
      {/* Animated compass / log pose spinner */}
      <div className="relative w-16 h-16 mb-6">
        <div className="w-16 h-16 border-4 border-slate-800 border-t-[#d4af37] rounded-full animate-spin" />
        <div
          className="absolute inset-0 flex items-center justify-center text-2xl"
          aria-hidden="true"
        >
          🧭
        </div>
      </div>

      <p className="text-[#d4af37] font-semibold text-sm tracking-widest uppercase animate-pulse">
        Consulting the Oracle…
      </p>
      <p className="text-slate-600 text-xs mt-2">
        Charting the Grand Line
      </p>
    </div>
  );
}
