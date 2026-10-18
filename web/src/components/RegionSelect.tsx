import { useMunicipalities, useStates } from '../lib/hooks';

interface Props {
  state: string;
  municipality: string;
  onChange: (v: { state: string; municipality: string }) => void;
  allowAll?: boolean;
  required?: boolean;
}

/** Selects encadeados de estado → município (lista oficial do IBGE). */
export function RegionSelect({ state, municipality, onChange, allowAll = true, required }: Props) {
  const states = useStates();
  const municipalities = useMunicipalities(state || undefined);

  return (
    <>
      <label className="field">
        <span>Estado</span>
        <select
          value={state}
          required={required}
          onChange={(e) => onChange({ state: e.target.value, municipality: '' })}
        >
          <option value="">{allowAll ? 'Todos os estados' : 'Selecione'}</option>
          {states.map((s) => (
            <option key={s.uf} value={s.uf}>
              {s.name}
            </option>
          ))}
        </select>
      </label>
      <label className="field">
        <span>Município</span>
        <select
          value={municipality}
          required={required}
          disabled={!state}
          onChange={(e) => onChange({ state, municipality: e.target.value })}
        >
          <option value="">{!state ? 'Escolha o estado' : allowAll ? 'Todos os municípios' : 'Selecione'}</option>
          {/* Mantém o valor atual visível mesmo antes da lista carregar */}
          {municipality && !municipalities.includes(municipality) && <option value={municipality}>{municipality}</option>}
          {municipalities.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
      </label>
    </>
  );
}
