'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useLanguage } from '@/contexts/language-context';
import { Button } from './ui/button';
import { MobileSidebar } from './MobileSidebar';
import { LogOut, History, Bookmark, Menu } from 'lucide-react';

interface HeaderProps {
  onOpenHistory: () => void;
  onOpenPresets: () => void;
}

export function Header({ onOpenHistory, onOpenPresets }: HeaderProps) {
  const { user, isAuthenticated, login, logout, isLoading } = useAuth();
  const { locale, toggleLocale, t } = useLanguage();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md">
        <div className="container mx-auto flex h-14 sm:h-16 items-center justify-between px-3.5 sm:px-6">
          {/* Logo */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div
              className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-[#1DB954] text-black shadow-lg shadow-[#1DB954]/25 shrink-0"
              suppressHydrationWarning
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width={20}
                height={20}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2.2}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="lucide lucide-dices h-5 w-5 sm:h-6 sm:w-6 stroke-[2.2]"
                suppressHydrationWarning
              >
                <rect width="12" height="12" x="2" y="10" rx="2" ry="2" />
                <path d="m17.92 14 3.5-3.5a2.24 2.24 0 0 0 0-3l-5-4.92a2.24 2.24 0 0 0-3 0L10 6" />
                <path d="M6 18h.01" />
                <path d="M10 14h.01" />
                <path d="M15 6h.01" />
                <path d="M18 9h.01" />
              </svg>
            </div>
            <div className="min-w-0">
              <h1 className="text-base sm:text-xl font-black tracking-tight text-white flex items-center gap-1.5">
                <span>Randomify</span>
                <span className="text-[9px] sm:text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400">
                  Spotify
                </span>
              </h1>
              <p className="text-xs text-zinc-400 hidden sm:block">
                {t.header.subtitle}
              </p>
            </div>
          </div>

          {/* Desktop Navigation (visible on md and above) */}
          <div className="hidden md:flex items-center gap-2.5 shrink-0">
            {/* Language Switcher */}
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleLocale}
              title={t.header.toggleLanguage}
              className="h-8 px-2.5 rounded-lg border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800 text-xs font-semibold text-zinc-200 hover:text-white transition-all flex items-center gap-1.5 cursor-pointer"
              suppressHydrationWarning
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width={16}
                height={16}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="lucide lucide-globe h-3.5 w-3.5 text-emerald-400 shrink-0"
                suppressHydrationWarning
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
                <path d="M2 12h20" />
              </svg>
              <span className="text-[11px] font-bold" suppressHydrationWarning>
                {locale === 'pt-BR' ? 'PT' : 'EN'}
              </span>
              <span className="text-xs" suppressHydrationWarning>
                {locale === 'pt-BR' ? '🇧🇷' : '🇺🇸'}
              </span>
            </Button>

            {isAuthenticated && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onOpenPresets}
                  title={t.header.presets}
                  className="h-8 px-3 gap-1.5 text-zinc-300 hover:text-white"
                >
                  <Bookmark className="h-4 w-4 shrink-0 text-emerald-400" />
                  <span>{t.header.presets}</span>
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onOpenHistory}
                  title={t.header.history}
                  className="h-8 px-3 gap-1.5 text-zinc-300 hover:text-white"
                >
                  <History className="h-4 w-4 shrink-0" />
                  <span>{t.header.history}</span>
                </Button>
              </>
            )}

            {isLoading ? (
              <div className="h-8 w-20 animate-pulse rounded-full bg-zinc-800" />
            ) : isAuthenticated && user ? (
              <div className="flex items-center gap-2 pl-2 border-l border-zinc-800">
                <div className="flex items-center gap-2">
                  {user.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={user.avatarUrl}
                      alt={user.displayName || 'Avatar'}
                      className="h-8 w-8 rounded-full border border-emerald-500/40 object-cover"
                    />
                  ) : (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-800 text-xs font-bold text-emerald-400">
                      {user.displayName?.charAt(0) || 'U'}
                    </div>
                  )}
                  <span className="text-sm font-medium text-zinc-200">
                    {user.displayName}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={logout}
                  title={t.header.logout}
                  className="h-8 w-8 text-zinc-400 hover:text-red-400"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <Button
                variant="spotify"
                size="sm"
                onClick={login}
                className="h-9 px-4 gap-2 text-sm"
                suppressHydrationWarning
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width={16}
                  height={16}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="lucide lucide-log-in h-4 w-4 shrink-0"
                  suppressHydrationWarning
                >
                  <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                  <polyline points="10 17 15 12 10 7" />
                  <line x1="15" x2="3" y1="12" y2="12" />
                </svg>
                <span>{t.header.login}</span>
              </Button>
            )}
          </div>

          {/* Minified Mobile Actions (visible below md) */}
          <div className="flex md:hidden items-center gap-2 shrink-0">
            {isLoading ? (
              <div className="h-8 w-8 animate-pulse rounded-full bg-zinc-800" />
            ) : isAuthenticated && user ? (
              <>
                {/* User Avatar button opening sidebar */}
                <button
                  type="button"
                  onClick={() => setIsMobileMenuOpen(true)}
                  aria-label={t.header.openMenu}
                  className="flex items-center justify-center p-0.5 rounded-full border border-emerald-500/50 hover:border-emerald-400 transition-colors cursor-pointer"
                >
                  {user.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={user.avatarUrl}
                      alt={user.displayName || 'Avatar'}
                      className="h-7 w-7 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-zinc-800 text-[11px] font-bold text-emerald-400">
                      {user.displayName?.charAt(0) || 'U'}
                    </div>
                  )}
                </button>

                {/* Hamburger Menu button */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsMobileMenuOpen(true)}
                  aria-label={t.header.openMenu}
                  className="h-8 w-8 rounded-xl border border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-300 hover:text-white cursor-pointer"
                >
                  <Menu className="h-4.5 w-4.5" />
                </Button>
              </>
            ) : (
              <>
                {/* Compact Spotify Login for quick access on mobile */}
                <Button
                  variant="spotify"
                  size="sm"
                  onClick={login}
                  className="h-8 px-2.5 text-xs gap-1.5 font-bold"
                  suppressHydrationWarning
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width={14}
                    height={14}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2.2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="lucide lucide-log-in h-3.5 w-3.5 shrink-0"
                    suppressHydrationWarning
                  >
                    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                    <polyline points="10 17 15 12 10 7" />
                    <line x1="15" x2="3" y1="12" y2="12" />
                  </svg>
                  <span>{locale === 'pt-BR' ? 'Entrar' : 'Log in'}</span>
                </Button>

                {/* Hamburger Menu button */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsMobileMenuOpen(true)}
                  aria-label={t.header.openMenu}
                  className="h-8 w-8 rounded-xl border border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-300 hover:text-white cursor-pointer"
                >
                  <Menu className="h-4.5 w-4.5" />
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Slide-out Drawer */}
      <MobileSidebar
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        onOpenHistory={onOpenHistory}
        onOpenPresets={onOpenPresets}
      />
    </>
  );
}
