import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import cookie from '@fastify/cookie';
import jwt from '@fastify/jwt';
import {
  serializerCompiler,
  validatorCompiler,
} from 'fastify-type-provider-zod';

import { authRoutes } from './routes/auth.routes.js';
import { spotifyRoutes } from './routes/spotify.routes.js';
import { presetRoutes } from './routes/preset.routes.js';
import { historyRoutes } from './routes/history.routes.js';

const app = Fastify({
  logger: {
    transport: {
      target: 'pino-pretty',
      options: {
        translateTime: 'HH:MM:ss Z',
        ignore: 'pid,hostname',
      },
    },
  },
});

// Zod validation compilers
app.setValidatorCompiler(validatorCompiler);
app.setSerializerCompiler(serializerCompiler);

// Tolerate empty body when Content-Type is application/json
app.addContentTypeParser(
  'application/json',
  { parseAs: 'string' },
  (req, body, done) => {
    if (!body || (typeof body === 'string' && body.trim() === '')) {
      done(null, {});
      return;
    }
    try {
      const json = JSON.parse(body as string);
      done(null, json);
    } catch (err: any) {
      err.statusCode = 400;
      done(err, undefined);
    }
  }
);

// CORS
await app.register(cors, {
  origin: (origin, cb) => {
    // Permite requisições sem header Origin (ex: server-to-server, curl)
    if (!origin) {
      return cb(null, true);
    }

    const clientUrl = process.env.CLIENT_URL;

    // Permite requisições de localhost, qualquer deploy da Vercel (*.vercel.app) e CLIENT_URL
    const isAllowed =
      (clientUrl && origin === clientUrl) ||
      origin.endsWith('.vercel.app') ||
      /^https?:\/\/localhost(:\d+)?$/.test(origin) ||
      /^https?:\/\/127\.0\.0\.1(:\d+)?$/.test(origin);

    if (isAllowed) {
      return cb(null, true);
    }

    return cb(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie', 'x-timezone'],
  exposedHeaders: ['Set-Cookie'],
});

// Cookies
await app.register(cookie);

// JWT
await app.register(jwt, {
  secret: process.env.JWT_SECRET || 'randomify_super_secret_jwt_key_1234567890_change_in_prod',
});

// Health check
app.get('/health', async () => {
  return { status: 'ok', timestamp: new Date().toISOString() };
});

// Registrar rotas
await app.register(authRoutes);
await app.register(spotifyRoutes);
await app.register(presetRoutes);
await app.register(historyRoutes);

const port = Number(process.env.PORT) || 3333;

try {
  await app.listen({ port, host: '0.0.0.0' });
  app.log.info(`🚀 Fastify server listening on port ${port}`);
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
