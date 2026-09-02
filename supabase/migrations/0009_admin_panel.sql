-- Fase 12: panel de administración y métricas.
--
-- Añade:
--   1. A `clubs`: `verified` (insignia pública de "verificado" en la
--      página del club) y `admin_suspended` (bloqueo total decidido por
--      un admin: el club deja de poder entrar a su panel y desaparece
--      de la página pública y del buscador, sin importar su
--      suscripción).
--   2. `search_logs`: un registro mínimo de cada búsqueda en `/buscar`,
--      para la métrica "búsquedas realizadas" del panel de admin. Solo
--      accesible con la clave de servicio (no hay ninguna política de
--      RLS): ni un club, ni una empresa, ni un visitante anónimo pueden
--      leerlo ni escribirlo directamente.
--   3. Actualiza `club_public_profiles` (expone `verified`, oculta los
--      clubes suspendidos) y `opportunity_search_view` (oculta las
--      oportunidades de un club suspendido), igual que hizo la
--      migración 0007 con la suscripción.
--
-- Cómo aplicar esta migración: igual que las anteriores, pega el
-- contenido de este archivo en Supabase -> SQL Editor -> New query y
-- ejecútalo. Es seguro volver a ejecutarla.

-- ---------------------------------------------------------------------
-- 1. Columnas de administración en `clubs`
-- ---------------------------------------------------------------------
alter table public.clubs
  add column if not exists verified boolean not null default false,
  add column if not exists verified_at timestamptz,
  add column if not exists admin_suspended boolean not null default false,
  add column if not exists admin_suspended_at timestamptz;

comment on column public.clubs.verified is 'Insignia pública de "verificado" (Fase 12), la decide un admin desde /admin/clubes. No tiene relación con la suscripción.';
comment on column public.clubs.admin_suspended is 'true si un admin ha suspendido el club (Fase 12): pierde el acceso a su panel y desaparece de la página pública y del buscador hasta que se reactive, sin importar su suscripción.';

create index if not exists clubs_admin_suspended_idx on public.clubs (admin_suspended) where admin_suspended;

-- ---------------------------------------------------------------------
-- 2. Tabla `search_logs`
-- ---------------------------------------------------------------------
create table if not exists public.search_logs (
  id uuid primary key default gen_random_uuid(),
  -- Filtros de la búsqueda, tal cual los recibe `buscarOportunidades`
  -- (lib/search.ts). Solo para poder analizar más adelante qué se
  -- busca más; no identifica a quién busca.
  filters jsonb not null default '{}'::jsonb,
  results_count integer not null default 0,
  created_at timestamptz not null default now()
);

comment on table public.search_logs is 'Fase 12: un registro por cada búsqueda nueva en /buscar (no cada "cargar más"), solo para la métrica "búsquedas realizadas" del panel de admin. Sin datos de quién busca.';

create index if not exists search_logs_created_at_idx on public.search_logs (created_at);

alter table public.search_logs enable row level security;
-- A propósito, sin ninguna política: solo el cliente con la clave de
-- servicio (createAdminClient) puede leer o escribir aquí.

-- ---------------------------------------------------------------------
-- 3. Vista pública `club_public_profiles`, ahora también filtrada por
--    `admin_suspended` y exponiendo `verified`.
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
  verified,
  created_at,
  updated_at
from public.clubs
where subscription_status in ('trialing', 'active')
  and not admin_suspended;

comment on view public.club_public_profiles is 'Vista pública de clubs (Fase 5): usada por /club/[slug]. Igual que `clubs`, pero contact_name/contact_phone solo se ven si contact_public_consent es true, solo incluye clubes con suscripción activa o en prueba (Fase 10) y excluye los suspendidos por un admin (Fase 12).';

grant select on public.club_public_profiles to anon, authenticated;

-- ---------------------------------------------------------------------
-- 4. Vista pública `opportunity_search_view`, mismo filtro añadido.
-- ---------------------------------------------------------------------
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
where o.status = 'available'
  and o.archived_at is null
  and c.subscription_status in ('trialing', 'active')
  and not c.admin_suspended;

comment on view public.opportunity_search_view is 'Vista pública usada por el buscador (/buscar, Fase 7): cada fila es una oportunidad disponible y no archivada de un club con suscripción activa o en prueba (Fase 10) y no suspendido por un admin (Fase 12), con los datos de su club.';

grant select on public.opportunity_search_view to anon, authenticated;
