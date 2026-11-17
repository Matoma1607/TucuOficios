import { describe, expect, it } from 'vitest';
import { prettyTitle } from '../lib/text';
import { slugify } from '../lib/slug';

describe('prettyTitle', () => {
  it('pasa a oración los títulos en mayúsculas', () => {
    expect(prettyTitle('TRABAJOS EN GENERAL')).toBe('Trabajos en general');
    expect(prettyTitle('APRENDÉ A MANEJAR AUTO')).toBe('Aprendé a manejar auto');
  });

  it('no toca los títulos normales ni las siglas cortas', () => {
    expect(prettyTitle('Venta de Iphone al mejor precio')).toBe('Venta de Iphone al mejor precio');
    expect(prettyTitle('SPOT CYCLING')).toBe('Spot cycling');
    expect(prettyTitle('DJ')).toBe('DJ');
  });
});

describe('slugify', () => {
  it('quita acentos, símbolos y espacios', () => {
    expect(slugify('Juan Pérez - Plomero 24 h')).toBe('juan-perez-plomero-24-h');
    expect(slugify('  ¡Niñera!  ')).toBe('ninera');
  });

  it('corta en 60 caracteres', () => {
    expect(slugify('a'.repeat(100))).toHaveLength(60);
  });
});

import { isGenericTitle, timeAgo } from '../lib/text';

describe('isGenericTitle', () => {
  it('detecta títulos que no dicen nada', () => {
    expect(isGenericTitle('Venta')).toBe(true);
    expect(isGenericTitle('TRABAJOS EN GENERAL')).toBe(true);
    expect(isGenericTitle('  Servicios. ')).toBe(true);
  });
  it('acepta títulos concretos', () => {
    expect(isGenericTitle('Venta de Iphone al mejor precio')).toBe(false);
    expect(isGenericTitle('Plomero matriculado')).toBe(false);
  });
});

describe('timeAgo', () => {
  const now = new Date('2026-11-17T12:00:00Z');
  it.each([
    ['2026-11-17T08:00:00Z', 'hoy'],
    ['2026-11-16T08:00:00Z', 'ayer'],
    ['2026-11-07T12:00:00Z', 'hace 10 días'],
    ['2026-10-10T12:00:00Z', 'hace 1 mes'],
    ['2026-04-17T12:00:00Z', 'hace 7 meses'],
    ['2025-10-01T12:00:00Z', 'hace 1 año'],
  ])('%s → %s', (iso, expected) => {
    expect(timeAgo(iso, now)).toBe(expected);
  });
});
