import { describe, expect, it } from 'vitest';
import '../src/lib/zod-pt.js';
import { listQuery, plantInput } from '../src/modules/plants/plants.schemas.js';

const valid = {
  scientificName: 'Handroanthus albus',
  popularNames: 'Ipê-amarelo',
  biome: 'CERRADO',
  light: 'SOL_PLENO',
  water: 'BAIXA',
  municipalityCode: '3138203',
  source: 'Flora e Funga do Brasil',
  showContributor: 'true',
};

describe('plantInput (formulário multipart)', () => {
  it('converte strings do formulário e aplica padrões', () => {
    const r = plantInput.parse({ ...valid, family: '', latitude: '-21.2', longitude: '' });
    expect(r.municipalityCode).toBe(3138203);
    expect(r.showContributor).toBe(true);
    expect(r.toxicityLevel).toBe('DESCONHECIDA');
    expect(r.family).toBeUndefined();
    expect(r.latitude).toBe(-21.2);
    expect(r.longitude).toBeUndefined();
  });

  it('devolve mensagens em português para campos faltando', () => {
    const r = plantInput.safeParse({ showContributor: 'false' });
    expect(r.success).toBe(false);
    const errors = r.error!.flatten().fieldErrors;
    expect(errors.scientificName?.[0]).toBe('Informe o nome científico');
    expect(errors.municipalityCode?.[0]).toBe('Escolha o município');
    expect(errors.light?.[0]).toBe('Escolha a necessidade de luz');
  });

  it('recusa nome científico fora do formato binomial', () => {
    expect(plantInput.safeParse({ ...valid, scientificName: 'Ipê' }).success).toBe(false);
  });
});

describe('listQuery', () => {
  it('normaliza UF e usa padrões de paginação', () => {
    const q = listQuery.parse({ state: 'mg' });
    expect(q).toMatchObject({ state: 'MG', page: 1, limit: 12, sort: 'recent' });
  });
});
