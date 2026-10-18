import { useEffect, useState } from 'react';
import type { Place } from '../api/types';
import { regionsService, type MunicipalityOption, type UF } from '../services';

export interface Coords {
  lat: number;
  lng: number;
}

export type GeoState =
  | { status: 'idle' | 'locating' | 'denied' | 'unavailable' }
  | ({ status: 'ready'; coords: Coords } & Place);

const STORAGE_KEY = 'vj_last_location';
const EMPTY_PLACE: Place = { state: null, municipality: null, municipalityCode: null };

/** Pede a localização ao navegador e descobre o município pela API. Lembra a última posição na sessão. */
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
        const place = await regionsService.locate(c.lat, c.lng).catch(() => EMPTY_PLACE);
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

let statesCache: UF[] | null = null;
const munCache = new Map<string, MunicipalityOption[]>();

export function useStates() {
  const [states, setStates] = useState<UF[]>(statesCache ?? []);
  useEffect(() => {
    if (statesCache) return;
    regionsService
      .states()
      .then((items) => {
        statesCache = items;
        setStates(items);
      })
      .catch(() => {});
  }, []);
  return states;
}

/** Municípios oficiais (IBGE) da UF, com cache em memória. */
export function useMunicipalities(uf: string | undefined) {
  const [list, setList] = useState<MunicipalityOption[]>([]);
  useEffect(() => {
    if (!uf) return setList([]);
    const hit = munCache.get(uf);
    if (hit) return setList(hit);
    let alive = true;
    regionsService
      .municipalities(uf)
      .then((items) => {
        munCache.set(uf, items);
        if (alive) setList(items);
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
