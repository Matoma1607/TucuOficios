import { describe, it, expect } from 'vitest';
import { CATEGORIES_CONFIG, Job } from '../types';
import { categoryEmoji, channelText } from '../lib/channel';

const job = (over: Partial<Job> = {}) => ({
  id: '1', ownerId: 'o', title: 'Ventas de ollas Essen', category: 'Cocina y Hogar', zone: 'Famaillá',
  professionalName: 'Noelia Lazarte', whatsapp: '5493810000000', instagram: null, description: 'Cuotas sin interés',
  imagePath: null, imageUrl: '', thumbUrl: '', cardUrl: '', photoPaths: [], photoUrls: [], estado: 'aprobado',
  verificado: false, createdAt: '2026-11-18T00:00:00Z', ...over,
}) as Job;

describe('texto para el canal', () => {
  it('cada rubro tiene su propio emoji (ninguno queda con el genérico salvo "Otros")', () => {
    for (const c of CATEGORIES_CONFIG) {
      if (c.id === 'Otros') continue;
      expect(categoryEmoji(c.id), c.id).not.toBe('📌');
    }
  });

  it('usa el emoji del rubro y no el de herramientas para algo que no lo es', () => {
    const text = channelText(job(), 'https://tucuoficios.net.ar/p/1/x');
    expect(text.startsWith('🍳 *Ventas de ollas Essen*')).toBe(true);
    expect(text).not.toContain('🛠️');
  });

  it('agrega el link de Instagram solo si lo cargó', () => {
    expect(channelText(job(), 'u')).not.toContain('instagram.com');
    expect(channelText(job({ instagram: 'noelia.essen' }), 'u')).toContain('📸 Instagram: https://www.instagram.com/noelia.essen/');
  });
});
