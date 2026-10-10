'use client';

import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Trash2, Bookmark, Play, Users } from 'lucide-react';
import { Button } from './ui/button';
import { apiFetch } from '@/lib/api';
import type { Preset, Artist } from '@randomify/shared';

interface PresetsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyPreset: (artists: Artist[]) => void;
}

export function PresetsModal({ isOpen, onClose, onApplyPreset }: PresetsModalProps) {
  const queryClient = useQueryClient();

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-xl rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <div className="flex items-center gap-2">
            <Bookmark className="h-5 w-5 text-emerald-400" />
            <h2 className="text-lg font-bold text-white">Meus Presets Salvos</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="max-h-96 overflow-y-auto space-y-3 pr-1">
          {isLoading ? (
            <p className="text-center text-xs text-zinc-500 py-8">Carregando presets...</p>
          ) : presets.length === 0 ? (
            <p className="text-center text-xs text-zinc-500 py-8">
              Você ainda não salvou nenhum preset. Selecione artistas e clique em &ldquo;Salvar como Preset&rdquo;.
            </p>
          ) : (
            presets.map((preset) => {
              const artistsList: Artist[] = (preset.artists as any).map((a: any) => ({
                id: a.id,
                name: a.name,
                imageUrl: a.imageUrl,
              }));

              return (
                <div
                  key={preset.id}
                  className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-sm text-white">{preset.name}</h3>
                      <p className="text-xs text-zinc-400 flex items-center gap-1 mt-0.5">
                        <Users className="h-3.5 w-3.5 text-emerald-400" />
                        {artistsList.length} artistas
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        onClick={() => {
                          onApplyPreset(artistsList);
                          onClose();
                        }}
                        className="gap-1.5 text-xs h-8"
                      >
                        <Play className="h-3.5 w-3.5 fill-black" />
                        Carregar
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deletePresetMutation.mutate(preset.id)}
                        disabled={deletePresetMutation.isPending}
                        className="h-8 w-8 text-zinc-500 hover:text-red-400"
                        title="Excluir preset"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto">
                    {artistsList.map((artist) => (
                      <span
                        key={artist.id}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-zinc-800/80 text-[11px] text-zinc-300"
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
