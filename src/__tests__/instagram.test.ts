import { describe, expect, it } from 'vitest';
import { normalizeInstagram } from '../lib/instagram';

describe('normalizeInstagram', () => {
  it.each([
    ['@tucuoficios', 'tucuoficios'],
    ['TucuOficios', 'tucuoficios'],
    ['instagram.com/plomeria.kuba', 'plomeria.kuba'],
    ['https://www.instagram.com/plomeria_kuba/?igsh=abc123', 'plomeria_kuba'],
    ['  @martin.gomez_  ', 'martin.gomez_'],
  ])('%s → %s', (input, expected) => {
    expect(normalizeInstagram(input)).toBe(expected);
  });

  it('vacío es válido (el campo es opcional)', () => {
    expect(normalizeInstagram('')).toBe('');
    expect(normalizeInstagram('   ')).toBe('');
  });

  it.each(['con espacio', 'ñandú', '.punto', 'punto.', 'dos..puntos', 'a'.repeat(31), '@'])('rechaza "%s"', (input) => {
    expect(normalizeInstagram(input)).toBeNull();
  });
});
