-- ---------------------------------------------------------------------
-- 0035 — Máxima categoría, una por equipo masculino y otra por femenino.
--
-- Había una sola casilla de "máxima categoría", y un club con equipo
-- masculino y femenino tenía que elegir cuál poner o meter las dos en
-- la misma línea. Los dos son el club y los dos venden.
--
-- `top_category` se queda y no se toca: la usan la vista pública, el
-- dossier y el cálculo de la puntuación del perfil (migración 0020).
-- Pasa a escribirse a partir de las dos nuevas —"Primera Nacional
-- (masculino) · Autonómica (femenino)"— desde el propio formulario, que
-- guarda las tres a la vez, así que no pueden descuadrarse. Hacerlo así
-- evita tocar la función de puntuación y que un club deje de sumar
-- puntos por rellenar el campo nuevo en vez del viejo.
-- ---------------------------------------------------------------------

alter table public.clubs add column if not exists top_category_male text;
alter table public.clubs add column if not exists top_category_female text;

alter table public.clubs drop constraint if exists clubs_top_category_sexo_check;
alter table public.clubs
  add constraint clubs_top_category_sexo_check
  check (
    (top_category_male is null or length(top_category_male) <= 120)
    and (top_category_female is null or length(top_category_female) <= 120)
  );

comment on column public.clubs.top_category_male is
  'Máxima categoría del equipo masculino. Texto libre: cada federación nombra las suyas.';
comment on column public.clubs.top_category_female is
  'Máxima categoría del equipo femenino.';
comment on column public.clubs.top_category is
  'Resumen de las dos anteriores, escrito por el formulario del panel. Se mantiene porque de él dependen la vista pública, el dossier y la puntuación del perfil (migración 0020).';

-- Las columnas nuevas se añaden AL FINAL de la vista. Postgres permite
-- ampliar una vista por el final con "create or replace" sin borrarla,
-- así que este cambio no sale como operación destructiva en el editor
-- de Supabase (mismo truco que en la migración 0026).
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
  facilities_address,
  facilities_photos,
  website,
  social_links,
  description,
  logo_url,
  cover_url,
  photo_urls,
  video_url,
  case when contact_public_consent then contact_name else null end as contact_name,
  case when contact_public_consent then contact_phone else null end as contact_phone,
  contact_hours,
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
  profile_score,
  verified,
  created_at,
  updated_at,
  cover_position,
  top_category_male,
  top_category_female
from public.clubs
where subscription_status in ('trialing', 'active')
  and not admin_suspended;

grant select on public.club_public_profiles to anon, authenticated;
