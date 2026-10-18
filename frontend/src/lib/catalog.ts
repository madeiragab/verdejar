// Espelho de api/src/lib/catalog.ts (rótulos em português).

export const BIOMES: Record<string, string> = {
  AMAZONIA: 'Amazônia',
  CAATINGA: 'Caatinga',
  CERRADO: 'Cerrado',
  MATA_ATLANTICA: 'Mata Atlântica',
  PAMPA: 'Pampa',
  PANTANAL: 'Pantanal',
  URBANO: 'Área urbana / cultivada',
};

export const LIGHT: Record<string, string> = {
  SOL_PLENO: 'Sol pleno',
  MEIA_SOMBRA: 'Meia-sombra',
  SOMBRA: 'Sombra',
};

export const WATER: Record<string, string> = {
  BAIXA: 'Pouca água',
  MEDIA: 'Rega moderada',
  ALTA: 'Muita água',
};

export const TOXICITY: Record<string, string> = {
  NENHUMA: 'Não tóxica',
  BAIXA: 'Toxicidade baixa',
  MODERADA: 'Toxicidade moderada',
  ALTA: 'Tóxica',
  DESCONHECIDA: 'Toxicidade não informada',
};

export const STATUS_LABEL: Record<string, string> = {
  PENDING: 'Em revisão',
  APPROVED: 'Publicado',
  REJECTED: 'Precisa de ajustes',
};

export const ROLE_LABEL: Record<string, string> = {
  USER: 'Colaborador',
  MODERATOR: 'Mediador',
  ADMIN: 'Administrador',
};

/** Cor de destaque por bioma (usada nos placeholders e chips). */
export const BIOME_COLOR: Record<string, string> = {
  AMAZONIA: '#2f7d4f',
  CAATINGA: '#b9773a',
  CERRADO: '#a38b2c',
  MATA_ATLANTICA: '#3f8f6b',
  PAMPA: '#7a9a3c',
  PANTANAL: '#3a7a8f',
  URBANO: '#6b7a73',
};
