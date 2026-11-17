-- Sección "Emprendimientos" (venta de productos) y categoría "Ferretería y materiales".
-- Las categorías viven en el código (src/types.ts); acá solo se reubican los avisos existentes.
-- El trigger de edición pasa a "pendiente" lo que no edita un admin: se desactiva mientras tanto.

alter table public.jobs disable trigger jobs_before_update;

update public.jobs set category = case professional_name
  when 'Lazarte Noelia Mariajosé' then 'Cocina y Hogar'
  when 'Alejo Varela'             then 'Ropa y Accesorios'
  when 'Paulo Alderete'           then 'Celulares y Electrónica'
  when 'Ferreteria Italia'        then 'Ferretería y Materiales'
end
where category in ('Otros', 'Otros Productos')
  and professional_name in ('Lazarte Noelia Mariajosé', 'Alejo Varela', 'Paulo Alderete', 'Ferreteria Italia');

alter table public.jobs enable trigger jobs_before_update;
