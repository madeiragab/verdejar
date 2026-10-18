import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  BookOpen,
  CloudSun,
  Droplets,
  ExternalLink,
  HeartPulse,
  Lightbulb,
  MapPin,
  Pencil,
  Sun,
  Trees,
  TriangleAlert,
  UserRound,
} from 'lucide-react';
import { ApiError } from '../api/client';
import { plantsService } from '../services';
import type { PlantDetail as Detail } from '../api/types';
import { Alert, Empty, Spinner } from '../components/common';
import { PlantCard } from '../components/PlantCard';
import { PlantMap } from '../components/PlantMap';
import { PlantPhoto } from '../components/PlantPhoto';
import { StatusBadge } from '../components/StatusBadge';
import { BIOMES, LIGHT, TOXICITY, WATER } from '../lib/catalog';
import { formatDate } from '../lib/format';
import { useDocumentTitle } from '../lib/hooks';
import { useAuth } from '../auth/AuthContext';

export function PlantDetail() {
  const { id } = useParams();
  const { ready } = useAuth();
  const navigate = useNavigate();
  const [plant, setPlant] = useState<Detail | null>(null);
  const [error, setError] = useState<string | null>(null);
  useDocumentTitle(plant?.popularNames[0] ?? 'Planta');

  useEffect(() => {
    if (!ready) return; // espera a sessão para o autor/mediador conseguir ver registros pendentes
    setPlant(null);
    setError(null);
    plantsService
      .get(id!)
      .then(setPlant)
      .catch((e) => setError(e instanceof ApiError ? e.message : 'Erro ao carregar'));
  }, [id, ready]);

  if (error)
    return (
      <div className="container section">
        <Empty title="Planta não encontrada">
          <Link to="/explorar">Voltar para explorar</Link>
        </Empty>
      </div>
    );
  if (!plant) return <Spinner />;

  const tox = plant.toxicityLevel;
  const toxClass = tox === 'ALTA' || tox === 'MODERADA' ? 'danger' : tox === 'BAIXA' ? 'warning' : 'ok';

  return (
    <article className="container section detail">
      <button className="link-back" onClick={() => (history.length > 1 ? navigate(-1) : navigate('/explorar'))}>
        <ArrowLeft size={16} /> Voltar
      </button>

      {plant.status && plant.status !== 'APPROVED' && (
        <Alert kind={plant.status === 'REJECTED' ? 'warning' : 'info'}>
          <StatusBadge status={plant.status} /> Este registro ainda não está público.
          {plant.reviewNote && (
            <>
              {' '}
              <strong>Observação do mediador:</strong> {plant.reviewNote}
            </>
          )}
        </Alert>
      )}

      <div className="detail-top">
        <figure className="detail-photo">
          <PlantPhoto src={plant.photoUrl} alt={plant.popularNames[0]} biome={plant.biome} />
          {plant.photoCredit && <figcaption>{plant.photoCredit}</figcaption>}
        </figure>

        <div className="detail-head">
          <span className="eyebrow">{plant.family}</span>
          <h1>{plant.popularNames[0]}</h1>
          <p className="sci big">{plant.scientificName}</p>
          {plant.popularNames.length > 1 && (
            <p className="muted">Também conhecida como {plant.popularNames.slice(1).join(', ')}</p>
          )}

          <p className="detail-place">
            <MapPin size={16} /> {plant.municipality} · {plant.state}
          </p>

          <ul className="facts">
            <li>
              <Trees size={18} />
              <span>Bioma</span>
              <strong>{plant.biomeName ?? BIOMES[plant.biome]}</strong>
            </li>
            <li>
              <Sun size={18} />
              <span>Luz</span>
              <strong>{LIGHT[plant.light]}</strong>
            </li>
            <li>
              <Droplets size={18} />
              <span>Água</span>
              <strong>{WATER[plant.water]}</strong>
            </li>
            {plant.climate && (
              <li>
                <CloudSun size={18} />
                <span>Clima</span>
                <strong>{plant.climate}</strong>
              </li>
            )}
          </ul>

          <div className={`tox tox-${toxClass}`}>
            <TriangleAlert size={18} />
            <div>
              <strong>{TOXICITY[tox]}</strong>
              {plant.toxicityNotes && <p>{plant.toxicityNotes}</p>}
            </div>
          </div>

          {plant.isOwner && (
            <Link to={`/contribuir/${plant.id}`} className="btn btn-ghost btn-sm">
              <Pencil size={15} /> Editar meu registro
            </Link>
          )}
        </div>
      </div>

      <div className="detail-body">
        <div className="detail-main">
          {plant.description && (
            <section>
              <h2>Sobre</h2>
              <p>{plant.description}</p>
            </section>
          )}
          {plant.medicinalUse && (
            <section>
              <h2>
                <HeartPulse size={20} /> Uso medicinal
              </h2>
              <p>{plant.medicinalUse}</p>
              <p className="muted small">Informação de caráter informativo. Consulte um profissional de saúde antes de usar.</p>
            </section>
          )}
          {plant.curiosities && (
            <section className="curiosity">
              <h2>
                <Lightbulb size={20} /> Curiosidades
              </h2>
              <p>{plant.curiosities}</p>
            </section>
          )}
          <section className="source">
            <h2>
              <BookOpen size={20} /> Fonte
            </h2>
            <p>{plant.source}</p>
            {plant.sourceUrl && (
              <a href={plant.sourceUrl} target="_blank" rel="noopener noreferrer">
                {new URL(plant.sourceUrl).hostname} <ExternalLink size={13} />
              </a>
            )}
          </section>
        </div>

        <aside className="detail-side">
          {plant.latitude != null && <PlantMap plants={[plant]} height={260} />}
          <div className="card meta">
            {plant.contributor ? (
              <p>
                <UserRound size={16} /> Enviado por <strong>{plant.contributor.name}</strong>
              </p>
            ) : (
              <p className="muted">
                <UserRound size={16} /> Colaborador anônimo
              </p>
            )}
            <p className="muted small">Publicado em {formatDate(plant.createdAt)}</p>
          </div>
        </aside>
      </div>

      {plant.related.length > 0 && (
        <section className="section-tight">
          <h2>Outros registros desta espécie</h2>
          <div className="grid">
            {plant.related.map((r) => (
              <PlantCard key={r.id} plant={r} />
            ))}
          </div>
        </section>
      )}
    </article>
  );
}
