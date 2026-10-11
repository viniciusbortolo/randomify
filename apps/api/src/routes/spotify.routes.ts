import { FastifyInstance } from 'fastify';
import { authenticate } from '../middlewares/auth.middleware.js';
import { getValidAccessTokenForUser, spotifyFetch } from '../lib/spotify.js';
import { prisma } from '../lib/prisma.js';
import {
  RandomizeRequestSchema,
  BatchSearchRequestSchema,
  DAILY_SPIN_LIMIT,
  SpinLimitsResponse,
} from '@randomify/shared';

interface SpotifyFollowedResponse {
  artists: {
    items: Array<{
      id: string;
      name: string;
      images: Array<{ url: string }>;
      genres: string[];
      popularity: number;
      uri: string;
      external_urls: { spotify: string };
    }>;
  };
}

interface SpotifySearchResponse {
  artists: {
    items: Array<{
      id: string;
      name: string;
      images: Array<{ url: string }>;
      genres: string[];
      popularity: number;
      uri: string;
      external_urls: { spotify: string };
    }>;
  };
}

interface SpotifyArtistInfo {
  id: string;
  name: string;
  images: Array<{ url: string }>;
  genres: string[];
  popularity: number;
  uri: string;
  external_urls: { spotify: string };
}

interface SpotifyAlbumItem {
  id: string;
  name: string;
  album_type: string;
  release_date: string;
  total_tracks: number;
  images: Array<{ url: string }>;
  artists: Array<{ name: string; id: string }>;
  uri: string;
  external_urls: { spotify: string };
}

interface SpotifyAlbumTracksResponse {
  items: Array<{
    id: string;
    name: string;
    uri: string;
    duration_ms: number;
    preview_url: string | null;
    artists: Array<{ name: string; id: string }>;
    external_urls: { spotify: string };
  }>;
}

interface SpotifyTopTracksResponse {
  tracks: Array<{
    id: string;
    name: string;
    uri: string;
    duration_ms: number;
    preview_url: string | null;
    artists: Array<{ name: string; id: string }>;
    album: {
      name: string;
      release_date: string;
      images: Array<{ url: string }>;
    };
    external_urls: { spotify: string };
  }>;
}

async function fetchArtistAlbums(
  token: string,
  artistId: string,
  includeGroups: string
): Promise<SpotifyAlbumItem[]> {
  // A API do Spotify restringe /artists/{id}/albums a no máximo 10 itens por requisição
  const initialData = await spotifyFetch<{ items: SpotifyAlbumItem[]; total?: number }>(
    token,
    `/artists/${artistId}/albums?include_groups=${includeGroups}&limit=10&offset=0`
  );

  const items = initialData.items || [];
  const total = initialData.total ?? items.length;

  // Se o artista tiver mais de 10 lançamentos, sorteamos um offset aleatório para cobrir todas as épocas
  if (total > 10) {
    const maxOffset = Math.max(0, total - 10);
    const randomOffset = Math.floor(Math.random() * (maxOffset + 1));
    if (randomOffset > 0) {
      try {
        const offsetData = await spotifyFetch<{ items: SpotifyAlbumItem[] }>(
          token,
          `/artists/${artistId}/albums?include_groups=${includeGroups}&limit=10&offset=${randomOffset}`
        );
        if (offsetData.items && offsetData.items.length > 0) {
          return offsetData.items;
        }
      } catch {
        // Fallback para items iniciais
      }
    }
  }

  return items;
}

function getUtcDayBounds(): { startOfDay: Date; endOfDay: Date } {
  const now = new Date();
  const startOfDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
  const endOfDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0, 0));
  return { startOfDay, endOfDay };
}

