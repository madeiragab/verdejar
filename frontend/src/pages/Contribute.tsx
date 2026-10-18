import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Camera, CheckCircle2, Crosshair, ImagePlus } from 'lucide-react';
import { ApiError } from '../api/client';
import type { Plant } from '../api/types';
import { plantsService, regionsService } from '../services';
import { Alert, PageHeader, Spinner } from '../components/common';
import { LocationPicker } from '../components/PlantMap';
import { RegionSelect } from '../components/RegionSelect';
import { BIOMES, LIGHT, TOXICITY, WATER } from '../lib/catalog';
import { useDocumentTitle, type Coords } from '../lib/hooks';

const EMPTY = {
  scientificName: '',
  popularNames: '',
  family: '',
  description: '',
  biome: '',
  climate: '',
  light: '',
  water: '',
  medicinalUse: '',
  toxicityLevel: 'DESCONHECIDA',
  toxicityNotes: '',
  curiosities: '',
  photoCredit: '',
  state: '',
  municipalityCode: '',
  source: '',
  sourceUrl: '',
  showContributor: true,
};
type FormState = typeof EMPTY;

export function Contribute() {
  const { id } = useParams();
  const editing = !!id;
  useDocumentTitle(editing ? 'Editar registro' : 'Contribuir');
  const navigate = useNavigate();

  const [form, setForm] = useState<FormState>(EMPTY);
  const [coords, setCoords] = useState<Coords | null>(null);
  const [photo, setPhoto] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(editing);
  const [busy, setBusy] = useState(false);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [done, setDone] = useState<Plant | null>(null);

  useEffect(() => {
    if (!id) return;
    plantsService
      .get(id)
      .then((p) => {
        setForm({
          ...EMPTY,
          ...Object.fromEntries(Object.keys(EMPTY).map((k) => [k, (p as unknown as Record<string, unknown>)[k] ?? ''])),
          popularNames: p.popularNames.join(', '),
          municipalityCode: String(p.municipalityCode),
          showContributor: !!p.showContributor,
        } as FormState);
        if (p.latitude != null && p.longitude != null) setCoords({ lat: p.latitude, lng: p.longitude });
        setPreview(p.photoUrl);
      })
      .catch(() => navigate('/minhas-contribuicoes'))
      .finally(() => setLoading(false));
  }, [id, navigate]);

  useEffect(() => {
    if (!photo) return;
    const url = URL.createObjectURL(photo);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [photo]);

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setForm((f) => ({ ...f, [k]: v }));
  const err = (k: string) => error?.details?.[k]?.[0];

  const useMyLocation = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async ({ coords: c }) => {
        const point = { lat: c.latitude, lng: c.longitude };
        setCoords(point);
        try {
          const place = await regionsService.locate(point.lat, point.lng);
          if (place.state) {
            setForm((f) => ({ ...f, state: place.state!, municipalityCode: place.municipalityCode ? String(place.municipalityCode) : '' }));
          }
        } catch {
          /* usuário escolhe manualmente */
        }
        setLocating(false);
      },
      () => setLocating(false),
      { timeout: 10_000 },
    );
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!editing && !photo) {
      setError(new ApiError(400, 'VALIDATION_ERROR', 'Envie uma foto', { photo: ['Envie uma foto da planta'] }));
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    const body = new FormData();
    // 'state' só serve para filtrar a lista de municípios; a API recebe o código IBGE.
    for (const [k, v] of Object.entries(form)) if (k !== 'state') body.append(k, String(v));
    if (coords) {
      body.append('latitude', String(coords.lat));
      body.append('longitude', String(coords.lng));
    }
    if (photo) body.append('photo', photo);

    setBusy(true);
    try {
      const saved = editing ? await plantsService.update(id!, body) : await plantsService.create(body);
      setDone(saved);
      window.scrollTo({ top: 0 });
    } catch (e2) {
      setError(e2 instanceof ApiError ? e2 : new ApiError(0, 'ERROR', 'Não foi possível enviar'));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <Spinner />;

  if (done)
    return (
      <div className="container section narrow">
        <div className="card success-card">
          <CheckCircle2 size={48} />
          <h1>Recebemos sua contribuição!</h1>
          <p>
            <strong>{form.popularNames.split(',')[0]}</strong> foi enviada para revisão. Assim que um mediador aprovar, ela
            aparece no site. Você acompanha o status em “Minhas contribuições”.
          </p>
          <div className="row">
            <Link to="/minhas-contribuicoes" className="btn">
              Minhas contribuições
            </Link>
            <button
              className="btn btn-ghost"
              onClick={() => {
                setDone(null);
                setForm(EMPTY);
                setPhoto(null);
                setPreview(null);
                setCoords(null);
                navigate('/contribuir');
              }}
            >
              Enviar outra planta
            </button>
          </div>
        </div>
      </div>
    );

  return (
    <div className="container section narrow">
      <PageHeader eyebrow={editing ? 'Editar' : 'Contribuir'} title={editing ? 'Editar registro' : 'Registrar uma planta'}>
        Preencha com cuidado e informe a fonte onde você confirmou a espécie. Todo envio passa por um mediador antes de
        ser publicado{editing && ' — ao salvar, o registro volta para revisão'}.
      </PageHeader>

      {error && <Alert>{error.details ? 'Confira os campos destacados abaixo.' : error.message}</Alert>}

      <form className="form contribute" onSubmit={submit} noValidate>
        <Fieldset n={1} title="Foto">
          <label className={`dropzone ${preview ? 'has-image' : ''} ${err('photo') ? 'invalid' : ''}`}>
            {preview ? (
              <img src={preview} alt="Pré-visualização" />
            ) : (
              <span>
                <ImagePlus size={36} strokeWidth={1.5} />
                <strong>Toque para escolher uma foto</strong>
                <small>JPG, PNG ou WEBP · até 5 MB</small>
              </span>
            )}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              capture="environment"
              onChange={(e) => setPhoto(e.target.files?.[0] ?? null)}
            />
            {preview && (
              <span className="dropzone-change">
                <Camera size={15} /> Trocar foto
              </span>
            )}
          </label>
          {err('photo') && <small className="error">{err('photo')}</small>}
          <Field label="Crédito da foto" hint="Opcional. Ex.: “Foto: Maria Silva”" error={err('photoCredit')}>
            <input value={form.photoCredit} onChange={(e) => set('photoCredit', e.target.value)} />
          </Field>
        </Fieldset>

        <Fieldset n={2} title="Identificação">
          <div className="cols-2">
            <Field label="Nome científico *" error={err('scientificName')}>
              <input
                className="italic"
                placeholder="Ex.: Handroanthus albus"
                value={form.scientificName}
                onChange={(e) => set('scientificName', e.target.value)}
              />
            </Field>
            <Field label="Família" error={err('family')}>
              <input placeholder="Ex.: Bignoniaceae" value={form.family} onChange={(e) => set('family', e.target.value)} />
            </Field>
          </div>
          <Field label="Nomes populares *" hint="Separe por vírgula" error={err('popularNames')}>
            <input
              placeholder="Ex.: Ipê-amarelo, Ipê-do-cerrado"
              value={form.popularNames}
              onChange={(e) => set('popularNames', e.target.value)}
            />
          </Field>
          <Field label="Descrição" error={err('description')}>
            <textarea rows={3} value={form.description} onChange={(e) => set('description', e.target.value)} />
          </Field>
        </Fieldset>

        <Fieldset n={3} title="Onde ela está">
          <div className="cols-2">
            <RegionSelect
              state={form.state}
              municipality={form.municipalityCode}
              allowAll={false}
              onChange={({ state, municipality }) => setForm((f) => ({ ...f, state, municipalityCode: municipality }))}
            />
          </div>
          {err('municipalityCode') && <small className="error">{err('municipalityCode')}</small>}
          <div className="picker-head">
            <span className="muted small">Toque no mapa para marcar o ponto exato (opcional, mas ajuda a achar as mais próximas).</span>
            <button type="button" className="btn btn-ghost btn-sm" onClick={useMyLocation} disabled={locating}>
              <Crosshair size={15} /> {locating ? 'Localizando…' : 'Estou ao lado dela'}
            </button>
          </div>
          <LocationPicker value={coords} onChange={setCoords} />
        </Fieldset>

        <Fieldset n={4} title="Ambiente e cuidados">
          <div className="cols-3">
            <Field label="Bioma *" error={err('biome')}>
              <select value={form.biome} onChange={(e) => set('biome', e.target.value)}>
                <option value="">Selecione</option>
                {Object.entries(BIOMES).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Luz *" error={err('light')}>
              <select value={form.light} onChange={(e) => set('light', e.target.value)}>
                <option value="">Selecione</option>
                {Object.entries(LIGHT).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Água *" error={err('water')}>
              <select value={form.water} onChange={(e) => set('water', e.target.value)}>
                <option value="">Selecione</option>
                {Object.entries(WATER).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <Field label="Clima" hint="Ex.: Tropical de altitude, com inverno seco" error={err('climate')}>
            <input value={form.climate} onChange={(e) => set('climate', e.target.value)} />
          </Field>
        </Fieldset>

        <Fieldset n={5} title="Usos e cuidados com a saúde">
          <Field label="Uso medicinal" error={err('medicinalUse')}>
            <textarea rows={3} value={form.medicinalUse} onChange={(e) => set('medicinalUse', e.target.value)} />
          </Field>
          <div className="cols-2">
            <Field label="Toxicidade" error={err('toxicityLevel')}>
              <select value={form.toxicityLevel} onChange={(e) => set('toxicityLevel', e.target.value)}>
                {Object.entries(TOXICITY).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Detalhes da toxicidade" error={err('toxicityNotes')}>
              <input
                placeholder="Qual parte, para quem (crianças, pets)…"
                value={form.toxicityNotes}
                onChange={(e) => set('toxicityNotes', e.target.value)}
              />
            </Field>
          </div>
          <Field label="Curiosidades" error={err('curiosities')}>
            <textarea rows={3} value={form.curiosities} onChange={(e) => set('curiosities', e.target.value)} />
          </Field>
        </Fieldset>

        <Fieldset n={6} title="Fonte">
          <Field label="Onde você confirmou a espécie? *" hint="Livro, artigo, site, herbário…" error={err('source')}>
            <input
              placeholder="Ex.: LORENZI, H. Árvores Brasileiras, v. 1"
              value={form.source}
              onChange={(e) => set('source', e.target.value)}
            />
          </Field>
          <Field label="Link da fonte" error={err('sourceUrl')}>
            <input
              type="url"
              placeholder="https://floradobrasil.jbrj.gov.br/…"
              value={form.sourceUrl}
              onChange={(e) => set('sourceUrl', e.target.value)}
            />
          </Field>
        </Fieldset>

        <label className="consent card">
          <input type="checkbox" checked={form.showContributor} onChange={(e) => set('showContributor', e.target.checked)} />
          <span>
            <strong>Exibir meu nome como colaborador</strong>
            <small className="muted">Se desmarcar, o registro aparece como de um colaborador anônimo.</small>
          </span>
        </label>

        <div className="form-actions">
          <button className="btn btn-lg" disabled={busy}>
            {busy ? 'Enviando…' : editing ? 'Salvar e reenviar para revisão' : 'Enviar para revisão'}
          </button>
        </div>
      </form>
    </div>
  );
}

function Fieldset({ n, title, children }: { n: number; title: string; children: ReactNode }) {
  return (
    <fieldset className="card fieldset">
      <legend>
        <span className="step-n">{n}</span> {title}
      </legend>
      {children}
    </fieldset>
  );
}

function Field({ label, hint, error, children }: { label: string; hint?: string; error?: string; children: ReactNode }) {
  return (
    <label className={`field ${error ? 'invalid' : ''}`}>
      <span>{label}</span>
      {children}
      {hint && !error && <small className="hint">{hint}</small>}
      {error && <small className="error">{error}</small>}
    </label>
  );
}
