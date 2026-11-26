import { describe, expect, it } from 'vitest';
import { buscarEnSitio, rubrosEn, zonaEn } from '../lib/buscarChat';
import { Job } from '../types';

const job = (p: Partial<Job>): Job => ({
  id: Math.random().toString(), ownerId: 'x', title: 'Trabajo', category: 'Plomería', extraCategories: [], zone: 'San Miguel de Tucumán',
  professionalName: 'Ana', negocio: null, alias: null, whatsapp: '549381' + Math.floor(Math.random() * 1e7), instagram: null, imageUrl: '', thumbUrl: '',
  cardUrl: '', imagePath: null, photoUrls: [], photoPaths: [], createdAt: '', estado: 'aprobado', verificado: false, description: '', ...p,
});

describe('buscador del chat', () => {
  it('reconoce oficios por cómo los dice la gente', () => {
    expect(rubrosEn('necesito un plomero urgente')).toContain('Plomería');
    expect(rubrosEn('alguien que haga tortas?')).toContain('Repostería');
    expect(rubrosEn('busco electricista')).toContain('Electricidad');
    expect(rubrosEn('me hago las uñas')).toContain('Uñas');
  });

  it('no confunde palabras comunes con rubros', () => {
    expect(rubrosEn('busco un profesional')).not.toContain('Apoyo Escolar');
    expect(rubrosEn('busco una peluquera')).not.toContain('Uñas');
    expect(rubrosEn('busco una peluquera')).toContain('Peluquería');
  });

  it('reconoce zonas, con o sin acentos', () => {
    expect(zonaEn('plomero en yerba buena')).toBe('Yerba Buena');
    expect(zonaEn('en tafi del valle')).toBe('Tafí del Valle');
    expect(zonaEn('electricista en santa lucia')).toBe('Santa Lucía');
    expect(rubrosEn('busco mates y bombillas')).toContain('Mates y Accesorios');
    for (const [q, r] of [['plomero', 'Plomería'], ['electricista', 'Electricidad'], ['gasista', 'Gasista Matriculado'], ['albañil', 'Albañilería'], ['mecanico', 'Mecánica']] as const) expect(rubrosEn(q), q).toContain(r);
    expect(rubrosEn('plomero en yerba buena')).not.toContain('Mates y Accesorios');
    expect(rubrosEn('arreglo de termotanque')).not.toContain('Mates y Accesorios');
    expect(zonaEn('algo en el cadillal')).toBe('El Cadillal');
    expect(zonaEn('peluqueria en alberdi')).toBe('Juan Bautista Alberdi');
    expect(zonaEn('gasista en san pedro de colalao')).toBe('San Pedro de Colalao');
    expect(zonaEn('algo en tafi')).toBe('Tafí Viejo');
    expect(zonaEn('en el centro')).toBe('San Miguel de Tucumán');
  });

  it('filtra por rubro y zona, y ofrece otras zonas si no hay', () => {
    const jobs = [
      job({ category: 'Plomería', zone: 'Yerba Buena' }),
      job({ category: 'Plomería', zone: 'Famaillá' }),
      job({ category: 'Mecánica', zone: 'Yerba Buena', extraCategories: ['Plomería'] }),
      job({ category: 'Plomería', zone: 'Yerba Buena', estado: 'pendiente' }),
    ];
    const r = buscarEnSitio('plomero en yerba buena', jobs)!;
    expect(r.jobs).toHaveLength(2);
    const r2 = buscarEnSitio('plomero en lules', jobs)!;
    expect(r2.jobs).toHaveLength(0);
    expect(r2.otrasZonas).toHaveLength(3);
  });

  it('devuelve null si no hay nada para buscar', () => {
    expect(buscarEnSitio('hola', [job({})])).toBeNull();
  });
});
