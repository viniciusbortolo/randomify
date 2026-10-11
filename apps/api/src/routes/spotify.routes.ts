import { FastifyInstance } from 'fastify';
import { authenticate } from '../middlewares/auth.middleware.js';
import { getValidAccessTokenForUser, spotifyFetch } from '../lib/spotify.js';
import { prisma } from '../lib/prisma.js';
import { RandomizeRequestSchema } from '@randomify/shared';

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

export async function spotifyRoutes(app: FastifyInstance) {
  // Buscar artistas que o usuário segue no Spotify
  app.get('/spotify/followed-artists', { preHandler: [authenticate] }, async (request, reply) => {
    const userId = request.user!.id;
    const token = await getValidAccessTokenForUser(userId);

    const data = await spotifyFetch<SpotifyFollowedResponse>(token, '/me/following?type=artist&limit=50');

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
      `/search?type=artist&q=${encodeURIComponent(q.trim())}&limit=20`
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

  // Sortear música, álbum ou single/EP
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
    const token = await getValidAccessTokenForUser(userId);

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
        // Escolhe um álbum/single aleatório
        const randomAlbum = albums[Math.floor(Math.random() * albums.length)];
        const tracksData = await spotifyFetch<SpotifyAlbumTracksResponse>(
          token,
          `/albums/${randomAlbum.id}/tracks?limit=20`
        );

        if (tracksData.items.length > 0) {
          const track = tracksData.items[Math.floor(Math.random() * tracksData.items.length)];
          chosenTrack = {
            id: track.id,
            name: track.name,
            uri: track.uri,
            externalUrl: track.external_urls.spotify,
            imageUrl: randomAlbum.images[0]?.url || selectedArtist.imageUrl,
            artistNames: track.artists.map((a) => a.name),
            durationMs: track.duration_ms,
            previewUrl: track.preview_url,
            albumName: randomAlbum.name,
            releaseDate: randomAlbum.release_date,
          };
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

        const track = topTracksData.tracks[Math.floor(Math.random() * topTracksData.tracks.length)];
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

      return reply.send({
        type: 'track',
        selectedArtist,
        track: chosenTrack,
      });
    }

    if (type === 'album') {
      // Buscar apenas álbuns completos
      const albums = await fetchArtistAlbums(token, selectedArtistId, 'album');

      if (albums.length === 0) {
        return reply.status(404).send({ error: `No full albums found for artist ${selectedArtist.name}.` });
      }

      const album = albums[Math.floor(Math.random() * albums.length)];

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

      return reply.send({
        type: 'album',
        selectedArtist,
        album: chosenAlbum,
      });
    }

    if (type === 'single') {
      // Buscar apenas singles e EPs
      const singles = await fetchArtistAlbums(token, selectedArtistId, 'single');

      if (singles.length === 0) {
        return reply.status(404).send({ error: `No singles or EPs found for artist ${selectedArtist.name}.` });
      }

      const single = singles[Math.floor(Math.random() * singles.length)];

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

      return reply.send({
        type: 'single',
        selectedArtist,
        album: chosenSingle,
      });
    }

    return reply.status(400).send({ error: 'Unsupported randomize type.' });
  });
}
