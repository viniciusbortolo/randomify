import { FastifyInstance } from 'fastify';
import { authenticate } from '../middlewares/auth.middleware.js';
import { prisma } from '../lib/prisma.js';
import { CreatePresetSchema } from '@randomify/shared';

export async function presetRoutes(app: FastifyInstance) {
  // Listar presets salvos do usuário
  app.get('/presets', { preHandler: [authenticate] }, async (request, reply) => {
    const userId = request.user!.id;

    const presets = await prisma.preset.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return reply.send(presets);
  });

  // Criar um novo preset
  app.post('/presets', { preHandler: [authenticate] }, async (request, reply) => {
    const parsed = CreatePresetSchema.safeParse(request.body);

    if (!parsed.success) {
      return reply.status(400).send({
        error: 'Dados inválidos para o preset',
        details: parsed.error.flatten(),
      });
    }

    const userId = request.user!.id;
    const { name, artists } = parsed.data;

    const preset = await prisma.preset.create({
      data: {
        userId,
        name,
        artists: artists as any,
      },
    });

    return reply.status(201).send(preset);
  });

  // Deletar um preset
  app.delete('/presets/:id', { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const userId = request.user!.id;

    const existing = await prisma.preset.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      return reply.status(404).send({ error: 'Preset não encontrado' });
    }

    await prisma.preset.delete({
      where: { id },
    });

    return reply.send({ message: 'Preset removido com sucesso' });
  });
}
