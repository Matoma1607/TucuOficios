import { useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  // Mientras el navegador va a Google (puede tardar 1-2 s con datos móviles)
  const [signingIn, setSigningIn] = useState(false);

  // Si vuelve con "atrás" desde Google, la página puede quedar congelada con el aviso puesto
  useEffect(() => {
    const onShow = () => setSigningIn(false);
    window.addEventListener('pageshow', onShow);
    return () => window.removeEventListener('pageshow', onShow);
  }, []);

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
    if (signingIn) return; // evita doble toque
    setSigningIn(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin + window.location.pathname,
        // Sin esto Google entra directo con la cuenta ya abierta en el navegador
        // y no deja elegir otra (por ejemplo, después de cerrar sesión).
        queryParams: { prompt: 'select_account' },
      },
    });
    if (error) setSigningIn(false);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return { user, isAdmin, loading, signingIn, signInWithGoogle, signOut };
}
