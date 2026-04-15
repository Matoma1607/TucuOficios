import { User as UserIcon, LogOut, PlusCircle, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { User } from '../types';

interface HeaderProps {
  user: User | null;
  onLogin: () => void;
  onLogout: () => void;
  onPostClick: () => void;
}

export default function Header({ user, onLogin, onLogout, onPostClick }: HeaderProps) {
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
          {!user && (
            <button
              onClick={onPostClick}
              className="p-2 text-gray-400 hover:text-brand-primary transition-colors"
              title="Ayuda para iniciar sesión"
            >
              <ExternalLink className="w-5 h-5" />
            </button>
          )}
          {user ? (
            <>
              <button
                onClick={onPostClick}
                className="flex items-center gap-2 px-3 sm:px-4 py-2.5 bg-gray-900 text-white rounded-full font-medium hover:bg-gray-800 transition-all active:scale-95 text-sm"
              >
                <PlusCircle className="w-4 h-4" />
                <span className="hidden xs:inline">Subir Trabajo</span>
              </button>
              
              <div className="flex items-center gap-1 sm:gap-2 pl-1 sm:pl-2 border-l border-gray-200">
                {user.photoURL ? (
                  <div className="relative">
                    <img src={user.photoURL} alt={user.displayName || ''} className="w-8 h-8 rounded-full border border-gray-200 min-w-[32px]" />
                    {(user.role === 'admin' || user.email === 'matias39974593@gmail.com') && (
                      <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 border-2 border-white rounded-full" title="Admin" />
                    )}
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center min-w-[32px]">
                    <UserIcon className="w-4 h-4 text-gray-400" />
                  </div>
                )}
                <button
                  onClick={onLogout}
                  className="p-1.5 sm:p-2 text-gray-400 hover:text-red-500 transition-colors"
                  title="Cerrar Sesión"
                >
                  <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </div>
            </>
          ) : (
            <button
              onClick={onLogin}
              className="px-4 sm:px-6 py-2.5 bg-brand-primary text-white rounded-full font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 active:scale-95 text-xs sm:text-sm flex items-center gap-2"
            >
              Publicar Trabajo
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
