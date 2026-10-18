import type { Prisma } from '@prisma/client';
import { isModerator } from '../../middlewares/auth.js';
import type { AccessPayload } from '../../lib/tokens.js';

/** Tudo o que um registro precisa para ser exibido. */
export const recordInclude = {
  species: true,
  biome: true,
  municipality: true,
  popularNames: { orderBy: { position: 'asc' } },
  photos: { orderBy: { position: 'asc' } },
  sources: { orderBy: { position: 'asc' } },
  contributor: { select: { id: true, name: true } },
  reviews: {
    orderBy: { createdAt: 'desc' },
    include: { actor: { select: { id: true, name: true } } },
  },
} satisfies Prisma.PlantRecordInclude;

export type FullRecord = Prisma.PlantRecordGetPayload<{ include: typeof recordInclude }>;

/**
 * Formato público de um registro (o mesmo JSON que o frontend consome).
 * - O nome do colaborador só sai se ele autorizou.
 * - Status, observações e histórico só aparecem para o autor ou para mediadores.
 */
export function toPlantDto(r: FullRecord, viewer?: AccessPayload, distanceKm?: number) {
  const isOwner = !!viewer && viewer.sub === r.contributorId;
  const moderator = isModerator(viewer);
  const latest = r.reviews[0];
  const decided = latest && (latest.action === 'APPROVED' || latest.action === 'REJECTED') ? latest : null;
  const cover = r.photos[0];
  const mainSource = r.sources[0];

  return {
    id: r.id,
    speciesId: r.speciesId,
    scientificName: r.species.scientificName,
    family: r.species.family,
    popularNames: r.popularNames.map((n) => n.name),
    description: r.description,
    biome: r.biomeCode,
    biomeName: r.biome.name,
    climate: r.climate,
    light: r.light,
    water: r.water,
    medicinalUse: r.medicinalUse,
    toxicityLevel: r.toxicityLevel,
    toxicityNotes: r.toxicityNotes,
    curiosities: r.curiosities,
    photoUrl: cover?.url ?? null,
    photoCredit: cover?.credit ?? null,
    photos: r.photos.map((p) => ({ url: p.url, credit: p.credit })),
    state: r.municipality.stateUf,
    municipality: r.municipality.name,
    municipalityCode: r.municipalityCode,
    latitude: r.latitude,
    longitude: r.longitude,
    source: mainSource?.citation ?? '',
    sourceUrl: mainSource?.url ?? null,
    sources: r.sources.map((s) => ({ citation: s.citation, url: s.url })),
    contributor: r.showContributor && r.contributor ? { name: r.contributor.name } : null,
    publishedAt: r.publishedAt,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
    ...(distanceKm !== undefined && { distanceKm: Math.round(distanceKm * 10) / 10 }),
    ...((isOwner || moderator) && {
      status: r.status,
      reviewNote: decided?.note ?? null,
      reviewedAt: decided?.createdAt ?? null,
      showContributor: r.showContributor,
      isOwner,
    }),
    ...(moderator && {
      submittedBy: r.contributor ? { id: r.contributor.id, name: r.contributor.name } : null,
      reviewedBy: decided?.actor ? { name: decided.actor.name } : null,
      history: r.reviews.map((h) => ({
        action: h.action,
        note: h.note,
        by: h.actor?.name ?? null,
        at: h.createdAt,
      })),
    }),
  };
}

export type PlantDto = ReturnType<typeof toPlantDto>;
