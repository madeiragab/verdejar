import { useEffect, useState } from 'react';
import { api } from '../api/client';
import type { NewsItem } from '../api/types';
import { Empty, PageHeader } from '../components/common';
import { NewsCard } from '../components/NewsCard';
import { useDocumentTitle } from '../lib/hooks';

interface Source {
  id: string;
  name: string;
  site: string;
}

export function News() {
  useDocumentTitle('Notícias');
  const [items, setItems] = useState<NewsItem[] | null>(null);
  const [sources, setSources] = useState<Source[]>([]);
  const [source, setSource] = useState('');

  useEffect(() => {
    api<{ items: Source[] }>('/news/sources').then((r) => setSources(r.items)).catch(() => {});
  }, []);

  useEffect(() => {
    setItems(null);
    api<{ items: NewsItem[] }>('/news', { query: { limit: 36, source } })
      .then((r) => setItems(r.items))
      .catch(() => setItems([]));
  }, [source]);

  return (
    <div className="container section">
      <PageHeader eyebrow="Notícias" title="Clima e meio ambiente">
        Reunimos as últimas publicações de sites especializados. Clique para ler a matéria completa no site original.
      </PageHeader>

      <div className="pills">
        <button className={`pill ${source === '' ? 'is-active' : ''}`} onClick={() => setSource('')}>
          Todas
        </button>
        {sources.map((s) => (
          <button key={s.id} className={`pill ${source === s.name ? 'is-active' : ''}`} onClick={() => setSource(s.name)}>
            {s.name}
          </button>
        ))}
      </div>

      {items === null ? (
        <div className="news-grid">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="card news-card skeleton" style={{ height: 300 }} />
          ))}
        </div>
      ) : items.length === 0 ? (
        <Empty title="Nenhuma notícia por enquanto">As notícias são atualizadas a cada hora.</Empty>
      ) : (
        <div className="news-grid">
          {items.map((n) => (
            <NewsCard key={n.id} item={n} />
          ))}
        </div>
      )}
    </div>
  );
}
