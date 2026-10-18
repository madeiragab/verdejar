import { describe, expect, it } from 'vitest';
import { haversineKm } from '../src/lib/geo.js';

describe('haversineKm', () => {
  it('é zero para o mesmo ponto', () => {
    expect(haversineKm(-21.24, -45, -21.24, -45)).toBe(0);
  });

  it('calcula a distância Lavras → Belo Horizonte (~190 km em linha reta)', () => {
    const d = haversineKm(-21.2453, -44.9997, -19.9167, -43.9345);
    expect(d).toBeGreaterThan(180);
    expect(d).toBeLessThan(195);
  });
});
