'use client';

import React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Disc3, Music2, Radio, Dices, Loader2, AlertCircle } from 'lucide-react';
import { Button } from './ui/button';
import { apiFetch } from '@/lib/api';
import type { RandomizeType, RandomizeResponse, Artist } from '@randomify/shared';

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
      // Invalidate history to refresh recent items
      queryClient.invalidateQueries({ queryKey: ['history'] });
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
      label: 'Track',
      description: 'Picks a random song',
      icon: Music2,
    },
    {
      type: 'album',
      label: 'Album',
      description: 'Picks a full album',
      icon: Disc3,
    },
    {
      type: 'single',
      label: 'Single / EP',
      description: 'Picks singles and EPs',
      icon: Radio,
    },
  ];

  const hasArtists = selectedArtists.length > 0;

  return (
    <div className="space-y-4">
      {/* Type Selector (Track / Album / Single) */}
      <div className="grid grid-cols-3 gap-3">
        {options.map((option) => {
          const Icon = option.icon;
          const active = selectedType === option.type;
          return (
            <button
              key={option.type}
              type="button"
              onClick={() => onSelectType(option.type)}
              className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all text-center cursor-pointer ${
                active
                  ? 'border-emerald-500 bg-emerald-950/40 text-white shadow-lg shadow-emerald-500/20 scale-[1.02]'
                  : 'border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
              }`}
            >
              <div
                className={`p-2.5 rounded-full mb-2 ${
                  active ? 'bg-emerald-500 text-black' : 'bg-zinc-800 text-zinc-300'
                }`}
              >
                <Icon className="h-5 w-5" />
              </div>
              <span className="font-bold text-sm">{option.label}</span>
              <span className="text-[11px] text-zinc-500 hidden sm:block mt-0.5">
                {option.description}
              </span>
            </button>
          );
        })}
      </div>

      {/* Randomize Action Button */}
      <div className="pt-2 flex flex-col items-center">
        <Button
          variant="spotify"
          size="lg"
          disabled={!hasArtists || randomizeMutation.isPending}
          onClick={() => randomizeMutation.mutate()}
          className="w-full sm:w-80 h-14 text-lg font-black tracking-wide shadow-xl shadow-[#1DB954]/25 hover:shadow-[#1DB954]/40"
        >
          {randomizeMutation.isPending ? (
            <>
              <Loader2 className="h-6 w-6 animate-spin text-black" />
              Drawing from Spotify...
            </>
          ) : (
            <>
              <Dices className="h-6 w-6" />
              SPIN {selectedType.toUpperCase()}!
            </>
          )}
        </Button>

        {!hasArtists && (
          <p className="text-xs text-amber-400/90 mt-2 flex items-center gap-1.5">
            <AlertCircle className="h-3.5 w-3.5" />
            Select at least one artist above to randomize.
          </p>
        )}

        {randomizeMutation.isError && (
          <p className="text-xs text-red-400 mt-2 flex items-center gap-1.5">
            <AlertCircle className="h-3.5 w-3.5" />
            {randomizeMutation.error.message}
          </p>
        )}
      </div>
    </div>
  );
}
