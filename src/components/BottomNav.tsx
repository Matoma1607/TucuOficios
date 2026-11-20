import { Home, Search, Plus, Heart, UserRound } from 'lucide-react';

export type NavTab = 'home' | 'saved' | 'account';

interface Props {
  active: NavTab;
  savedCount: number;
  hidden?: boolean;
  avatarUrl?: string;
  onHome: () => void;
  onSearch: () => void;
  onPublish: () => void;
  onSaved: () => void;
  onAccount: () => void;
}

/** Menú fijo abajo, solo en el celular. */
export default function BottomNav({ active, savedCount, hidden, avatarUrl, onHome, onSearch, onPublish, onSaved, onAccount }: Props) {
  const item = (isActive: boolean) =>
    `flex-1 flex flex-col items-center justify-center gap-0.5 h-full text-[11px] font-semibold transition-colors ${
      isActive ? 'text-gray-900' : 'text-gray-500 active:text-gray-900'
    }`;
  return (
    <nav
      aria-label="Menú principal"
      aria-hidden={hidden}
      inert={hidden || undefined}
      className={`sm:hidden fixed inset-x-0 bottom-0 z-[90] bg-white border-t border-gray-200 pb-[env(safe-area-inset-bottom)] transition-transform duration-300 ${
        hidden ? 'translate-y-full' : 'translate-y-0'
      }`}
    >
      <div className="h-16 flex items-stretch px-1">
        <button type="button" onClick={onHome} className={item(active === 'home')} aria-current={active === 'home' ? 'page' : undefined}>
          <Home className="w-[22px] h-[22px]" strokeWidth={active === 'home' ? 2.4 : 2} aria-hidden="true" />
          Inicio
        </button>
        <button type="button" onClick={onSearch} className={item(false)}>
          <Search className="w-[22px] h-[22px]" aria-hidden="true" />
          Buscar
        </button>
        <div className="flex-1 flex items-center justify-center">
          <button
            type="button"
            onClick={onPublish}
            data-tour="publicar"
            aria-label="Publicar oficio"
            className="-mt-5 flex flex-col items-center gap-1 text-[11px] font-semibold text-gray-900"
          >
            <span className="w-12 h-12 grid place-items-center rounded-full bg-brand-strong active:bg-brand-strong-hover text-white shadow-[0_6px_16px_-4px_rgba(255,122,26,.6)] ring-4 ring-white">
              <Plus className="w-6 h-6" strokeWidth={2.6} aria-hidden="true" />
            </span>
            Publicar
          </button>
        </div>
        <button type="button" onClick={onSaved} className={item(active === 'saved')} aria-current={active === 'saved' ? 'page' : undefined}>
          <span className="relative">
            <Heart className={`w-[22px] h-[22px] ${active === 'saved' ? 'fill-gray-900' : ''}`} aria-hidden="true" />
            {savedCount > 0 && (
              <span className="absolute -top-1.5 -right-2.5 min-w-[18px] h-[18px] px-1 grid place-items-center rounded-full bg-brand-strong text-[10px] font-bold text-white">
                {savedCount > 9 ? '9+' : savedCount}
              </span>
            )}
          </span>
          Guardados
        </button>
        <button type="button" onClick={onAccount} className={item(active === 'account')} aria-current={active === 'account' ? 'page' : undefined}>
          {avatarUrl ? (
            <img src={avatarUrl} alt="" referrerPolicy="no-referrer" className={`w-[24px] h-[24px] rounded-full ${active === 'account' ? 'ring-2 ring-gray-900' : ''}`} />
          ) : (
            <UserRound className="w-[22px] h-[22px]" aria-hidden="true" />
          )}
          Cuenta
        </button>
      </div>
    </nav>
  );
}
