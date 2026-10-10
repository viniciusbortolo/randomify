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

// CORS
await app.register(cors, {
  origin: [
    process.env.CLIENT_URL || 'http://localhost:3000',
    'http://localhost:3000',
    'http://127.0.0.1:3000',
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
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
  app.log.info(`🚀 Servidor Fastify rodando na porta ${port}`);
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
