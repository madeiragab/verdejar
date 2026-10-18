import { useEffect, useState } from 'react';
import { api, ApiError } from '../api/client';
import type { Role, User } from '../api/types';
import { useAuth } from '../auth/AuthContext';
import { Alert, PageHeader, Spinner } from '../components/common';
import { ROLE_LABEL } from '../lib/catalog';
import { formatDate } from '../lib/format';
import { useDocumentTitle } from '../lib/hooks';

type Row = User & { plants: number };

export function Admin() {
  useDocumentTitle('Usuários');
  const { user: me } = useAuth();
  const [users, setUsers] = useState<Row[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState('');

  useEffect(() => {
    api<{ items: Row[] }>('/users').then((r) => setUsers(r.items));
  }, []);

  const changeRole = async (u: Row, role: Role) => {
    setError(null);
    try {
      await api(`/users/${u.id}/role`, { method: 'PATCH', body: { role } });
      setUsers((list) => list?.map((x) => (x.id === u.id ? { ...x, role } : x)) ?? null);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Erro');
    }
  };

  const filtered = users?.filter((u) => `${u.name} ${u.email}`.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="container section">
      <PageHeader eyebrow="Administração" title="Usuários e mediadores">
        Promova pessoas de confiança a mediadoras para ajudar na revisão.
      </PageHeader>
      {error && <Alert>{error}</Alert>}
      <label className="search" style={{ maxWidth: 360, marginBottom: 16 }}>
        <input placeholder="Buscar por nome ou e-mail" value={q} onChange={(e) => setQ(e.target.value)} />
      </label>
      {!filtered ? (
        <Spinner />
      ) : (
        <div className="card table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>E-mail</th>
                <th>Registros</th>
                <th>Desde</th>
                <th>Papel</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.id}>
                  <td>{u.name}</td>
                  <td className="muted">{u.email}</td>
                  <td>{u.plants}</td>
                  <td className="muted">{formatDate(u.createdAt)}</td>
                  <td>
                    <select value={u.role} disabled={u.id === me?.id} onChange={(e) => changeRole(u, e.target.value as Role)}>
                      {Object.entries(ROLE_LABEL).map(([k, v]) => (
                        <option key={k} value={k}>
                          {v}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
