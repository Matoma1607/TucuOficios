export interface Job {
  id: string;
  title: string;
  category: string;
  zone: string;
  professionalName: string;
  professionalId?: string;
  whatsapp: string;
  imageUrl: string;
  createdAt: number | string;
  estado: 'pendiente' | 'aprobado' | 'rechazado';
}

export interface User {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  role?: string;
}

export type Category = 'Plomería' | 'Cerrajería' | 'Aires' | 'Mudanzas' | 'Electricidad' | 'Pintura' | 'Otros';

export const CATEGORIES: Category[] = ['Plomería', 'Cerrajería', 'Aires', 'Mudanzas', 'Electricidad', 'Pintura', 'Otros'];
