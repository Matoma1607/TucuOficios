import { ZONAS_POR_REGION } from '../types';

/** Opciones del desplegable de zona, agrupadas por región */
export default function OpcionesZona({ conTodoTucuman = true }: { conTodoTucuman?: boolean }) {
  return (
    <>
      {conTodoTucuman && <option value="Todo Tucumán">Todo Tucumán</option>}
      {ZONAS_POR_REGION.map((r) => (
        <optgroup key={r.region} label={r.region}>
          {r.zonas.map((z) => (
            <option key={z} value={z}>{z}</option>
          ))}
        </optgroup>
      ))}
    </>
  );
}
