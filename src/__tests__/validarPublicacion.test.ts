import { describe, it, expect } from 'vitest';
import { validarPublicacion, type DatosPublicacion } from '../lib/validarPublicacion';

const base: DatosPublicacion = {
  title: 'Instalación de aires split',
  category: 'Electricidad',
  zone: 'Yerba Buena',
  nombre: 'Juan Pérez',
  negocio: '',
  whatsapp: '381 412-3456',
  instagram: '',
  description: 'Diez años de experiencia, matriculado.',
  fotos: 1,
};

describe('validación del formulario', () => {
  it('acepta una publicación correcta', () => {
    expect(validarPublicacion(base)).toEqual({});
    expect(validarPublicacion({ ...base, negocio: 'Ferretería Italia' })).toEqual({});
  });
  it('el nombre es de la persona: sin números, links ni arrobas', () => {
    expect(validarPublicacion({ ...base, nombre: 'Juan 3815551234' }).nombre).toBeTruthy();
    expect(validarPublicacion({ ...base, nombre: 'www.juan.com' }).nombre).toBeTruthy();
    expect(validarPublicacion({ ...base, nombre: '   ' }).nombre).toBeTruthy();
    expect(validarPublicacion({ ...base, nombre: '😀😀' }).nombre).toBeTruthy();
    expect(validarPublicacion({ ...base, nombre: 'María José Núñez' }).nombre).toBeUndefined();
  });
  it('el negocio es opcional pero sin teléfonos ni links', () => {
    expect(validarPublicacion({ ...base, negocio: 'Taller 24' }).negocio).toBeUndefined();
    expect(validarPublicacion({ ...base, negocio: 'Llamá 381 555-1234' }).negocio).toBeTruthy();
    expect(validarPublicacion({ ...base, negocio: 'mitienda.com.ar' }).negocio).toBeTruthy();
  });
  it('controla título, rubro, zona, WhatsApp, descripción y fotos', () => {
    const e = validarPublicacion({ ...base, title: 'Servicios', category: 'Inventado', zone: ' ', whatsapp: '123', description: 'corta', fotos: 0 });
    expect(Object.keys(e).sort()).toEqual(['category', 'description', 'image', 'title', 'whatsapp', 'zone']);
    expect(validarPublicacion({ ...base, title: 'Plomero 3815551234' }).title).toBeTruthy();
    expect(validarPublicacion({ ...base, description: 'x'.repeat(601) }).description).toBeTruthy();
  });
});
