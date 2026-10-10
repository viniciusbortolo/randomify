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
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 text-black shadow-lg shadow-emerald-500/20">
            <Dices className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight text-white flex items-center gap-1.5">
              Randomify
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400">
                Spotify
              </span>
            </h1>
            <p className="text-xs text-zinc-400 hidden sm:block">
              Sorteador de músicas, álbuns e singles
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
                <span className="hidden sm:inline">Meus Presets</span>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={onOpenHistory}
                className="gap-2 text-zinc-300 hover:text-white"
              >
                <History className="h-4 w-4" />
                <span className="hidden sm:inline">Histórico</span>
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
                title="Sair"
                className="h-8 w-8 text-zinc-400 hover:text-red-400"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <Button variant="spotify" size="sm" onClick={login} className="gap-2">
              <LogIn className="h-4 w-4" />
              Entrar com Spotify
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
