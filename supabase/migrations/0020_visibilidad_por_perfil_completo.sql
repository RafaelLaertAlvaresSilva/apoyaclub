-- ---------------------------------------------------------------------
-- La información completa da visibilidad.
--
-- Hasta ahora el porcentaje de perfil completado se calculaba en el
-- código de la app y solo servía para pintar una barra en el panel: era
-- un adorno. El club no tenía ningún motivo real para terminar su ficha.
--
-- Aquí ese porcentaje pasa a vivir en la base de datos (`clubs.profile_score`),
-- se mantiene solo mediante triggers, y entra en el orden del buscador:
-- a igualdad de todo lo demás, sale antes el club que ha contado más
-- cosas de sí mismo. Es lo que hace verdad la frase que se le enseña al
-- club: "cuanta más información, más visibilidad".
--
-- Se calcula como la media del progreso de ocho secciones, para que
-- ninguna pese más que las demás: un club con veinte fotos y nada más no
-- adelanta a uno que ha rellenado cantera, audiencia y patrocinadores.
-- ---------------------------------------------------------------------

alter table public.clubs
  add column if not exists profile_score int not null default 0;

comment on column public.clubs.profile_score is
  'Porcentaje (0-100) de ficha rellenada. Lo mantienen triggers; es la única definición del dato, la usan tanto el panel del club como el orden del buscador.';

-- ---------------------------------------------------------------------
-- 1. Cálculo
-- ---------------------------------------------------------------------
create or replace function public.calcular_profile_score(p_club_id uuid)
returns int
language sql
stable
security definer
set search_path = public
as $$
  with club as (
    select * from public.clubs where id = p_club_id
  ),
  secciones as (
    select unnest(array[
      -- 1. Identidad: quién es y qué cara tiene.
      (
        (c.logo_url is not null)::int +
        (coalesce(array_length(c.photo_urls, 1), 0) > 0)::int +
        (c.video_url is not null)::int +
        (c.description is not null)::int +
        (c.website is not null)::int +
        (c.social_links <> '{}'::jsonb)::int
      )::numeric / 6,
      -- 2. Nivel deportivo.
      (
        (c.top_category is not null)::int +
        (c.competitions is not null)::int +
        (c.achievements is not null)::int
      )::numeric / 3,
      -- 3. Equipos.
      (exists (select 1 from public.club_teams t where t.club_id = c.id))::int::numeric,
      -- 4. Cantera.
      (
        (c.youth_teams_count is not null)::int +
        (c.youth_players_count is not null)::int +
        (c.youth_families_count is not null)::int
      )::numeric / 3,
      -- 5. Historia.
      (
        (c.founding_year is not null)::int +
        (c.milestones <> '[]'::jsonb)::int
      )::numeric / 2,
      -- 6. Audiencia.
      (
        (c.followers_by_network <> '{}'::jsonb)::int +
        (c.estimated_reach is not null)::int +
        (c.average_attendance is not null)::int
      )::numeric / 3,
      -- 7. Comunidad.
      (c.community_actions <> '[]'::jsonb)::int::numeric,
      -- 8. Patrocinadores actuales.
      (exists (select 1 from public.club_sponsors s where s.club_id = c.id))::int::numeric
    ]) as fraccion
    from club c
  )
  select coalesce(round(avg(fraccion) * 100)::int, 0) from secciones;
$$;

comment on function public.calcular_profile_score(uuid) is
  'Media del progreso de las ocho secciones de la ficha, en porcentaje entero.';

-- ---------------------------------------------------------------------
-- 2. Mantenimiento automático
-- ---------------------------------------------------------------------

