import { LogOut, PlusCircle, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

interface HeaderProps {
  isAdmin: boolean;
  onLogin: () => void;
  onLogout: () => void;
  onPostClick: () => void;
}

export default function Header({ isAdmin, onLogout, onPostClick }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 w-full bg-white border-b border-gray-100">
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-brand-primary rounded-lg flex items-center justify-center">
            <span className="text-white font-black text-xl">T</span>
          </div>
          <span className="text-xl font-black tracking-tighter text-brand-dark">
            Tucu<span className="text-brand-primary">Oficios</span>
          </span>
        </Link>

        {/* Actions */}
        <div className="flex items-center gap-3">
          {isAdmin && (
            <button
              onClick={onLogout}
              className="p-2 text-gray-400 hover:text-brand-primary transition-colors"
            >
              <LogOut className="w-5 h-5" />
            </button>
          )}
          <button
            onClick={onPostClick}
            className="flex items-center gap-2 px-5 py-2 bg-brand-primary text-white rounded-full font-black text-sm shadow-lg shadow-orange-100 active:scale-95 transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            Publicar
          </button>
        </div>
      </div>
    </header>
  );
}
