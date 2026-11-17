import { useEffect, useRef } from 'react';
import { Camera, X, Plus, ArrowLeft } from 'lucide-react';
import { MAX_PHOTOS } from '../services/jobs';

/** Una foto ya subida (path) o nueva (file), con su URL para mostrar. */
export interface PhotoItem {
  key: string;
  url: string;
  path?: string;
  file?: File;
}

interface PhotoPickerProps {
  items: PhotoItem[];
  onChange: (items: PhotoItem[]) => void;
  error?: string;
  onError?: (message: string) => void;
}

export default function PhotoPicker({ items, onChange, error, onError }: PhotoPickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  // Libera las vistas previas de archivos nuevos al desmontar
  const itemsRef = useRef(items);
  itemsRef.current = items;
  useEffect(() => () => {
    itemsRef.current.forEach(i => i.file && URL.revokeObjectURL(i.url));
  }, []);

  const addFiles = (files: FileList | null) => {
    if (!files) return;
    const room = MAX_PHOTOS - items.length;
    const valid: PhotoItem[] = [];
    for (const file of Array.from(files).slice(0, room)) {
      if (!file.type.startsWith('image/')) {
        onError?.('Solo se pueden subir imágenes.');
        continue;
      }
      if (file.size > 15 * 1024 * 1024) {
        onError?.('Alguna foto es demasiado pesada (máx 15MB).');
        continue;
      }
      valid.push({ key: crypto.randomUUID(), url: URL.createObjectURL(file), file });
    }
    if (files.length > room) onError?.(`Podés subir hasta ${MAX_PHOTOS} fotos.`);
    if (valid.length) onChange([...items, ...valid]);
  };

  const remove = (key: string) => {
    const item = items.find(i => i.key === key);
    if (item?.file) URL.revokeObjectURL(item.url);
    onChange(items.filter(i => i.key !== key));
  };

  const makeCover = (key: string) => {
    const item = items.find(i => i.key === key);
    if (!item) return;
    onChange([item, ...items.filter(i => i.key !== key)]);
  };

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => { addFiles(e.target.files); e.target.value = ''; }}
      />

      {items.length === 0 ? (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className={`w-full h-48 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-2 text-gray-500 hover:border-gray-400 transition-colors ${
            error ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-gray-50'
          }`}
        >
          <Camera className="w-8 h-8" aria-hidden="true" />
          <span className="text-sm font-medium">Subí fotos de tu trabajo</span>
          <span className="text-xs text-gray-400">Hasta {MAX_PHOTOS}. La primera es la portada.</span>
        </button>
      ) : (
        <div className="grid grid-cols-4 gap-2">
          {items.map((item, i) => (
            <div key={item.key} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 group">
              <img src={item.url} alt={`Foto ${i + 1}`} className="w-full h-full object-cover" />
              {i === 0 ? (
                <span className="absolute bottom-1 left-1 text-[10px] font-medium px-1.5 py-0.5 rounded bg-brand-dark/80 text-white">
                  Portada
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => makeCover(item.key)}
                  aria-label="Usar como portada"
                  title="Usar como portada"
                  className="absolute bottom-1 left-1 p-1 rounded bg-white/90 text-gray-700 hover:bg-white"
                >
                  <ArrowLeft className="w-3 h-3" />
                </button>
              )}
              <button
                type="button"
                onClick={() => remove(item.key)}
                aria-label="Quitar foto"
                className="absolute top-1 right-1 p-1 rounded-full bg-white/90 text-gray-700 hover:bg-white hover:text-red-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
          {items.length < MAX_PHOTOS && (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              aria-label="Agregar foto"
              className="aspect-square rounded-lg border-2 border-dashed border-gray-300 text-gray-400 hover:border-gray-400 hover:text-gray-600 flex items-center justify-center"
            >
              <Plus className="w-6 h-6" />
            </button>
          )}
        </div>
      )}
      {error && <p className="mt-1.5 text-xs font-medium text-red-600">{error}</p>}
    </div>
  );
}
