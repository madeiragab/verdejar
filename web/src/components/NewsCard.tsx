import { ExternalLink, Newspaper } from 'lucide-react';
import type { NewsItem } from '../api/types';
import { timeAgo } from '../lib/format';

export function NewsCard({ item, compact = false }: { item: NewsItem; compact?: boolean }) {
  return (
    <a className={`card news-card ${compact ? 'compact' : ''}`} href={item.link} target="_blank" rel="noopener noreferrer">
      {!compact && (
        <div className="news-media">
          {item.imageUrl ? (
            <img src={item.imageUrl} alt="" loading="lazy" referrerPolicy="no-referrer" />
          ) : (
            <Newspaper size={32} strokeWidth={1.4} />
          )}
        </div>
      )}
      <div className="news-body">
        <span className="news-meta">
          <strong>{item.sourceName}</strong> · {timeAgo(item.publishedAt)}
        </span>
        <h3>{item.title}</h3>
        {!compact && item.summary && <p>{item.summary}</p>}
        <span className="news-link">
          Ler no site <ExternalLink size={13} />
        </span>
      </div>
    </a>
  );
}
