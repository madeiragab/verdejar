import type { RecordStatus } from '@prisma/client';
import { badRequest, notFound } from '../../lib/errors.js';
import { prisma } from '../../lib/prisma.js';
import type { AccessPayload } from '../../lib/tokens.js';
import { recordInclude, toPlantDto } from '../plants/plants.mapper.js';

export async function queue(status: RecordStatus, viewer: AccessPayload) {
  const [rows, counts] = await Promise.all([
    prisma.plantRecord.findMany({
      where: { status },
      include: recordInclude,
      // Pendentes: mais antigos primeiro (fila). Demais: mais recentes primeiro.
      orderBy: { updatedAt: status === 'PENDING' ? 'asc' : 'desc' },
      take: 100,
    }),
    prisma.plantRecord.groupBy({ by: ['status'], _count: { _all: true } }),
  ]);
  return {
    items: rows.map((r) => toPlantDto(r, viewer)),
    counts: Object.fromEntries(counts.map((c) => [c.status, c._count._all])),
  };
}

/** Aprovar publica o registro; recusar tira do ar (ou mantém fora) e devolve ao autor com a observação. */
export async function decide(id: string, decision: 'APPROVED' | 'REJECTED', viewer: AccessPayload, note?: string) {
  const current = await prisma.plantRecord.findUnique({ where: { id }, select: { status: true, publishedAt: true } });
  if (!current) throw notFound('Planta não encontrada');
  if (current.status === decision) {
    throw badRequest(decision === 'APPROVED' ? 'Este registro já está publicado' : 'Este registro já foi recusado');
  }

  const record = await prisma.plantRecord.update({
    where: { id },
    data: {
      status: decision,
      publishedAt: decision === 'APPROVED' ? (current.publishedAt ?? new Date()) : current.publishedAt,
      reviews: { create: [{ actorId: viewer.sub, action: decision, note: note || null }] },
    },
    include: recordInclude,
  });
  return toPlantDto(record, viewer);
}
