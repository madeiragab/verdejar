/**
 * Camada de acesso à API: as páginas chamam estas funções em vez de montar URLs.
 * Cada função corresponde a um endpoint documentado em docs/04-api.md.
 */
import { api } from '../api/client';
import type { NewsItem, NewsSource, Page, Place, Plant, PlantDetail, Role, Stats, Status, User } from '../api/types';

type Query = Record<string, string | number | undefined>;

export const plantsService = {
  list: (query: Query, signal?: AbortSignal) => api<Page<Plant>>('/plants', { query, signal }),
  get: (id: string) => api<PlantDetail>(`/plants/${id}`),
  stats: () => api<Stats>('/plants/stats'),
  mine: () => api<{ items: Plant[] }>('/plants/mine').then((r) => r.items),
  create: (body: FormData) => api<Plant>('/plants', { method: 'POST', body }),
  update: (id: string, body: FormData) => api<Plant>(`/plants/${id}`, { method: 'PUT', body }),
  remove: (id: string) => api<void>(`/plants/${id}`, { method: 'DELETE' }),
};

export const moderationService = {
  queue: (status: Status) =>
    api<{ items: Plant[]; counts: Record<string, number> }>('/moderation/plants', { query: { status } }),
  approve: (id: string, note?: string) => api<Plant>(`/moderation/plants/${id}/approve`, { method: 'POST', body: { note } }),
  reject: (id: string, note: string) => api<Plant>(`/moderation/plants/${id}/reject`, { method: 'POST', body: { note } }),
};

export interface UF {
  uf: string;
  name: string;
}
export interface MunicipalityOption {
  code: number;
  name: string;
}

export const regionsService = {
  states: () => api<{ items: UF[] }>('/regions/states').then((r) => r.items),
  municipalities: (uf: string) =>
    api<{ items: MunicipalityOption[] }>(`/regions/states/${uf}/municipalities`).then((r) => r.items),
  locate: (lat: number, lng: number) => api<Place>('/regions/locate', { query: { lat, lng } }),
};

export const newsService = {
  list: (query: { limit?: number; source?: string }) => api<{ items: NewsItem[] }>('/news', { query }).then((r) => r.items),
  sources: () => api<{ items: NewsSource[] }>('/news/sources').then((r) => r.items),
  refresh: () => api<{ added: number; errors: string[] }>('/news/refresh', { method: 'POST' }),
};

export type UserRow = User & { plants: number };

export const usersService = {
  list: () => api<{ items: UserRow[] }>('/users').then((r) => r.items),
  changeRole: (id: string, role: Role) => api<User>(`/users/${id}/role`, { method: 'PATCH', body: { role } }),
};
