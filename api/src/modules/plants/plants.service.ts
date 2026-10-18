import type { Plant, Prisma, User } from '@prisma/client';
import { badRequest, forbidden, notFound } from '../../lib/errors.js';
import { haversineKm } from '../../lib/geo.js';
import { prisma } from '../../lib/prisma.js';
import { deleteLocalPhoto, savePhoto } from '../../lib/storage.js';
import type { AccessPayload } from '../../lib/tokens.js';
import { isAdmin, isModerator } from '../../middlewares/auth.js';
import type { ListQuery, PlantInput } from './plants.schemas.js';

type PlantWithPeople = Plant & {
  contributor?: Pick<User, 'id' | 'name'> | null;
  reviewedBy?: Pick<User, 'id' | 'name'> | null;
};

const people = {
  contributor: { select: { id: true, name: true } },
  reviewedBy: { select: { id: true, name: true } },
} satisfies Prisma.PlantInclude;

/** Remove acentos e caixa para buscas ("ipe" encontra "Ipê"). */
export const normalize = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

const splitNames = (names: string) =>
  names
    .split(/[,;]/)
    .map((n) => n.trim())
    .filter(Boolean);

/**
 * Formato público de um registro. O nome do colaborador só sai se ele autorizou;
 * dados de moderação só aparecem para o próprio autor ou para mediadores.
 */
export function serialize(p: PlantWithPeople, viewer?: AccessPayload, distanceKm?: number) {
  const isOwner = !!viewer && viewer.sub === p.contributorId;
  const canSeePrivate = isOwner || isModerator(viewer);

  return {
    id: p.id,
    scientificName: p.scientificName,
    popularNames: splitNames(p.popularNames),
    family: p.family,
    description: p.description,
    biome: p.biome,
    climate: p.climate,
    light: p.light,
    water: p.water,
    medicinalUse: p.medicinalUse,
    toxicityLevel: p.toxicityLevel,
    toxicityNotes: p.toxicityNotes,
    curiosities: p.curiosities,
    photoUrl: p.photoUrl,
    photoCredit: p.photoCredit,
    state: p.state,
    municipality: p.municipality,
    latitude: p.latitude,
    longitude: p.longitude,
    source: p.source,
    sourceUrl: p.sourceUrl,
    contributor: p.showContributor && p.contributor ? { name: p.contributor.name } : null,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
    ...(distanceKm !== undefined && { distanceKm: Math.round(distanceKm * 10) / 10 }),
    ...(canSeePrivate && {
      status: p.status,
      reviewNote: p.reviewNote,
      reviewedAt: p.reviewedAt,
      showContributor: p.showContributor,
      isOwner,
    }),
    ...(isModerator(viewer) && {
      submittedBy: p.contributor ? { id: p.contributor.id, name: p.contributor.name } : null,
      reviewedBy: p.reviewedBy ? { name: p.reviewedBy.name } : null,
    }),
  };
}

export async function list(query: ListQuery, viewer?: AccessPayload) {
  const where: Prisma.PlantWhereInput = { status: 'APPROVED' };
  if (query.state) where.state = query.state;
  if (query.biome) where.biome = query.biome;
  if (query.light) where.light = query.light;
  if (query.water) where.water = query.water;
  if (query.toxicity) where.toxicityLevel = query.toxicity;

  let rows = await prisma.plant.findMany({ where, include: people, orderBy: { createdAt: 'desc' } });

  // Busca textual e município sem acento/caixa (o SQLite não faz isso sozinho).
  if (query.municipality) {
    const m = normalize(query.municipality);
    rows = rows.filter((p) => normalize(p.municipality) === m);
  }
  if (query.q) {
    const q = normalize(query.q);
    rows = rows.filter((p) =>
      [p.scientificName, p.popularNames, p.family ?? '', p.municipality].some((f) => normalize(f).includes(q)),
    );
  }

  const hasPoint = query.lat !== undefined && query.lng !== undefined;
  let items = rows.map((p) => ({
    p,
    d:
      hasPoint && p.latitude != null && p.longitude != null
        ? haversineKm(query.lat!, query.lng!, p.latitude, p.longitude)
        : undefined,
  }));

  if (hasPoint && query.radiusKm) items = items.filter((i) => i.d !== undefined && i.d <= query.radiusKm!);

  if (query.sort === 'distance' && hasPoint) {
    items.sort((a, b) => (a.d ?? Infinity) - (b.d ?? Infinity));
  } else if (query.sort === 'name') {
    items.sort((a, b) => splitNames(a.p.popularNames)[0].localeCompare(splitNames(b.p.popularNames)[0], 'pt-BR'));
  }

  const total = items.length;
  const start = (query.page - 1) * query.limit;
  return {
    items: items.slice(start, start + query.limit).map((i) => serialize(i.p, viewer, i.d)),
    page: query.page,
    limit: query.limit,
    total,
  };
}

