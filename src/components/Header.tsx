import { User as UserIcon, LogOut, PlusCircle, ExternalLink, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { User } from '../types';

interface HeaderProps {
  isAdmin: boolean;
  onLogin: () => void;
  onLogout: () => void;
  onPostClick: () => void;
}

export default function Header({ isAdmin, onLogin, onLogout, onPostClick }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 w-full bg-white/60 backdrop-blur-xl border-b border-white/20">
      <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center hover:opacity-80 transition-opacity">
          <span className="text-xl sm:text-2xl font-extrabold tracking-tighter text-brand-dark">
            Tucu<span className="text-brand-primary">Oficios</span>
          </span>
        </Link>

        {/* Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={onPostClick}
            className="flex items-center gap-2 px-4 sm:px-6 py-2.5 bg-brand-primary text-white rounded-full font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 active:scale-95 text-xs sm:text-sm"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Publicar Trabajo</span>
          </button>

          {isAdmin && (
            <div className="flex items-center gap-1 sm:gap-2 pl-1 sm:pl-2 border-l border-gray-200">
              <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center min-w-[32px] border border-amber-200" title="Admin">
                <ShieldCheck className="w-4 h-4 text-amber-600" />
              </div>
              <button
                onClick={onLogout}
                className="p-1.5 sm:p-2 text-gray-400 hover:text-red-500 transition-colors"
                title="Cerrar Sesión Admin"
              >
                <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
