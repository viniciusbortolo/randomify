'use client';

import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Trash2, ExternalLink, History as HistoryIcon, Music, Disc, Radio, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { apiFetch } from '@/lib/api';
import { useLanguage } from '@/contexts/language-context';
import type { HistoryItem } from '@randomify/shared';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function HistoryModal({ isOpen, onClose }: HistoryModalProps) {
  const queryClient = useQueryClient();
  const { t, formatDate } = useLanguage();

  const { data: history = [], isLoading } = useQuery<HistoryItem[]>({
    queryKey: ['history'],
    queryFn: () => apiFetch<HistoryItem[]>('/history'),
    enabled: isOpen,
  });

  const clearHistoryMutation = useMutation({
    mutationFn: () => apiFetch('/history', { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.setQueryData(['history'], []);
      queryClient.invalidateQueries({ queryKey: ['history'] });
    },
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-3.5 sm:p-4">
      <div className="w-full max-w-xl rounded-2xl border border-zinc-800 bg-zinc-950 p-4 sm:p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200 max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3 shrink-0">
          <div className="flex items-center gap-2">
            <HistoryIcon className="h-5 w-5 text-emerald-400" />
            <h2 className="text-base sm:text-lg font-bold text-white">{t.history.title}</h2>
          </div>
          <div className="flex items-center gap-2">
            {history.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => clearHistoryMutation.mutate()}
                disabled={clearHistoryMutation.isPending}
                className="text-xs text-zinc-400 hover:text-red-400 gap-1.5 h-8 px-2.5"
              >
                {clearHistoryMutation.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Trash2 className="h-3.5 w-3.5" />
                )}
                {t.history.clear}
              </Button>
            )}
            <button
              onClick={onClose}
              className="rounded-full p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-0">
          {isLoading ? (
            <p className="text-center text-xs text-zinc-500 py-8">{t.history.loading}</p>
          ) : history.length === 0 ? (
            <p className="text-center text-xs text-zinc-500 py-8">{t.history.empty}</p>
          ) : (
            history.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-2.5 sm:p-3 rounded-xl bg-zinc-900/60 border border-zinc-800/80 hover:border-zinc-700 transition-all text-xs gap-2"
              >
                <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                  <div className="p-2 rounded-lg bg-zinc-800 text-emerald-400 shrink-0">
                    {item.type === 'track' ? (
                      <Music className="h-4 w-4" />
                    ) : item.type === 'album' ? (
                      <Disc className="h-4 w-4" />
                    ) : (
                      <Radio className="h-4 w-4" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-zinc-100 truncate">{item.itemName}</p>
                    <p className="text-zinc-400 truncate text-[11px] sm:text-xs">{item.artistNames.join(', ')}</p>
                    <span className="text-[10px] text-zinc-500">
                      {formatDate(item.createdAt)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                  <Badge variant="secondary" className="text-[9px] sm:text-[10px] uppercase px-1.5 py-0.5">
                    {item.type === 'track'
                      ? t.history.typeTrack
                      : item.type === 'album'
                      ? t.history.typeAlbum
                      : t.history.typeSingle}
                  </Badge>
                  <a
                    href={item.externalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded-lg text-zinc-400 hover:text-[#1DB954] hover:bg-zinc-800 transition-colors"
                    title={t.history.openInSpotify}
                  >
                    <ExternalLink className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
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