export async function getById(id: string, viewer?: AccessPayload) {
  const plant = await prisma.plant.findUnique({ where: { id }, include: people });
  const visible =
    plant && (plant.status === 'APPROVED' || plant.contributorId === viewer?.sub || isModerator(viewer));
  if (!visible) throw notFound('Planta não encontrada');

  const related = await prisma.plant.findMany({
    where: { status: 'APPROVED', scientificName: plant.scientificName, NOT: { id } },
    include: people,
    take: 6,
    orderBy: { createdAt: 'desc' },
  });

  return { ...serialize(plant, viewer), related: related.map((r) => serialize(r, viewer)) };
}

export async function mine(viewer: AccessPayload) {
  const rows = await prisma.plant.findMany({
    where: { contributorId: viewer.sub },
    include: people,
    orderBy: { updatedAt: 'desc' },
  });
  return rows.map((p) => serialize(p, viewer));
}

export async function stats() {
  const [byState, byBiome, total, contributors] = await Promise.all([
    prisma.plant.groupBy({ by: ['state'], where: { status: 'APPROVED' }, _count: { _all: true } }),
    prisma.plant.groupBy({ by: ['biome'], where: { status: 'APPROVED' }, _count: { _all: true } }),
    prisma.plant.count({ where: { status: 'APPROVED' } }),
    prisma.plant.findMany({
      where: { status: 'APPROVED', contributorId: { not: null } },
      distinct: ['contributorId'],
      select: { contributorId: true },
    }),
  ]);
  return {
    total,
    contributors: contributors.length,
    byState: Object.fromEntries(byState.map((s) => [s.state, s._count._all])),
    byBiome: Object.fromEntries(byBiome.map((b) => [b.biome, b._count._all])),
  };
}

const toData = (input: PlantInput) => ({
  ...input,
  popularNames: splitNames(input.popularNames).join(', '),
  scientificName: input.scientificName.replace(/\s+/g, ' '),
});

export async function create(input: PlantInput, photo: Express.Multer.File | undefined, viewer: AccessPayload) {
  if (!photo) throw badRequest('A foto da planta é obrigatória', { photo: ['Envie uma foto'] });
  const photoUrl = await savePhoto(photo);
  const plant = await prisma.plant.create({
    data: { ...toData(input), photoUrl, contributorId: viewer.sub, status: 'PENDING' },
    include: people,
  });
  return serialize(plant, viewer);
}

/** O autor pode editar a qualquer momento; toda edição volta para a fila de revisão. */
export async function update(
  id: string,
  input: PlantInput,
  photo: Express.Multer.File | undefined,
  viewer: AccessPayload,
) {
  const current = await prisma.plant.findUnique({ where: { id } });
  if (!current) throw notFound('Planta não encontrada');
  if (current.contributorId !== viewer.sub) throw forbidden('Só quem enviou pode editar este registro');

  let photoUrl = current.photoUrl;
  if (photo) {
    photoUrl = await savePhoto(photo);
    await deleteLocalPhoto(current.photoUrl);
  }

  const plant = await prisma.plant.update({
    where: { id },
    data: {
      ...toData(input),
      photoUrl,
      status: 'PENDING',
      reviewNote: null,
      reviewedAt: null,
      reviewedById: null,
    },
    include: people,
  });
  return serialize(plant, viewer);
}

export async function remove(id: string, viewer: AccessPayload) {
  const current = await prisma.plant.findUnique({ where: { id } });
  if (!current) throw notFound('Planta não encontrada');
  if (current.contributorId !== viewer.sub && !isAdmin(viewer)) throw forbidden();
  await prisma.plant.delete({ where: { id } });
  await deleteLocalPhoto(current.photoUrl);
}
