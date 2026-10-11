'use client';

import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X, ClipboardPaste, Loader2, CheckCircle2, AlertTriangle, Plus } from 'lucide-react';
import { Button } from './ui/button';
import { apiFetch } from '@/lib/api';
import type { Artist, BatchSearchResponse } from '@randomify/shared';

interface PasteListModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddArtists: (artists: Artist[]) => void;
}

export function PasteListModal({ isOpen, onClose, onAddArtists }: PasteListModalProps) {
  const queryClient = useQueryClient();
  const [inputText, setInputText] = useState('');
  const [saveAsPreset, setSaveAsPreset] = useState(false);
  const [presetName, setPresetName] = useState('');
  const [resultSummary, setResultSummary] = useState<BatchSearchResponse | null>(null);

  // Parse lines or comma-separated queries
  const parsedQueries = inputText
    .split(/[\n,;]+/)
    .map((line) => line.trim().replace(/^(\d+[\.\)]|[-*•])\s*/, ''))
    .filter((line) => line.length > 0);

  const batchSearchMutation = useMutation({
    mutationFn: async (queries: string[]) => {
      return apiFetch<BatchSearchResponse>('/spotify/batch-search', {
        method: 'POST',
        body: JSON.stringify({ queries }),
      });
    },
    onSuccess: async (data) => {
      setResultSummary(data);

      if (data.found.length > 0) {
        onAddArtists(data.found);

        // Optionally save directly as a preset
        if (saveAsPreset && presetName.trim()) {
          try {
            await apiFetch('/presets', {
              method: 'POST',
              body: JSON.stringify({
                name: presetName.trim(),
                artists: data.found.map((a) => ({ id: a.id, name: a.name, imageUrl: a.imageUrl })),
              }),
            });
            queryClient.invalidateQueries({ queryKey: ['presets'] });
          } catch {
            // ignore preset creation error
          }
        }
      }

      // If all artists were found, close modal after a brief moment
      if (data.notFound.length === 0 && data.found.length > 0) {
        setTimeout(() => {
          handleClose();
        }, 1200);
      }
    },
  });

  const handleClose = () => {
    setInputText('');
    setPresetName('');
    setSaveAsPreset(false);
    setResultSummary(null);
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (parsedQueries.length === 0) return;
    batchSearchMutation.mutate(parsedQueries);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <ClipboardPaste className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Paste Artist List</h2>
              <p className="text-xs text-zinc-400">
                Add multiple artists at once from text or Spotify links
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="rounded-full p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-300 flex items-center justify-between">
              <span>Artists (one per line or comma-separated):</span>
              <span className="text-[11px] text-emerald-400 font-mono">
                {parsedQueries.length} {parsedQueries.length === 1 ? 'artist' : 'artists'} detected
              </span>
            </label>
            <textarea
              value={inputText}
              onChange={(e) => {
                setInputText(e.target.value);
                setResultSummary(null);
              }}
              rows={7}
              placeholder={`Radiohead\nPink Floyd\nDavid Bowie\nLed Zeppelin\nThe Beatles`}
              className="w-full rounded-xl border border-zinc-700 bg-zinc-900/90 p-3 text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-sans leading-relaxed"
              disabled={batchSearchMutation.isPending}
            />
          </div>

          {/* Optional: save as preset */}
          <div className="p-3 rounded-xl bg-zinc-900/50 border border-zinc-800 space-y-2">
            <label className="flex items-center gap-2 cursor-pointer text-xs text-zinc-300">
              <input
                type="checkbox"
                checked={saveAsPreset}
                onChange={(e) => setSaveAsPreset(e.target.checked)}
                className="h-4 w-4 rounded accent-emerald-500 cursor-pointer"
              />
              <span>Also save these artists as a new Preset</span>
            </label>
            {saveAsPreset && (
              <input
                type="text"
                value={presetName}
                onChange={(e) => setPresetName(e.target.value)}
                placeholder="Preset name (e.g. My Favorite Bands)"
                className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-1.5 text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            )}
          </div>

          {/* Results Summary */}
          {resultSummary && (
            <div className="space-y-2 animate-in fade-in">
              {resultSummary.found.length > 0 && (
                <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-950/30 p-2.5 rounded-xl border border-emerald-500/30">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>
                    Successfully found and added {resultSummary.found.length}{' '}
                    {resultSummary.found.length === 1 ? 'artist' : 'artists'} to your pool!
                  </span>
                </div>
              )}

              {resultSummary.notFound.length > 0 && (
                <div className="space-y-1 text-xs text-amber-300 bg-amber-950/30 p-2.5 rounded-xl border border-amber-500/30">
                  <div className="flex items-center gap-1.5 font-semibold">
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    <span>{resultSummary.notFound.length} not found on Spotify:</span>
                  </div>
                  <p className="text-[11px] text-amber-400/80 pl-5">
                    {resultSummary.notFound.join(', ')}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClose}
              disabled={batchSearchMutation.isPending}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={parsedQueries.length === 0 || batchSearchMutation.isPending}
              className="gap-2 text-xs"
            >
              {batchSearchMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Searching Spotify...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  Add {parsedQueries.length > 0 ? `(${parsedQueries.length})` : ''} to Pool
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
