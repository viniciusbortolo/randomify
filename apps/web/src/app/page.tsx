'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/auth-context';
import { useLanguage } from '@/contexts/language-context';
import { apiFetch } from '@/lib/api';
import { Header } from '@/components/Header';
import { ArtistSelection } from '@/components/ArtistSelection';
import { RandomizerAction } from '@/components/RandomizerAction';
import { RandomizeResult } from '@/components/RandomizeResult';
import { HistoryModal } from '@/components/HistoryModal';
import { PresetsModal } from '@/components/PresetsModal';
import { Button } from '@/components/ui/button';
import { Dices, Music2, CheckCircle2, AlertCircle, X } from 'lucide-react';
import type { Artist, RandomizeType, RandomizeResponse, SpinLimitsResponse } from '@randomify/shared';

export default function Home() {
  const { isAuthenticated, isLoading, isLoggingIn, login, authError, clearAuthError } = useAuth();
  const { locale, t } = useLanguage();

  const [selectedArtists, setSelectedArtists] = useState<Artist[]>([]);
  const [selectedType, setSelectedType] = useState<RandomizeType>('track');
  const [drawResult, setDrawResult] = useState<RandomizeResponse | null>(null);

  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isPresetsOpen, setIsPresetsOpen] = useState(false);

  const { data: spinLimits } = useQuery<SpinLimitsResponse>({
    queryKey: ['spin-limits'],
    queryFn: () => apiFetch<SpinLimitsResponse>('/spotify/spin-limits'),
    enabled: isAuthenticated,
  });

  // Toggle individual artist
  const handleToggleArtist = (artist: Artist) => {
    setSelectedArtists((prev) => {
      const exists = prev.some((a) => a.id === artist.id);
      if (exists) {
        return prev.filter((a) => a.id !== artist.id);
      }
      return [...prev, artist];
    });
  };

  // Clear all selected artists
  const handleClearSelected = () => {
    setSelectedArtists([]);
  };

  // Select multiple artists (preset or select all followed)
  const handleSelectMultiple = (artists: Artist[]) => {
    setSelectedArtists(artists);
  };

  return (
    <div className="min-h-screen flex flex-col bg-radial from-zinc-900 via-zinc-950 to-black">
      <Header
        onOpenHistory={() => setIsHistoryOpen(true)}
        onOpenPresets={() => setIsPresetsOpen(true)}
      />

      <main className="flex-1 container mx-auto px-3.5 sm:px-6 py-4 sm:py-8 max-w-5xl">
        {authError && (
          <div className="mb-4 sm:mb-6 p-3 sm:p-4 rounded-xl bg-red-950/40 border border-red-500/40 text-red-200 text-xs sm:text-sm flex items-center justify-between animate-in fade-in">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-400 shrink-0" />
              <span>{authError}</span>
            </div>
            <button
              onClick={clearAuthError}
              className="text-red-400 hover:text-white p-1 rounded-lg hover:bg-red-900/40 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {isLoading ? (
          <div className="flex flex-col items-center justify-center min-h-[50vh] sm:min-h-[60vh] space-y-4">
            <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin" />
            <p className="text-xs sm:text-sm text-zinc-400">{t.common.loading}</p>
          </div>
        ) : !isAuthenticated ? (
          /* Hero Section for unauthenticated visitors */
          <div className="py-8 sm:py-16 flex flex-col items-center text-center space-y-6 sm:space-y-8 animate-in fade-in duration-500">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
              <Dices className="h-3.5 w-3.5" />
              {t.hero.badge}
            </div>

            <div className="space-y-3 sm:space-y-4 max-w-2xl">
              <h1 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight text-white leading-tight">
                {t.hero.title}
              </h1>
              <p className="text-sm sm:text-base md:text-lg text-zinc-400 px-2 sm:px-0">
                {t.hero.description}
              </p>
            </div>

            <Button
              variant="spotify"
              size="lg"
              onClick={login}
              disabled={isLoggingIn}
              className="h-12 sm:h-14 px-6 sm:px-8 text-sm sm:text-base font-bold shadow-2xl shadow-[#1DB954]/30 w-full sm:w-auto gap-2"
            >
              {isLoggingIn ? (
                <>
                  <div className="h-5 w-5 rounded-full border-2 border-black border-t-transparent animate-spin shrink-0" />
                  <span>{locale === 'pt-BR' ? 'Conectando ao Spotify...' : 'Connecting to Spotify...'}</span>
                </>
              ) : (
                t.hero.connectButton
              )}
            </Button>

            {/* Feature Highlights */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 pt-6 sm:pt-12 w-full max-w-3xl text-left">
              <div className="p-4 sm:p-5 rounded-2xl bg-zinc-900/50 border border-zinc-800 space-y-2">
                <div className="p-2 sm:p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 w-fit">
                  <Music2 className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
                <h3 className="font-bold text-white text-xs sm:text-sm">{t.hero.features.tracksAlbums.title}</h3>
                <p className="text-xs text-zinc-400">
                  {t.hero.features.tracksAlbums.desc}
                </p>
              </div>

              <div className="p-4 sm:p-5 rounded-2xl bg-zinc-900/50 border border-zinc-800 space-y-2">
                <div className="p-2 sm:p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 w-fit">
                  <Dices className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
                <h3 className="font-bold text-white text-xs sm:text-sm">{t.hero.features.catalogFollowed.title}</h3>
                <p className="text-xs text-zinc-400">
                  {t.hero.features.catalogFollowed.desc}
                </p>
              </div>

              <div className="p-4 sm:p-5 rounded-2xl bg-zinc-900/50 border border-zinc-800 space-y-2">
                <div className="p-2 sm:p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 w-fit">
                  <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
                <h3 className="font-bold text-white text-xs sm:text-sm">{t.hero.features.presetsHistory.title}</h3>
                <p className="text-xs text-zinc-400">
                  {t.hero.features.presetsHistory.desc}
                </p>
              </div>
            </div>
          </div>
        ) : (
          /* Main Application (Logged in) */
          <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300">
            {/* Randomizer Control Section */}
            <div className="space-y-6">
              <RandomizerAction
                selectedArtists={selectedArtists}
                selectedType={selectedType}
                onSelectType={setSelectedType}
                onResult={(result) => {
                  setDrawResult(result);
                  // Smoothly scroll up to the result
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              />

              {/* Draw Result Card */}
              {drawResult && (
                <RandomizeResult
                  result={drawResult}
                  canSpinAgain={
                    selectedArtists.length > 0 &&
                    (spinLimits ? spinLimits[drawResult.type].remaining > 0 : true)
                  }
                  onDrawAgain={() => {
                    if (selectedType !== drawResult.type) {
                      setSelectedType(drawResult.type);
                    }
                    setTimeout(() => {
                      const spinBtn = document.getElementById('spin-action-button') as HTMLElement;
                      spinBtn?.click();
                    }, 50);
                  }}
                />
              )}
            </div>

            {/* Artist Selection Section */}
            <div className="pt-4 border-t border-zinc-800/80">
              <ArtistSelection
                selectedArtists={selectedArtists}
                onToggleArtist={handleToggleArtist}
                onClearSelected={handleClearSelected}
                onSelectMultiple={handleSelectMultiple}
              />
            </div>
          </div>
        )}
      </main>

      {/* History and Presets Modals */}
      <HistoryModal isOpen={isHistoryOpen} onClose={() => setIsHistoryOpen(false)} />
      <PresetsModal
        isOpen={isPresetsOpen}
        onClose={() => setIsPresetsOpen(false)}
        onApplyPreset={handleSelectMultiple}
      />
    </div>
  );
}
