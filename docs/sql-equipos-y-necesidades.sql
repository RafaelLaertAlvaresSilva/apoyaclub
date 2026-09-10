-- ---------------------------------------------------------------------
-- 0038 — Dos cosas que faltaban: el detalle de cada equipo y lo que el
-- club NECESITA (además de lo que ofrece).
--
-- 1. EQUIPOS. Hasta ahora un equipo era deporte, categoría, sexo,
--    número de jugadores y poco más. Faltaba lo que de verdad le dice
--    algo a una empresa: en qué compite y qué ha ganado. "Cadete" no
--    significa nada fuera del mundillo; "Primera Autonómica, campeón
--    provincial 2025" sí.
--
-- 2. NECESIDADES. Hasta ahora todas las oportunidades iban en la misma
--    dirección: el club ofrece visibilidad y la empresa paga. Pero un
--    club de barrio necesita también un fisio, un fotógrafo, un
--    autobús o material, y a cambio ofrece lo mismo —marca, presencia,
--    redes—. Eso es una oportunidad igual de real, solo que al revés,
--    y para un fisioterapeuta del barrio es probablemente la mejor de
--    todas.
--
--    Se resuelve con una bandera en la misma tabla y no con una tabla
--    nueva: comparte absolutamente todo con una oportunidad normal
--    (título, descripción, plazas, equipo, objetivos, estado), y
--    duplicarlo habría significado duplicar también el buscador, la
--    ficha pública y el panel.
-- ---------------------------------------------------------------------

-- ---------- 1. Equipos ----------

alter table public.club_teams
  add column if not exists competition_level text,
  add column if not exists achievements text;

alter table public.club_teams
  drop constraint if exists club_teams_textos_check;
alter table public.club_teams
  add constraint club_teams_textos_check
  check (
    (competition_level is null or length(competition_level) <= 200)
    and (achievements is null or length(achievements) <= 1000)
  );

comment on column public.club_teams.competition_level is
  'En qué compite este equipo, en texto libre: "Primera Autonómica", "Liga comarcal". La categoría (cadete, sénior) va aparte, en `category`.';
comment on column public.club_teams.achievements is
  'Logros de este equipo concreto. Los del club entero siguen en clubs.achievements.';

-- `gender` ya existía y sigue siendo texto libre: hay clubes con
-- equipos mixtos y con nomenclaturas propias, y cerrarlo a tres valores
-- rompería lo que ya hay escrito. Lo que cambia es el formulario, que
-- ahora ofrece las tres opciones normales en un desplegable para que
-- "Masculino", "masculino" y "M" dejen de ser tres cosas distintas.

-- ---------- 2. Necesidades del club ----------

alter table public.opportunities
  add column if not exists is_need boolean not null default false,
  add column if not exists need_category text;

alter table public.opportunities
  drop constraint if exists opportunities_need_check;
alter table public.opportunities
  add constraint opportunities_need_check
  check (
    -- Una oportunidad normal no lleva categoría de necesidad.
    (not is_need and need_category is null)
    or (
      is_need
      and need_category in (
        'fisioterapia', 'medico', 'fotografia', 'video', 'marketing',
        'imprenta', 'transporte', 'material', 'equipacion', 'limpieza',
        'restauracion', 'alojamiento', 'gimnasio', 'nutricion',
        'asesoria', 'informatica', 'otro'
      )
    )
  );

comment on column public.opportunities.is_need is
  'true = el club NECESITA esto (un servicio, un producto) y ofrece visibilidad a cambio. false = lo normal: el club ofrece visibilidad y la empresa paga.';
comment on column public.opportunities.need_category is
  'Qué clase de servicio o producto necesita. Solo se rellena cuando is_need es true.';

-- Las necesitadas se buscan por su cuenta: un fisioterapeuta que entra
-- quiere ver solo estas.
create index if not exists opportunities_necesidades_idx
  on public.opportunities (need_category)
  where is_need;

-- ---------- 3. La vista del buscador ----------
-- Las columnas nuevas van AL FINAL, detrás de las dos que añadió la
-- 0020. `create or replace view` en Postgres solo deja añadir columnas
-- por el final: meterlas en medio, o cambiarles el nombre, obliga a
-- borrar la vista, y eso Supabase lo marca como operación destructiva.
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
  o.need_category
from public.opportunities o
join public.clubs c on c.id = o.club_id
left join public.club_teams t on t.id = o.team_id
where o.status = 'available'
  and o.archived_at is null
  and c.subscription_status in ('trialing', 'active')
  and not c.admin_suspended;

grant select on public.opportunity_search_view to anon, authenticated;