-- a) Cuando cambia la propia fila del club, se recalcula antes de
--    escribirla: así el valor viaja en el mismo UPDATE y no hace falta
--    una segunda escritura (que además reentraría en el trigger).
create or replace function public.refrescar_profile_score_propio()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.profile_score := (
    select coalesce(round(avg(fraccion) * 100)::int, 0)
    from unnest(array[
      (
        (new.logo_url is not null)::int +
        (coalesce(array_length(new.photo_urls, 1), 0) > 0)::int +
        (new.video_url is not null)::int +
        (new.description is not null)::int +
        (new.website is not null)::int +
        (new.social_links <> '{}'::jsonb)::int
      )::numeric / 6,
      (
        (new.top_category is not null)::int +
        (new.competitions is not null)::int +
        (new.achievements is not null)::int
      )::numeric / 3,
      (exists (select 1 from public.club_teams t where t.club_id = new.id))::int::numeric,
      (
        (new.youth_teams_count is not null)::int +
        (new.youth_players_count is not null)::int +
        (new.youth_families_count is not null)::int
      )::numeric / 3,
      (
        (new.founding_year is not null)::int +
        (new.milestones <> '[]'::jsonb)::int
      )::numeric / 2,
      (
        (new.followers_by_network <> '{}'::jsonb)::int +
        (new.estimated_reach is not null)::int +
        (new.average_attendance is not null)::int
      )::numeric / 3,
      (new.community_actions <> '[]'::jsonb)::int::numeric,
      (exists (select 1 from public.club_sponsors s where s.club_id = new.id))::int::numeric
    ]) as fraccion
  );
  return new;
end;
$$;

drop trigger if exists clubs_refrescar_score on public.clubs;
create trigger clubs_refrescar_score
  before insert or update on public.clubs
  for each row execute function public.refrescar_profile_score_propio();

-- b) Cuando cambian las tablas hijas, se recalcula la fila del club.
create or replace function public.refrescar_profile_score_del_padre()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_club_id uuid := coalesce(new.club_id, old.club_id);
begin
  update public.clubs
     set profile_score = public.calcular_profile_score(v_club_id)
   where id = v_club_id;
  return coalesce(new, old);
end;
$$;

drop trigger if exists club_teams_refrescar_score on public.club_teams;
create trigger club_teams_refrescar_score
  after insert or delete on public.club_teams
  for each row execute function public.refrescar_profile_score_del_padre();

drop trigger if exists club_sponsors_refrescar_score on public.club_sponsors;
create trigger club_sponsors_refrescar_score
  after insert or delete on public.club_sponsors
  for each row execute function public.refrescar_profile_score_del_padre();

-- c) Puesta al día de lo que ya existe.
update public.clubs set profile_score = public.calcular_profile_score(id);

-- ---------------------------------------------------------------------
-- 3. El buscador lo tiene en cuenta
-- ---------------------------------------------------------------------
-- Se añade la columna a la vista pública de búsqueda para poder ordenar
-- por ella. Se redondea a decenas al ordenar (en el código de la app),
-- no aquí: así un 71 % y un 78 % se consideran iguales y desempata la
-- novedad, en vez de premiar diferencias que no significan nada.
drop view if exists public.opportunity_search_view cascade;

create view public.opportunity_search_view as
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
  -- Redondeo a decenas: un 71 % y un 78 % se consideran igual de
  -- completos y desempata la novedad. Así el orden premia terminar
  -- secciones, no rellenar un campo suelto para adelantar a otro club.
  (c.profile_score / 10) as club_visibility_bucket
from public.opportunities o
join public.clubs c on c.id = o.club_id
left join public.club_teams t on t.id = o.team_id
where o.status = 'available'
  and o.archived_at is null
  and c.subscription_status in ('trialing', 'active')
  and not c.admin_suspended;

comment on view public.opportunity_search_view is
  'Oportunidades visibles en el buscador, con los datos del club ya unidos. SECURITY DEFINER a propósito (ver 0012): expone solo columnas públicas de `clubs`.';

grant select on public.opportunity_search_view to anon, authenticated;

-- Índice para el orden por visibilidad del buscador.
create index if not exists clubs_profile_score_idx on public.clubs (profile_score desc);
