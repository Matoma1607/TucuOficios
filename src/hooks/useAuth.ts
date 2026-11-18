import { useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  // Solo sirve para mostrar u ocultar botones. Quién puede editar o borrar
  // de verdad lo decide la base de datos (RLS), no este valor.
  useEffect(() => {
    if (!user) {
      setIsAdmin(false);
      return;
    }
    supabase.rpc('is_admin').then(({ data }) => setIsAdmin(Boolean(data)));
  }, [user]);

  const signInWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin + window.location.pathname,
        // Sin esto Google entra directo con la cuenta ya abierta en el navegador
        // y no deja elegir otra (por ejemplo, después de cerrar sesión).
        queryParams: { prompt: 'select_account' },
      },
    });
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return { user, isAdmin, loading, signInWithGoogle, signOut };
}
