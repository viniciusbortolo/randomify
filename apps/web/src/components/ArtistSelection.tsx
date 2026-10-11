'use client';

import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Search, Plus, X, BookmarkPlus, Check, Sparkles, Loader2, Users, ClipboardPaste, Filter } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { PasteListModal } from './PasteListModal';
import { z } from 'zod';
import type { CreatePresetInput, Artist, Preset } from '@randomify/shared';
import { useLanguage } from '@/contexts/language-context';

type SavePresetFormInput = {
  name: string;
};

interface ArtistSelectionProps {
  selectedArtists: Artist[];
  onToggleArtist: (artist: Artist) => void;
  onClearSelected: () => void;
  onSelectMultiple: (artists: Artist[]) => void;
}

export function ArtistSelection({
  selectedArtists,
  onToggleArtist,
  onClearSelected,
  onSelectMultiple,
}: ArtistSelectionProps) {
  const queryClient = useQueryClient();
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSavingPreset, setIsSavingPreset] = useState(false);
  const [isPasteModalOpen, setIsPasteModalOpen] = useState(false);

  const handleAddBatchArtists = (newArtists: Artist[]) => {
    const existingMap = new Map(selectedArtists.map((a) => [a.id, a]));
    for (const artist of newArtists) {
      existingMap.set(artist.id, artist);
    }
    onSelectMultiple(Array.from(existingMap.values()));
  };

  // Fetch followed artists from Spotify
  const { data: followedArtists = [], isLoading: loadingFollowed } = useQuery<Artist[]>({
    queryKey: ['spotify', 'followed-artists'],
    queryFn: () => apiFetch<Artist[]>('/spotify/followed-artists'),
  });

  // Sort followed artists alphabetically A-Z
  const sortedFollowedArtists = useMemo(() => {
    return [...followedArtists].sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
    );
  }, [followedArtists]);

  // Genre filter state
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);

  // Available genres aggregated from followed artists
  const availableGenres = useMemo(() => {
    const genreMap = new Map<string, number>();
    for (const artist of followedArtists) {
      if (artist.genres) {
        for (const genre of artist.genres) {
          const formatted = genre.trim().toLowerCase();
          if (formatted) {
            genreMap.set(formatted, (genreMap.get(formatted) || 0) + 1);
          }
        }
      }
    }
    return Array.from(genreMap.entries())
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .map(([name, count]) => ({ name, count }));
  }, [followedArtists]);

  // Filter sorted followed artists by selected genre
  const displayedFollowedArtists = useMemo(() => {
    if (!selectedGenre) return sortedFollowedArtists;
    const target = selectedGenre.toLowerCase();
    return sortedFollowedArtists.filter((artist) =>
      artist.genres?.some((g) => g.toLowerCase() === target)
    );
  }, [sortedFollowedArtists, selectedGenre]);

  // Search artists by name
  const { data: searchResults = [], isFetching: isSearching } = useQuery<Artist[]>({
    queryKey: ['spotify', 'search', searchQuery],
    queryFn: () => apiFetch<Artist[]>(`/spotify/search-artists?q=${encodeURIComponent(searchQuery)}`),
    enabled: searchQuery.trim().length > 1,
  });

  // Fetch saved presets
  const { data: presets = [] } = useQuery<Preset[]>({
    queryKey: ['presets'],
    queryFn: () => apiFetch<Preset[]>('/presets'),
  });

  const savePresetSchema = useMemo(
    () =>
      z.object({
        name: z
          .string()
          .trim()
          .min(1, t.artistSelection.presetErrorRequired)
          .max(50, t.artistSelection.presetErrorTooLong),
      }),
    [t]
  );

  // Save preset form with react-hook-form and zod
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SavePresetFormInput>({
    resolver: zodResolver(savePresetSchema),
    defaultValues: {
      name: '',
    },
  });

  // Mutation to create preset
  const createPresetMutation = useMutation({
    mutationFn: (data: CreatePresetInput) =>
      apiFetch('/presets', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['presets'] });
      setIsSavingPreset(false);
      reset();
    },
  });

  const onSavePresetSubmit = (formData: SavePresetFormInput) => {
    if (selectedArtists.length === 0) return;
    createPresetMutation.mutate({
      name: formData.name.trim(),
      artists: selectedArtists.map((a) => ({ id: a.id, name: a.name, imageUrl: a.imageUrl })),
    });
  };

  const isSelected = (id: string) => selectedArtists.some((a) => a.id === id);

  return (
    <div className="space-y-6">
      {/* Selected Artists Bar */}
      <Card className="border-emerald-500/20 bg-zinc-900/80">
        <CardHeader className="pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
              <Users className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-400" />
              {t.artistSelection.title} ({selectedArtists.length})
            </CardTitle>
            <p className="text-xs text-zinc-400 mt-0.5">
              {t.artistSelection.subtitle}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsPasteModalOpen(true)}
              className="gap-1.5 text-xs h-8 border-emerald-500/40 text-emerald-300 hover:bg-emerald-950/40"
            >
              <ClipboardPaste className="h-3.5 w-3.5" />
              {t.artistSelection.pasteList}
            </Button>

            {selectedArtists.length > 0 && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsSavingPreset(!isSavingPreset)}
                  className="gap-1.5 text-xs h-8 text-zinc-300 hover:text-white"
                >
                  <BookmarkPlus className="h-3.5 w-3.5 text-emerald-400" />
                  {t.artistSelection.savePreset}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClearSelected}
                  className="text-xs h-8 text-zinc-400 hover:text-red-400 px-2.5"
                >
                  {t.artistSelection.clear}
                </Button>
              </>
            )}
          </div>
        </CardHeader>

        <CardContent>
          {/* Inline Save Preset Form */}
          {isSavingPreset && (
            <form
              onSubmit={handleSubmit(onSavePresetSubmit)}
              className="mb-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-3 rounded-xl bg-zinc-950/60 border border-emerald-500/30"
            >
              <div className="flex-1 w-full">
                <Input
                  {...register('name')}
                  placeholder={t.artistSelection.presetPlaceholder}
                  className="h-9 text-xs"
                  autoFocus
                />
                {errors.name && (
                  <p className="text-[11px] text-red-400 mt-1">{errors.name.message}</p>
                )}
                {createPresetMutation.isError && (
                  <p className="text-[11px] text-red-400 mt-1">
                    {createPresetMutation.error instanceof Error
                      ? createPresetMutation.error.message
                      : t.artistSelection.presetSaveFailed}
                  </p>
                )}
              </div>
              <div className="flex gap-2 justify-end">
                <Button
                  type="submit"
                  size="sm"
                  disabled={isSubmitting || createPresetMutation.isPending}
                  className="text-xs h-9 px-4"
                >
                  {createPresetMutation.isPending ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    t.artistSelection.presetSave
                  )}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsSavingPreset(false)}
                  className="text-xs h-9"
                >
                  {t.artistSelection.presetCancel}
                </Button>
              </div>
            </form>
          )}

          {/* Selected artists chips */}
          {selectedArtists.length === 0 ? (
            <div className="py-6 px-4 text-center text-xs sm:text-sm text-zinc-500 border border-dashed border-zinc-800 rounded-xl">
              {t.artistSelection.noArtistsSelected}
            </div>
          ) : (
            <div className="flex flex-wrap gap-1.5 sm:gap-2 max-h-44 overflow-y-auto pr-1">
              {selectedArtists.map((artist) => (
                <button
                  key={artist.id}
                  type="button"
                  onClick={() => onToggleArtist(artist)}
                  className="group flex items-center gap-1.5 sm:gap-2 rounded-full border border-emerald-500/30 bg-emerald-950/30 pl-1 pr-2.5 py-1 text-xs text-zinc-200 transition-all hover:border-red-500/50 hover:bg-red-950/30 hover:text-red-200 cursor-pointer max-w-full"
                  title={`${t.artistSelection.removeArtist} ${artist.name}`}
                >
                  {artist.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={artist.imageUrl}
                      alt={artist.name}
                      className="h-5 w-5 rounded-full object-cover shrink-0"
                    />
                  ) : (
                    <div className="h-5 w-5 rounded-full bg-emerald-800/60 text-[10px] flex items-center justify-center font-bold text-white shrink-0 group-hover:bg-red-900/60 transition-colors">
                      {artist.name[0]}
                    </div>
                  )}
                  <span className="font-medium text-zinc-200 group-hover:text-red-200 transition-colors truncate">
                    {artist.name}
                  </span>
                  <span className="text-zinc-400 group-hover:text-red-400 transition-colors shrink-0">
                    <X className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                  </span>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Preset Selector */}
      {presets.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          <span className="text-zinc-500 font-medium whitespace-nowrap">{t.artistSelection.quickPresets}</span>
          {presets.map((p) => (
            <button
              key={p.id}
              onClick={() => {
                const artistsList: Artist[] = p.artists.map((a) => ({
                  id: a.id,
                  name: a.name,
                  imageUrl: a.imageUrl,
                }));
                onSelectMultiple(artistsList);
              }}
              className="px-3 py-1.5 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:border-emerald-500/50 hover:bg-emerald-950/20 transition-all whitespace-nowrap flex items-center gap-1.5"
            >
              <Sparkles className="h-3 w-3 text-emerald-400" />
              {p.name}
              <span className="text-[10px] text-zinc-500">({p.artists.length})</span>
            </button>
          ))}
        </div>
      )}

      {/* Artist Search Input */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t.artistSelection.searchPlaceholder}
          className="pl-11 pr-10 h-10 sm:h-11 bg-zinc-900/90 text-xs sm:text-sm"
        />
        {isSearching && (
          <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-emerald-400" />
        )}
      </div>

      {/* Search results */}
      {searchQuery.trim().length > 1 && (
        <Card className="border-zinc-800 bg-zinc-900/90">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-zinc-400">{t.artistSelection.searchResults}</CardTitle>
          </CardHeader>
          <CardContent>
            {searchResults.length === 0 && !isSearching ? (
              <p className="text-xs text-zinc-500 py-2">
                {t.artistSelection.noArtistsFound.replace('{query}', searchQuery)}
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3 max-h-60 overflow-y-auto pr-1">
                {searchResults.map((artist) => {
                  const selected = isSelected(artist.id);
                  return (
                    <button
                      key={artist.id}
                      onClick={() => onToggleArtist(artist)}
                      className={`flex items-center gap-2.5 p-2 rounded-xl text-left border transition-all cursor-pointer ${
                        selected
                          ? 'border-emerald-500 bg-emerald-950/30 text-white'
                          : 'border-zinc-800 bg-zinc-950/40 text-zinc-300 hover:border-zinc-700 hover:bg-zinc-800/40'
                      }`}
                    >
                      {artist.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={artist.imageUrl}
                          alt={artist.name}
                          className="h-8 w-8 sm:h-9 sm:w-9 rounded-full object-cover shrink-0"
                        />
                      ) : (
                        <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-full bg-zinc-800 flex items-center justify-center font-bold text-xs shrink-0">
                          {artist.name[0]}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold truncate">{artist.name}</p>
                      </div>
                      <div className="shrink-0">
                        {selected ? (
                          <Check className="h-4 w-4 text-emerald-400" />
                        ) : (
                          <Plus className="h-4 w-4 text-zinc-500" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Followed Artists on Spotify */}
      <Card className="border-zinc-800 bg-zinc-900/60">
        <CardHeader className="pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div>
            <CardTitle className="text-base text-zinc-200">
              {t.artistSelection.followedTitle}
            </CardTitle>
            <p className="text-xs text-zinc-400 mt-0.5">
              {t.artistSelection.followedSubtitle}
            </p>
          </div>

          {displayedFollowedArtists.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const allSelected = displayedFollowedArtists.every((a) => isSelected(a.id));
                if (allSelected) {
                  const idsToDeselect = new Set(displayedFollowedArtists.map((a) => a.id));
                  onSelectMultiple(selectedArtists.filter((a) => !idsToDeselect.has(a.id)));
                } else {
                  const merged = new Map(selectedArtists.map((a) => [a.id, a]));
                  for (const a of displayedFollowedArtists) {
                    merged.set(a.id, a);
                  }
                  onSelectMultiple(Array.from(merged.values()));
                }
              }}
              className="text-xs self-start sm:self-auto h-8"
            >
              {displayedFollowedArtists.every((a) => isSelected(a.id))
                ? selectedGenre
                  ? t.artistSelection.deselectAllGenre.replace('{genre}', selectedGenre)
                  : t.artistSelection.deselectAll
                : selectedGenre
                ? t.artistSelection.selectAllGenre.replace('{genre}', selectedGenre)
                : t.artistSelection.selectAll}
            </Button>
          )}
        </CardHeader>

        <CardContent>
          {/* Genre filter pills */}
          {!loadingFollowed && availableGenres.length > 0 && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-2.5 mb-3 text-xs">
              <span className="text-[11px] font-medium text-zinc-500 shrink-0 mr-1 flex items-center gap-1">
                <Filter className="h-3 w-3" />
                {t.artistSelection.genreLabel}
              </span>
              <button
                type="button"
                onClick={() => setSelectedGenre(null)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all whitespace-nowrap cursor-pointer shrink-0 ${
                  selectedGenre === null
                    ? 'bg-[#1DB954] text-black font-semibold shadow-sm shadow-emerald-500/20'
                    : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700'
                }`}
              >
                {t.artistSelection.allGenres} ({sortedFollowedArtists.length})
              </button>
              {availableGenres.map(({ name, count }) => {
                const isCurrent = selectedGenre === name;
                return (
                  <button
                    key={name}
                    type="button"
                    onClick={() => setSelectedGenre(isCurrent ? null : name)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer shrink-0 capitalize ${
                      isCurrent
                        ? 'bg-[#1DB954] text-black font-semibold shadow-sm shadow-emerald-500/20'
                        : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700'
                    }`}
                  >
                    <span>{name}</span>
                    <span className={`text-[10px] ${isCurrent ? 'text-black/70 font-bold' : 'text-zinc-500'}`}>
                      ({count})
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {loadingFollowed ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-14 rounded-xl bg-zinc-800/50 animate-pulse" />
              ))}
            </div>
          ) : sortedFollowedArtists.length === 0 ? (
            <div className="py-6 text-center text-xs text-zinc-500">
              {t.artistSelection.noFollowedArtists}
            </div>
          ) : displayedFollowedArtists.length === 0 ? (
            <div className="py-6 text-center text-xs text-zinc-500">
              {t.artistSelection.noArtistsForGenre.replace('{genre}', selectedGenre || '')}
              <button
                type="button"
                onClick={() => setSelectedGenre(null)}
                className="ml-2 text-emerald-400 hover:underline cursor-pointer"
              >
                {t.artistSelection.clearFilter}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-2.5 max-h-80 overflow-y-auto pr-1">
              {displayedFollowedArtists.map((artist) => {
                const selected = isSelected(artist.id);
                return (
                  <button
                    key={artist.id}
                    onClick={() => onToggleArtist(artist)}
                    className={`flex items-center gap-2.5 p-2 rounded-xl text-left border transition-all cursor-pointer ${
                      selected
                        ? 'border-emerald-500 bg-emerald-950/30 text-white shadow-sm shadow-emerald-500/20'
                        : 'border-zinc-800/80 bg-zinc-950/40 text-zinc-300 hover:border-zinc-700 hover:bg-zinc-800/50'
                    }`}
                  >
                    {artist.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={artist.imageUrl}
                        alt={artist.name}
                        className="h-9 w-9 sm:h-10 sm:w-10 rounded-full object-cover shrink-0"
                      />
                    ) : (
                      <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-full bg-zinc-800 flex items-center justify-center font-bold text-xs shrink-0">
                        {artist.name[0]}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold truncate">{artist.name}</p>
                      {artist.genres && artist.genres.length > 0 && (
                        <p className="text-[10px] text-zinc-500 truncate capitalize">
                          {artist.genres.slice(0, 2).join(', ')}
                        </p>
                      )}
                    </div>
                    <div className="shrink-0">
                      {selected ? (
                        <Check className="h-4 w-4 text-emerald-400" />
                      ) : (
                        <Plus className="h-4 w-4 text-zinc-600" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
      {/* Paste List Modal */}
      <PasteListModal
        isOpen={isPasteModalOpen}
        onClose={() => setIsPasteModalOpen(false)}
        onAddArtists={handleAddBatchArtists}
      />
    </div>
  );
}
