'use client';

import React from 'react';
import { ExternalLink, RotateCcw, Calendar, Disc, Music } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import type { RandomizeResponse } from '@randomify/shared';

interface RandomizeResultProps {
  result: RandomizeResponse;
  onDrawAgain: () => void;
}

export function RandomizeResult({ result, onDrawAgain }: RandomizeResultProps) {
  const { type, selectedArtist, track, album } = result;

  const item = track || album;
  if (!item) return null;

  const isTrack = type === 'track';
  const embedUrl = isTrack
    ? `https://open.spotify.com/embed/track/${item.id}?utm_source=generator&theme=0`
    : `https://open.spotify.com/embed/album/${item.id}?utm_source=generator&theme=0`;

  const badgeLabel =
    type === 'track' ? 'Random Track' : type === 'album' ? 'Random Album' : 'Random Single / EP';

  return (
    <Card className="border-emerald-500/40 bg-zinc-900/90 shadow-2xl shadow-emerald-950/40 overflow-hidden animate-in fade-in zoom-in-95 duration-300">
      <CardHeader className="bg-gradient-to-r from-emerald-950/40 to-zinc-900/80 border-b border-zinc-800/80 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="default" className="uppercase font-bold tracking-wider text-[10px]">
              {badgeLabel}
            </Badge>
            <span className="text-xs text-zinc-400">
              by <strong className="text-emerald-400">{selectedArtist.name}</strong>
            </span>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={onDrawAgain}
            className="gap-1.5 text-xs h-8 border-emerald-500/30 text-emerald-300 hover:bg-emerald-950/30"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Spin Another
          </Button>
        </div>

        <CardTitle className="text-2xl font-black text-white mt-3 flex items-center gap-2">
          {isTrack ? <Music className="h-6 w-6 text-emerald-400" /> : <Disc className="h-6 w-6 text-emerald-400" />}
          {item.name}
        </CardTitle>

        <p className="text-sm text-zinc-300 font-medium">
          {item.artistNames.join(', ')}
        </p>
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        {/* Metadata */}
        <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-400">
          {item.releaseDate && (
            <div className="flex items-center gap-1.5 bg-zinc-950/60 px-3 py-1.5 rounded-full border border-zinc-800">
              <Calendar className="h-3.5 w-3.5 text-emerald-400" />
              Released: {item.releaseDate}
            </div>
          )}

          {album?.totalTracks && (
            <div className="flex items-center gap-1.5 bg-zinc-950/60 px-3 py-1.5 rounded-full border border-zinc-800">
              <Disc className="h-3.5 w-3.5 text-emerald-400" />
              {album.totalTracks} tracks
            </div>
          )}

          {track?.albumName && (
            <div className="flex items-center gap-1.5 bg-zinc-950/60 px-3 py-1.5 rounded-full border border-zinc-800">
              <Disc className="h-3.5 w-3.5 text-emerald-400" />
              Album: {track.albumName}
            </div>
          )}

          <a
            href={item.externalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-auto inline-flex items-center gap-1.5 text-xs font-bold text-[#1DB954] hover:underline"
          >
            Open in Spotify app
            <ExternalLink className="h-3.5 w-3.5" />
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