async function getUserSpinLimits(userId: string): Promise<SpinLimitsResponse> {
  const { startOfDay, endOfDay } = getUtcDayBounds();

  const spinRecords = await prisma.spinUsage.findMany({
    where: {
      userId,
      createdAt: {
        gte: startOfDay,
        lt: endOfDay,
      },
    },
    select: {
      type: true,
    },
  });

  const counts: Record<string, number> = {
    track: 0,
    album: 0,
    single: 0,
  };

  for (const record of spinRecords) {
    if (counts[record.type] !== undefined) {
      counts[record.type]++;
    }
  }

  return {
    track: {
      used: counts.track,
      limit: DAILY_SPIN_LIMIT,
      remaining: Math.max(0, DAILY_SPIN_LIMIT - counts.track),
    },
    album: {
      used: counts.album,
      limit: DAILY_SPIN_LIMIT,
      remaining: Math.max(0, DAILY_SPIN_LIMIT - counts.album),
    },
    single: {
      used: counts.single,
      limit: DAILY_SPIN_LIMIT,
      remaining: Math.max(0, DAILY_SPIN_LIMIT - counts.single),
    },
    resetsAt: endOfDay.toISOString(),
  };
}

export async function spotifyRoutes(app: FastifyInstance) {
  // Buscar artistas que o usuário segue no Spotify
  app.get('/spotify/followed-artists', { preHandler: [authenticate] }, async (request, reply) => {
    const userId = request.user!.id;
    const token = await getValidAccessTokenForUser(userId);

    const data = await spotifyFetch<SpotifyFollowedResponse>(token, '/me/following?type=artist&limit=50');

    const formatted = data.artists.items
      .map((artist) => ({
        id: artist.id,
        name: artist.name,
        imageUrl: artist.images[0]?.url || null,
        genres: artist.genres,
        popularity: artist.popularity,
        uri: artist.uri,
        externalUrl: artist.external_urls.spotify,
      }))
      .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));

    return reply.send(formatted);
  });

  // Buscar artistas por texto
  app.get('/spotify/search-artists', { preHandler: [authenticate] }, async (request, reply) => {
    const { q } = request.query as { q?: string };

    if (!q || q.trim() === '') {
      return reply.send([]);
    }

    const userId = request.user!.id;
    const token = await getValidAccessTokenForUser(userId);

    const data = await spotifyFetch<SpotifySearchResponse>(
      token,
      `/search?type=artist&q=${encodeURIComponent(q.trim())}&limit=10`
    );

    const formatted = data.artists.items.map((artist) => ({
      id: artist.id,
      name: artist.name,
      imageUrl: artist.images[0]?.url || null,
      genres: artist.genres,
      popularity: artist.popularity,
      uri: artist.uri,
      externalUrl: artist.external_urls.spotify,
    }));

    return reply.send(formatted);
  });

  // Batch search and resolve artists by names or Spotify URLs
  app.post('/spotify/batch-search', { preHandler: [authenticate] }, async (request, reply) => {
    const parsed = BatchSearchRequestSchema.safeParse(request.body);

    if (!parsed.success) {
      return reply.status(400).send({
        error: 'Invalid request',
        details: parsed.error.flatten(),
      });
    }

    const { queries } = parsed.data;
    const userId = request.user!.id;
    const token = await getValidAccessTokenForUser(userId);

    const items: Array<{ query: string; artist: any | null }> = [];
    const found: any[] = [];
    const notFound: string[] = [];
    const seenIds = new Set<string>();

    const chunkSize = 5;
    for (let i = 0; i < queries.length; i += chunkSize) {
      const chunk = queries.slice(i, i + chunkSize);

      const chunkResults = await Promise.all(
        chunk.map(async (rawQuery) => {
          const cleaned = rawQuery.replace(/^(\d+[\.\)]|[-*•])\s*/, '').trim();
          if (!cleaned) return null;

          try {
            // Check if it's a Spotify link or URI
            const spotifyUrlMatch = cleaned.match(/artist[/:]([a-zA-Z0-9]{22})/);
            if (spotifyUrlMatch) {
              const artistId = spotifyUrlMatch[1];
              const artist = await spotifyFetch<SpotifyArtistInfo>(token, `/artists/${artistId}`);
              const formatted = {
                id: artist.id,
                name: artist.name,
                imageUrl: artist.images[0]?.url || null,
                genres: artist.genres,
                popularity: artist.popularity,
                uri: artist.uri,
                externalUrl: artist.external_urls.spotify,
              };
              return { query: cleaned, artist: formatted };
            }

            // Search by name on Spotify
            const searchData = await spotifyFetch<SpotifySearchResponse>(
              token,
              `/search?type=artist&q=${encodeURIComponent(cleaned)}&limit=1`
            );

            if (searchData.artists.items.length > 0) {
              const artist = searchData.artists.items[0];
              const formatted = {
                id: artist.id,
                name: artist.name,
                imageUrl: artist.images[0]?.url || null,
                genres: artist.genres,
                popularity: artist.popularity,
                uri: artist.uri,
                externalUrl: artist.external_urls.spotify,
              };
              return { query: cleaned, artist: formatted };
            }

            return { query: cleaned, artist: null };
          } catch {
            return { query: cleaned, artist: null };
          }
        })
      );

      for (const res of chunkResults) {
        if (!res) continue;
        items.push(res);
        if (res.artist) {
          if (!seenIds.has(res.artist.id)) {
            seenIds.add(res.artist.id);
            found.push(res.artist);
          }
        } else {
          notFound.push(res.query);
        }
      }
    }

    return reply.send({ items, found, notFound });
  });

  // Consultar limites diários de sorteios
  app.get('/spotify/spin-limits', { preHandler: [authenticate] }, async (request, reply) => {
    const userId = request.user!.id;
    const spinLimits = await getUserSpinLimits(userId);
    return reply.send(spinLimits);
  });

  // Randomize track, album, or single/EP
  app.post('/spotify/randomize', { preHandler: [authenticate] }, async (request, reply) => {
    const parsed = RandomizeRequestSchema.safeParse(request.body);

    if (!parsed.success) {
      return reply.status(400).send({
        error: 'Invalid request',
        details: parsed.error.flatten(),
      });
    }

    const { artistIds, type } = parsed.data;
    const userId = request.user!.id;

    // Verificar limite diário de sorteios para a categoria (máximo 3 por categoria por dia)
    const currentLimits = await getUserSpinLimits(userId);
    const categoryLimit = currentLimits[type];

    if (categoryLimit.remaining <= 0) {
      const categoryLabel = type === 'single' ? 'single / EP' : type;
      return reply.status(429).send({
        error: `Daily limit reached for ${categoryLabel}. You can spin up to ${DAILY_SPIN_LIMIT} times per day.`,
        spinLimits: currentLimits,
      });
    }

    const token = await getValidAccessTokenForUser(userId);

    // Buscar histórico recente para evitar repetições consecutivas (últimos 20 sorteios)
    const recentHistory = await prisma.drawHistory.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: {
        itemUri: true,
        itemName: true,
      },
    });

    const recentUris = new Set(recentHistory.map((h) => h.itemUri));
    const recentNames = new Set(recentHistory.map((h) => h.itemName.toLowerCase().trim()));

    // 1. Escolhe um artista aleatoriamente da lista fornecida
    const selectedArtistId = artistIds[Math.floor(Math.random() * artistIds.length)];

    // Busca detalhes do artista sorteado
    const artistDetails = await spotifyFetch<SpotifyArtistInfo>(token, `/artists/${selectedArtistId}`);
    const selectedArtist = {
      id: artistDetails.id,
      name: artistDetails.name,
      imageUrl: artistDetails.images[0]?.url || null,
      genres: artistDetails.genres,
      popularity: artistDetails.popularity,
      uri: artistDetails.uri,
      externalUrl: artistDetails.external_urls.spotify,
    };

    if (type === 'track') {
      // Para sortear faixa: buscamos álbuns e singles do artista para explorar o catálogo completo
      const albums = await fetchArtistAlbums(token, selectedArtistId, 'album,single');

      let chosenTrack: any = null;

      if (albums.length > 0) {
        // Embaralha os álbuns para variar a busca
        const shuffledAlbums = [...albums].sort(() => Math.random() - 0.5);

        // Tenta encontrar uma faixa que não tenha sido sorteada recentemente
        for (const albumCandidate of shuffledAlbums) {
          const tracksData = await spotifyFetch<SpotifyAlbumTracksResponse>(
            token,
            `/albums/${albumCandidate.id}/tracks?limit=20`
          );

          if (tracksData.items && tracksData.items.length > 0) {
            const unplayedTracks = tracksData.items.filter(
              (t) => !recentUris.has(t.uri) && !recentNames.has(t.name.toLowerCase().trim())
            );

            if (unplayedTracks.length > 0) {
              const track = unplayedTracks[Math.floor(Math.random() * unplayedTracks.length)];
              chosenTrack = {
                id: track.id,
                name: track.name,
                uri: track.uri,
                externalUrl: track.external_urls.spotify,
                imageUrl: albumCandidate.images[0]?.url || selectedArtist.imageUrl,
                artistNames: track.artists.map((a) => a.name),
                durationMs: track.duration_ms,
                previewUrl: track.preview_url,
                albumName: albumCandidate.name,
                releaseDate: albumCandidate.release_date,
              };
              break;
            }
          }
        }

        // Fallback: se todas as faixas dos álbuns testados já estavam no histórico, pega qualquer uma
        if (!chosenTrack) {
          const fallbackAlbum = albums[Math.floor(Math.random() * albums.length)];
          const tracksData = await spotifyFetch<SpotifyAlbumTracksResponse>(
            token,
            `/albums/${fallbackAlbum.id}/tracks?limit=20`
          );
          if (tracksData.items && tracksData.items.length > 0) {
            const track = tracksData.items[Math.floor(Math.random() * tracksData.items.length)];
            chosenTrack = {
              id: track.id,
              name: track.name,
              uri: track.uri,
              externalUrl: track.external_urls.spotify,
              imageUrl: fallbackAlbum.images[0]?.url || selectedArtist.imageUrl,
              artistNames: track.artists.map((a) => a.name),
              durationMs: track.duration_ms,
              previewUrl: track.preview_url,
              albumName: fallbackAlbum.name,
              releaseDate: fallbackAlbum.release_date,
            };
          }
        }
      }

      // Se por algum motivo não conseguiu (ex: catálogo restrito), tenta top tracks
      if (!chosenTrack) {
        const topTracksData = await spotifyFetch<SpotifyTopTracksResponse>(
          token,
          `/artists/${selectedArtistId}/top-tracks?market=BR`
        );

        if (!topTracksData.tracks || topTracksData.tracks.length === 0) {
          return reply.status(404).send({ error: 'No tracks found for this artist.' });
        }

        const unplayedTop = topTracksData.tracks.filter(
          (t) => !recentUris.has(t.uri) && !recentNames.has(t.name.toLowerCase().trim())
        );
        const candidateTracks = unplayedTop.length > 0 ? unplayedTop : topTracksData.tracks;
        const track = candidateTracks[Math.floor(Math.random() * candidateTracks.length)];

        chosenTrack = {
          id: track.id,
          name: track.name,
          uri: track.uri,
          externalUrl: track.external_urls.spotify,
          imageUrl: track.album.images[0]?.url || selectedArtist.imageUrl,
          artistNames: track.artists.map((a) => a.name),
          durationMs: track.duration_ms,
          previewUrl: track.preview_url,
          albumName: track.album.name,
          releaseDate: track.album.release_date,
        };
      }

      // Salva no histórico do banco de dados
      await prisma.drawHistory.create({
        data: {
          userId,
          type: 'track',
          itemName: chosenTrack.name,
          itemUri: chosenTrack.uri,
          externalUrl: chosenTrack.externalUrl,
          artistNames: chosenTrack.artistNames,
          imageUrl: chosenTrack.imageUrl,
        },
      });

      // Registra o uso do limite diário
      await prisma.spinUsage.create({
        data: {
          userId,
          type: 'track',
        },
      });

      const updatedLimits: SpinLimitsResponse = {
        ...currentLimits,
        track: {
          ...currentLimits.track,
          used: currentLimits.track.used + 1,
          remaining: Math.max(0, currentLimits.track.remaining - 1),
        },
      };

      return reply.send({
        type: 'track',
        selectedArtist,
        track: chosenTrack,
        spinLimits: updatedLimits,
      });
    }

    if (type === 'album') {
      // Buscar apenas álbuns completos
      const albums = await fetchArtistAlbums(token, selectedArtistId, 'album');

      if (albums.length === 0) {
        return reply.status(404).send({ error: `No full albums found for artist ${selectedArtist.name}.` });
      }

      // Evita álbuns sorteados recentemente
      const unplayedAlbums = albums.filter(
        (a) => !recentUris.has(a.uri) && !recentNames.has(a.name.toLowerCase().trim())
      );
      const candidateAlbums = unplayedAlbums.length > 0 ? unplayedAlbums : albums;
      const album = candidateAlbums[Math.floor(Math.random() * candidateAlbums.length)];

      const chosenAlbum = {
        id: album.id,
        name: album.name,
        uri: album.uri,
        externalUrl: album.external_urls.spotify,
        imageUrl: album.images[0]?.url || selectedArtist.imageUrl,
        artistNames: album.artists.map((a) => a.name),
        totalTracks: album.total_tracks,
        releaseDate: album.release_date,
        albumType: album.album_type,
      };

      // Salva no histórico
      await prisma.drawHistory.create({
        data: {
          userId,
          type: 'album',
          itemName: chosenAlbum.name,
          itemUri: chosenAlbum.uri,
          externalUrl: chosenAlbum.externalUrl,
          artistNames: chosenAlbum.artistNames,
          imageUrl: chosenAlbum.imageUrl,
        },
      });

      // Registra o uso do limite diário
      await prisma.spinUsage.create({
        data: {
          userId,
          type: 'album',
        },
      });

      const updatedLimits: SpinLimitsResponse = {
        ...currentLimits,
        album: {
          ...currentLimits.album,
          used: currentLimits.album.used + 1,
          remaining: Math.max(0, currentLimits.album.remaining - 1),
        },
      };

      return reply.send({
        type: 'album',
        selectedArtist,
        album: chosenAlbum,
        spinLimits: updatedLimits,
      });
    }

    if (type === 'single') {
      // Buscar apenas singles e EPs
      const singles = await fetchArtistAlbums(token, selectedArtistId, 'single');

      if (singles.length === 0) {
        return reply.status(404).send({ error: `No singles or EPs found for artist ${selectedArtist.name}.` });
      }

      // Evita singles/EPs sorteados recentemente
      const unplayedSingles = singles.filter(
        (s) => !recentUris.has(s.uri) && !recentNames.has(s.name.toLowerCase().trim())
      );
      const candidateSingles = unplayedSingles.length > 0 ? unplayedSingles : singles;
      const single = candidateSingles[Math.floor(Math.random() * candidateSingles.length)];

      const chosenSingle = {
        id: single.id,
        name: single.name,
        uri: single.uri,
        externalUrl: single.external_urls.spotify,
        imageUrl: single.images[0]?.url || selectedArtist.imageUrl,
        artistNames: single.artists.map((a) => a.name),
        totalTracks: single.total_tracks,
        releaseDate: single.release_date,
        albumType: single.album_type,
      };

      // Salva no histórico
      await prisma.drawHistory.create({
        data: {
          userId,
          type: 'single',
          itemName: chosenSingle.name,
          itemUri: chosenSingle.uri,
          externalUrl: chosenSingle.externalUrl,
          artistNames: chosenSingle.artistNames,
          imageUrl: chosenSingle.imageUrl,
        },
      });

      // Registra o uso do limite diário
      await prisma.spinUsage.create({
        data: {
          userId,
          type: 'single',
        },
      });

      const updatedLimits: SpinLimitsResponse = {
        ...currentLimits,
        single: {
          ...currentLimits.single,
          used: currentLimits.single.used + 1,
          remaining: Math.max(0, currentLimits.single.remaining - 1),
        },
      };

      return reply.send({
        type: 'single',
        selectedArtist,
        album: chosenSingle,
        spinLimits: updatedLimits,
      });
    }

    return reply.status(400).send({ error: 'Unsupported randomize type.' });
  });
}
