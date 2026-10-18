export const formatDistance = (km?: number) =>
  km === undefined ? '' : km < 1 ? `${Math.round(km * 1000)} m` : `${km.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} km`;

export const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });

export function timeAgo(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 3600) return `há ${Math.max(1, Math.round(diff / 60))} min`;
  if (diff < 86400) return `há ${Math.round(diff / 3600)} h`;
  if (diff < 86400 * 7) return `há ${Math.round(diff / 86400)} dias`;
  return formatDate(iso);
}
