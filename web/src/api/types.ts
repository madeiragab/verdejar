export type Role = 'USER' | 'MODERATOR' | 'ADMIN';
export type Status = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  createdAt: string;
}

export interface Plant {
  id: string;
  scientificName: string;
  popularNames: string[];
  family: string | null;
  description: string | null;
  biome: string;
  climate: string | null;
  light: string;
  water: string;
  medicinalUse: string | null;
  toxicityLevel: string;
  toxicityNotes: string | null;
  curiosities: string | null;
  photoUrl: string | null;
  photoCredit: string | null;
  state: string;
  municipality: string;
  latitude: number | null;
  longitude: number | null;
  source: string;
  sourceUrl: string | null;
  contributor: { name: string } | null;
  createdAt: string;
  updatedAt: string;
  distanceKm?: number;
  // Só para o autor ou mediadores
  status?: Status;
  reviewNote?: string | null;
  reviewedAt?: string | null;
  showContributor?: boolean;
  isOwner?: boolean;
  submittedBy?: { id: string; name: string } | null;
  reviewedBy?: { name: string } | null;
}

export interface PlantDetail extends Plant {
  related: Plant[];
}

export interface Page<T> {
  items: T[];
  page: number;
  limit: number;
  total: number;
}

export interface NewsItem {
  id: string;
  title: string;
  link: string;
  summary: string | null;
  imageUrl: string | null;
  sourceName: string;
  publishedAt: string;
}

export interface Session {
  user: User;
  accessToken: string;
}

export interface Stats {
  total: number;
  contributors: number;
  byState: Record<string, number>;
  byBiome: Record<string, number>;
}
