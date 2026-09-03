-- ---------------------------------------------------------------------
-- ApoyaClub: portada, instalaciones y horario (migracion 0025).
--
-- Añade la imagen de portada de la ficha, la direccion y las fotos de
-- las instalaciones, y el horario de atencion. Recrea ademas la vista
-- publica para que los enseñe.
--
-- Se puede ejecutar varias veces sin romper nada.
-- Se pega en Supabase -> SQL Editor -> New query -> Run.
-- ---------------------------------------------------------------------

-- ---------------------------------------------------------------------
-- La ficha del club, con cara de ficha de club.
--
-- Hasta ahora la portada de la página era, sin más, la primera foto de
-- la galería. Eso obliga al club a elegir entre tener una buena foto de
-- cabecera o tener esa misma foto en la galería, y el resultado depende
-- del orden en que las subió.
--
-- Y las instalaciones eran un único campo de texto libre. Para una
-- empresa que se está planteando poner una lona, dónde está el pabellón
-- y qué pinta tiene es justo lo que quiere saber.
--
--   cover_url          imagen de cabecera, de lado a lado
--   facilities_address dirección del pabellón o campo
--   facilities_photos  fotos de las instalaciones
--   contact_hours      cuándo se puede llamar
-- ---------------------------------------------------------------------

alter table public.clubs
  add column if not exists cover_url text,
  add column if not exists facilities_address text,
  add column if not exists facilities_photos text[] not null default '{}'::text[],
  add column if not exists contact_hours text;

comment on column public.clubs.cover_url is
  'Imagen de cabecera de la ficha pública, de lado a lado. Independiente de photo_urls (la galería).';
comment on column public.clubs.facilities_address is
  'Dónde juega el club: dirección del pabellón, campo o pista.';
comment on column public.clubs.facilities_photos is
  'Fotos de las instalaciones. Separadas de photo_urls, que es la galería del club.';
comment on column public.clubs.contact_hours is
  'Horario en el que el club atiende. Texto libre: "L-V de 17 a 21 h".';

alter table public.clubs drop constraint if exists clubs_contact_hours_check;
alter table public.clubs
  add constraint clubs_contact_hours_check
  check (contact_hours is null or length(contact_hours) <= 200);

alter table public.clubs drop constraint if exists clubs_facilities_address_check;
alter table public.clubs
  add constraint clubs_facilities_address_check
  check (facilities_address is null or length(facilities_address) <= 300);

-- ---------------------------------------------------------------------
-- La vista pública tiene que traer los campos nuevos
-- ---------------------------------------------------------------------
-- Se recrea entera porque hay que insertar columnas en medio, y Postgres
-- no deja cambiar el orden de las columnas de una vista con un simple
-- "create or replace" (error 42P16).
--
-- `contact_email` se queda deliberadamente FUERA. Esta vista la puede
-- leer cualquiera sin sesión: publicar aquí el correo sería dejarlo otra
-- vez al alcance de los robots que recolectan direcciones, que es justo
-- lo que se arregló en la migración 0022. El correo se sirve al pulsar
-- "Ver datos de contacto", que además permite contar cuántas empresas
-- llegan hasta ahí.
drop view if exists public.club_public_profiles cascade;

create view public.club_public_profiles as
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
  updated_at
from public.clubs
where subscription_status in ('trialing', 'active')
  and not admin_suspended;

comment on view public.club_public_profiles is
  'Vista pública de clubs: la usa /club/[slug]. Oculta contact_name/contact_phone sin autorización del club, no expone contact_email (ver 0022) ni ningún dato de Stripe, y solo incluye clubes publicados. SECURITY DEFINER a propósito (ver 0012).';

grant select on public.club_public_profiles to anon, authenticated;
