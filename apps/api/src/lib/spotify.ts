import { prisma } from './prisma.js';

const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID || '';
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET || '';
const SPOTIFY_REDIRECT_URI = process.env.SPOTIFY_REDIRECT_URI || 'http://127.0.0.1:3333/auth/callback';

export function getSpotifyAuthUrl(): string {
  const scopes = [
    'user-read-private',
    'user-read-email',
    'user-follow-read',
    'user-top-read',
  ].join(' ');

  const params = new URLSearchParams({
    client_id: SPOTIFY_CLIENT_ID,
    response_type: 'code',
    redirect_uri: SPOTIFY_REDIRECT_URI,
    scope: scopes,
    show_dialog: 'true',
  });

  return `https://accounts.spotify.com/authorize?${params.toString()}`;
}

export async function exchangeCodeForTokens(code: string) {
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: SPOTIFY_REDIRECT_URI,
  });

  const credentials = Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString('base64');

  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${credentials}`,
    },
    body: body.toString(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to retrieve Spotify tokens: ${errorText}`);
  }

  const data = (await response.json()) as {
    access_token: string;
    refresh_token: string;
    expires_in: number;
    token_type: string;
  };

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: new Date(Date.now() + data.expires_in * 1000),
  };
}

export async function refreshUserAccessToken(userId: string, refreshToken: string): Promise<string> {
  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
  });

  const credentials = Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString('base64');

  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${credentials}`,
    },
    body: body.toString(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to refresh Spotify token: ${errorText}`);
  }

  const data = (await response.json()) as {
    access_token: string;
    expires_in: number;
    refresh_token?: string;
  };

  const newExpiresAt = new Date(Date.now() + data.expires_in * 1000);

  await prisma.user.update({
    where: { id: userId },
    data: {
      accessToken: data.access_token,
      tokenExpiresAt: newExpiresAt,
      ...(data.refresh_token ? { refreshToken: data.refresh_token } : {}),
    },
  });

  return data.access_token;
}

export async function getValidAccessTokenForUser(userId: string): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new Error('User not found');
  }

  // Se o token expirar em menos de 5 minutos, atualiza
  const fiveMinutesFromNow = new Date(Date.now() + 5 * 60 * 1000);
  if (user.tokenExpiresAt <= fiveMinutesFromNow) {
    return refreshUserAccessToken(user.id, user.refreshToken);
  }

  return user.accessToken;
}

export async function spotifyFetch<T>(accessToken: string, endpoint: string): Promise<T> {
  const response = await fetch(`https://api.spotify.com/v1${endpoint}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Spotify API error (${response.status}): ${errText}`);
  }

  return response.json() as Promise<T>;
}
