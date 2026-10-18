import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Crosshair, MapPin, Newspaper, ShieldCheck, Upload } from 'lucide-react';
import { api } from '../api/client';
import type { NewsItem, Page, Plant, Stats } from '../api/types';
import { Empty } from '../components/common';
import { NewsCard } from '../components/NewsCard';
import { PlantGrid, PlantGridSkeleton } from '../components/PlantCard';
import { PlantMap } from '../components/PlantMap';
import { useDocumentTitle, useLocation, useStates } from '../lib/hooks';

export function Home() {
  useDocumentTitle('');
  const { geo, locate } = useLocation(true);
  const states = useStates();
  const [manualUf, setManualUf] = useState('');
  const [plants, setPlants] = useState<Plant[] | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [news, setNews] = useState<NewsItem[]>([]);

  useEffect(() => {
    api<Stats>('/plants/stats').then(setStats).catch(() => {});
    api<{ items: NewsItem[] }>('/news', { query: { limit: 4 } })
      .then((r) => setNews(r.items))
      .catch(() => {});
  }, []);

  const coords = geo.status === 'ready' ? geo.coords : null;

  // Enquanto a pessoa não responde ao pedido de localização, já mostra os destaques gerais.
  useEffect(() => {
    if (coords) setPlants(null);
    const query = coords
      ? { lat: coords.lat, lng: coords.lng, sort: 'distance', limit: 8 }
      : { state: manualUf || undefined, limit: 8 };
    const ctrl = new AbortController();
    api<Page<Plant>>('/plants', { query, signal: ctrl.signal })
      .then((r) => setPlants(r.items))
      .catch((e) => e.name !== 'AbortError' && setPlants([]));
    return () => ctrl.abort();
  }, [coords?.lat, coords?.lng, manualUf]); // eslint-disable-line react-hooks/exhaustive-deps

  const placeLabel =
    geo.status === 'ready' && geo.municipality
      ? `${geo.municipality} · ${geo.state}`
      : geo.status === 'ready'
        ? 'sua localização'
        : null;

  const exploreLink =
    geo.status === 'ready' && geo.state
      ? `/explorar?state=${geo.state}${geo.municipality ? `&municipality=${encodeURIComponent(geo.municipality)}` : ''}`
      : '/explorar';

  return (
    <>
      <section className="hero">
        <div className="container hero-inner">
          <div className="hero-text">
            <span className="eyebrow light">Flora do Brasil, região por região</span>
            <h1>Descubra as plantas que crescem perto de você</h1>
            <p>
              Fotos, bioma, clima, cuidados com luz e água, usos medicinais, toxicidade e curiosidades — tudo enviado pela
              comunidade e conferido por mediadores.
            </p>

            <div className="locate-box">
              {geo.status === 'locating' && (
                <span className="locate-status">
                  <span className="pulse" /> Procurando sua localização…
                </span>
              )}
              {placeLabel && (
                <span className="locate-status">
                  <MapPin size={18} /> Você está em <strong>{placeLabel}</strong>
                </span>
              )}
              {(geo.status === 'denied' || geo.status === 'unavailable' || geo.status === 'idle') && (
                <>
                  <button className="btn btn-light" onClick={locate}>
                    <Crosshair size={18} /> Usar minha localização
                  </button>
                  <span className="or">ou</span>
                  <select className="select-light" value={manualUf} onChange={(e) => setManualUf(e.target.value)}>
                    <option value="">Escolha um estado</option>
                    {states.map((s) => (
                      <option key={s.uf} value={s.uf}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </>
              )}
            </div>
          </div>

          {stats && (
            <dl className="hero-stats">
              <div>
                <dt>{stats.total}</dt>
                <dd>registros publicados</dd>
              </div>
              <div>
                <dt>{Object.keys(stats.byState).length}</dt>
                <dd>estados</dd>
              </div>
              <div>
                <dt>{Object.keys(stats.byBiome).length}</dt>
                <dd>biomas</dd>
              </div>
            </dl>
          )}
        </div>
      </section>

      <section className="container section">
        <div className="section-head">
          <div>
            <span className="eyebrow">{coords ? 'Mais próximas de você' : manualUf ? `Em ${manualUf}` : 'Destaques'}</span>
            <h2>{coords ? 'Plantas da sua região' : 'Plantas do Brasil'}</h2>
          </div>
          <Link to={exploreLink} className="link-arrow">
            Ver todas e filtrar <ArrowRight size={16} />
          </Link>
        </div>

        <div className="home-split">
          <div>
            {plants === null ? (
              <PlantGridSkeleton count={4} />
            ) : plants.length === 0 ? (
              <Empty title="Ainda não há plantas aqui">
                Seja a primeira pessoa a registrar uma planta desta região. <Link to="/contribuir">Contribuir</Link>
              </Empty>
            ) : (
              <PlantGrid plants={plants} />
            )}
          </div>
          <div className="sticky">
            <PlantMap plants={plants ?? []} me={coords} height={460} />
          </div>
        </div>
      </section>

      <section className="band">
        <div className="container steps">
          <div className="step">
            <span className="step-icon">
              <Upload size={22} />
            </span>
            <h3>Envie</h3>
            <p>Crie uma conta, tire a foto, marque o local e diga de onde veio a informação.</p>
          </div>
          <div className="step">
            <span className="step-icon">
              <ShieldCheck size={22} />
            </span>
            <h3>Mediadores conferem</h3>
            <p>Cada registro é revisado antes de ir ao ar, para manter a informação confiável.</p>
          </div>
          <div className="step">
            <span className="step-icon">
              <MapPin size={22} />
            </span>
            <h3>Todos descobrem</h3>
            <p>A planta aparece no mapa da região — com seu nome como colaborador, se você quiser.</p>
          </div>
          <Link to="/contribuir" className="btn">
            Quero contribuir
          </Link>
        </div>
      </section>

      {news.length > 0 && (
        <section className="container section">
          <div className="section-head">
            <div>
              <span className="eyebrow">Clima e meio ambiente</span>
              <h2>Últimas notícias</h2>
            </div>
            <Link to="/noticias" className="link-arrow">
              <Newspaper size={16} /> Todas as notícias
            </Link>
          </div>
          <div className="news-grid compact">
            {news.map((n) => (
              <NewsCard key={n.id} item={n} compact />
            ))}
          </div>
        </section>
      )}
    </>
  );
}
