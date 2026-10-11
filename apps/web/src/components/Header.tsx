'use client';

import { useAuth } from '@/contexts/auth-context';
import { Button } from './ui/button';
import { LogIn, LogOut, History, Bookmark } from 'lucide-react';

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
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1DB954] text-black shadow-lg shadow-[#1DB954]/25 transition-transform hover:scale-105">
            <svg
              className="h-6 w-6 fill-current"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
              aria-label="Spotify Logo"
            >
              <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.496 17.305c-.216.353-.674.464-1.027.248-2.812-1.718-6.352-2.107-10.522-1.155-.403.092-.806-.157-.898-.56-.092-.403.157-.806.56-.898 4.566-1.043 8.487-.597 11.64 1.338.353.216.464.674.248 1.027zm1.468-3.262c-.272.443-.847.585-1.29.313-3.22-1.979-8.128-2.551-11.936-1.394-.499.151-1.03-.133-1.181-.632-.151-.499.133-1.03.632-1.181 4.355-1.323 9.774-.682 13.462 1.604.443.272.585.847.313 1.29zm.126-3.41c-3.86-2.292-10.228-2.503-13.896-1.39-.59.18-1.217-.156-1.397-.746-.18-.59.156-1.217.746-1.397 4.225-1.282 11.261-1.037 15.714 1.605.53.314.704 1.002.39 1.532-.314.53-1.002.704-1.532.39z" />
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
