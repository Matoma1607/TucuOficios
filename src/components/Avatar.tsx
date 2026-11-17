// Avatar con iniciales y un color estable por nombre (el mismo nombre
// siempre da el mismo color).
const PALETTE = [
  'bg-orange-100 text-orange-800',
  'bg-amber-100 text-amber-800',
  'bg-emerald-100 text-emerald-800',
  'bg-sky-100 text-sky-800',
  'bg-violet-100 text-violet-800',
  'bg-rose-100 text-rose-800',
  'bg-teal-100 text-teal-800',
  'bg-indigo-100 text-indigo-800',
];

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  const first = parts[0][0] ?? '';
  const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return (first + last).toUpperCase();
}

function colorFor(name: string): string {
  let hash = 0;
  for (const ch of name) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return PALETTE[hash % PALETTE.length];
}

interface AvatarProps {
  name: string;
  size?: 'md' | 'lg';
}

export default function Avatar({ name, size = 'md' }: AvatarProps) {
  const dims = size === 'lg' ? 'w-14 h-14 text-lg' : 'w-11 h-11 text-sm';
  return (
    <div
      aria-hidden="true"
      className={`${dims} ${colorFor(name)} rounded-full flex items-center justify-center font-semibold flex-none select-none`}
    >
      {initials(name)}
    </div>
  );
}
