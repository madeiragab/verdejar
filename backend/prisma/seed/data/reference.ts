/** Dados de referência: estados (IBGE), biomas, municípios usados no conteúdo inicial e fontes de notícias. */

export const STATES: { uf: string; name: string; region: string; ibgeCode: number }[] = [
  { uf: 'AC', name: 'Acre', region: 'Norte', ibgeCode: 12 },
  { uf: 'AL', name: 'Alagoas', region: 'Nordeste', ibgeCode: 27 },
  { uf: 'AP', name: 'Amapá', region: 'Norte', ibgeCode: 16 },
  { uf: 'AM', name: 'Amazonas', region: 'Norte', ibgeCode: 13 },
  { uf: 'BA', name: 'Bahia', region: 'Nordeste', ibgeCode: 29 },
  { uf: 'CE', name: 'Ceará', region: 'Nordeste', ibgeCode: 23 },
  { uf: 'DF', name: 'Distrito Federal', region: 'Centro-Oeste', ibgeCode: 53 },
  { uf: 'ES', name: 'Espírito Santo', region: 'Sudeste', ibgeCode: 32 },
  { uf: 'GO', name: 'Goiás', region: 'Centro-Oeste', ibgeCode: 52 },
  { uf: 'MA', name: 'Maranhão', region: 'Nordeste', ibgeCode: 21 },
  { uf: 'MT', name: 'Mato Grosso', region: 'Centro-Oeste', ibgeCode: 51 },
  { uf: 'MS', name: 'Mato Grosso do Sul', region: 'Centro-Oeste', ibgeCode: 50 },
  { uf: 'MG', name: 'Minas Gerais', region: 'Sudeste', ibgeCode: 31 },
  { uf: 'PA', name: 'Pará', region: 'Norte', ibgeCode: 15 },
  { uf: 'PB', name: 'Paraíba', region: 'Nordeste', ibgeCode: 25 },
  { uf: 'PR', name: 'Paraná', region: 'Sul', ibgeCode: 41 },
  { uf: 'PE', name: 'Pernambuco', region: 'Nordeste', ibgeCode: 26 },
  { uf: 'PI', name: 'Piauí', region: 'Nordeste', ibgeCode: 22 },
  { uf: 'RJ', name: 'Rio de Janeiro', region: 'Sudeste', ibgeCode: 33 },
  { uf: 'RN', name: 'Rio Grande do Norte', region: 'Nordeste', ibgeCode: 24 },
  { uf: 'RS', name: 'Rio Grande do Sul', region: 'Sul', ibgeCode: 43 },
  { uf: 'RO', name: 'Rondônia', region: 'Norte', ibgeCode: 11 },
  { uf: 'RR', name: 'Roraima', region: 'Norte', ibgeCode: 14 },
  { uf: 'SC', name: 'Santa Catarina', region: 'Sul', ibgeCode: 42 },
  { uf: 'SP', name: 'São Paulo', region: 'Sudeste', ibgeCode: 35 },
  { uf: 'SE', name: 'Sergipe', region: 'Nordeste', ibgeCode: 28 },
  { uf: 'TO', name: 'Tocantins', region: 'Norte', ibgeCode: 17 },
];

export const BIOMES: { code: string; name: string; description: string }[] = [
  { code: 'AMAZONIA', name: 'Amazônia', description: 'Maior floresta tropical do mundo, quente e úmida.' },
  { code: 'CAATINGA', name: 'Caatinga', description: 'Bioma exclusivamente brasileiro, semiárido, do Nordeste.' },
  { code: 'CERRADO', name: 'Cerrado', description: 'Savana brasileira, com estação seca bem marcada.' },
  { code: 'MATA_ATLANTICA', name: 'Mata Atlântica', description: 'Florestas da costa e das serras, das mais ameaçadas do país.' },
  { code: 'PAMPA', name: 'Pampa', description: 'Campos do sul do Rio Grande do Sul.' },
  { code: 'PANTANAL', name: 'Pantanal', description: 'Maior planície alagável do planeta.' },
  { code: 'URBANO', name: 'Área urbana / cultivada', description: 'Plantas cultivadas em cidades, jardins e quintais.' },
];

/** Municípios do conteúdo inicial (os demais são criados sob demanda a partir do IBGE). */
export const MUNICIPALITIES: { ibgeCode: number; name: string; stateUf: string }[] = [
  { ibgeCode: 3138203, name: 'Lavras', stateUf: 'MG' },
  { ibgeCode: 3151800, name: 'Poços de Caldas', stateUf: 'MG' },
  { ibgeCode: 3143302, name: 'Montes Claros', stateUf: 'MG' },
  { ibgeCode: 3170206, name: 'Uberlândia', stateUf: 'MG' },
  { ibgeCode: 3170701, name: 'Varginha', stateUf: 'MG' },
  { ibgeCode: 3152501, name: 'Pouso Alegre', stateUf: 'MG' },
  { ibgeCode: 3106200, name: 'Belo Horizonte', stateUf: 'MG' },
  { ibgeCode: 3110301, name: 'Caldas', stateUf: 'MG' },
  { ibgeCode: 1721000, name: 'Palmas', stateUf: 'TO' },
  { ibgeCode: 2611101, name: 'Petrolina', stateUf: 'PE' },
  { ibgeCode: 1501402, name: 'Belém', stateUf: 'PA' },
  { ibgeCode: 3304557, name: 'Rio de Janeiro', stateUf: 'RJ' },
  { ibgeCode: 5208707, name: 'Goiânia', stateUf: 'GO' },
  { ibgeCode: 4314902, name: 'Porto Alegre', stateUf: 'RS' },
  { ibgeCode: 4106902, name: 'Curitiba', stateUf: 'PR' },
];

/** Sites de onde as notícias são puxadas (RSS). Para incluir outro, basta um feed RSS/Atom válido. */
export const NEWS_SOURCES: { id: string; name: string; feedUrl: string; siteUrl: string }[] = [
  { id: 'oeco', name: 'O Eco', feedUrl: 'https://oeco.org.br/feed/', siteUrl: 'https://oeco.org.br' },
  { id: 'climainfo', name: 'ClimaInfo', feedUrl: 'https://climainfo.org.br/feed/', siteUrl: 'https://climainfo.org.br' },
  {
    id: 'agenciabrasil',
    name: 'Agência Brasil',
    feedUrl: 'https://agenciabrasil.ebc.com.br/rss/meio-ambiente/feed.xml',
    siteUrl: 'https://agenciabrasil.ebc.com.br/meio-ambiente',
  },
  { id: 'g1', name: 'G1 Natureza', feedUrl: 'https://g1.globo.com/rss/g1/natureza/', siteUrl: 'https://g1.globo.com/natureza/' },
  { id: 'metsul', name: 'MetSul', feedUrl: 'https://metsul.com/feed/', siteUrl: 'https://metsul.com' },
];
