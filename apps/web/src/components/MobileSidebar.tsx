'use client';

import React, { useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useLanguage } from '@/contexts/language-context';
import { Button } from './ui/button';
import {
  X,
  Bookmark,
  History,
  LogOut,
  LogIn,
  ChevronRight,
  Globe,
  Check,
} from 'lucide-react';

interface MobileSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenHistory: () => void;
  onOpenPresets: () => void;
}

export function MobileSidebar({
  isOpen,
  onClose,
  onOpenHistory,
  onOpenPresets,
}: MobileSidebarProps) {
  const { user, isAuthenticated, isLoggingIn, login, logout } = useAuth();
  const { locale, setLocale, t } = useLanguage();

  // Fecha o menu ao pressionar a tecla Escape e trava o scroll do body
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  return (
    <>
      {/* Backdrop overlay */}
      <div
        className={`fixed inset-0 z-50 bg-black/75 backdrop-blur-sm transition-opacity duration-300 md:hidden ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-out Sidebar Panel */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={t.header.menu}
        className={`fixed top-0 right-0 bottom-0 z-50 w-[84vw] max-w-sm bg-zinc-950 border-l border-zinc-800/80 shadow-2xl flex flex-col transition-transform duration-300 ease-out md:hidden ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Top Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-800/80 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#1DB954] text-black shadow-md shadow-[#1DB954]/25">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width={18}
                height={18}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2.2}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="lucide lucide-dices stroke-[2.2]"
              >
                <rect width="12" height="12" x="2" y="10" rx="2" ry="2" />
                <path d="m17.92 14 3.5-3.5a2.24 2.24 0 0 0 0-3l-5-4.92a2.24 2.24 0 0 0-3 0L10 6" />
                <path d="M6 18h.01" />
                <path d="M10 14h.01" />
                <path d="M15 6h.01" />
                <path d="M18 9h.01" />
              </svg>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-black text-white text-base tracking-tight">Randomify</span>
              <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400">
                Spotify
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label={t.header.closeMenu}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900/70 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5 min-h-0">
          {/* User Profile / Status */}
          {isAuthenticated && user ? (
            <div className="p-3.5 rounded-2xl bg-zinc-900/70 border border-zinc-800/90 flex items-center gap-3">
              {user.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.avatarUrl}
                  alt={user.displayName || 'Avatar'}
                  className="h-11 w-11 rounded-full border-2 border-emerald-500/50 object-cover shadow-sm shrink-0"
                />
              ) : (
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-zinc-800 border-2 border-emerald-500/50 text-sm font-bold text-emerald-400 shrink-0">
                  {user.displayName?.charAt(0) || 'U'}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="font-bold text-white text-sm truncate">{user.displayName}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                  <span className="text-[11px] text-zinc-400 font-medium truncate">
                    {t.header.connectedAs}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800/80 space-y-3">
              <p className="text-xs text-zinc-400 leading-relaxed">
                {locale === 'pt-BR'
                  ? 'Conecte sua conta do Spotify para desbloquear histórico, salvar presets e sortear suas músicas.'
                  : 'Connect your Spotify account to unlock history, saved presets, and randomized music.'}
              </p>
              <Button
                variant="spotify"
                size="sm"
                onClick={() => {
                  login();
                }}
                disabled={isLoggingIn}
                className="w-full h-10 gap-2 text-xs font-bold shadow-md shadow-[#1DB954]/20"
              >
                {isLoggingIn ? (
                  <>
                    <div className="h-4 w-4 rounded-full border-2 border-black border-t-transparent animate-spin shrink-0" />
                    <span>{locale === 'pt-BR' ? 'Conectando ao Spotify...' : 'Connecting to Spotify...'}</span>
                  </>
                ) : (
                  <>
                    <LogIn className="h-4 w-4 shrink-0" />
                    <span>{t.header.login}</span>
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Quick Actions (if authenticated) */}
          {isAuthenticated && (
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-zinc-500 tracking-wider uppercase px-1">
                {t.header.navigation}
              </span>
              <div className="space-y-1.5">
                <button
                  onClick={() => {
                    onClose();
                    onOpenPresets();
                  }}
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-zinc-900/50 border border-zinc-800/80 hover:bg-zinc-900 hover:border-zinc-700 transition-all text-left group cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0 group-hover:scale-105 transition-transform">
                      <Bookmark className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-zinc-100 group-hover:text-emerald-400 transition-colors">
                        {t.header.presets}
                      </p>
                      <p className="text-[11px] text-zinc-400 truncate">{t.header.presetsDesc}</p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-zinc-500 group-hover:text-zinc-300 transition-colors shrink-0" />
                </button>

                <button
                  onClick={() => {
                    onClose();
                    onOpenHistory();
                  }}
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-zinc-900/50 border border-zinc-800/80 hover:bg-zinc-900 hover:border-zinc-700 transition-all text-left group cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0 group-hover:scale-105 transition-transform">
                      <History className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-zinc-100 group-hover:text-emerald-400 transition-colors">
                        {t.header.history}
                      </p>
                      <p className="text-[11px] text-zinc-400 truncate">{t.header.historyDesc}</p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-zinc-500 group-hover:text-zinc-300 transition-colors shrink-0" />
                </button>
              </div>
            </div>
          )}

          {/* Language Selector */}
          <div className="space-y-2">
            <span className="text-[11px] font-bold text-zinc-500 tracking-wider uppercase px-1 flex items-center gap-1.5">
              <Globe className="h-3.5 w-3.5" />
              {t.header.language}
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setLocale('pt-BR')}
                className={`flex items-center justify-between p-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                  locale === 'pt-BR'
                    ? 'border-emerald-500/50 bg-emerald-500/15 text-emerald-300 font-bold shadow-sm shadow-emerald-500/10'
                    : 'border-zinc-800 bg-zinc-900/40 text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <span>🇧🇷</span>
                  <span>Português</span>
                </span>
                {locale === 'pt-BR' && <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />}
              </button>

              <button
                onClick={() => setLocale('en')}
                className={`flex items-center justify-between p-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                  locale === 'en'
                    ? 'border-emerald-500/50 bg-emerald-500/15 text-emerald-300 font-bold shadow-sm shadow-emerald-500/10'
                    : 'border-zinc-800 bg-zinc-900/40 text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <span>🇺🇸</span>
                  <span>English</span>
                </span>
                {locale === 'en' && <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />}
              </button>
            </div>
          </div>
        </div>

        {/* Footer / Logout */}
        <div className="p-4 border-t border-zinc-800/80 shrink-0 space-y-3">
          {isAuthenticated && (
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                onClose();
                await logout();
              }}
              className="w-full h-10 border-red-900/40 bg-red-950/20 hover:bg-red-950/40 text-red-300 hover:text-red-200 rounded-xl gap-2 text-xs font-semibold"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>{t.header.logout}</span>
            </Button>
          )}

          <p className="text-[10px] text-center text-zinc-500">
            Randomify • Spotify Web API
          </p>
        </div>
      </aside>
    </>
  );
}
