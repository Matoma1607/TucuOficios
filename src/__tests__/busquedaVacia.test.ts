import { describe, it, expect, vi } from 'vitest';
vi.mock('../lib/supabase', () => ({ supabase: {} }));
import { limpiarTexto } from '../lib/contador';

describe('búsquedas sin resultado', () => {
  it('guarda solo letras: nada de números (ni teléfonos)', () => {
    expect(limpiarTexto('Fumigador 381-5551234')).toBe('fumigador');
    expect(limpiarTexto('  Herrería   Artística!! ')).toBe('herrería artística');
  });
  it('descarta textos muy cortos o vacíos', () => {
    expect(limpiarTexto('ab')).toBeNull();
    expect(limpiarTexto('12345')).toBeNull();
  });
  it('corta a 40 letras', () => {
    expect(limpiarTexto('a'.repeat(80))!.length).toBe(40);
  });
});
