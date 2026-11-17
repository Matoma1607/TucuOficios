import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, ImageOff } from 'lucide-react';

interface GalleryProps {
  urls: string[];
  alt: string;
  className?: string;
}

/** Foto principal + miniaturas. Las fotos se ven completas (sin recortar). */
export default function Gallery({ urls, alt, className = '' }: GalleryProps) {
  const [index, setIndex] = useState(0);

  useEffect(() => setIndex(0), [urls]);

  if (urls.length === 0) {
    return (
      <div className={`bg-gray-100 flex items-center justify-center ${className}`}>
        <ImageOff className="w-10 h-10 text-gray-300" aria-label="Sin foto" />
      </div>
    );
  }

  const go = (delta: number) => setIndex(i => (i + delta + urls.length) % urls.length);

  return (
    <div className={`flex flex-col bg-gray-100 ${className}`}>
      <div className="relative flex-1 min-h-0 flex items-center justify-center overflow-hidden">
        <img
          src={urls[index]}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover scale-125 blur-3xl opacity-50"
        />
        <img
          src={urls[index]}
          alt={`${alt} (foto ${index + 1} de ${urls.length})`}
          className="relative w-full h-full object-contain"
        />
        {urls.length > 1 && (
          <>
            <button
              onClick={() => go(-1)}
              aria-label="Foto anterior"
              className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/90 text-gray-700 hover:bg-white shadow-sm"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => go(1)}
              aria-label="Foto siguiente"
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/90 text-gray-700 hover:bg-white shadow-sm"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}
      </div>
      {urls.length > 1 && (
        <div className="flex gap-2 p-2 justify-center bg-white/60">
          {urls.map((url, i) => (
            <button
              key={url}
              onClick={() => setIndex(i)}
              aria-label={`Ver foto ${i + 1}`}
              aria-current={i === index}
              className={`w-14 h-14 rounded-md overflow-hidden border-2 transition-colors ${
                i === index ? 'border-gray-900' : 'border-transparent opacity-70 hover:opacity-100'
              }`}
            >
              <img src={url} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
