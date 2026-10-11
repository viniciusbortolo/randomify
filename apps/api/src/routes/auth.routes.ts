import { FastifyInstance } from 'fastify';
import { exchangeCodeForTokens, getSpotifyAuthUrl, spotifyFetch } from '../lib/spotify.js';
import { prisma } from '../lib/prisma.js';
import { authenticate } from '../middlewares/auth.middleware.js';

interface SpotifyProfileResponse {
  id: string;
  display_name: string | null;
  email: string | null;
  images?: Array<{ url: string }>;
}

export async function authRoutes(app: FastifyInstance) {
  // Redireciona o usuário para a página de permissão do Spotify
  app.get('/auth/login', async (_request, reply) => {
    const authUrl = getSpotifyAuthUrl();
    return reply.redirect(authUrl);
  });

  // Callback chamado pelo Spotify após o usuário aceitar
  app.get('/auth/callback', async (request, reply) => {
    const { code, error } = request.query as { code?: string; error?: string };

    const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';

    if (error || !code) {
      return reply.redirect(`${clientUrl}?auth_error=${encodeURIComponent(error || 'Authorization code not provided')}`);
    }

    try {
      const tokens = await exchangeCodeForTokens(code);

      // Fetch user profile from Spotify
      const profile = await spotifyFetch<SpotifyProfileResponse>(tokens.accessToken, '/me');

      const avatarUrl = profile.images && profile.images.length > 0 ? profile.images[0].url : null;

      // Upsert user in database via Prisma
      const user = await prisma.user.upsert({
        where: { spotifyId: profile.id },
        update: {
          displayName: profile.display_name,
          email: profile.email,
          avatarUrl,
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          tokenExpiresAt: tokens.expiresAt,
        },
        create: {
          spotifyId: profile.id,
          displayName: profile.display_name,
          email: profile.email,
          avatarUrl,
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          tokenExpiresAt: tokens.expiresAt,
        },
      });

      // Sign JWT
      const token = app.jwt.sign({
        id: user.id,
        spotifyId: user.spotifyId,
      });

      // Set secure cookie
      reply.setCookie('token', token, {
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60, // 7 days
      });

      // Redirect back to frontend
      return reply.redirect(`${clientUrl}?auth_token=${token}`);
    } catch (err: any) {
      request.log.error(err);
      return reply.redirect(`${clientUrl}?auth_error=${encodeURIComponent(err.message || 'Authentication failed')}`);
    }
  });

  // Return authenticated user profile
  app.get('/auth/me', { preHandler: [authenticate] }, async (request, reply) => {
    const userId = request.user!.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        spotifyId: true,
        displayName: true,
        email: true,
        avatarUrl: true,
        createdAt: true,
      },
    });

    if (!user) {
      return reply.status(404).send({ error: 'User not found' });
    }

    return reply.send(user);
  });

  // Logout
  app.post('/auth/logout', async (_request, reply) => {
    reply.clearCookie('token', { path: '/' });
    return reply.send({ message: 'Logged out successfully' });
  });
}
