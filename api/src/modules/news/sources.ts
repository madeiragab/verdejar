/**
 * Sites de onde as notícias são puxadas (RSS).
 * Para adicionar outro site basta incluir aqui um feed RSS/Atom válido.
 */
export const NEWS_SOURCES = [
  { id: 'oeco', name: 'O Eco', url: 'https://oeco.org.br/feed/', site: 'https://oeco.org.br' },
  { id: 'climainfo', name: 'ClimaInfo', url: 'https://climainfo.org.br/feed/', site: 'https://climainfo.org.br' },
  {
    id: 'agenciabrasil',
    name: 'Agência Brasil',
    url: 'https://agenciabrasil.ebc.com.br/rss/meio-ambiente/feed.xml',
    site: 'https://agenciabrasil.ebc.com.br/meio-ambiente',
  },
  { id: 'g1', name: 'G1 Natureza', url: 'https://g1.globo.com/rss/g1/natureza/', site: 'https://g1.globo.com/natureza/' },
  { id: 'metsul', name: 'MetSul', url: 'https://metsul.com/feed/', site: 'https://metsul.com' },
] as const;
