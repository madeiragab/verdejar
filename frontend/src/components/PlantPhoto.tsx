import { useState } from 'react';
import { Leaf } from 'lucide-react';
import { BIOME_COLOR } from '../lib/catalog';
import { mediaUrl } from '../lib/image';

interface Props {
  src: string | null;
  alt: string;
  biome: string;
  className?: string;
}

/** Foto da planta, com um placeholder bonito quando não houver imagem (ou ela falhar). */
export function PlantPhoto({ src, alt, biome, className = '' }: Props) {
  const [failed, setFailed] = useState(false);
  const color = BIOME_COLOR[biome] ?? '#3f8f6b';

  if (!src || failed) {
    return (
      <div
        className={`photo photo-placeholder ${className}`}
        style={{ background: `linear-gradient(135deg, ${color}, ${color}aa 60%, #e9f2e4)` }}
        role="img"
        aria-label={alt}
      >
        <Leaf size={48} strokeWidth={1.4} />
      </div>
    );
  }
  return <img className={`photo ${className}`} src={mediaUrl(src)!} alt={alt} loading="lazy" onError={() => setFailed(true)} />;
}
