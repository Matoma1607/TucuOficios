import React from 'react';
import { Heart } from 'lucide-react';
import { useFavorites } from '../hooks/useFavorites';
import { useToast } from './Toast';

interface Props {
  jobId: string;
  name: string;
  className?: string;
}

/** Corazón para guardar un profesional y encontrarlo después en "Guardados". */
export default function SaveButton({ jobId, name, className = '' }: Props) {
  const { isSaved, toggle } = useFavorites();
  const toast = useToast();
  const saved = isSaved(jobId);
  const onClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const now = toggle(jobId);
    toast(now ? 'Guardado en tus favoritos' : 'Lo sacaste de guardados');
  };
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={saved}
      aria-label={saved ? `Quitar a ${name} de guardados` : `Guardar a ${name}`}
      className={`grid place-items-center rounded-full transition-colors ${className}`}
    >
      <Heart
        className={`w-[18px] h-[18px] transition-transform ${saved ? 'fill-brand-strong text-brand-strong scale-110' : 'text-gray-400'}`}
        aria-hidden="true"
      />
    </button>
  );
}
