-- ---------------------------------------------------------------------
-- Qué se ve en la foto del primer equipo.
--
-- En la ficha, la foto de cada máxima categoría iba con dos líneas
-- debajo: "Máxima categoría · Masculino" y el nombre de la categoría.
-- Para alguien del mundillo es suficiente; para la empresa que entra
-- por primera vez, "Primera Autonómica" no dice nada, y la foto —que
-- es lo primero que mira— se queda sin contar nada.
--
-- Esto es el pie de foto: una línea del club diciendo qué se está
-- viendo. "Primer equipo masculino, temporada 2025/26. Subió de
-- categoría en mayo." Es voluntario y va vacío por defecto: una foto
-- sin pie se sigue viendo exactamente igual que antes.
-- ---------------------------------------------------------------------

alter table public.clubs
  add column if not exists top_category_male_photo_note text,
  add column if not exists top_category_female_photo_note text;

comment on column public.clubs.top_category_male_photo_note is
  'Pie de la foto del equipo masculino de máxima categoría (migración 0044). Lo escribe el club; puede estar vacío.';

comment on column public.clubs.top_category_female_photo_note is
  'Pie de la foto del equipo femenino de máxima categoría (migración 0044). Lo escribe el club; puede estar vacío.';

-- La vista pública, ampliada con las columnas nuevas. Van AL FINAL,
-- para poder ampliarla con "create or replace" sin borrarla (mismo
-- motivo que en las migraciones 0026, 0035, 0036 y 0042).
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
  members_count,
  top_category_male_photo_note,
  top_category_female_photo_note
from public.clubs
where subscription_status in ('trialing', 'active')
  and not admin_suspended;

grant select on public.club_public_profiles to anon, authenticated;
