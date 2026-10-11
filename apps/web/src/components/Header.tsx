'use client';

import { useAuth } from '@/contexts/auth-context';
import { Button } from './ui/button';
import { Dices, LogIn, LogOut, History, Bookmark } from 'lucide-react';

interface HeaderProps {
  onOpenHistory: () => void;
  onOpenPresets: () => void;
}

export function Header({ onOpenHistory, onOpenPresets }: HeaderProps) {
  const { user, isAuthenticated, login, logout, isLoading } = useAuth();

  return (
    <header className="sticky top-0 z-40 border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1DB954] text-black shadow-lg shadow-[#1DB954]/25 transition-transform hover:scale-105"
            suppressHydrationWarning
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width={24}
              height={24}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.2}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="lucide lucide-dices h-6 w-6 stroke-[2.2]"
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
          <div>
            <h1 className="text-xl font-black tracking-tight text-white flex items-center gap-1.5">
              Randomify
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400">
                Spotify
              </span>
            </h1>
            <p className="text-xs text-zinc-400 hidden sm:block">
              Spotify track, album, and single randomizer
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isAuthenticated && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={onOpenPresets}
                className="gap-2 text-zinc-300 hover:text-white"
              >
                <Bookmark className="h-4 w-4" />
                <span className="hidden sm:inline">My Presets</span>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={onOpenHistory}
                className="gap-2 text-zinc-300 hover:text-white"
              >
                <History className="h-4 w-4" />
                <span className="hidden sm:inline">History</span>
              </Button>
            </>
          )}

          {isLoading ? (
            <div className="h-9 w-24 animate-pulse rounded-full bg-zinc-800" />
          ) : isAuthenticated && user ? (
            <div className="flex items-center gap-3 pl-2 border-l border-zinc-800">
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
                <span className="text-sm font-medium text-zinc-200 hidden md:block">
                  {user.displayName}
                </span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={logout}
                title="Log out"
                className="h-8 w-8 text-zinc-400 hover:text-red-400"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <Button variant="spotify" size="sm" onClick={login} className="gap-2">
              <LogIn className="h-4 w-4" />
              Log in with Spotify
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
