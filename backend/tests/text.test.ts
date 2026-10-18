import { describe, expect, it } from 'vitest';
import { formatScientificName, normalize, splitNames } from '../src/lib/text.js';

describe('normalize', () => {
  it('remove acentos, caixa e espaços extras', () => {
    expect(normalize('  Ipê-Amarelo   do  Cerrado ')).toBe('ipe-amarelo do cerrado');
    expect(normalize('Poços de Caldas')).toBe(normalize('pocos de caldas'));
  });
});

describe('splitNames', () => {
  it('separa por vírgula/ponto e vírgula e tira repetidos sem diferenciar acento', () => {
    expect(splitNames('Ipê-amarelo, Ipê-do-cerrado; ipe-amarelo ,, ')).toEqual(['Ipê-amarelo', 'Ipê-do-cerrado']);
  });
});

describe('formatScientificName', () => {
  it('gênero com maiúscula e epíteto minúsculo', () => {
    expect(formatScientificName('handroanthus   ALBUS')).toBe('Handroanthus albus');
  });
});
