import { Job, User } from '../types';

const JOBS_KEY = 'tucu_oficios_jobs';
const USER_KEY = 'tucu_oficios_user';

// Initial mock data
const INITIAL_JOBS: Job[] = [
  {
    id: '1',
    title: 'Instalación de Split - Barrio Norte',
    category: 'Aires',
    zone: 'Barrio Norte',
    professionalName: 'Juan Pérez',
    professionalId: 'prof1',
    whatsapp: '3815551234',
    imageUrl: 'https://picsum.photos/seed/ac/800/600',
    createdAt: Date.now() - 86400000,
  },
  {
    id: '2',
    title: 'Arreglo de Cañerías - Yerba Buena',
    category: 'Plomería',
    zone: 'Yerba Buena',
    professionalName: 'Ricardo Gómez',
    professionalId: 'prof2',
    whatsapp: '3815555678',
    imageUrl: 'https://picsum.photos/seed/plumbing/800/600',
    createdAt: Date.now() - 172800000,
  },
  {
    id: '3',
    title: 'Cambio de Cerradura Blindada',
    category: 'Cerrajería',
    zone: 'Centro',
    professionalName: 'Matias Sosa',
    professionalId: 'prof3',
    whatsapp: '3815559012',
    imageUrl: 'https://picsum.photos/seed/lock/800/600',
    createdAt: Date.now() - 259200000,
  }
];

export const mockDb = {
  getJobs: (): Job[] => {
    const stored = localStorage.getItem(JOBS_KEY);
    if (!stored) {
      localStorage.setItem(JOBS_KEY, JSON.stringify(INITIAL_JOBS));
      return INITIAL_JOBS;
    }
    return JSON.parse(stored);
  },

  addJob: (job: Omit<Job, 'id' | 'createdAt'>): Job => {
    const jobs = mockDb.getJobs();
    const newJob: Job = {
      ...job,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: Date.now(),
    };
    localStorage.setItem(JOBS_KEY, JSON.stringify([newJob, ...jobs]));
    return newJob;
  },

  getCurrentUser: (): User | null => {
    const stored = localStorage.getItem(USER_KEY);
    return stored ? JSON.parse(stored) : null;
  },

  login: (): User => {
    const user: User = {
      uid: 'mock-user-id',
      displayName: 'Profesional Tucumano',
      email: 'profesional@example.com',
      photoURL: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
    };
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    return user;
  },

  logout: () => {
    localStorage.removeItem(USER_KEY);
  }
};
