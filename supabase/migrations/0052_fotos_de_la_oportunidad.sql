-- ---------------------------------------------------------------------
-- Fotos en las oportunidades.
--
-- Una oportunidad se vende con una foto mucho mejor que con un párrafo:
-- "lona de 3×1 en el pabellón" obliga a la empresa a imaginarse la
-- pared, y la foto de la pared se la enseña. Es lo que más empuja a
-- escribir al club, y hasta ahora el catálogo entero era texto.
--
-- UNA COLUMNA Y NO UNA TABLA APARTE. Son tres direcciones de imagen que
-- siempre se leen con la oportunidad y nunca por separado: una tabla
-- con sus claves y sus políticas sería más maquinaria de la que el
-- problema pide. Además ya hay precedente en la casa: las fotos de las
-- instalaciones del club viven igual, en `clubs.facilities_photos`
-- (migración 0025).
--
-- EL TOPE DE TRES, COMPROBADO AQUÍ. La aplicación también lo comprueba,
-- pero esa comprobación vive en un formulario y se la salta cualquiera
-- que llame a la base de datos por otro camino. Esta no se la salta
-- nadie. Tres es donde los clubes todavía rellenan: con seis, la
-- mayoría sube una y el hueco se nota.
--
-- SE GUARDA LA DIRECCIÓN, NO EL ARCHIVO. Las imágenes van al bucket
-- `club-media`, que ya existe y es público en lectura: son fotos que se
-- enseñan en el catálogo, así que no hay nada que esconder. OJO: al
-- borrar la oportunidad se va la fila, NO el archivo. El almacén no
-- sabe de claves ajenas; eso lo barre la aplicación.
-- ---------------------------------------------------------------------

alter table public.opportunities
  add column if not exists photos text[] not null default '{}'::text[];

-- `array_length` de un array vacío devuelve NULL, no 0: sin el coalesce
-- la regla dejaría pasar cualquier cosa en cuanto el array se vaciara.
alter table public.opportunities
  drop constraint if exists opportunities_photos_max;
alter table public.opportunities
  add constraint opportunities_photos_max
  check (coalesce(array_length(photos, 1), 0) <= 3);

comment on column public.opportunities.photos is
  'Hasta 3 direcciones públicas de club-media (migración 0052). La primera es la que sale de miniatura en los listados.';

-- ---------------------------------------------------------------------
-- Y la vista del buscador, que es de donde salen los resultados.
-- ---------------------------------------------------------------------
-- Sin esto, las fotos existirían en la tabla pero NO en el buscador, y
-- sin dar ningún error: la consulta pide `select *` sobre la vista, así
-- que simplemente no vendría la columna y las miniaturas no saldrían
-- nunca. Es el tipo de fallo que se descubre semanas después.
--
-- La columna nueva va AL FINAL, detrás de las que añadieron la 0020 y
-- la 0038. `create or replace view` en Postgres solo deja añadir por el
-- final: meterla en medio obliga a borrar la vista, y eso Supabase lo
-- marca como operación destructiva.
create or replace view public.opportunity_search_view as
select
  o.id as opportunity_id,
  o.club_id,
  o.title,
  o.description,
  o.opportunity_type,
  o.value,
  o.duration,
  o.period,
  o.collaboration_type,
  o.objectives,
  o.created_at as opportunity_created_at,
  c.slug as club_slug,
  c.name as club_name,
  c.city as club_city,
  c.province as club_province,
  c.postal_code as club_postal_code,
  c.logo_url as club_logo_url,
  c.latitude as club_latitude,
  c.longitude as club_longitude,
  o.sponsor_level,
  o.exclusivity,
  o.team_id,
  t.sport as team_sport,
  t.category as team_category,
  t.gender as team_gender,
  t.team_level as team_level,
  o.slots_total,
  o.slots_taken,
  c.profile_score as club_profile_score,
  (c.profile_score / 10) as club_visibility_bucket,
  o.is_need,
  o.need_category,
  o.photos
from public.opportunities o
join public.clubs c on c.id = o.club_id
left join public.club_teams t on t.id = o.team_id
where o.status = 'available'
  and o.archived_at is null
  and c.subscription_status in ('trialing', 'active')
  and not c.admin_suspended;

grant select on public.opportunity_search_view to anon, authenticated;
