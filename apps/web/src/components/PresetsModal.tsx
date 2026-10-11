'use client';

import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Trash2, Bookmark, Play, Users } from 'lucide-react';
import { Button } from './ui/button';
import { apiFetch } from '@/lib/api';
import { useLanguage } from '@/contexts/language-context';
import type { Preset, Artist } from '@randomify/shared';

interface PresetsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyPreset: (artists: Artist[]) => void;
}

export function PresetsModal({ isOpen, onClose, onApplyPreset }: PresetsModalProps) {
  const queryClient = useQueryClient();
  const { t } = useLanguage();

  const { data: presets = [], isLoading } = useQuery<Preset[]>({
    queryKey: ['presets'],
    queryFn: () => apiFetch<Preset[]>('/presets'),
    enabled: isOpen,
  });

  const deletePresetMutation = useMutation({
    mutationFn: (id: string) => apiFetch(`/presets/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['presets'] });
    },
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-3.5 sm:p-4">
      <div className="w-full max-w-xl rounded-2xl border border-zinc-800 bg-zinc-950 p-4 sm:p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200 max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3 shrink-0">
          <div className="flex items-center gap-2">
            <Bookmark className="h-5 w-5 text-emerald-400" />
            <h2 className="text-base sm:text-lg font-bold text-white">{t.presets.title}</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-3 pr-1 min-h-0">
          {isLoading ? (
            <p className="text-center text-xs text-zinc-500 py-8">{t.presets.loading}</p>
          ) : presets.length === 0 ? (
            <p className="text-center text-xs text-zinc-500 py-8">
              {t.presets.empty}
            </p>
          ) : (
            presets.map((preset) => {
              const artistsList: Artist[] = preset.artists.map((a) => ({
                id: a.id,
                name: a.name,
                imageUrl: a.imageUrl,
              }));

              return (
                <div
                  key={preset.id}
                  className="p-3 sm:p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-2.5 sm:space-y-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="font-bold text-xs sm:text-sm text-white truncate">{preset.name}</h3>
                      <p className="text-[11px] sm:text-xs text-zinc-400 flex items-center gap-1 mt-0.5">
                        <Users className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                        <span>{artistsList.length} {t.presets.artistsCount}</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                      <Button
                        size="sm"
                        onClick={() => {
                          onApplyPreset(artistsList);
                          onClose();
                        }}
                        className="gap-1.5 text-xs h-7 sm:h-8 px-2.5 sm:px-3"
                      >
                        <Play className="h-3 w-3 sm:h-3.5 sm:w-3.5 fill-black" />
                        {t.presets.load}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deletePresetMutation.mutate(preset.id)}
                        disabled={deletePresetMutation.isPending}
                        className="h-7 w-7 sm:h-8 sm:w-8 text-zinc-500 hover:text-red-400"
                        title={t.presets.deleteTitle}
                      >
                        <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1 sm:gap-1.5 max-h-20 overflow-y-auto">
                    {artistsList.map((artist) => (
                      <span
                        key={artist.id}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-zinc-800/80 text-[10px] sm:text-[11px] text-zinc-300"
                      >
                        {artist.name}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
