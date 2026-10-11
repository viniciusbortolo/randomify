import { FastifyReply, FastifyRequest } from 'fastify';

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: { id: string; spotifyId: string };
    user: { id: string; spotifyId: string };
  }
}

export async function authenticate(request: FastifyRequest, reply: FastifyReply) {
  try {
    const authHeader = request.headers.authorization;
    let token: string | undefined;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (request.cookies && request.cookies.token) {
      token = request.cookies.token;
    }

    if (!token) {
      return reply.status(401).send({ error: 'Unauthorized' });
    }

    const decoded = request.server.jwt.verify<{ id: string; spotifyId: string }>(token);
    request.user = decoded;
  } catch (error) {
    return reply.status(401).send({ error: 'Invalid or expired token' });
  }
}
