import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { LayoutGrid, Map as MapIcon, Search, SlidersHorizontal, X } from 'lucide-react';
import { api } from '../api/client';
import type { Page, Plant } from '../api/types';
import { Empty, PageHeader } from '../components/common';
import { PlantGrid, PlantGridSkeleton } from '../components/PlantCard';
import { PlantMap } from '../components/PlantMap';
import { RegionSelect } from '../components/RegionSelect';
import { BIOMES, LIGHT, TOXICITY, WATER } from '../lib/catalog';
import { useDocumentTitle, useLocation } from '../lib/hooks';

const FILTERS = ['q', 'state', 'municipality', 'biome', 'light', 'water', 'toxicity', 'sort'] as const;
const LIMIT = 12;

export function Explore() {
  useDocumentTitle('Explorar');
  const [params, setParams] = useSearchParams();
  const { geo } = useLocation(false);
  const coords = geo.status === 'ready' ? geo.coords : null;

  const [view, setView] = useState<'grid' | 'map'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [q, setQ] = useState(params.get('q') ?? '');
  const [data, setData] = useState<Page<Plant> | null>(null);
  const [page, setPage] = useState(1);

  const get = (k: (typeof FILTERS)[number]) => params.get(k) ?? '';
  const set = (patch: Partial<Record<(typeof FILTERS)[number], string>>) => {
    const next = new URLSearchParams(params);
    for (const [k, v] of Object.entries(patch)) {
      if (v) next.set(k, v);
      else next.delete(k);
    }
    setParams(next, { replace: true });
  };

  // Busca com pequeno atraso enquanto digita.
  useEffect(() => {
    const t = setTimeout(() => q !== get('q') && set({ q }), 350);
    return () => clearTimeout(t);
  }, [q]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => setPage(1), [params]);

  useEffect(() => {
    const ctrl = new AbortController();
    const sort = get('sort') || (coords ? 'distance' : 'recent');
    const query: Record<string, string | number | undefined> = {
      ...Object.fromEntries(FILTERS.map((k) => [k, get(k) || undefined])),
      sort,
      page: view === 'map' ? 1 : page,
      limit: view === 'map' ? 100 : LIMIT,
      lat: coords?.lat,
      lng: coords?.lng,
    };
    if (page === 1) setData(null);
    api<Page<Plant>>('/plants', { query, signal: ctrl.signal })
      .then((r) =>
        setData((prev) => (page > 1 && prev && view === 'grid' ? { ...r, items: [...prev.items, ...r.items] } : r)),
      )
      .catch((e) => e.name !== 'AbortError' && setData({ items: [], page: 1, limit: LIMIT, total: 0 }));
    return () => ctrl.abort();
  }, [params, page, view, coords?.lat, coords?.lng]); // eslint-disable-line react-hooks/exhaustive-deps

  const active = FILTERS.filter((k) => k !== 'sort' && k !== 'q' && get(k)).length;

  return (
    <div className="container section">
      <PageHeader eyebrow="Explorar" title="Plantas por região">
        Filtre por estado, município, bioma e cuidados. {coords && 'Os resultados estão ordenados pelos mais próximos de você.'}
      </PageHeader>

      <div className="toolbar">
        <label className="search">
          <Search size={18} />
          <input
            placeholder="Buscar por nome popular, científico ou família…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          {q && (
            <button className="icon-btn" onClick={() => setQ('')} aria-label="Limpar busca">
              <X size={16} />
            </button>
          )}
        </label>
        <button className={`btn btn-ghost ${showFilters ? 'is-active' : ''}`} onClick={() => setShowFilters((s) => !s)}>
          <SlidersHorizontal size={17} /> Filtros {active > 0 && <span className="count">{active}</span>}
        </button>
        <div className="segmented">
          <button className={view === 'grid' ? 'is-active' : ''} onClick={() => setView('grid')}>
            <LayoutGrid size={16} /> Lista
          </button>
          <button className={view === 'map' ? 'is-active' : ''} onClick={() => setView('map')}>
            <MapIcon size={16} /> Mapa
          </button>
        </div>
      </div>

      <div className={`filters ${showFilters || active > 0 ? 'is-open' : ''}`}>
        <RegionSelect
          state={get('state')}
          municipality={get('municipality')}
          onChange={({ state, municipality }) => set({ state, municipality })}
        />
        <label className="field">
          <span>Bioma</span>
          <select value={get('biome')} onChange={(e) => set({ biome: e.target.value })}>
            <option value="">Todos</option>
            {Object.entries(BIOMES).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Luz</span>
          <select value={get('light')} onChange={(e) => set({ light: e.target.value })}>
            <option value="">Qualquer</option>
            {Object.entries(LIGHT).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Água</span>
          <select value={get('water')} onChange={(e) => set({ water: e.target.value })}>
            <option value="">Qualquer</option>
            {Object.entries(WATER).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Toxicidade</span>
          <select value={get('toxicity')} onChange={(e) => set({ toxicity: e.target.value })}>
            <option value="">Qualquer</option>
            {Object.entries(TOXICITY).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Ordenar</span>
          <select value={get('sort')} onChange={(e) => set({ sort: e.target.value })}>
            <option value="">{coords ? 'Mais próximas' : 'Mais recentes'}</option>
            {coords && <option value="recent">Mais recentes</option>}
            <option value="name">Nome (A–Z)</option>
          </select>
        </label>
        {active > 0 && (
          <button
            className="btn btn-ghost btn-sm clear"
            onClick={() => setParams(q ? { q } : {}, { replace: true })}
          >
            <X size={15} /> Limpar filtros
          </button>
        )}
      </div>

      {data && <p className="muted result-count">{data.total} {data.total === 1 ? 'planta encontrada' : 'plantas encontradas'}</p>}

      {data === null ? (
        <PlantGridSkeleton />
      ) : data.items.length === 0 ? (
        <Empty title="Nenhuma planta encontrada">Tente remover algum filtro ou buscar por outro nome.</Empty>
      ) : view === 'map' ? (
        <PlantMap plants={data.items} me={coords} height={560} />
      ) : (
        <>
          <PlantGrid plants={data.items} />
          {data.items.length < data.total && (
            <div className="center">
              <button className="btn btn-ghost" onClick={() => setPage((p) => p + 1)}>
                Carregar mais
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
