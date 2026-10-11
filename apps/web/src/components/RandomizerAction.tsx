'use client';

import React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Disc3, Music2, Radio, Dices, Loader2, AlertCircle, Clock } from 'lucide-react';
import { Button } from './ui/button';
import { apiFetch } from '@/lib/api';
import { useLanguage } from '@/contexts/language-context';
import { translateApiError } from '@/i18n';
import type { RandomizeType, RandomizeResponse, Artist, SpinLimitsResponse } from '@randomify/shared';

interface RandomizerActionProps {
  selectedArtists: Artist[];
  selectedType: RandomizeType;
  onSelectType: (type: RandomizeType) => void;
  onResult: (result: RandomizeResponse) => void;
}

export function RandomizerAction({
  selectedArtists,
  selectedType,
  onSelectType,
  onResult,
}: RandomizerActionProps) {
  const queryClient = useQueryClient();
  const { t, locale } = useLanguage();

  const { data: spinLimits } = useQuery<SpinLimitsResponse>({
    queryKey: ['spin-limits'],
    queryFn: () => apiFetch<SpinLimitsResponse>('/spotify/spin-limits'),
  });

  const randomizeMutation = useMutation({
    mutationFn: async () => {
      return apiFetch<RandomizeResponse>('/spotify/randomize', {
        method: 'POST',
        body: JSON.stringify({
          artistIds: selectedArtists.map((a) => a.id),
          type: selectedType,
        }),
      });
    },
    onSuccess: (data) => {
      onResult(data);
      if (data.spinLimits) {
        queryClient.setQueryData(['spin-limits'], data.spinLimits);
      }
      queryClient.invalidateQueries({ queryKey: ['history'] });
      queryClient.invalidateQueries({ queryKey: ['spin-limits'] });
    },
    onError: () => {
      queryClient.invalidateQueries({ queryKey: ['spin-limits'] });
    },
  });

  const options: Array<{
    type: RandomizeType;
    label: string;
    description: string;
    icon: React.ElementType;
  }> = [
    {
      type: 'track',
      label: t.randomizer.track,
      description: t.randomizer.trackDesc,
      icon: Music2,
    },
    {
      type: 'album',
      label: t.randomizer.album,
      description: t.randomizer.albumDesc,
      icon: Disc3,
    },
    {
      type: 'single',
      label: t.randomizer.single,
      description: t.randomizer.singleDesc,
      icon: Radio,
    },
  ];

  const hasArtists = selectedArtists.length > 0;
  const currentLimit = spinLimits ? spinLimits[selectedType] : null;
  const isCurrentLimitExhausted = currentLimit ? currentLimit.remaining <= 0 : false;
  const canSpin = hasArtists && !isCurrentLimitExhausted && !randomizeMutation.isPending;

  const categoryLabel =
    selectedType === 'single'
      ? t.randomizer.categorySingles
      : selectedType === 'album'
      ? t.randomizer.categoryAlbums
      : t.randomizer.categoryTracks;

  const spinButtonText =
    selectedType === 'track'
      ? t.randomizer.spinTrack
      : selectedType === 'album'
      ? t.randomizer.spinAlbum
      : t.randomizer.spinSingle;

  return (
    <div className="space-y-4">
      {/* Type Selector (Track / Album / Single) */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {options.map((option) => {
          const Icon = option.icon;
          const active = selectedType === option.type;
          const remaining = spinLimits ? spinLimits[option.type].remaining : null;
          const isCategoryExhausted = remaining === 0;

          return (
            <button
              key={option.type}
              type="button"
              onClick={() => onSelectType(option.type)}
              className={`flex flex-col items-center justify-center p-2.5 sm:p-4 rounded-xl sm:rounded-2xl border transition-all text-center cursor-pointer relative ${
                active
                  ? 'border-emerald-500 bg-emerald-950/40 text-white shadow-lg shadow-emerald-500/20 scale-[1.02]'
                  : 'border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
              }`}
            >
              <div
                className={`p-1.5 sm:p-2.5 rounded-full mb-1 sm:mb-2 ${
                  active ? 'bg-emerald-500 text-black' : 'bg-zinc-800 text-zinc-300'
                }`}
              >
                <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
              <span className="font-bold text-xs sm:text-sm truncate max-w-full">{option.label}</span>
              <span className="text-[11px] text-zinc-500 hidden sm:block mt-0.5">
                {option.description}
              </span>

              {/* Daily Limit Badge */}
              <div className="mt-1.5 sm:mt-2.5">
                <span
                  className={`text-[9px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded-full border transition-colors inline-block ${
                    isCategoryExhausted
                      ? 'bg-red-500/10 text-red-400 border-red-500/30'
                      : active
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : 'bg-zinc-800 text-zinc-400 border-zinc-700/60'
                  }`}
                >
                  <span className="sm:hidden">{remaining !== null ? `${remaining}/3` : '3/3'}</span>
                  <span className="hidden sm:inline">
                    {remaining !== null
                      ? `${remaining}/3 ${t.randomizer.leftToday}`
                      : `3/3 ${t.randomizer.leftToday}`}
                  </span>
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Randomize Action Button */}
      <div className="pt-1 sm:pt-2 flex flex-col items-center">
        <Button
          id="spin-action-button"
          variant="spotify"
          size="lg"
          disabled={!canSpin}
          onClick={() => randomizeMutation.mutate()}
          className="w-full sm:w-80 h-12 sm:h-14 text-base sm:text-lg font-black tracking-wide shadow-xl shadow-[#1DB954]/25 hover:shadow-[#1DB954]/40 disabled:opacity-50 disabled:shadow-none"
        >
          {randomizeMutation.isPending ? (
            <>
              <Loader2 className="h-5 w-5 sm:h-6 sm:w-6 animate-spin text-black" />
              {t.randomizer.drawing}
            </>
          ) : isCurrentLimitExhausted ? (
            <>
              <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-zinc-400" />
              {t.randomizer.limitReachedButton}
            </>
          ) : (
            <>
              <Dices className="h-5 w-5 sm:h-6 sm:w-6" />
              {spinButtonText}
            </>
          )}
        </Button>

        {isCurrentLimitExhausted && (
          <div className="mt-3 flex items-center justify-center gap-1.5 text-xs text-amber-300 bg-amber-950/40 border border-amber-500/30 px-3.5 py-2 rounded-xl animate-in fade-in text-center">
            <Clock className="h-3.5 w-3.5 text-amber-400 shrink-0" />
            <span>
              {t.randomizer.limitReachedBanner.replace('{category}', categoryLabel)}
            </span>
          </div>
        )}

        {!hasArtists && !isCurrentLimitExhausted && (
          <p className="text-xs text-amber-400/90 mt-2 flex items-center justify-center text-center gap-1.5">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            <span>{t.randomizer.selectArtistWarning}</span>
          </p>
        )}

        {randomizeMutation.isError && (
          <p className="text-xs text-red-400 mt-2 flex items-center gap-1.5">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            {translateApiError(randomizeMutation.error.message, locale)}
          </p>
        )}
      </div>
    </div>
  );
}
