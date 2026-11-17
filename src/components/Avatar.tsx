// Avatar con iniciales en un tono neutro (antes era un color distinto por nombre).

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  const first = parts[0][0] ?? '';
  const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return (first + last).toUpperCase();
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
      className={`${dims} bg-gray-100 text-gray-700 rounded-full flex items-center justify-center font-semibold flex-none select-none`}
    >
      {initials(name)}
    </div>
  );
}
