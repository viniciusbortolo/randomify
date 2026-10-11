'use client';

import React from 'react';
import { ExternalLink, RotateCcw, Calendar, Disc, Music } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { useLanguage } from '@/contexts/language-context';
import type { RandomizeResponse } from '@randomify/shared';

interface RandomizeResultProps {
  result: RandomizeResponse;
  onDrawAgain: () => void;
  canSpinAgain?: boolean;
}

export function RandomizeResult({ result, onDrawAgain, canSpinAgain = true }: RandomizeResultProps) {
  const { t } = useLanguage();
  const { type, selectedArtist, track, album } = result;

  const item = track || album;
  if (!item) return null;

  const isTrack = type === 'track';
  const embedUrl = isTrack
    ? `https://open.spotify.com/embed/track/${item.id}?utm_source=generator&theme=0`
    : `https://open.spotify.com/embed/album/${item.id}?utm_source=generator&theme=0`;

  const badgeLabel =
    type === 'track'
      ? t.result.randomTrack
      : type === 'album'
      ? t.result.randomAlbum
      : t.result.randomSingle;

  return (
    <Card className="border-emerald-500/40 bg-zinc-900/90 shadow-2xl shadow-emerald-950/40 overflow-hidden animate-in fade-in zoom-in-95 duration-300">
      <CardHeader className="bg-gradient-to-r from-emerald-950/40 to-zinc-900/80 border-b border-zinc-800/80 pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="default" className="uppercase font-bold tracking-wider text-[10px]">
              {badgeLabel}
            </Badge>
            <span className="text-xs text-zinc-400">
              {t.common.by} <strong className="text-emerald-400">{selectedArtist.name}</strong>
            </span>
          </div>

          <Button
            variant="outline"
            size="sm"
            disabled={!canSpinAgain}
            onClick={onDrawAgain}
            className="self-start sm:self-auto gap-1.5 text-xs h-8 border-emerald-500/30 text-emerald-300 hover:bg-emerald-950/30 disabled:opacity-50 disabled:border-zinc-800 disabled:text-zinc-500"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            {canSpinAgain ? t.result.spinAnother : t.result.limitReached}
          </Button>
        </div>

        <CardTitle className="text-xl sm:text-2xl font-black text-white mt-2 sm:mt-3 flex items-center gap-2">
          {isTrack ? <Music className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-400 shrink-0" /> : <Disc className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-400 shrink-0" />}
          <span className="truncate">{item.name}</span>
        </CardTitle>

        <p className="text-xs sm:text-sm text-zinc-300 font-medium truncate">
          {item.artistNames.join(', ')}
        </p>
      </CardHeader>

      <CardContent className="p-4 sm:p-6 space-y-4 sm:space-y-6">
        {/* Metadata */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs text-zinc-400">
          {item.releaseDate && (
            <div className="flex items-center gap-1.5 bg-zinc-950/60 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full border border-zinc-800 text-[11px] sm:text-xs">
              <Calendar className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
              <span>{t.result.released} {item.releaseDate}</span>
            </div>
          )}

          {album?.totalTracks && (
            <div className="flex items-center gap-1.5 bg-zinc-950/60 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full border border-zinc-800 text-[11px] sm:text-xs">
              <Disc className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
              <span>{album.totalTracks} {t.result.tracksCount}</span>
            </div>
          )}

          {track?.albumName && (
            <div className="flex items-center gap-1.5 bg-zinc-950/60 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full border border-zinc-800 text-[11px] sm:text-xs max-w-full">
              <Disc className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
              <span className="truncate">{t.result.album} {track.albumName}</span>
            </div>
          )}

          <a
            href={item.externalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-auto inline-flex items-center gap-1.5 text-xs font-bold text-[#1DB954] hover:underline"
          >
            {t.result.openInSpotify}
            <ExternalLink className="h-3.5 w-3.5 shrink-0" />
          </a>
        </div>

        {/* Official Spotify Embed Player */}
        <div className="rounded-xl overflow-hidden shadow-2xl bg-black border border-zinc-800">
          <iframe
            src={embedUrl}
            width="100%"
            height={isTrack ? '152' : '352'}
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            loading="lazy"
            className="w-full border-0"
            title="Spotify Embed Player"
          />
        </div>
      </CardContent>
    </Card>
  );
}
