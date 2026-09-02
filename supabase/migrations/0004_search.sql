-- Fase 7: buscador público de oportunidades y clubes (/buscar).
--
-- Añade lo que hace falta para poder filtrar y localizar clubes desde
-- el buscador:
--   1. Coordenadas del club (`latitude`/`longitude`), rellenadas
--      automáticamente al guardar la Identidad (geocodificación con
--      OpenStreetMap/Nominatim, ver `src/lib/geocoding.ts`). Se añaden
--      también a la vista pública `club_public_profiles` (Fase 5), que
--      es la única forma en que el buscador puede leer clubes sin
--      sesión.
--   2. Tres campos nuevos en `opportunities`: `collaboration_type`
--      (dinero/producto/servicio/mixta), `objectives` (a qué público u
--      objetivo apela la oportunidad) y `period` (partido/mes/
--      temporada/evento), para poder filtrar el presupuesto por periodo
--      además de por rango de euros. El tipo de oportunidad (Fase 6) no
--      cambia: se mantienen los 6 tipos ya existentes.
--   3. Una vista pública `opportunity_search_view`, que junta cada
--      oportunidad disponible con los datos de su club (mismo patrón
--      que `club_public_profiles`): es la única consulta que hace el
--      buscador.
--   4. Índices para que el filtrado sea rápido.
--
-- Cómo aplicar esta migración: igual que las anteriores, pega el
-- contenido de este archivo en Supabase -> SQL Editor -> New query y
-- ejecútalo. Es seguro volver a ejecutarla.

-- ---------------------------------------------------------------------
-- 1. Coordenadas del club
-- ---------------------------------------------------------------------
alter table public.clubs add column if not exists latitude double precision;
alter table public.clubs add column if not exists longitude double precision;
alter table public.clubs add column if not exists geocoded_at timestamptz;

comment on column public.clubs.latitude is 'Latitud aproximada del club, geocodificada a partir de ciudad/provincia/código postal (Fase 7). Null si aún no se ha podido geocodificar.';
comment on column public.clubs.longitude is 'Longitud aproximada del club. Ver comentario de `latitude`.';
comment on column public.clubs.geocoded_at is 'Cuándo se calcularon por última vez `latitude`/`longitude`.';

create index if not exists clubs_lat_lng_idx on public.clubs (latitude, longitude);

-- ---------------------------------------------------------------------
-- 2. Campos nuevos en `opportunities`
-- ---------------------------------------------------------------------
alter table public.opportunities add column if not exists collaboration_type text;
alter table public.opportunities add column if not exists objectives text[] not null default '{}'::text[];
alter table public.opportunities add column if not exists period text;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'opportunities_collaboration_type_check'
  ) then
    alter table public.opportunities
      add constraint opportunities_collaboration_type_check
      check (collaboration_type is null or collaboration_type in ('money', 'product', 'service', 'mixed'));
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'opportunities_period_check'
  ) then
    alter table public.opportunities
      add constraint opportunities_period_check
      check (period is null or period in ('match', 'month', 'season', 'event'));
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'opportunities_objectives_check'
  ) then
    alter table public.opportunities
      add constraint opportunities_objectives_check
      check (
        objectives <@ array[
          'familias', 'jovenes', 'comunidad_local', 'deporte_femenino', 'deporte_base',
          'visibilidad', 'contenido', 'clientes', 'empleados', 'rsc'
        ]::text[]
      );
  end if;
end;
$$;

comment on column public.opportunities.collaboration_type is 'Forma de colaboración: dinero, producto, servicio o mixta (Fase 7). Opcional.';
comment on column public.opportunities.objectives is 'A qué público u objetivo apela la oportunidad (familias, jóvenes, RSC…), Fase 7. Puede estar vacío.';
comment on column public.opportunities.period is 'Periodo del presupuesto: partido, mes, temporada o evento (Fase 7). Opcional, independiente del texto libre de `duration`.';

create index if not exists opportunities_search_idx
  on public.opportunities (opportunity_type, value)
  where status = 'available' and archived_at is null;

create index if not exists opportunities_objectives_idx on public.opportunities using gin (objectives);

-- ---------------------------------------------------------------------
-- 3. Vista pública `club_public_profiles` (Fase 5): añade coordenadas
-- ---------------------------------------------------------------------
-- Se borra antes de recrearla: `create or replace view` no permite
-- cambiar el orden de las columnas, y aquí se añaden en medio.
drop view if exists public.club_public_profiles cascade;

create or replace view public.club_public_profiles as
select
  id,
  slug,
  name,
  city,
  province,
  postal_code,
  latitude,
  longitude,
  facilities,
  website,
  social_links,
  description,
  logo_url,
  photo_urls,
  video_url,
  case when contact_public_consent then contact_name else null end as contact_name,
  case when contact_public_consent then contact_phone else null end as contact_phone,
  contact_public_consent,
  top_category,
  competitions,
  achievements,
  youth_teams_count,
  youth_players_count,
  youth_families_count,
  founding_year,
  milestones,
  followers_by_network,
  estimated_reach,
  average_attendance,
  community_actions,
  created_at,
  updated_at
from public.clubs;

grant select on public.club_public_profiles to anon, authenticated;

-- ---------------------------------------------------------------------
-- 4. Vista pública `opportunity_search_view` (Fase 7)
-- ---------------------------------------------------------------------
-- Igual patrón que `club_public_profiles`: se crea con el rol propietario
-- de las tablas, así que puede juntar `opportunities` y `clubs` para
-- `anon` sin necesitar una política de RLS pública nueva sobre `clubs`.
-- Solo expone las oportunidades que ya son públicas hoy (disponibles y
-- no archivadas: mismo criterio que la política "opportunities_select_public"),
-- con los datos del club que hacen falta para el buscador.
-- Se borra antes de recrearla: `create or replace view` no permite
-- cambiar el orden de las columnas, y aquí se añaden en medio.
drop view if exists public.opportunity_search_view cascade;

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
  c.longitude as club_longitude
from public.opportunities o
join public.clubs c on c.id = o.club_id
where o.status = 'available' and o.archived_at is null;

comment on view public.opportunity_search_view is 'Vista pública usada por el buscador (/buscar, Fase 7): cada fila es una oportunidad disponible y no archivada, con los datos de su club.';

grant select on public.opportunity_search_view to anon, authenticated;
