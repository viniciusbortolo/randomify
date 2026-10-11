'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Search, Plus, X, BookmarkPlus, Check, Sparkles, Loader2, Users, ClipboardPaste } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { PasteListModal } from './PasteListModal';
import { CreatePresetSchema, type CreatePresetInput, type Artist, type Preset } from '@randomify/shared';

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

  // Save preset form with react-hook-form and zod
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreatePresetInput>({
    resolver: zodResolver(CreatePresetSchema),
    defaultValues: {
      name: '',
      artists: [],
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

  const onSavePresetSubmit = (formData: { name: string }) => {
    createPresetMutation.mutate({
      name: formData.name,
      artists: selectedArtists.map((a) => ({ id: a.id, name: a.name, imageUrl: a.imageUrl })),
    });
  };

  const isSelected = (id: string) => selectedArtists.some((a) => a.id === id);

  return (
    <div className="space-y-6">
      {/* Selected Artists Bar */}
      <Card className="border-emerald-500/20 bg-zinc-900/80">
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5 text-emerald-400" />
              Selected Artists ({selectedArtists.length})
            </CardTitle>
            <p className="text-xs text-zinc-400 mt-1">
              Randomization will pick from these selected artists
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsPasteModalOpen(true)}
              className="gap-1.5 text-xs border-emerald-500/40 text-emerald-300 hover:bg-emerald-950/40"
            >
              <ClipboardPaste className="h-3.5 w-3.5" />
              Paste List
            </Button>

            {selectedArtists.length > 0 && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsSavingPreset(!isSavingPreset)}
                  className="gap-1.5 text-xs text-zinc-300 hover:text-white"
                >
                  <BookmarkPlus className="h-3.5 w-3.5 text-emerald-400" />
                  Save as Preset
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClearSelected}
                  className="text-xs text-zinc-400 hover:text-red-400"
                >
                  Clear
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
              className="mb-4 flex flex-col sm:flex-row items-start sm:items-center gap-2 p-3 rounded-xl bg-zinc-950/60 border border-emerald-500/30"
            >
              <div className="flex-1 w-full">
                <Input
                  {...register('name')}
                  placeholder="Preset name (e.g. Classic Rock, Indie Favorites)"
                  className="h-9 text-xs"
                />
                {errors.name && (
                  <p className="text-[11px] text-red-400 mt-1">{errors.name.message}</p>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  type="submit"
                  size="sm"
                  disabled={isSubmitting || createPresetMutation.isPending}
                  className="text-xs h-9"
                >
                  {createPresetMutation.isPending ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    'Save'
                  )}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsSavingPreset(false)}
                  className="text-xs h-9"
                >
                  Cancel
                </Button>
              </div>
            </form>
          )}

          {/* Selected artists chips */}
          {selectedArtists.length === 0 ? (
            <div className="py-6 text-center text-sm text-zinc-500 border border-dashed border-zinc-800 rounded-xl">
              No artists selected yet. Search or pick from below!
            </div>
          ) : (
            <div className="flex flex-wrap gap-2 max-h-44 overflow-y-auto pr-1">
              {selectedArtists.map((artist) => (
                <div
                  key={artist.id}
                  className="group flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-950/30 pl-1 pr-3 py-1 text-xs text-emerald-200 transition-all hover:border-red-500/40 hover:bg-red-950/20"
                >
                  {artist.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={artist.imageUrl}
                      alt={artist.name}
                      className="h-5 w-5 rounded-full object-cover"
                    />
                  ) : (
                    <div className="h-5 w-5 rounded-full bg-emerald-800/60 text-[10px] flex items-center justify-center font-bold">
                      {artist.name[0]}
                    </div>
                  )}
                  <span className="font-medium">{artist.name}</span>
                  <button
                    onClick={() => onToggleArtist(artist)}
                    className="text-emerald-400 group-hover:text-red-400 transition-colors ml-0.5"
                    title="Remove"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Preset Selector */}
      {presets.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          <span className="text-zinc-500 font-medium whitespace-nowrap">Quick presets:</span>
          {presets.map((p) => (
            <button
              key={p.id}
              onClick={() => {
                const artistsList: Artist[] = (p.artists as any).map((a: any) => ({
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
              <span className="text-[10px] text-zinc-500">({(p.artists as any[]).length})</span>
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
          placeholder="Search artist by name in Spotify catalog..."
          className="pl-11 pr-10 h-11 bg-zinc-900/90 text-sm"
        />
        {isSearching && (
          <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-emerald-400" />
        )}
      </div>

      {/* Search results */}
      {searchQuery.trim().length > 1 && (
        <Card className="border-zinc-800 bg-zinc-900/90">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-zinc-400">Search Results</CardTitle>
          </CardHeader>
          <CardContent>
            {searchResults.length === 0 && !isSearching ? (
              <p className="text-xs text-zinc-500 py-2">No artists found for &ldquo;{searchQuery}&rdquo;</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-60 overflow-y-auto">
                {searchResults.map((artist) => {
                  const selected = isSelected(artist.id);
                  return (
                    <button
                      key={artist.id}
                      onClick={() => onToggleArtist(artist)}
                      className={`flex items-center gap-2.5 p-2 rounded-xl text-left border transition-all ${
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
                          className="h-9 w-9 rounded-full object-cover shrink-0"
                        />
                      ) : (
                        <div className="h-9 w-9 rounded-full bg-zinc-800 flex items-center justify-center font-bold text-xs shrink-0">
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
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base text-zinc-200">
              Artists you follow on Spotify
            </CardTitle>
            <p className="text-xs text-zinc-400">
              Click to select or deselect from the randomize pool
            </p>
          </div>

          {followedArtists.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const allSelected = followedArtists.every((a) => isSelected(a.id));
                if (allSelected) {
                  onClearSelected();
                } else {
                  onSelectMultiple(followedArtists);
                }
              }}
              className="text-xs"
            >
              {followedArtists.every((a) => isSelected(a.id))
                ? 'Deselect all'
                : 'Select all'}
            </Button>
          )}
        </CardHeader>

        <CardContent>
          {loadingFollowed ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="h-14 rounded-xl bg-zinc-800/50 animate-pulse" />
              ))}
            </div>
          ) : followedArtists.length === 0 ? (
            <div className="py-6 text-center text-xs text-zinc-500">
              No followed artists found on your Spotify account. Use the search above to add any artist!
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 max-h-72 overflow-y-auto pr-1">
              {followedArtists.map((artist) => {
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
                        className="h-10 w-10 rounded-full object-cover shrink-0"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-zinc-800 flex items-center justify-center font-bold text-xs shrink-0">
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
