import { FastifyInstance } from 'fastify';
import { authenticate } from '../middlewares/auth.middleware.js';
import { prisma } from '../lib/prisma.js';

export async function historyRoutes(app: FastifyInstance) {
  // Obter histórico de sorteios do usuário
  app.get('/history', { preHandler: [authenticate] }, async (request, reply) => {
    const userId = request.user!.id;

    const history = await prisma.drawHistory.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return reply.send(history);
  });

  // Limpar histórico
  app.delete('/history', { preHandler: [authenticate] }, async (request, reply) => {
    const userId = request.user!.id;

    await prisma.drawHistory.deleteMany({
      where: { userId },
    });

    return reply.send({ message: 'Histórico limpo com sucesso' });
  });
}
