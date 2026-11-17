import { describe, expect, it } from 'vitest';
import { formatWhatsappForInput, normalizeWhatsapp } from '../lib/whatsapp';

describe('normalizeWhatsapp', () => {
  it.each([
    ['381 412-3456', '5493814123456'],
    ['0381 15 412 3456', '5493814123456'],
    ['381 15 4123456', '5493814123456'],
    ['+54 9 381 4123456', '5493814123456'],
    ['5493814123456', '5493814123456'],
    ['0054 9 381 412 3456', '5493814123456'],
    ['11 2345-6789', '5491123456789'],
    ['3863 15 41-2345', '5493863412345'],
  ])('%s → %s', (input, expected) => {
    expect(normalizeWhatsapp(input)).toBe(expected);
  });

  it.each(['', '123', '412-3456', 'hola'])('rechaza "%s"', (input) => {
    expect(normalizeWhatsapp(input)).toBeNull();
  });
});

describe('formatWhatsappForInput', () => {
  it('muestra el número sin el 549', () => {
    expect(formatWhatsappForInput('5493814123456')).toBe('381 412-3456');
  });
});
