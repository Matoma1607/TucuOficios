import { describe, it, expect } from 'vitest';
import { ZONES } from '../types';
import { ordenarPorCercania, zonaMasCercana, COORDS_ZONAS } from '../lib/cercania';

describe('cercanía', () => {
  it('reconoce la zona más cercana', () => {
    expect(zonaMasCercana([-26.817, -65.301]).zona).toBe('Yerba Buena');
    expect(zonaMasCercana([-27.34, -65.59]).zona).toBe('Concepción');
  });
  it('ordena de más cerca a más lejos y "Todo Tucumán" cuenta como cerca', () => {
    const lista = [{ zone: 'Concepción' }, { zone: 'Tafí Viejo' }, { zone: 'Todo Tucumán' }, { zone: 'Yerba Buena' }];
    const orden = ordenarPorCercania(lista, COORDS_ZONAS['Yerba Buena']).map((x) => x.zone);
    expect(orden).toEqual(['Yerba Buena', 'Todo Tucumán', 'Tafí Viejo', 'Concepción']);
  });
  it('todas las zonas tienen coordenadas dentro de Tucumán', () => {
    for (const z of ZONES.filter((x) => x !== 'Todo Tucumán')) {
      const c = COORDS_ZONAS[z];
      expect(c, z).toBeDefined();
      expect(c[0]).toBeGreaterThan(-28.1);
      expect(c[0]).toBeLessThan(-26);
      expect(c[1]).toBeGreaterThan(-66.3);
      expect(c[1]).toBeLessThan(-64.4);
    }
  });
});
