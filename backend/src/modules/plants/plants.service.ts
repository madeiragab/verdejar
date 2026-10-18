import type { Prisma } from '@prisma/client';
import { badRequest, forbidden, notFound } from '../../lib/errors.js';
import { haversineKm } from '../../lib/geo.js';
import { prisma } from '../../lib/prisma.js';
import { deletePhoto, savePhoto } from '../../lib/storage.js';
import { formatScientificName, normalize, splitNames } from '../../lib/text.js';
import type { AccessPayload } from '../../lib/tokens.js';
import { isAdmin, isModerator } from '../../middlewares/auth.js';
import { ensureMunicipality } from '../regions/regions.service.js';
import { recordInclude, toPlantDto, type FullRecord } from './plants.mapper.js';
import type { ListQuery, PlantInput } from './plants.schemas.js';

type UploadedFile = Express.Multer.File | undefined;

// ───────────────────────────── Consultas ─────────────────────────────

export async function list(query: ListQuery, viewer?: AccessPayload) {
  const where: Prisma.PlantRecordWhereInput = {
    status: 'APPROVED',
    ...(query.state && { municipality: { stateUf: query.state } }),
    ...(query.municipality && { municipalityCode: query.municipality }),
    ...(query.biome && { biomeCode: query.biome }),
    ...(query.light && { light: query.light }),
    ...(query.water && { water: query.water }),
    ...(query.toxicity && { toxicityLevel: query.toxicity }),
    ...(query.q && { searchText: { contains: normalize(query.q) } }),
  };

  const hasPoint = query.lat !== undefined && query.lng !== undefined;
  const distanceOf = (r: FullRecord) =>
    hasPoint && r.latitude != null && r.longitude != null
      ? haversineKm(query.lat!, query.lng!, r.latitude, r.longitude)
      : undefined;

  // Caminho simples: ordenação e paginação feitas pelo banco.
  const inMemory = (hasPoint && (query.sort === 'distance' || query.radiusKm)) || query.sort === 'name';
  if (!inMemory) {
    const [rows, total] = await prisma.$transaction([
      prisma.plantRecord.findMany({
        where,
        include: recordInclude,
        orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      prisma.plantRecord.count({ where }),
    ]);
    return {
      items: rows.map((r) => toPlantDto(r, viewer, distanceOf(r))),
      page: query.page,
      limit: query.limit,
      total,
    };
  }

  // Distância e nome popular: ordena na aplicação (volume de uma região é pequeno).
  let items = (await prisma.plantRecord.findMany({ where, include: recordInclude })).map((r) => ({
    r,
    d: distanceOf(r),
  }));
  if (hasPoint && query.radiusKm) items = items.filter((i) => i.d !== undefined && i.d <= query.radiusKm!);
  if (query.sort === 'name') {
    items.sort((a, b) => (a.r.popularNames[0]?.name ?? '').localeCompare(b.r.popularNames[0]?.name ?? '', 'pt-BR'));
  } else {
    items.sort((a, b) => (a.d ?? Infinity) - (b.d ?? Infinity));
  }

  const start = (query.page - 1) * query.limit;
  return {
    items: items.slice(start, start + query.limit).map((i) => toPlantDto(i.r, viewer, i.d)),
    page: query.page,
    limit: query.limit,
    total: items.length,
  };
}

export async function getById(id: string, viewer?: AccessPayload) {
  const record = await prisma.plantRecord.findUnique({ where: { id }, include: recordInclude });
  const visible =
    record && (record.status === 'APPROVED' || record.contributorId === viewer?.sub || isModerator(viewer));
  if (!visible) throw notFound('Planta não encontrada');

  // Outros registros aprovados da mesma espécie, em outros lugares.
  const related = await prisma.plantRecord.findMany({
    where: { status: 'APPROVED', speciesId: record.speciesId, NOT: { id } },
    include: recordInclude,
    take: 6,
    orderBy: { publishedAt: 'desc' },
  });

  return { ...toPlantDto(record, viewer), related: related.map((r) => toPlantDto(r, viewer)) };
}

export async function mine(viewer: AccessPayload) {
  const rows = await prisma.plantRecord.findMany({
    where: { contributorId: viewer.sub },
    include: recordInclude,
    orderBy: { updatedAt: 'desc' },
  });
  return rows.map((r) => toPlantDto(r, viewer));
}

export async function stats() {
  const approved = { status: 'APPROVED' } as const;
  const [byMunicipality, byBiome, total, contributors] = await Promise.all([
    prisma.plantRecord.groupBy({ by: ['municipalityCode'], where: approved, _count: { _all: true } }),
    prisma.plantRecord.groupBy({ by: ['biomeCode'], where: approved, _count: { _all: true } }),
    prisma.plantRecord.count({ where: approved }),
    prisma.plantRecord.findMany({
      where: { ...approved, contributorId: { not: null } },
      distinct: ['contributorId'],
      select: { contributorId: true },
    }),
  ]);

  const municipalities = await prisma.municipality.findMany({
    where: { ibgeCode: { in: byMunicipality.map((m) => m.municipalityCode) } },
    select: { ibgeCode: true, stateUf: true },
  });
  const ufOf = new Map(municipalities.map((m) => [m.ibgeCode, m.stateUf]));
  const byState: Record<string, number> = {};
  for (const m of byMunicipality) {
    const uf = ufOf.get(m.municipalityCode)!;
    byState[uf] = (byState[uf] ?? 0) + m._count._all;
  }

  return {
    total,
    contributors: contributors.length,
    byState,
    byBiome: Object.fromEntries(byBiome.map((b) => [b.biomeCode, b._count._all])),
  };
}

// ───────────────────────────── Escrita ─────────────────────────────

/** Valida referências e devolve os dados comuns a criar/editar. */
async function prepare(input: PlantInput) {
  const [municipality, biome] = await Promise.all([
    ensureMunicipality(input.municipalityCode),
    prisma.biome.findUnique({ where: { code: input.biome } }),
  ]);
  if (!biome) throw badRequest('Bioma inválido', { biome: ['Escolha o bioma'] });

  const scientificName = formatScientificName(input.scientificName);
  const names = splitNames(input.popularNames);
  if (names.length === 0) throw badRequest('Informe pelo menos um nome popular', { popularNames: ['Informe pelo menos um nome popular'] });

  const searchText = normalize([scientificName, input.family ?? '', ...names, municipality.name].join(' '));

  const fields = {
    municipalityCode: municipality.ibgeCode,
    biomeCode: biome.code,
    latitude: input.latitude ?? null,
    longitude: input.longitude ?? null,
    description: input.description ?? null,
    climate: input.climate ?? null,
    light: input.light,
    water: input.water,
    medicinalUse: input.medicinalUse ?? null,
    toxicityLevel: input.toxicityLevel,
    toxicityNotes: input.toxicityNotes ?? null,
    curiosities: input.curiosities ?? null,
    showContributor: input.showContributor,
    searchText,
  };

  return { scientificName, names, fields };
}

/** A espécie é identificada pelo nome científico; a família é preenchida se ainda não existir. */
function upsertSpecies(tx: Prisma.TransactionClient, scientificName: string, family?: string) {
  return tx.species.upsert({
    where: { scientificName },
    create: { scientificName, family: family ?? null },
    update: family ? { family } : {},
  });
}

const namesData = (names: string[]) => names.map((name, position) => ({ name, position }));
const sourcesData = (input: PlantInput) => [{ citation: input.source, url: input.sourceUrl ?? null, position: 0 }];

export async function create(input: PlantInput, photo: UploadedFile, viewer: AccessPayload) {
  if (!photo) throw badRequest('A foto da planta é obrigatória', { photo: ['Envie uma foto da planta'] });
  const { scientificName, names, fields } = await prepare(input);
  const photoUrl = await savePhoto(photo);

  const record = await prisma.$transaction(async (tx) => {
    const species = await upsertSpecies(tx, scientificName, input.family);
    return tx.plantRecord.create({
      data: {
        ...fields,
        speciesId: species.id,
        contributorId: viewer.sub,
        status: 'PENDING',
        popularNames: { create: namesData(names) },
        photos: { create: [{ url: photoUrl, credit: input.photoCredit ?? null, position: 0 }] },
        sources: { create: sourcesData(input) },
        reviews: { create: [{ actorId: viewer.sub, action: 'SUBMITTED' }] },
      },
      include: recordInclude,
    });
  });
  return toPlantDto(record, viewer);
}

/** O autor pode editar a qualquer momento; toda edição volta para a fila de revisão. */
export async function update(id: string, input: PlantInput, photo: UploadedFile, viewer: AccessPayload) {
  const current = await prisma.plantRecord.findUnique({ where: { id }, include: { photos: true } });
  if (!current) throw notFound('Planta não encontrada');
  if (current.contributorId !== viewer.sub) throw forbidden('Só quem enviou pode editar este registro');

  const { scientificName, names, fields } = await prepare(input);
  const newPhotoUrl = photo ? await savePhoto(photo) : null;

  const record = await prisma.$transaction(async (tx) => {
    const species = await upsertSpecies(tx, scientificName, input.family);
    await tx.popularName.deleteMany({ where: { recordId: id } });
    await tx.source.deleteMany({ where: { recordId: id } });
    if (newPhotoUrl) await tx.photo.deleteMany({ where: { recordId: id } });
    else await tx.photo.updateMany({ where: { recordId: id, position: 0 }, data: { credit: input.photoCredit ?? null } });

    return tx.plantRecord.update({
      where: { id },
      data: {
        ...fields,
        speciesId: species.id,
        status: 'PENDING',
        popularNames: { create: namesData(names) },
        sources: { create: sourcesData(input) },
        ...(newPhotoUrl && { photos: { create: [{ url: newPhotoUrl, credit: input.photoCredit ?? null, position: 0 }] } }),
        reviews: { create: [{ actorId: viewer.sub, action: 'RESUBMITTED' }] },
      },
      include: recordInclude,
    });
  });

  if (newPhotoUrl) await Promise.all(current.photos.map((p) => deletePhoto(p.url)));
  return toPlantDto(record, viewer);
}

export async function remove(id: string, viewer: AccessPayload) {
  const current = await prisma.plantRecord.findUnique({ where: { id }, include: { photos: true } });
  if (!current) throw notFound('Planta não encontrada');
  if (current.contributorId !== viewer.sub && !isAdmin(viewer)) throw forbidden();
  await prisma.plantRecord.delete({ where: { id } });
  await Promise.all(current.photos.map((p) => deletePhoto(p.url)));
}
