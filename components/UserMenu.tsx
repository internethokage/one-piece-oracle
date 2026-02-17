'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';

interface UserMenuProps {
  onUpgradeClick: () => void;
}

export default function UserMenu({ onUpgradeClick }: UserMenuProps) {
  const { user, isPro, tier, signOut } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const avatarLetter = user?.email?.[0]?.toUpperCase() ?? '?';

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 group"
      >
        {/* Avatar */}
        <div className="w-9 h-9 rounded-full bg-amber-500 flex items-center justify-center text-slate-900 font-bold text-sm">
          {avatarLetter}
        </div>
        {/* Tier badge */}
        {isPro && (
          <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 text-xs font-semibold rounded-full border border-amber-500/30">
            PRO
          </span>
        )}
        <svg
          className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-12 w-64 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl overflow-hidden z-50">
          {/* User info */}
          <div className="px-4 py-3 border-b border-slate-700">
            <p className="text-white font-semibold text-sm truncate">{user?.email}</p>
            <div className="flex items-center gap-2 mt-1">
              <span
                className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                  isPro
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    : 'bg-slate-700 text-slate-400'
                }`}
              >
                {isPro ? '⭐ Pro' : 'Free tier'}
              </span>
            </div>
          </div>

          {/* Upgrade CTA (free users only) */}
          {!isPro && (
            <div className="px-4 py-3 border-b border-slate-700 bg-amber-900/20">
              <p className="text-amber-300 text-xs mb-2">Unlock AI answers + agent reports</p>
              <button
                onClick={() => {
                  setIsOpen(false);
                  onUpgradeClick();
                }}
                className="w-full py-2 bg-amber-500 text-slate-900 text-sm font-bold rounded-lg hover:bg-amber-400 transition-colors"
              >
                Upgrade to Pro — $5/mo
              </button>
            </div>
          )}

          {/* Menu items */}
          <div className="py-1">
            <button
              onClick={() => {
                setIsOpen(false);
                // TODO: navigate to settings/dashboard
              }}
              className="w-full px-4 py-2.5 text-left text-sm text-slate-300 hover:bg-slate-700 transition-colors flex items-center gap-2"
            >
              ⚙️ Account Settings
            </button>

            {isPro && (
              <button
                onClick={() => {
                  setIsOpen(false);
                  // TODO: open billing portal
                }}
                className="w-full px-4 py-2.5 text-left text-sm text-slate-300 hover:bg-slate-700 transition-colors flex items-center gap-2"
              >
                💳 Manage Billing
              </button>
            )}

            <button
              onClick={async () => {
                setIsOpen(false);
                await signOut();
              }}
              className="w-full px-4 py-2.5 text-left text-sm text-red-400 hover:bg-slate-700 transition-colors flex items-center gap-2"
            >
              🚪 Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
