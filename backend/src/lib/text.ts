/** Remove acentos e caixa para comparação e busca ("Ipê" → "ipe"). */
export const normalize = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();

/** "Ipê-amarelo, Ipê-do-cerrado; ipê" → ["Ipê-amarelo", "Ipê-do-cerrado"] (sem repetidos). */
export function splitNames(input: string): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of input.split(/[,;\n]/)) {
    const name = raw.trim().replace(/\s+/g, ' ');
    const key = normalize(name);
    if (!name || seen.has(key)) continue;
    seen.add(key);
    out.push(name);
  }
  return out;
}

/** "handroanthus   Albus" → "Handroanthus albus" (gênero com maiúscula, epíteto minúsculo). */
export function formatScientificName(input: string): string {
  const [genus = '', ...rest] = input.trim().split(/\s+/);
  return [genus.charAt(0).toUpperCase() + genus.slice(1).toLowerCase(), ...rest.map((w) => w.toLowerCase())].join(' ');
}
