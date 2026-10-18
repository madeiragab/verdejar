import type { LightNeed, ToxicityLevel, WaterNeed } from '@prisma/client';

// Rótulos em português dos enums do banco. Os biomas ficam na tabela `biomes`.

export const LIGHT_LABELS: Record<LightNeed, string> = {
  SOL_PLENO: 'Sol pleno',
  MEIA_SOMBRA: 'Meia-sombra',
  SOMBRA: 'Sombra',
};

export const WATER_LABELS: Record<WaterNeed, string> = {
  BAIXA: 'Pouca água',
  MEDIA: 'Rega moderada',
  ALTA: 'Muita água',
};

export const TOXICITY_LABELS: Record<ToxicityLevel, string> = {
  NENHUMA: 'Não tóxica',
  BAIXA: 'Baixa',
  MODERADA: 'Moderada',
  ALTA: 'Alta',
  DESCONHECIDA: 'Não informada',
};
