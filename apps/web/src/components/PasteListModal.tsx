'use client';

import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import {
  X,
  ClipboardPaste,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Search,
  Plus,
  ArrowLeft,
  Check,
  Trash2,
  Sparkles,
} from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { apiFetch } from '@/lib/api';
import type { Artist, BatchSearchResponse } from '@randomify/shared';

interface ReviewItem {
  id: string;
  query: string;
  artist: Artist | null;
}

interface PasteListModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddArtists: (artists: Artist[]) => void;
}

export function PasteListModal({ isOpen, onClose, onAddArtists }: PasteListModalProps) {
  const [step, setStep] = useState<'input' | 'review'>('input');
  const [inputText, setInputText] = useState('');
  const [items, setItems] = useState<ReviewItem[]>([]);

  // Manual search state
  const [activeManualIndex, setActiveManualIndex] = useState<number | null>(null);
  const [manualQuery, setManualQuery] = useState('');
  const [manualCandidates, setManualCandidates] = useState<Artist[]>([]);
  const [isManualSearching, setIsManualSearching] = useState(false);

  // Parse queries from raw text (split by newlines, commas, semicolons)
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
    onSuccess: (data) => {
      const reviewList: ReviewItem[] = data.items.map((item, idx) => ({
        id: `${item.query}-${idx}`,
        query: item.query,
        artist: item.artist || null,
      }));
      setItems(reviewList);
      setStep('review');
    },
  });

  const handleClose = () => {
    setStep('input');
    setInputText('');
    setItems([]);
    setActiveManualIndex(null);
    setManualCandidates([]);
    setManualQuery('');
    onClose();
  };

  const handleStartReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (parsedQueries.length === 0) return;
    batchSearchMutation.mutate(parsedQueries);
  };

  const handleOpenManualSearch = async (index: number, initialQuery: string) => {
    setActiveManualIndex(index);
    setManualQuery(initialQuery);
    setManualCandidates([]);
    setIsManualSearching(true);

    try {
      const candidates = await apiFetch<Artist[]>(
        `/spotify/search-artists?q=${encodeURIComponent(initialQuery)}`
      );
      setManualCandidates(candidates.slice(0, 5));
    } catch {
      setManualCandidates([]);
    } finally {
      setIsManualSearching(false);
    }
  };

  const handleSearchManualQuery = async (query: string) => {
    if (!query.trim()) return;
    setIsManualSearching(true);
    try {
      const candidates = await apiFetch<Artist[]>(
        `/spotify/search-artists?q=${encodeURIComponent(query.trim())}`
      );
      setManualCandidates(candidates.slice(0, 5));
    } catch {
      setManualCandidates([]);
    } finally {
      setIsManualSearching(false);
    }
  };

  const handleSelectManualArtist = (index: number, selectedArtist: Artist) => {
    setItems((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, artist: selectedArtist } : item
      )
    );
    setActiveManualIndex(null);
    setManualCandidates([]);
    setManualQuery('');
  };

  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
    if (activeManualIndex === index) {
      setActiveManualIndex(null);
      setManualCandidates([]);
    }
  };

  const handleConfirmAdd = () => {
    // Collect all unique resolved artists
    const seen = new Set<string>();
    const resolvedArtists: Artist[] = [];

    for (const item of items) {
      if (item.artist && !seen.has(item.artist.id)) {
        seen.add(item.artist.id);
        resolvedArtists.push(item.artist);
      }
    }

    if (resolvedArtists.length > 0) {
      onAddArtists(resolvedArtists);
    }

    handleClose();
  };

  if (!isOpen) return null;

  const resolvedCount = items.filter((i) => i.artist !== null).length;
  const notFoundCount = items.length - resolvedCount;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-xl rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <ClipboardPaste className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                {step === 'input' ? 'Paste Artist List' : 'Review Matched Artists'}
              </h2>
              <p className="text-xs text-zinc-400">
                {step === 'input'
                  ? 'Paste artist names or Spotify URLs to add them in bulk'
                  : `Resolved ${resolvedCount} of ${items.length} artists`}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="rounded-full p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* STEP 1: Textarea Input */}
        {step === 'input' && (
          <form onSubmit={handleStartReview} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-300 flex items-center justify-between">
                <span>Artist names (one per line or comma-separated):</span>
                <span className="text-[11px] text-emerald-400 font-mono">
                  {parsedQueries.length} {parsedQueries.length === 1 ? 'artist' : 'artists'} detected
                </span>
              </label>
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                rows={8}
                placeholder={`Radiohead\nPink Floyd\nDavid Bowie\nLed Zeppelin\nhttps://open.spotify.com/artist/4Z8W4fKeB5YxbusRsdQVPb`}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-900/90 p-3 text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-sans leading-relaxed resize-none"
                disabled={batchSearchMutation.isPending}
                autoFocus
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleClose}
                disabled={batchSearchMutation.isPending}
                className="text-xs text-zinc-400 hover:text-white"
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
                    Searching on Spotify...
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4" />
                    Find Artists ({parsedQueries.length})
                  </>
                )}
              </Button>
            </div>
          </form>
        )}

        {/* STEP 2: Review and Manual Match */}
        {step === 'review' && (
          <div className="space-y-4">
            {/* Status overview pill */}
            {notFoundCount > 0 ? (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-950/30 border border-amber-500/30 text-xs text-amber-300">
                <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400" />
                <span>
                  <strong>{notFoundCount} {notFoundCount === 1 ? 'artist was' : 'artists were'} not found automatically.</strong> Click &ldquo;Search manually&rdquo; on the item to find the exact match.
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-xs text-emerald-300">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                <span>All {items.length} artists were matched successfully! Review and confirm below.</span>
              </div>
            )}

            {/* List of items */}
            <div className="max-h-[50vh] overflow-y-auto space-y-2 pr-1">
              {items.map((item, index) => {
                const isFound = item.artist !== null;
                const isManualOpen = activeManualIndex === index;

                return (
                  <div
                    key={item.id}
                    className={`rounded-xl border transition-all p-3 text-xs ${
                      isFound
                        ? 'border-zinc-800 bg-zinc-900/60'
                        : 'border-amber-500/40 bg-amber-950/15'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      {isFound ? (
                        /* Found Artist Card */
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          {item.artist?.imageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={item.artist.imageUrl}
                              alt={item.artist.name}
                              className="h-10 w-10 rounded-full object-cover shrink-0 border border-emerald-500/40"
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-emerald-800/60 text-white font-bold flex items-center justify-center shrink-0">
                              {item.artist?.name[0]}
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-zinc-100 truncate">
                                {item.artist?.name}
                              </p>
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-[10px] text-emerald-300">
                                <Check className="h-2.5 w-2.5" /> Matched
                              </span>
                            </div>
                            <p className="text-[11px] text-zinc-400 truncate">
                              Query: &ldquo;{item.query}&rdquo;
                            </p>
                          </div>
                        </div>
                      ) : (
                        /* Unmatched Item */
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-zinc-200 truncate">
                              &ldquo;{item.query}&rdquo;
                            </span>
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-amber-950/80 border border-amber-500/40 text-[10px] text-amber-300">
                              <AlertTriangle className="h-2.5 w-2.5" /> Not found
                            </span>
                          </div>
                          <p className="text-[11px] text-zinc-400 mt-0.5">
                            No exact match in Spotify catalog. Search manually to pick the correct artist.
                          </p>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        {!isFound && !isManualOpen && (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenManualSearch(index, item.query)}
                            className="h-7 text-xs border-amber-500/40 text-amber-300 hover:bg-amber-950/40 hover:text-amber-200 gap-1.5"
                          >
                            <Search className="h-3 w-3" />
                            Search manually
                          </Button>
                        )}

                        {isFound && (
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => handleOpenManualSearch(index, item.query)}
                            className="h-7 px-2 text-[11px] text-zinc-400 hover:text-zinc-200"
                            title="Pick different artist"
                          >
                            Change
                          </Button>
                        )}

                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => handleRemoveItem(index)}
                          className="h-7 w-7 p-0 text-zinc-500 hover:text-red-400"
                          title="Remove from import"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>

                    {/* Inline Manual Search Bar & Candidates */}
                    {isManualOpen && (
                      <div className="mt-3 pt-3 border-t border-zinc-800/80 space-y-2 animate-in fade-in duration-150">
                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
                            <Input
                              value={manualQuery}
                              onChange={(e) => {
                                setManualQuery(e.target.value);
                                handleSearchManualQuery(e.target.value);
                              }}
                              placeholder="Search Spotify artist name..."
                              className="h-8 pl-8 text-xs bg-zinc-950 border-zinc-700"
                              autoFocus
                            />
                            {isManualSearching && (
                              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 animate-spin text-emerald-400" />
                            )}
                          </div>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => setActiveManualIndex(null)}
                            className="h-8 text-xs text-zinc-400 hover:text-white"
                          >
                            Cancel
                          </Button>
                        </div>

                        {/* Candidates list */}
                        {manualCandidates.length > 0 && (
                          <div className="space-y-1 pt-1 max-h-40 overflow-y-auto pr-1">
                            <p className="text-[10px] text-zinc-400 font-medium uppercase tracking-wider">
                              Select correct artist:
                            </p>
                            {manualCandidates.map((candidate) => (
                              <button
                                key={candidate.id}
                                type="button"
                                onClick={() => handleSelectManualArtist(index, candidate)}
                                className="w-full flex items-center justify-between p-2 rounded-lg bg-zinc-950/70 hover:bg-emerald-950/40 border border-zinc-800 hover:border-emerald-500/40 transition-colors text-left cursor-pointer"
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  {candidate.imageUrl ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                      src={candidate.imageUrl}
                                      alt={candidate.name}
                                      className="h-7 w-7 rounded-full object-cover shrink-0"
                                    />
                                  ) : (
                                    <div className="h-7 w-7 rounded-full bg-zinc-800 text-[10px] font-bold flex items-center justify-center shrink-0 text-zinc-300">
                                      {candidate.name[0]}
                                    </div>
                                  )}
                                  <div className="min-w-0">
                                    <p className="text-xs font-semibold text-zinc-200 truncate">
                                      {candidate.name}
                                    </p>
                                    {candidate.genres && candidate.genres.length > 0 && (
                                      <p className="text-[10px] text-zinc-500 truncate">
                                        {candidate.genres.slice(0, 2).join(', ')}
                                      </p>
                                    )}
                                  </div>
                                </div>
                                <span className="text-[11px] text-emerald-400 font-medium shrink-0 ml-2">
                                  Select
                                </span>
                              </button>
                            ))}
                          </div>
                        )}

                        {!isManualSearching && manualCandidates.length === 0 && manualQuery.trim() !== '' && (
                          <p className="text-[11px] text-zinc-500 py-1">
                            No artists found on Spotify for &ldquo;{manualQuery}&rdquo;.
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Footer action bar */}
            <div className="flex items-center justify-between pt-2 border-t border-zinc-800">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setStep('input')}
                className="text-xs text-zinc-400 hover:text-white gap-1.5"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back to text
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleClose}
                  className="text-xs text-zinc-400 hover:text-white"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleConfirmAdd}
                  disabled={resolvedCount === 0}
                  className="gap-1.5 text-xs font-semibold"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add {resolvedCount} {resolvedCount === 1 ? 'Artist' : 'Artists'} to Selection
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
