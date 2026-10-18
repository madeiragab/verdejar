import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MessageSquareWarning, Pencil, Plus, Trash2 } from 'lucide-react';
import { api } from '../api/client';
import type { Plant } from '../api/types';
import { useAuth } from '../auth/AuthContext';
import { Empty, PageHeader, Spinner } from '../components/common';
import { PlantPhoto } from '../components/PlantPhoto';
import { StatusBadge } from '../components/StatusBadge';
import { ROLE_LABEL } from '../lib/catalog';
import { formatDate } from '../lib/format';
import { useDocumentTitle } from '../lib/hooks';

export function MyContributions() {
  useDocumentTitle('Minhas contribuições');
  const { user } = useAuth();
  const [items, setItems] = useState<Plant[] | null>(null);

  const load = () =>
    api<{ items: Plant[] }>('/plants/mine')
      .then((r) => setItems(r.items))
      .catch(() => setItems([]));

  useEffect(() => {
    load();
  }, []);

  const remove = async (p: Plant) => {
    if (!confirm(`Remover "${p.popularNames[0]}"? Isso não pode ser desfeito.`)) return;
    await api(`/plants/${p.id}`, { method: 'DELETE' });
    load();
  };

  const count = (s: string) => items?.filter((i) => i.status === s).length ?? 0;

  return (
    <div className="container section">
      <PageHeader eyebrow={user ? ROLE_LABEL[user.role] : ''} title={`Olá, ${user?.name.split(' ')[0]}`}>
        Acompanhe aqui o que você enviou.
      </PageHeader>

      {items && items.length > 0 && (
        <div className="kpis">
          <div className="kpi">
            <strong>{count('APPROVED')}</strong>
            <span>publicadas</span>
          </div>
          <div className="kpi">
            <strong>{count('PENDING')}</strong>
            <span>em revisão</span>
          </div>
          <div className="kpi">
            <strong>{count('REJECTED')}</strong>
            <span>precisam de ajustes</span>
          </div>
          <Link to="/contribuir" className="btn">
            <Plus size={17} /> Nova planta
          </Link>
        </div>
      )}

      {items === null ? (
        <Spinner />
      ) : items.length === 0 ? (
        <Empty title="Você ainda não enviou nenhuma planta">
          <Link to="/contribuir" className="btn">
            Registrar minha primeira planta
          </Link>
        </Empty>
      ) : (
        <ul className="list">
          {items.map((p) => (
            <li key={p.id} className="card list-item">
              <Link to={`/plantas/${p.id}`} className="list-thumb">
                <PlantPhoto src={p.photoUrl} alt={p.popularNames[0]} biome={p.biome} />
              </Link>
              <div className="list-body">
                <div className="list-title">
                  <Link to={`/plantas/${p.id}`}>
                    <strong>{p.popularNames[0]}</strong> <em className="sci">{p.scientificName}</em>
                  </Link>
                  {p.status && <StatusBadge status={p.status} />}
                </div>
                <p className="muted small">
                  {p.municipality} · {p.state} · atualizado em {formatDate(p.updatedAt)}
                </p>
                {p.reviewNote && (
                  <p className={`review-note ${p.status === 'REJECTED' ? 'warn' : ''}`}>
                    <MessageSquareWarning size={15} /> <strong>Mediador:</strong> {p.reviewNote}
                  </p>
                )}
              </div>
              <div className="list-actions">
                <Link to={`/contribuir/${p.id}`} className="icon-btn" title="Editar">
                  <Pencil size={17} />
                </Link>
                <button className="icon-btn danger" title="Remover" onClick={() => remove(p)}>
                  <Trash2 size={17} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
