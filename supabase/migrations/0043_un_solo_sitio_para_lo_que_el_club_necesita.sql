-- ---------------------------------------------------------------------
-- Lo que el club necesita, en un solo sitio.
--
-- Había dos formas de decir exactamente lo mismo, y el club las tenía
-- las dos en la misma pantalla sin que nada le avisara de la
-- diferencia:
--
--   1. Una oportunidad con el interruptor "es una necesidad"
--      (`opportunities.is_need`, migración 0038). Esta SÍ sale en el
--      buscador: la vista `opportunity_search_view` la indexa.
--   2. El formulario "Servicios que necesitamos"
--      (`club_service_needs`, migración 0016). Esta NO salía en ningún
--      buscador: solo se veía en la ficha del club y en /servicios.
--
-- O sea que un club podía estar apuntando lo que necesita en el sitio
-- donde nadie lo iba a encontrar. Y encima con catálogos de categorías
-- distintos: siete en uno y diecisiete en el otro.
--
-- Aquí se pasa todo lo de (2) a (1) y se deja de escribir en la tabla
-- vieja. No se borra: los datos se quedan donde están por si hubiera
-- que mirar atrás, con la fecha de traspaso apuntada para no traer dos
-- veces lo mismo.
-- ---------------------------------------------------------------------

alter table public.club_service_needs
  add column if not exists migrated_at timestamptz;

comment on column public.club_service_needs.migrated_at is
  'Cuándo se pasó esta fila a `opportunities` como necesidad (migración 0043). No nula = ya traspasada; la tabla queda solo de archivo.';

comment on table public.club_service_needs is
  'RETIRADA (migración 0043). Lo que el club necesita vive ahora en `opportunities` con is_need = true. Esta tabla se conserva como archivo de lo que se apuntó antes; no se escribe en ella.';

-- Las siete categorías viejas, a las diecisiete de las oportunidades.
-- "formacion" no tiene equivalente y cae en "otro": es preferible a
-- inventarle una que no le corresponde.
create or replace function public.categoria_de_servicio_a_necesidad(p_categoria text)
returns text
language sql
immutable
as $$
  select case p_categoria
    when 'salud' then 'medico'
    when 'transporte' then 'transporte'
    when 'hosteleria' then 'restauracion'
    when 'material' then 'material'
    when 'imprenta' then 'imprenta'
    when 'formacion' then 'otro'
    else 'otro'
  end;
$$;

comment on function public.categoria_de_servicio_a_necesidad(text) is
  'Traduce las 7 categorías de `club_service_needs` a las 17 de `opportunities.need_category` (migración 0043).';

-- El traspaso.
--
-- `value = 0` porque una necesidad no lleva precio: lo que se ofrece es
-- el servicio y a cambio va visibilidad.
--
-- `opportunity_type = 'in_kind'` porque eso es exactamente lo que es:
-- una aportación en especie.
--
-- Un servicio ya cubierto entra como 'reserved', que es lo que
-- significa en el catálogo nuevo.
insert into public.opportunities (
  club_id,
  title,
  description,
  opportunity_type,
  status,
  value,
  is_need,
  need_category,
  created_at
)
select
  s.club_id,
  s.title,
  s.description,
  'in_kind',
  case when s.status = 'covered' then 'reserved' else 'available' end,
  0,
  true,
  public.categoria_de_servicio_a_necesidad(s.category),
  s.created_at
from public.club_service_needs s
where s.migrated_at is null;

update public.club_service_needs
   set migrated_at = now()
 where migrated_at is null;
