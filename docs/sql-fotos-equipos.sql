-- ---------------------------------------------------------------------
-- 0036 — Fotos: de cada equipo, de la máxima categoría y de lo social.
--
-- Un club se vende con fotos, no con listas. Hasta ahora solo tenía la
-- portada, el logo y la galería de instalaciones: los equipos y las
-- acciones sociales eran texto, y son justo lo que una empresa mira.
--
-- Tres sitios nuevos donde poner una:
--
--   1. El equipo de máxima categoría, uno por sexo (migración 0035).
--   2. Cada equipo de la lista del club.
--   3. Cada acción social. Esa no necesita columna: `community_actions`
--      es jsonb y le cabe una clave `photo` más sin tocar la tabla.
--
-- Sobre los derechos de imagen: las fotos las sube el club y son suyas,
-- con su responsabilidad. La plataforma lo dice donde se suben, que es
-- donde sirve de algo, y no guarda ningún consentimiento por él: hacerlo
-- daría a entender que ApoyaClub los ha comprobado, y no es así.
-- ---------------------------------------------------------------------

alter table public.clubs add column if not exists top_category_male_photo text;
alter table public.clubs add column if not exists top_category_female_photo text;

comment on column public.clubs.top_category_male_photo is
  'Foto del equipo masculino de máxima categoría. La sube el club y responde de sus derechos de imagen.';
comment on column public.clubs.top_category_female_photo is
  'Foto del equipo femenino de máxima categoría.';

alter table public.club_teams add column if not exists photo_url text;

comment on column public.club_teams.photo_url is
  'Foto del equipo. La sube el club y responde de sus derechos de imagen.';

comment on column public.clubs.community_actions is
  'Acciones sociales del club: [{ "title", "description", "photo" }]. "photo" es opcional y se añadió en la migración 0036 sin tocar la tabla, por ser jsonb.';

-- Las columnas nuevas van AL FINAL de la vista, para poder ampliarla con
-- "create or replace" sin borrarla (mismo motivo que en las migraciones
-- 0026 y 0035: así no sale como operación destructiva en Supabase).
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
  top_category_female_photo
from public.clubs
where subscription_status in ('trialing', 'active')
  and not admin_suspended;

grant select on public.club_public_profiles to anon, authenticated;
