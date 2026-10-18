import Parser from 'rss-parser';
import { prisma } from '../../lib/prisma.js';
import { NEWS_SOURCES } from './sources.js';

type Item = Parser.Item & {
  'media:content'?: { $?: { url?: string } };
  'media:thumbnail'?: { $?: { url?: string } };
  enclosure?: { url?: string; type?: string };
};

const USER_AGENT = 'Mozilla/5.0 (compatible; Verdejar/0.1)';

const parser: Parser<object, Item> = new Parser({
  customFields: { item: ['media:content', 'media:thumbnail'] },
});

const stripHtml = (html = '') =>
  html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#8230;|&hellip;/g, '…')
    .replace(/&#822[01];/g, '"')
    .replace(/&#8217;/g, '’')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();

function imageOf(item: Item): string | null {
  const fromMedia = item['media:content']?.$?.url ?? item['media:thumbnail']?.$?.url;
  if (fromMedia) return fromMedia;
  if (item.enclosure?.url && (item.enclosure.type ?? 'image').startsWith('image')) return item.enclosure.url;
  const html = (item as Record<string, unknown>)['content:encoded'] ?? item.content ?? '';
  const match = String(html).match(/<img[^>]+src=["']([^"']+)["']/i);
  return match?.[1] ?? null;
}

let running: Promise<{ added: number; errors: string[] }> | null = null;

/** Baixa todos os feeds e grava as notícias novas. Chamadas simultâneas compartilham a mesma execução. */
export function refreshNews() {
  running ??= (async () => {
    let added = 0;
    const errors: string[] = [];

    await Promise.all(
      NEWS_SOURCES.map(async (source) => {
        try {
          // fetch descompacta gzip sozinho (o G1 manda gzip mesmo sem pedir; o parseURL não lida com isso).
          const res = await fetch(source.url, {
            headers: { 'User-Agent': USER_AGENT, Accept: 'application/rss+xml, application/xml, text/xml' },
            signal: AbortSignal.timeout(10_000),
          });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const feed = await parser.parseString((await res.text()).replace(/^﻿/, '').trimStart());
          for (const item of feed.items.slice(0, 20)) {
            if (!item.link || !item.title) continue;
            const exists = await prisma.newsItem.findUnique({ where: { link: item.link }, select: { id: true } });
            if (exists) continue;
            const summary = stripHtml(item.contentSnippet ?? item.content ?? '').slice(0, 280);
            await prisma.newsItem.create({
              data: {
                title: stripHtml(item.title),
                link: item.link,
                summary: summary || null,
                imageUrl: imageOf(item),
                sourceName: source.name,
                publishedAt: item.isoDate ? new Date(item.isoDate) : new Date(),
              },
            });
            added++;
          }
        } catch (err) {
          errors.push(`${source.name}: ${(err as Error).message}`);
        }
      }),
    );

    // Mantém o banco enxuto: guarda só as 300 mais recentes.
    const old = await prisma.newsItem.findMany({ orderBy: { publishedAt: 'desc' }, skip: 300, select: { id: true } });
    if (old.length) await prisma.newsItem.deleteMany({ where: { id: { in: old.map((o) => o.id) } } });

    return { added, errors };
  })().finally(() => {
    running = null;
  });
  return running;
}

export function startNewsJob(minutes: number) {
  if (minutes <= 0) return;
  const run = () =>
    refreshNews()
      .then((r) => console.log(`[news] +${r.added} notícias${r.errors.length ? ` · falhas: ${r.errors.join('; ')}` : ''}`))
      .catch((err) => console.error('[news]', err));
  run();
  setInterval(run, minutes * 60_000).unref();
}
