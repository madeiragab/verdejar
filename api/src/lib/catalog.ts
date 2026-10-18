// Valores aceitos pela API + rótulos em português usados pelo front.

export const BIOMES = {
  AMAZONIA: 'Amazônia',
  CAATINGA: 'Caatinga',
  CERRADO: 'Cerrado',
  MATA_ATLANTICA: 'Mata Atlântica',
  PAMPA: 'Pampa',
  PANTANAL: 'Pantanal',
  URBANO: 'Área urbana / cultivada',
} as const;

export const LIGHT = {
  SOL_PLENO: 'Sol pleno',
  MEIA_SOMBRA: 'Meia-sombra',
  SOMBRA: 'Sombra',
} as const;

export const WATER = {
  BAIXA: 'Pouca água',
  MEDIA: 'Rega moderada',
  ALTA: 'Muita água',
} as const;

export const TOXICITY = {
  NENHUMA: 'Não tóxica',
  BAIXA: 'Baixa',
  MODERADA: 'Moderada',
  ALTA: 'Alta',
  DESCONHECIDA: 'Não informada',
} as const;

export const ROLES = ['USER', 'MODERATOR', 'ADMIN'] as const;
export type Role = (typeof ROLES)[number];

export const STATUS = ['PENDING', 'APPROVED', 'REJECTED'] as const;
export type Status = (typeof STATUS)[number];

export const UFS = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA',
  'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
] as const;

const keys = <T extends object>(o: T) => Object.keys(o) as [keyof T & string, ...(keyof T & string)[]];
export const biomeKeys = keys(BIOMES);
export const lightKeys = keys(LIGHT);
export const waterKeys = keys(WATER);
export const toxicityKeys = keys(TOXICITY);
