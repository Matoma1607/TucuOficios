import { describe, it, expect } from 'vitest';
import { rubrosDe } from '../types';

describe('rubrosDe', () => {
  it('pone el rubro principal primero', () => {
    expect(rubrosDe({ category: 'Plomería', extraCategories: ['Aires', 'Mecánica'] })).toEqual(['Plomería', 'Aires', 'Mecánica']);
  });
  it('funciona sin rubros extra', () => {
    expect(rubrosDe({ category: 'Plomería' })).toEqual(['Plomería']);
  });
});
