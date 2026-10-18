/**
 * Sobe um PostgreSQL local, sem Docker e sem instalar nada no sistema.
 * Os dados ficam em backend/.pgdata (fora do git).
 *
 *   npm run db:start      → deixa rodando; Ctrl+C para parar
 *
 * Quem preferir Docker pode usar o docker-compose.yml da raiz.
 */
import fs from 'node:fs';
import path from 'node:path';
import EmbeddedPostgres from 'embedded-postgres';

const DATA_DIR = path.resolve('.pgdata');
const PORT = Number(process.env.DEV_DB_PORT ?? 5433);
const DB_NAME = 'verdejar';

const pg = new EmbeddedPostgres({
  databaseDir: DATA_DIR,
  user: 'verdejar',
  password: 'verdejar',
  port: PORT,
  persistent: true,
  // Sem isso o Windows cria o cluster em WIN1252 e textos com acentos combinados falham.
  initdbFlags: ['--encoding=UTF8', '--locale=C'],
  onLog: () => {},
});

const firstRun = !fs.existsSync(path.join(DATA_DIR, 'PG_VERSION'));
if (firstRun) await pg.initialise();
await pg.start();

const client = pg.getPgClient('postgres');
await client.connect();
const exists = await client.query('SELECT 1 FROM pg_database WHERE datname = $1', [DB_NAME]);
if (exists.rowCount === 0) await pg.createDatabase(DB_NAME);
await client.end();

console.log(`🐘 PostgreSQL rodando em postgresql://verdejar:verdejar@localhost:${PORT}/${DB_NAME}`);
console.log('   Ctrl+C para parar.');

const stop = async () => {
  await pg.stop();
  process.exit(0);
};
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
