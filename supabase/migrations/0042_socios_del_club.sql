-- ---------------------------------------------------------------------
-- Los socios del club.
--
-- La ficha ya guardaba jugadores y familias de la cantera, pero no el
-- número de socios, que en un club de barrio es otra gente distinta:
-- el vecino que paga su cuota de 30 € al año y no tiene ningún hijo
-- jugando. Para una empresa local es la cifra que mejor describe a
-- cuánta gente del pueblo llega el club.
--
-- Va aparte a propósito y nunca se suma con jugadores ni familias: son
-- conjuntos que se solapan —muchos padres son también socios— y
-- sumarlos daría un número inflado que no resiste la primera pregunta.
-- ---------------------------------------------------------------------

alter table public.clubs
  add column if not exists members_count int;

comment on column public.clubs.members_count is
  'Socios del club, declarado por el club (migración 0042). Se enseña siempre por separado: se solapa con jugadores y familias y sumarlos contaría dos veces a la misma persona.';

-- La vista pública, ampliada con la columna nueva. Las columnas nuevas
-- van AL FINAL, para poder ampliarla con "create or replace" sin
-- borrarla (mismo motivo que en las migraciones 0026, 0035 y 0036).
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
  top_category_female,
  top_category_male_photo,
  top_category_female_photo,
  members_count
from public.clubs
where subscription_status in ('trialing', 'active')
  and not admin_suspended;

grant select on public.club_public_profiles to anon, authenticated;
