/**
 * Popula o banco com dados de referência e conteúdo inicial.
 *   npm run db:seed        (idempotente: rodar de novo não duplica nada)
 */
import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { PrismaClient, type Role } from '@prisma/client';
import { formatScientificName, normalize, splitNames } from '../../src/lib/text.js';
import { approvedPlants, pendingPlants, type SeedPlant } from './data/plants.js';
import { BIOMES, MUNICIPALITIES, NEWS_SOURCES, STATES } from './data/reference.js';

const prisma = new PrismaClient();
const PASSWORD = 'verdejar123';

async function seedReference() {
  for (const s of STATES) await prisma.state.upsert({ where: { uf: s.uf }, update: s, create: s });
  for (const b of BIOMES) await prisma.biome.upsert({ where: { code: b.code }, update: b, create: b });
  for (const m of MUNICIPALITIES) await prisma.municipality.upsert({ where: { ibgeCode: m.ibgeCode }, update: m, create: m });
  for (const n of NEWS_SOURCES) await prisma.newsSource.upsert({ where: { id: n.id }, update: n, create: n });
}

async function upsertUser(name: string, email: string, password: string, role: Role) {
  return prisma.user.upsert({
    where: { email },
    update: { role },
    create: { name, email, role, passwordHash: await bcrypt.hash(password, 10) },
  });
}

async function createRecord(p: SeedPlant, contributorId: string, moderatorId: string | null) {
  const municipality = MUNICIPALITIES.find((m) => m.stateUf === p.state && m.name === p.municipality);
  if (!municipality) throw new Error(`Município sem código IBGE no seed: ${p.municipality}/${p.state}`);

  const scientificName = formatScientificName(p.scientificName);
  const names = splitNames(p.popularNames);
  const species = await prisma.species.upsert({
    where: { scientificName },
    update: {},
    create: { scientificName, family: p.family },
  });

  const approved = moderatorId !== null;
  await prisma.plantRecord.create({
    data: {
      speciesId: species.id,
      municipalityCode: municipality.ibgeCode,
      biomeCode: p.biome,
      latitude: p.latitude,
      longitude: p.longitude,
      description: p.description,
      climate: p.climate,
      light: p.light,
      water: p.water,
      medicinalUse: p.medicinalUse ?? null,
      toxicityLevel: p.toxicityLevel,
      toxicityNotes: p.toxicityNotes ?? null,
      curiosities: p.curiosities,
      showContributor: p.showContributor,
      contributorId,
      status: approved ? 'APPROVED' : 'PENDING',
      publishedAt: approved ? new Date() : null,
      searchText: normalize([scientificName, p.family, ...names, municipality.name].join(' ')),
      popularNames: { create: names.map((name, position) => ({ name, position })) },
      photos: p.photoUrl ? { create: [{ url: p.photoUrl, credit: p.photoCredit ?? null }] } : undefined,
      sources: { create: [{ citation: p.source, url: p.sourceUrl ?? null }] },
      reviews: {
        create: [
          { actorId: contributorId, action: 'SUBMITTED' },
          ...(approved ? [{ actorId: moderatorId, action: 'APPROVED' as const }] : []),
        ],
      },
    },
  });
}

async function main() {
  await seedReference();
  console.log(`✔ ${STATES.length} estados, ${BIOMES.length} biomas, ${NEWS_SOURCES.length} fontes de notícias`);

  const admin = await upsertUser(
    'Administração',
    process.env.SEED_ADMIN_EMAIL ?? 'admin@verdejar.app',
    process.env.SEED_ADMIN_PASSWORD ?? PASSWORD,
    'ADMIN',
  );
  const moderator = await upsertUser('Mediador(a) Exemplo', 'mediador@verdejar.app', PASSWORD, 'MODERATOR');
  const maria = await upsertUser('Maria das Flores', 'maria@exemplo.com', PASSWORD, 'USER');
  console.log(`✔ Usuários: ${admin.email} (admin), ${moderator.email} (mediador), ${maria.email} (colaboradora)`);

  if ((await prisma.plantRecord.count()) > 0) {
    console.log('• Plantas já existem — pulando.');
    return;
  }
  for (const p of approvedPlants) await createRecord(p, maria.id, moderator.id);
  for (const p of pendingPlants) await createRecord(p, maria.id, null);
  console.log(`✔ ${approvedPlants.length} registros publicados + ${pendingPlants.length} aguardando revisão`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
