import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Check, ExternalLink, MapPin, RefreshCw, UserRound, X } from 'lucide-react';
import { ApiError } from '../api/client';
import type { Plant, ReviewAction, Status } from '../api/types';
import { moderationService, newsService } from '../services';
import { Alert, Empty, PageHeader, Spinner } from '../components/common';
import { PlantPhoto } from '../components/PlantPhoto';
import { StatusBadge } from '../components/StatusBadge';
import { BIOMES, LIGHT, TOXICITY, WATER } from '../lib/catalog';
import { formatDate } from '../lib/format';
import { useDocumentTitle } from '../lib/hooks';

const ACTION_LABEL: Record<ReviewAction, string> = {
  SUBMITTED: 'Enviado',
  RESUBMITTED: 'Corrigido e reenviado',
  APPROVED: 'Aprovado',
  REJECTED: 'Recusado',
};

const TABS: { status: Status; label: string }[] = [
  { status: 'PENDING', label: 'Pendentes' },
  { status: 'REJECTED', label: 'Recusados' },
  { status: 'APPROVED', label: 'Aprovados' },
];

export function Moderation() {
  useDocumentTitle('Moderação');
  const [status, setStatus] = useState<Status>('PENDING');
  const [items, setItems] = useState<Plant[] | null>(null);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [newsMsg, setNewsMsg] = useState<string | null>(null);

  const load = () => {
    setItems(null);
    moderationService
      .queue(status)
      .then((r) => {
        setItems(r.items);
        setCounts(r.counts);
      })
      .catch(() => setItems([]));
  };

  useEffect(load, [status]); // eslint-disable-line react-hooks/exhaustive-deps

  const refreshNews = async () => {
    setNewsMsg('Atualizando notícias…');
    try {
      const r = await newsService.refresh();
      setNewsMsg(`${r.added} notícias novas${r.errors.length ? ` · ${r.errors.length} fonte(s) com falha` : ''}`);
    } catch {
      setNewsMsg('Não foi possível atualizar agora');
    }
  };

  return (
    <div className="container section">
      <PageHeader eyebrow="Mediação" title="Revisar contribuições">
        Confira se a foto, a identificação e a fonte batem antes de publicar.
      </PageHeader>

      <div className="toolbar">
        <div className="segmented">
          {TABS.map((t) => (
            <button key={t.status} className={status === t.status ? 'is-active' : ''} onClick={() => setStatus(t.status)}>
              {t.label} <span className="count">{counts[t.status] ?? 0}</span>
            </button>
          ))}
        </div>
        <button className="btn btn-ghost btn-sm" onClick={refreshNews}>
          <RefreshCw size={15} /> Atualizar notícias
        </button>
        {newsMsg && <span className="muted small">{newsMsg}</span>}
      </div>

      {items === null ? (
        <Spinner />
      ) : items.length === 0 ? (
        <Empty title={status === 'PENDING' ? 'Fila vazia 🎉' : 'Nada por aqui'}>
          {status === 'PENDING' && 'Nenhuma contribuição aguardando revisão.'}
        </Empty>
      ) : (
        <div className="review-list">
          {items.map((p) => (
            <ReviewCard key={p.id} plant={p} onDone={load} />
          ))}
        </div>
      )}
    </div>
  );
}

function ReviewCard({ plant: p, onDone }: { plant: Plant; onDone: () => void }) {
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const act = async (action: 'approve' | 'reject') => {
    setBusy(true);
    setError(null);
    try {
      if (action === 'approve') await moderationService.approve(p.id, note || undefined);
      else await moderationService.reject(p.id, note);
      onDone();
    } catch (e) {
      setError(e instanceof ApiError ? (e.details?.note?.[0] ?? e.message) : 'Erro');
      setBusy(false);
    }
  };

  return (
    <article className="card review-card">
      <div className="review-photo">
        <PlantPhoto src={p.photoUrl} alt={p.popularNames[0]} biome={p.biome} />
      </div>
      <div className="review-body">
        <div className="list-title">
          <Link to={`/plantas/${p.id}`} target="_blank">
            <h3>{p.popularNames.join(', ')}</h3>
          </Link>
          {p.status && <StatusBadge status={p.status} />}
        </div>
        <p className="sci">
          {p.scientificName}
          {p.family && ` · ${p.family}`}
        </p>

        <dl className="review-grid">
          <div>
            <dt>Local</dt>
            <dd>
              <MapPin size={14} /> {p.municipality} · {p.state}
              {p.latitude != null && (
                <a
                  href={`https://www.openstreetmap.org/?mlat=${p.latitude}&mlon=${p.longitude}#map=14/${p.latitude}/${p.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {' '}
                  ver no mapa
                </a>
              )}
            </dd>
          </div>
          <div>
            <dt>Bioma</dt>
            <dd>{BIOMES[p.biome]}</dd>
          </div>
          <div>
            <dt>Luz / Água</dt>
            <dd>
              {LIGHT[p.light]} · {WATER[p.water]}
            </dd>
          </div>
          <div>
            <dt>Toxicidade</dt>
            <dd>{TOXICITY[p.toxicityLevel]}</dd>
          </div>
          {p.medicinalUse && (
            <div className="span-2">
              <dt>Uso medicinal</dt>
              <dd>{p.medicinalUse}</dd>
            </div>
          )}
          <div className="span-2">
            <dt>
              <BookOpen size={14} /> Fonte
            </dt>
            <dd>
              {p.source}
              {p.sourceUrl && (
                <a href={p.sourceUrl} target="_blank" rel="noopener noreferrer">
                  {' '}
                  <ExternalLink size={13} />
                </a>
              )}
            </dd>
          </div>
        </dl>

        <p className="muted small">
          <UserRound size={14} /> {p.submittedBy?.name ?? 'Usuário removido'}
          {p.showContributor ? ' (autorizou exibir o nome)' : ' (anônimo no site)'} · enviado em {formatDate(p.updatedAt)}
          {p.reviewedBy && ` · revisado por ${p.reviewedBy.name}`}
        </p>
        {p.history && p.history.length > 0 && (
          <ol className="timeline">
            {[...p.history].reverse().map((h, i) => (
              <li key={i} className={`timeline-${h.action.toLowerCase()}`}>
                <strong>{ACTION_LABEL[h.action]}</strong> {h.by && `por ${h.by}`} · {formatDate(h.at)}
                {h.note && <span className="timeline-note">“{h.note}”</span>}
              </li>
            ))}
          </ol>
        )}

        {error && <Alert>{error}</Alert>}
        <div className="review-actions">
          <input
            placeholder="Observação para o colaborador (obrigatória para recusar)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          {p.status !== 'REJECTED' && (
            <button className="btn btn-danger" disabled={busy} onClick={() => act('reject')}>
              <X size={16} /> Recusar
            </button>
          )}
          {p.status !== 'APPROVED' && (
            <button className="btn" disabled={busy} onClick={() => act('approve')}>
              <Check size={16} /> Aprovar
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
