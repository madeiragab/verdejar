import { useEffect, useState } from 'react';
import { api } from '../api/client';

export interface Coords {
  lat: number;
  lng: number;
}

export type GeoState =
  | { status: 'idle' | 'locating' | 'denied' | 'unavailable' }
  | { status: 'ready'; coords: Coords; state: string | null; municipality: string | null };

const STORAGE_KEY = 'vj_last_location';

/** Pede a localização ao navegador e descobre o município pela API. Lembra a última posição. */
export function useLocation(auto = true) {
  const [geo, setGeo] = useState<GeoState>(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved) as GeoState;
    } catch {
      /* ignora */
    }
    return { status: 'idle' };
  });

  const locate = () => {
    if (!('geolocation' in navigator)) return setGeo({ status: 'unavailable' });
    setGeo({ status: 'locating' });
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        const c = { lat: coords.latitude, lng: coords.longitude };
        let place: { state: string | null; municipality: string | null } = { state: null, municipality: null };
        try {
          place = await api('/regions/locate', { query: c });
        } catch {
          /* segue só com as coordenadas */
        }
        const next: GeoState = { status: 'ready', coords: c, ...place };
        setGeo(next);
        try {
          sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        } catch {
          /* ignora */
        }
      },
      (err) => setGeo({ status: err.code === err.PERMISSION_DENIED ? 'denied' : 'unavailable' }),
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 10 * 60_000 },
    );
  };

  useEffect(() => {
    if (auto && geo.status === 'idle') locate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { geo, locate };
}

export interface UF {
  uf: string;
  name: string;
}

let statesCache: UF[] | null = null;
const munCache = new Map<string, string[]>();

export function useStates() {
  const [states, setStates] = useState<UF[]>(statesCache ?? []);
  useEffect(() => {
    if (statesCache) return;
    api<{ items: UF[] }>('/regions/states')
      .then((r) => {
        statesCache = r.items;
        setStates(r.items);
      })
      .catch(() => {});
  }, []);
  return states;
}

export function useMunicipalities(uf: string | undefined) {
  const [list, setList] = useState<string[]>([]);
  useEffect(() => {
    if (!uf) return setList([]);
    const hit = munCache.get(uf);
    if (hit) return setList(hit);
    let alive = true;
    api<{ items: { name: string }[] }>(`/regions/states/${uf}/municipalities`)
      .then((r) => {
        const names = r.items.map((m) => m.name);
        munCache.set(uf, names);
        if (alive) setList(names);
      })
      .catch(() => alive && setList([]));
    return () => {
      alive = false;
    };
  }, [uf]);
  return list;
}

export function useDocumentTitle(title: string) {
  useEffect(() => {
    document.title = title ? `${title} · Verdejar` : 'Verdejar · Plantas da sua região';
  }, [title]);
}
