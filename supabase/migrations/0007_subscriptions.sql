-- Fase 10: suscripción y pagos con Stripe.
--
-- Añade a `clubs` los campos necesarios para reflejar el estado de su
-- suscripción de Stripe, y actualiza las dos vistas públicas
-- (`club_public_profiles` y `opportunity_search_view`) para que un club
-- sin suscripción activa (ni en periodo de prueba) deje de aparecer en
-- ellas: conserva todos sus datos, pero su página pública y sus
-- oportunidades dejan de ser visibles hasta que se suscriba.
--
-- Cómo aplicar esta migración: pega el contenido de este archivo en
-- Supabase -> SQL Editor -> New query, y ejecútalo. Es seguro volver a
-- ejecutarlo (usa `if not exists` / `or replace` donde es posible).

-- ---------------------------------------------------------------------
-- 1. Columnas de suscripción en `clubs`
-- ---------------------------------------------------------------------
alter table public.clubs
  add column if not exists stripe_customer_id text,
  add column if not exists stripe_subscription_id text,
  -- Espejo de Subscription.status de Stripe: 'trialing' | 'active' |
  -- 'past_due' | 'canceled' | 'unpaid' | 'incomplete' |
  -- 'incomplete_expired' | null (nunca ha empezado ninguna suscripción).
  add column if not exists subscription_status text,
  add column if not exists trial_ends_at timestamptz,
  -- Fecha en la que termina el periodo ya pagado (o el de prueba, si
  -- todavía no se ha cobrado nada). Es la fecha que se muestra en el
  -- panel como "próxima renovación" o, si `cancel_at_period_end` es
  -- true, como fecha en la que se perderá el acceso.
  add column if not exists current_period_end timestamptz,
  add column if not exists cancel_at_period_end boolean not null default false,
  -- Marca de tiempo de cada aviso de caducidad ya enviado (7/3/1 días
  -- antes de `current_period_end`, solo cuando `cancel_at_period_end`
  -- es true). Se vacían solas si el club deshace la cancelación.
  add column if not exists reminder_7d_sent_at timestamptz,
  add column if not exists reminder_3d_sent_at timestamptz,
  add column if not exists reminder_1d_sent_at timestamptz;

comment on column public.clubs.subscription_status is 'Estado de la suscripción de Stripe (Fase 10). Null = el club nunca ha empezado a suscribirse.';
comment on column public.clubs.cancel_at_period_end is 'true si el club ha cancelado y conserva el acceso solo hasta current_period_end (Fase 10).';

-- Un mismo cliente de Stripe no debería poder asociarse a dos clubs.
create unique index if not exists clubs_stripe_customer_id_idx
  on public.clubs (stripe_customer_id)
  where stripe_customer_id is not null;

create index if not exists clubs_stripe_subscription_id_idx
  on public.clubs (stripe_subscription_id)
  where stripe_subscription_id is not null;

-- Usada por el cron de avisos de caducidad para encontrar rápido los
-- clubes con una cancelación programada.
create index if not exists clubs_cancel_at_period_end_idx
  on public.clubs (current_period_end)
  where cancel_at_period_end;

-- ---------------------------------------------------------------------
-- 2. Vista pública `club_public_profiles` (Fases 5 y 7), ahora filtrada
--    por suscripción activa o en prueba.
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
from public.clubs
where subscription_status in ('trialing', 'active');

comment on view public.club_public_profiles is 'Vista pública de clubs (Fase 5): usada por /club/[slug]. Igual que `clubs`, pero contact_name/contact_phone solo se ven si contact_public_consent es true, y solo incluye clubes con suscripción activa o en prueba (Fase 10).';

grant select on public.club_public_profiles to anon, authenticated;

-- ---------------------------------------------------------------------
-- 3. Vista pública `opportunity_search_view` (Fase 7), mismo filtro.
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
  c.longitude as club_longitude
from public.opportunities o
join public.clubs c on c.id = o.club_id
where o.status = 'available'
  and o.archived_at is null
  and c.subscription_status in ('trialing', 'active');

comment on view public.opportunity_search_view is 'Vista pública usada por el buscador (/buscar, Fase 7): cada fila es una oportunidad disponible y no archivada de un club con suscripción activa o en prueba (Fase 10), con los datos de su club.';

grant select on public.opportunity_search_view to anon, authenticated;
