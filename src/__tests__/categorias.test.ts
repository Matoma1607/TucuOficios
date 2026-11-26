import { describe, expect, it } from 'vitest';
import { CATEGORIES_CONFIG, SECTIONS, ZONES } from '../types';
import { Icons } from '../lib/icons';

describe('categorías', () => {
  it('no hay ids repetidos (el id se guarda en la base)', () => {
    const ids = CATEGORIES_CONFIG.map(c => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('cada categoría pertenece a una sección existente', () => {
    const sections = new Set(SECTIONS.map(s => s.id));
    for (const c of CATEGORIES_CONFIG) expect(sections.has(c.section), c.id).toBe(true);
  });

  it('todos los íconos usados están importados', () => {
    const used = [...CATEGORIES_CONFIG.map(c => c.iconName), ...SECTIONS.map(s => s.iconName)];
    for (const name of used) expect(Icons[name], name).toBeDefined();
  });

  it('los ids entran en el límite de la base (2 a 40 caracteres)', () => {
    for (const c of CATEGORIES_CONFIG) expect(c.id.length, c.id).toBeLessThanOrEqual(40);
  });

  it('las zonas no se repiten', () => {
    expect(new Set(ZONES).size).toBe(ZONES.length);
  });
});

import { iconoRubro, iconoSeccion } from '../lib/iconosRubro';
import { Question } from '@phosphor-icons/react';
describe('íconos de rubros', () => {
  it('cada rubro y cada sección tiene su ícono', () => {
    for (const c of CATEGORIES_CONFIG) expect(iconoRubro(c.id), c.id).not.toBe(Question);
    for (const s of SECTIONS) expect(iconoSeccion(s.id), s.id).toBeDefined();
  });
});
