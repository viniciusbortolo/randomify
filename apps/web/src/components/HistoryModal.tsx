'use client';

import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Trash2, ExternalLink, History as HistoryIcon, Music, Disc, Radio } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { apiFetch } from '@/lib/api';
import type { HistoryItem } from '@randomify/shared';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function HistoryModal({ isOpen, onClose }: HistoryModalProps) {
  const queryClient = useQueryClient();

  const { data: history = [], isLoading } = useQuery<HistoryItem[]>({
    queryKey: ['history'],
    queryFn: () => apiFetch<HistoryItem[]>('/history'),
    enabled: isOpen,
  });

  const clearHistoryMutation = useMutation({
    mutationFn: () => apiFetch('/history', { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['history'] });
    },
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-xl rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <div className="flex items-center gap-2">
            <HistoryIcon className="h-5 w-5 text-emerald-400" />
            <h2 className="text-lg font-bold text-white">Histórico de Sorteios</h2>
          </div>
          <div className="flex items-center gap-2">
            {history.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => clearHistoryMutation.mutate()}
                disabled={clearHistoryMutation.isPending}
                className="text-xs text-zinc-400 hover:text-red-400 gap-1.5"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Limpar
              </Button>
            )}
            <button
              onClick={onClose}
              className="rounded-full p-1 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="max-h-96 overflow-y-auto space-y-2 pr-1">
          {isLoading ? (
            <p className="text-center text-xs text-zinc-500 py-8">Carregando histórico...</p>
          ) : history.length === 0 ? (
            <p className="text-center text-xs text-zinc-500 py-8">Nenhum sorteio registrado ainda.</p>
          ) : (
            history.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-3 rounded-xl bg-zinc-900/60 border border-zinc-800/80 hover:border-zinc-700 transition-all text-xs"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2 rounded-lg bg-zinc-800 text-emerald-400 shrink-0">
                    {item.type === 'track' ? (
                      <Music className="h-4 w-4" />
                    ) : item.type === 'album' ? (
                      <Disc className="h-4 w-4" />
                    ) : (
                      <Radio className="h-4 w-4" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-zinc-100 truncate">{item.itemName}</p>
                    <p className="text-zinc-400 truncate">{item.artistNames.join(', ')}</p>
                    <span className="text-[10px] text-zinc-500">
                      {new Date(item.createdAt).toLocaleString('pt-BR')}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant="secondary" className="text-[10px] uppercase">
                    {item.type}
                  </Badge>
                  <a
                    href={item.externalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded-lg text-zinc-400 hover:text-[#1DB954] hover:bg-zinc-800 transition-colors"
                    title="Abrir no Spotify"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
