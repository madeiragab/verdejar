import { Link } from 'react-router-dom';
import { MapPin, TriangleAlert } from 'lucide-react';
import type { Plant } from '../api/types';
import { BIOMES } from '../lib/catalog';
import { formatDistance } from '../lib/format';
import { PlantPhoto } from './PlantPhoto';
import { StatusBadge } from './StatusBadge';

export function PlantCard({ plant, showStatus = false }: { plant: Plant; showStatus?: boolean }) {
  const toxic = plant.toxicityLevel === 'ALTA' || plant.toxicityLevel === 'MODERADA';
  return (
    <Link to={`/plantas/${plant.id}`} className="card plant-card">
      <div className="plant-card-media">
        <PlantPhoto src={plant.photoUrl} alt={plant.popularNames[0]} biome={plant.biome} />
        <span className="chip chip-on-photo">{BIOMES[plant.biome]}</span>
        {toxic && (
          <span className="chip chip-danger chip-on-photo right" title="Planta tóxica">
            <TriangleAlert size={13} /> Tóxica
          </span>
        )}
      </div>
      <div className="plant-card-body">
        {showStatus && plant.status && <StatusBadge status={plant.status} />}
        <h3>{plant.popularNames[0]}</h3>
        <p className="sci">{plant.scientificName}</p>
        <p className="plant-card-place">
          <MapPin size={14} />
          {plant.municipality} · {plant.state}
          {plant.distanceKm !== undefined && <span className="distance">{formatDistance(plant.distanceKm)}</span>}
        </p>
      </div>
    </Link>
  );
}

export function PlantGrid({ plants, showStatus }: { plants: Plant[]; showStatus?: boolean }) {
  return (
    <div className="grid">
      {plants.map((p) => (
        <PlantCard key={p.id} plant={p} showStatus={showStatus} />
      ))}
    </div>
  );
}

export function PlantGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="card plant-card skeleton">
          <div className="plant-card-media" />
          <div className="plant-card-body">
            <div className="sk-line w60" />
            <div className="sk-line w40" />
          </div>
        </div>
      ))}
    </div>
  );
}
