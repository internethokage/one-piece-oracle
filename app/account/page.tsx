'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import AuthModal from '@/components/AuthModal';

type SettingsTab = 'subscription' | 'settings' | 'usage';

export default function AccountPage() {
  const { user, profile, tier, isPro, isLoading, signOut, refreshProfile } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<SettingsTab>('subscription');
  const [authModalOpen, setAuthModalOpen] = useState(false);

  // Handle ?tab= param from UserMenu deep links
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab') as SettingsTab | null;
    if (tab && ['subscription', 'settings', 'usage'].includes(tab)) {
      setActiveTab(tab);
    }
  }, []);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isPortalLoading, setIsPortalLoading] = useState(false);
  const [isUpgradeLoading, setIsUpgradeLoading] = useState(false);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Handle checkout return
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('checkout') === 'success') {
      setNotice({ type: 'success', message: '🎉 Welcome to Pro! Your subscription is now active.' });
      refreshProfile();
      window.history.replaceState({}, '', '/account');
    } else if (params.get('checkout') === 'cancelled') {
      setNotice({ type: 'error', message: 'Checkout cancelled. Upgrade anytime to unlock Pro features.' });
      window.history.replaceState({}, '', '/account');
    }
  }, [refreshProfile]);

  // Redirect if not logged in (after loading)
  useEffect(() => {
    if (!isLoading && !user) {
      setAuthModalOpen(true);
    }
  }, [isLoading, user]);

  const handleUpgrade = async () => {
    if (!user) {
      setAuthModalOpen(true);
      return;
    }
    setIsUpgradeLoading(true);
    try {
      const res = await fetch('/api/checkout', { method: 'POST' });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setNotice({ type: 'error', message: data.error || 'Failed to start checkout.' });
      }
    } catch {
      setNotice({ type: 'error', message: 'Network error. Please try again.' });
    } finally {
      setIsUpgradeLoading(false);
    }
  };

  const handleBillingPortal = async () => {
    setIsPortalLoading(true);
    try {
      const res = await fetch('/api/checkout', { method: 'GET' });
      // The API redirects directly, but if it doesn't:
      if (!res.redirected && !res.ok) {
        const data = await res.json();
        setNotice({ type: 'error', message: data.error || 'Failed to open billing portal.' });
      }
      // If it's a redirect, the browser will follow it automatically
    } catch {
      setNotice({ type: 'error', message: 'Failed to open billing portal.' });
    } finally {
      setIsPortalLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setNotice({ type: 'error', message: 'New passwords do not match.' });
      return;
    }
    if (newPassword.length < 8) {
      setNotice({ type: 'error', message: 'Password must be at least 8 characters.' });
      return;
    }
    setPasswordLoading(true);
    try {
      // Dynamically import supabase client for password update
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        setNotice({ type: 'error', message: error.message });
      } else {
        setNotice({ type: 'success', message: 'Password updated successfully!' });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch {
      setNotice({ type: 'error', message: 'Failed to update password.' });
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  const subscriptionStatusLabel = () => {
    if (!profile?.subscription_status) return null;
    const statusMap: Record<string, { label: string; color: string }> = {
      active: { label: 'Active', color: 'text-green-400' },
      trialing: { label: 'Trial', color: 'text-blue-400' },
      past_due: { label: 'Past Due', color: 'text-red-400' },
      canceled: { label: 'Cancelled', color: 'text-slate-400' },
      inactive: { label: 'Inactive', color: 'text-slate-400' },
    };
    return statusMap[profile.subscription_status] ?? null;
  };

  const statusInfo = subscriptionStatusLabel();

  const tabs: { id: SettingsTab; label: string; icon: string }[] = [
    { id: 'subscription', label: 'Subscription', icon: '⭐' },
    { id: 'settings', label: 'Settings', icon: '⚙️' },
    { id: 'usage', label: 'Usage', icon: '📊' },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-blue-950 to-slate-900">
      {/* Header */}
      <header className="border-b border-amber-500/20 bg-slate-900/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.push('/')}
              className="flex items-center gap-3 group"
            >
              <div className="text-3xl">🏴‍☠️</div>
              <div>
                <h1 className="text-xl font-bold text-amber-400 group-hover:text-amber-300 transition-colors">
                  One Piece Oracle
                </h1>
                <p className="text-xs text-slate-400">← Back to search</p>
              </div>
            </button>
            <div className="flex items-center gap-3">
              <span className="text-slate-400 text-sm hidden sm:block">{user?.email}</span>
              {isPro && (
                <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 text-xs font-semibold rounded-full border border-amber-500/30">
                  PRO ⭐
                </span>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-10 max-w-3xl">
        {/* Page Title */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-white mb-1">Account</h2>
          <p className="text-slate-400">Manage your subscription, settings, and usage.</p>
        </div>

        {/* Notice Banner */}
        {notice && (
          <div
            className={`mb-6 px-4 py-3 rounded-lg border flex items-start justify-between gap-3 ${
              notice.type === 'success'
                ? 'bg-green-900/20 border-green-500/30 text-green-300'
                : 'bg-red-900/20 border-red-500/30 text-red-300'
            }`}
          >
            <span className="text-sm">{notice.message}</span>
            <button onClick={() => setNotice(null)} className="opacity-70 hover:opacity-100 shrink-0">
              ✕
            </button>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 mb-8 bg-slate-800/50 p-1 rounded-xl border border-slate-700">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-slate-700 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* ── Subscription Tab ── */}
        {activeTab === 'subscription' && (
          <div className="space-y-6">
            {/* Current Plan Card */}
            <div className="bg-slate-800/50 rounded-2xl border border-slate-700 overflow-hidden">
              <div className="px-6 py-5 border-b border-slate-700">
                <h3 className="text-lg font-semibold text-white mb-1">Current Plan</h3>
                <p className="text-slate-400 text-sm">Your active subscription details</p>
              </div>
              <div className="px-6 py-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-2xl font-bold text-white">
                        {isPro ? 'Pro' : 'Free'}
                      </span>
                      {isPro ? (
                        <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 text-xs font-semibold rounded-full border border-amber-500/30">
                          ⭐ Active
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-slate-700 text-slate-400 text-xs font-semibold rounded-full">
                          Free Tier
                        </span>
                      )}
                    </div>
                    {isPro ? (
                      <p className="text-slate-400 text-sm">$5.00 / month</p>
                    ) : (
                      <p className="text-slate-400 text-sm">Limited to basic search features</p>
                    )}
                  </div>
                  {statusInfo && (
                    <div className={`text-sm font-semibold ${statusInfo.color}`}>
                      {statusInfo.label}
                    </div>
                  )}
                </div>

                {/* Feature list */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                  {[
                    { feature: 'Panel search (keyword)', included: true },
                    { feature: 'SBS Q&A lookup', included: true },
                    { feature: 'AI-powered answers', included: isPro },
                    { feature: 'Semantic vector search', included: isPro },
                    { feature: 'Agent-generated reports', included: isPro },
                    { feature: 'Theory validation', included: isPro },
                  ].map(({ feature, included }) => (
                    <div key={feature} className="flex items-center gap-2 text-sm">
                      <span className={included ? 'text-green-400' : 'text-slate-600'}>
                        {included ? '✓' : '✗'}
                      </span>
                      <span className={included ? 'text-slate-300' : 'text-slate-600'}>
                        {feature}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Action buttons */}
                {isPro ? (
                  <button
                    onClick={handleBillingPortal}
                    disabled={isPortalLoading}
                    className="w-full py-3 border border-amber-500/40 text-amber-400 font-semibold rounded-lg hover:bg-amber-500/10 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isPortalLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-amber-400/30 border-t-amber-400 rounded-full animate-spin" />
                        Opening portal...
                      </>
                    ) : (
                      '💳 Manage Billing & Invoices'
                    )}
                  </button>
                ) : (
                  <div className="space-y-3">
                    <div className="p-4 bg-amber-900/20 rounded-xl border border-amber-500/20">
                      <div className="flex items-baseline gap-1 mb-1">
                        <span className="text-3xl font-bold text-white">$5</span>
                        <span className="text-slate-400">/month</span>
                      </div>
                      <p className="text-slate-300 text-sm mb-3">
                        Unlock everything: AI answers, semantic search, agent reports.
                      </p>
                      <button
                        onClick={handleUpgrade}
                        disabled={isUpgradeLoading}
                        className="w-full py-3 bg-amber-500 text-slate-900 font-bold rounded-lg hover:bg-amber-400 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {isUpgradeLoading ? (
                          <>
                            <div className="w-4 h-4 border-2 border-slate-900/30 border-t-slate-900 rounded-full animate-spin" />
                            Redirecting to checkout...
                          </>
                        ) : (
                          '⭐ Upgrade to Pro'
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Cancel / Danger zone (Pro users) */}
            {isPro && (
              <div className="bg-slate-800/30 rounded-2xl border border-red-500/20 overflow-hidden">
                <div className="px-6 py-5">
                  <h4 className="text-sm font-semibold text-red-400 mb-1">Cancel Subscription</h4>
                  <p className="text-slate-400 text-xs mb-3">
                    You&apos;ll keep Pro access until the end of your billing period. No refunds on
                    partial months.
                  </p>
                  <button
                    onClick={handleBillingPortal}
                    className="text-sm text-red-400 border border-red-500/30 px-4 py-2 rounded-lg hover:bg-red-500/10 transition-colors"
                  >
                    Cancel via Billing Portal
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Settings Tab ── */}
        {activeTab === 'settings' && (
          <div className="space-y-6">
            {/* Account Info */}
            <div className="bg-slate-800/50 rounded-2xl border border-slate-700 overflow-hidden">
              <div className="px-6 py-5 border-b border-slate-700">
                <h3 className="text-lg font-semibold text-white">Account Info</h3>
              </div>
              <div className="px-6 py-5 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Email
                  </label>
                  <div className="px-4 py-2.5 bg-slate-700/50 rounded-lg text-slate-300 text-sm border border-slate-600">
                    {user?.email}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Email changes are not yet supported.
                  </p>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Account ID
                  </label>
                  <div className="px-4 py-2.5 bg-slate-700/50 rounded-lg text-slate-500 text-xs font-mono border border-slate-600 truncate">
                    {user?.id}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Member Since
                  </label>
                  <div className="px-4 py-2.5 bg-slate-700/50 rounded-lg text-slate-300 text-sm border border-slate-600">
                    {user?.created_at
                      ? new Date(user.created_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })
                      : '—'}
                  </div>
                </div>
              </div>
            </div>

            {/* Change Password */}
            <div className="bg-slate-800/50 rounded-2xl border border-slate-700 overflow-hidden">
              <div className="px-6 py-5 border-b border-slate-700">
                <h3 className="text-lg font-semibold text-white">Change Password</h3>
                <p className="text-slate-400 text-sm mt-1">
                  {user?.app_metadata?.provider === 'google'
                    ? 'You signed in with Google — password change is not applicable.'
                    : 'Update your account password.'}
                </p>
              </div>
              {user?.app_metadata?.provider !== 'google' && (
                <form onSubmit={handlePasswordChange} className="px-6 py-5 space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                      New Password
                    </label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Minimum 8 characters"
                      className="w-full px-4 py-2.5 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 text-sm focus:outline-none focus:border-amber-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repeat password"
                      className="w-full px-4 py-2.5 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 text-sm focus:outline-none focus:border-amber-500 transition-colors"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={passwordLoading || !newPassword || !confirmPassword}
                    className="px-6 py-2.5 bg-slate-700 text-white font-semibold rounded-lg hover:bg-slate-600 transition-colors disabled:opacity-50 text-sm"
                  >
                    {passwordLoading ? 'Updating...' : 'Update Password'}
                  </button>
                </form>
              )}
            </div>

            {/* Danger Zone */}
            <div className="bg-slate-800/30 rounded-2xl border border-red-500/20 overflow-hidden">
              <div className="px-6 py-5 border-b border-red-500/10">
                <h3 className="text-lg font-semibold text-red-400">Danger Zone</h3>
              </div>
              <div className="px-6 py-5 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div>
                  <p className="text-white text-sm font-medium">Sign out of all sessions</p>
                  <p className="text-slate-400 text-xs mt-0.5">
                    You&apos;ll be redirected to the home page.
                  </p>
                </div>
                <button
                  onClick={handleSignOut}
                  className="shrink-0 px-5 py-2.5 border border-red-500/40 text-red-400 text-sm font-semibold rounded-lg hover:bg-red-500/10 transition-colors"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Usage Tab ── */}
        {activeTab === 'usage' && (
          <div className="space-y-6">
            {/* Tier summary */}
            <div className="bg-slate-800/50 rounded-2xl border border-slate-700 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Your Plan Limits</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  {
                    label: 'Search Type',
                    free: 'Keyword only',
                    pro: 'Keyword + Semantic',
                  },
                  {
                    label: 'AI Answers',
                    free: '—',
                    pro: 'Unlimited',
                  },
                  {
                    label: 'Agent Reports',
                    free: '—',
                    pro: 'Unlimited',
                  },
                ].map(({ label, free, pro }) => (
                  <div
                    key={label}
                    className="bg-slate-700/30 rounded-xl p-4 border border-slate-600/50"
                  >
                    <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                      {label}
                    </div>
                    <div className="text-sm font-semibold text-white">
                      {isPro ? pro : free}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Usage stats placeholder */}
            <div className="bg-slate-800/50 rounded-2xl border border-slate-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Usage History</h3>
                <span className="text-xs text-slate-500 bg-slate-700 px-2 py-1 rounded">
                  Coming soon
                </span>
              </div>
              <div className="text-center py-12 text-slate-500">
                <div className="text-4xl mb-3">📊</div>
                <p className="text-sm">
                  Per-query usage tracking is coming in a future update.
                </p>
                <p className="text-xs mt-2">
                  You&apos;ll be able to see search history, AI query counts, and more.
                </p>
              </div>
            </div>

            {/* Upgrade prompt for free users */}
            {!isPro && (
              <div className="bg-gradient-to-r from-amber-900/20 to-blue-900/20 rounded-2xl border border-amber-500/20 p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <p className="text-white font-semibold mb-1">Unlock the full Oracle</p>
                    <p className="text-slate-400 text-sm">
                      AI answers, semantic search, and agent reports for $5/mo.
                    </p>
                  </div>
                  <button
                    onClick={handleUpgrade}
                    disabled={isUpgradeLoading}
                    className="shrink-0 px-6 py-2.5 bg-amber-500 text-slate-900 font-bold rounded-lg hover:bg-amber-400 transition-colors disabled:opacity-50"
                  >
                    Upgrade to Pro
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Auth modal (redirect if not logged in) */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => {
          setAuthModalOpen(false);
          router.push('/');
        }}
        defaultTab="signin"
      />
    </div>
  );
}
