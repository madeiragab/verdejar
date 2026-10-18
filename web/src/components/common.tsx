import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Leaf } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import type { Role } from '../api/types';

export function Empty({ title, children, icon }: { title: string; children?: ReactNode; icon?: ReactNode }) {
  return (
    <div className="empty">
      <div className="empty-icon">{icon ?? <Leaf size={28} />}</div>
      <h3>{title}</h3>
      {children && <div className="muted">{children}</div>}
    </div>
  );
}

export function Spinner({ label = 'Carregando…' }: { label?: string }) {
  return (
    <div className="spinner-wrap" role="status">
      <span className="spinner" />
      <span className="muted">{label}</span>
    </div>
  );
}

export function Alert({ kind = 'error', children }: { kind?: 'error' | 'success' | 'info' | 'warning'; children: ReactNode }) {
  return <div className={`alert alert-${kind}`}>{children}</div>;
}

const RANK: Record<Role, number> = { USER: 0, MODERATOR: 1, ADMIN: 2 };

/** Protege rotas do front. A API valida de novo — isso aqui é só para a experiência. */
export function RequireAuth({ children, role = 'USER' }: { children: ReactNode; role?: Role }) {
  const { user, ready } = useAuth();
  const location = useLocation();
  if (!ready) return <Spinner />;
  if (!user) return <Navigate to="/entrar" replace state={{ from: location.pathname }} />;
  if (RANK[user.role] < RANK[role])
    return (
      <div className="container section">
        <Empty title="Acesso restrito">Esta área é só para mediadores.</Empty>
      </div>
    );
  return <>{children}</>;
}

export function PageHeader({ eyebrow, title, children }: { eyebrow?: string; title: string; children?: ReactNode }) {
  return (
    <div className="page-header">
      {eyebrow && <span className="eyebrow">{eyebrow}</span>}
      <h1>{title}</h1>
      {children && <div className="page-header-sub">{children}</div>}
    </div>
  );
}
