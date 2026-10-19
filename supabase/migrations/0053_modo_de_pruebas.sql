-- ---------------------------------------------------------------------
-- Modo de pruebas.
--
-- Un club en modo de pruebas sigue entrando a su panel con normalidad
-- (puede rellenar la ficha, crear oportunidades, generar el dossier…),
-- pero NO se ve en ningún sitio público: ni su página, ni el buscador,
-- ni /servicios, ni el mapa del sitio, ni los avisos a empresas.
--
-- POR QUÉ NO VALÍA "SUSPENDER". Suspender (migración 0009) también lo
-- esconde todo, pero además le corta el panel: es un castigo, no un
-- taller. Para el club con el que se prueba la plataforma, o para
-- preparar la ficha de un club invitado antes de enseñarla, hacía falta
-- lo contrario: esconderlo sin dejarlo fuera.
--
-- LO PONE Y LO QUITA EL ADMINISTRADOR, desde el listado de clubes. El
-- panel del club no tiene ningún botón para cambiarlo.
--
-- Las tres vistas públicas que filtran clubes se vuelven a escribir
-- tal cual estaban (últimas versiones: 0044, 0052 y 0016) con una sola
-- línea más: `and not admin_test_mode`. La prueba
-- `tests/unit/modo-de-pruebas.test.ts` comprueba que la última versión
-- de cada una lo sigue llevando, para que una migración futura que las
-- vuelva a escribir no se lo deje por el camino.
-- ---------------------------------------------------------------------

alter table public.clubs
  add column if not exists admin_test_mode boolean not null default false,
  add column if not exists admin_test_mode_at timestamptz;

comment on column public.clubs.admin_test_mode is
  'true si un admin ha puesto el club en modo de pruebas: conserva su panel, pero no aparece en la página pública, el buscador, /servicios, el sitemap ni los avisos a empresas (migración 0053).';

-- ---------------------------------------------------------------------
-- 1. Página pública del club (última versión: 0044)
-- ---------------------------------------------------------------------
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
  and not admin_suspended
  and not admin_test_mode;

grant select on public.club_public_profiles to anon, authenticated;

-- ---------------------------------------------------------------------
-- 2. Buscador y avisos a empresas (última versión: 0052)
-- ---------------------------------------------------------------------
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
  and not c.admin_suspended
  and not c.admin_test_mode;

grant select on public.opportunity_search_view to anon, authenticated;

-- ---------------------------------------------------------------------
-- 3. Servicios que buscan los clubes (última versión: 0016)
-- ---------------------------------------------------------------------
create or replace view public.club_service_needs_public as
select
  n.id,
  n.club_id,
  n.category,
  n.title,
  n.description,
  n.created_at,
  c.slug as club_slug,
  c.name as club_name,
  c.city as club_city,
  c.province as club_province,
  c.logo_url as club_logo_url
from public.club_service_needs n
join public.clubs c on c.id = n.club_id
where n.status = 'open'
  and c.subscription_status in ('trialing', 'active')
  and not c.admin_suspended
  and not c.admin_test_mode;

comment on view public.club_service_needs_public is
  'Servicios que buscan los clubes visibles (/servicios y la ficha del club). Solo necesidades abiertas de clubes con suscripción activa o en prueba, no suspendidos y no en modo de pruebas.';

grant select on public.club_service_needs_public to anon, authenticated;
