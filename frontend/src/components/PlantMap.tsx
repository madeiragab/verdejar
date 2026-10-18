import { useEffect } from 'react';
import { CircleMarker, MapContainer, Popup, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import { Link } from 'react-router-dom';
import type { LatLngBoundsExpression, LatLngExpression } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Plant } from '../api/types';
import type { Coords } from '../lib/hooks';

const BRAZIL: LatLngBoundsExpression = [
  [-33.8, -73.9],
  [5.3, -34.8],
];

/**
 * Camada do OpenStreetMap. A política de uso dos servidores do OSM exige o cabeçalho Referer
 * identificando o site; sem ele os tiles voltam como "403 Access blocked".
 */
function OsmTiles() {
  return (
    <TileLayer
      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
      referrerPolicy="strict-origin-when-cross-origin"
      maxZoom={19}
    />
  );
}

function FitBounds({ points, me }: { points: [number, number][]; me?: Coords | null }) {
  const map = useMap();
  useEffect(() => {
    const all = [...points, ...(me ? [[me.lat, me.lng] as [number, number]] : [])];
    if (all.length === 0) map.fitBounds(BRAZIL);
    else if (all.length === 1) map.setView(all[0], 11);
    else map.fitBounds(all, { padding: [32, 32], maxZoom: 12 });
  }, [map, JSON.stringify(points), me?.lat, me?.lng]); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}

interface Props {
  plants: Plant[];
  me?: Coords | null;
  height?: number;
}

export function PlantMap({ plants, me, height = 380 }: Props) {
  const points = plants
    .filter((p) => p.latitude != null && p.longitude != null)
    .map((p) => ({ p, pos: [p.latitude!, p.longitude!] as [number, number] }));

  return (
    <div className="map" style={{ height }}>
      <MapContainer bounds={BRAZIL} scrollWheelZoom={false} style={{ height: '100%' }}>
        <OsmTiles />
        <FitBounds points={points.map((x) => x.pos)} me={me} />
        {me && (
          <CircleMarker center={[me.lat, me.lng]} radius={9} pathOptions={{ color: '#fff', weight: 3, fillColor: '#2563eb', fillOpacity: 1 }}>
            <Popup>Você está aqui</Popup>
          </CircleMarker>
        )}
        {points.map(({ p, pos }) => (
          <CircleMarker
            key={p.id}
            center={pos}
            radius={8}
            pathOptions={{ color: '#fff', weight: 2, fillColor: '#2f7d4f', fillOpacity: 0.95 }}
          >
            <Popup>
              <Link to={`/plantas/${p.id}`} className="map-popup">
                <strong>{p.popularNames[0]}</strong>
                <em>{p.scientificName}</em>
                <span>
                  {p.municipality} · {p.state}
                </span>
              </Link>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  );
}

function ClickHandler({ onPick }: { onPick: (c: Coords) => void }) {
  useMapEvents({ click: (e) => onPick({ lat: e.latlng.lat, lng: e.latlng.lng }) });
  return null;
}

function Recenter({ center }: { center: LatLngExpression | null }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.setView(center, Math.max(map.getZoom(), 12));
  }, [map, center]);
  return null;
}

/** Mapa para escolher o ponto exato onde a planta está (clique para marcar). */
export function LocationPicker({ value, onChange }: { value: Coords | null; onChange: (c: Coords) => void }) {
  const center = value ? ([value.lat, value.lng] as [number, number]) : null;
  return (
    <div className="map" style={{ height: 280 }}>
      <MapContainer bounds={BRAZIL} style={{ height: '100%' }}>
        <OsmTiles />
        <ClickHandler onPick={onChange} />
        <Recenter center={center} />
        {center && (
          <CircleMarker center={center} radius={10} pathOptions={{ color: '#fff', weight: 3, fillColor: '#2f7d4f', fillOpacity: 1 }} />
        )}
      </MapContainer>
    </div>
  );
}
