-- ---------------------------------------------------------------------
-- ApoyaClub — BLOQUE 2 de 4: buscador, empresas y solicitudes, dossier y suscripciones.
--
-- Pegar en Supabase -> SQL Editor -> New query -> Run, en orden.
-- Se puede repetir sin romper nada.
-- ---------------------------------------------------------------------


-- ===== 0004_search.sql =====

-- Fase 7: buscador público de oportunidades y clubes (/buscar).
--
-- Añade lo que hace falta para poder filtrar y localizar clubes desde
-- el buscador:
--   1. Coordenadas del club (`latitude`/`longitude`), rellenadas
--      automáticamente al guardar la Identidad (geocodificación con
--      OpenStreetMap/Nominatim, ver `src/lib/geocoding.ts`). Se añaden
--      también a la vista pública `club_public_profiles` (Fase 5), que
--      es la única forma en que el buscador puede leer clubes sin
--      sesión.
--   2. Tres campos nuevos en `opportunities`: `collaboration_type`
--      (dinero/producto/servicio/mixta), `objectives` (a qué público u
--      objetivo apela la oportunidad) y `period` (partido/mes/
--      temporada/evento), para poder filtrar el presupuesto por periodo
--      además de por rango de euros. El tipo de oportunidad (Fase 6) no
--      cambia: se mantienen los 6 tipos ya existentes.
--   3. Una vista pública `opportunity_search_view`, que junta cada
--      oportunidad disponible con los datos de su club (mismo patrón
--      que `club_public_profiles`): es la única consulta que hace el
--      buscador.
--   4. Índices para que el filtrado sea rápido.
--
-- Cómo aplicar esta migración: igual que las anteriores, pega el
-- contenido de este archivo en Supabase -> SQL Editor -> New query y
-- ejecútalo. Es seguro volver a ejecutarla.

-- ---------------------------------------------------------------------
-- 1. Coordenadas del club
-- ---------------------------------------------------------------------
alter table public.clubs add column if not exists latitude double precision;
alter table public.clubs add column if not exists longitude double precision;
alter table public.clubs add column if not exists geocoded_at timestamptz;

comment on column public.clubs.latitude is 'Latitud aproximada del club, geocodificada a partir de ciudad/provincia/código postal (Fase 7). Null si aún no se ha podido geocodificar.';
comment on column public.clubs.longitude is 'Longitud aproximada del club. Ver comentario de `latitude`.';
comment on column public.clubs.geocoded_at is 'Cuándo se calcularon por última vez `latitude`/`longitude`.';

create index if not exists clubs_lat_lng_idx on public.clubs (latitude, longitude);

-- ---------------------------------------------------------------------
-- 2. Campos nuevos en `opportunities`
-- ---------------------------------------------------------------------
alter table public.opportunities add column if not exists collaboration_type text;
alter table public.opportunities add column if not exists objectives text[] not null default '{}'::text[];
alter table public.opportunities add column if not exists period text;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'opportunities_collaboration_type_check'
  ) then
    alter table public.opportunities
      add constraint opportunities_collaboration_type_check
      check (collaboration_type is null or collaboration_type in ('money', 'product', 'service', 'mixed'));
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'opportunities_period_check'
  ) then
    alter table public.opportunities
      add constraint opportunities_period_check
      check (period is null or period in ('match', 'month', 'season', 'event'));
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'opportunities_objectives_check'
  ) then
    alter table public.opportunities
      add constraint opportunities_objectives_check
      check (
        objectives <@ array[
          'familias', 'jovenes', 'comunidad_local', 'deporte_femenino', 'deporte_base',
          'visibilidad', 'contenido', 'clientes', 'empleados', 'rsc'
        ]::text[]
      );
  end if;
end;
$$;

comment on column public.opportunities.collaboration_type is 'Forma de colaboración: dinero, producto, servicio o mixta (Fase 7). Opcional.';
comment on column public.opportunities.objectives is 'A qué público u objetivo apela la oportunidad (familias, jóvenes, RSC…), Fase 7. Puede estar vacío.';
comment on column public.opportunities.period is 'Periodo del presupuesto: partido, mes, temporada o evento (Fase 7). Opcional, independiente del texto libre de `duration`.';

create index if not exists opportunities_search_idx
  on public.opportunities (opportunity_type, value)
  where status = 'available' and archived_at is null;

create index if not exists opportunities_objectives_idx on public.opportunities using gin (objectives);

-- ---------------------------------------------------------------------
-- 3. Vista pública `club_public_profiles` (Fase 5): añade coordenadas
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
  created_at,
  updated_at
from public.clubs;

grant select on public.club_public_profiles to anon, authenticated;

-- ---------------------------------------------------------------------
-- 4. Vista pública `opportunity_search_view` (Fase 7)
-- ---------------------------------------------------------------------
-- Igual patrón que `club_public_profiles`: se crea con el rol propietario
-- de las tablas, así que puede juntar `opportunities` y `clubs` para
-- `anon` sin necesitar una política de RLS pública nueva sobre `clubs`.
-- Solo expone las oportunidades que ya son públicas hoy (disponibles y
-- no archivadas: mismo criterio que la política "opportunities_select_public"),
-- con los datos del club que hacen falta para el buscador.
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
where o.status = 'available' and o.archived_at is null;

comment on view public.opportunity_search_view is 'Vista pública usada por el buscador (/buscar, Fase 7): cada fila es una oportunidad disponible y no archivada, con los datos de su club.';

grant select on public.opportunity_search_view to anon, authenticated;


-- ===== 0005_company_and_contact_requests.sql =====

-- Fase 8: panel de empresa y solicitudes de contacto.
--
-- Añade:
--   1. `companies`: perfil de la empresa (nombre, sector, localidad, web,
--      presupuesto orientativo, objetivos de patrocinio). Una fila por
--      empresa, id = auth.users.id, igual que `clubs`. Se guarda con
--      upsert la primera vez (no hay un paso de registro obligatorio
--      que la cree antes, a diferencia del club).
--   2. `company_favorite_lists` y `company_favorites`: listas con
--      nombre propio en las que la empresa organiza las oportunidades
--      que guarda como favoritas.
--   3. `contact_requests`: solicitudes de contacto de una empresa a un
--      club (opcionalmente sobre una oportunidad concreta), con un
--      mensaje y un estado que gestiona el club (nueva, vista, en
--      conversación, cerrada, descartada).
--
-- Cómo aplicar esta migración: igual que las anteriores, pega el
-- contenido de este archivo en Supabase -> SQL Editor -> New query y
-- ejecútalo. Es seguro volver a ejecutarla.

-- ---------------------------------------------------------------------
-- 1. Tabla `companies`
-- ---------------------------------------------------------------------
create table if not exists public.companies (
  id uuid primary key references auth.users (id) on delete cascade,

  name text,
  sector text,
  city text,
  website text,
  -- Presupuesto orientativo (rango en euros). El club nunca ve esto como
  -- una oferta vinculante, es solo una referencia para el club al leer
  -- la solicitud.
  budget_min numeric(10, 2) check (budget_min is null or budget_min >= 0),
  budget_max numeric(10, 2) check (budget_max is null or budget_max >= 0),
  -- Mismo catálogo de objetivos que `opportunities.objectives` (Fase 7):
  -- a qué público u objetivo apela el patrocinio que busca la empresa.
  objectives text[] not null default '{}'::text[],

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.companies is 'Perfil de una empresa (Fase 8). Una fila por empresa, id = auth.users.id.';

drop trigger if exists companies_set_updated_at on public.companies;
create trigger companies_set_updated_at
  before update on public.companies
  for each row
  execute function public.set_updated_at();

alter table public.companies enable row level security;

drop policy if exists "companies_select_own" on public.companies;
create policy "companies_select_own"
  on public.companies for select
  using (auth.uid() = id);

drop policy if exists "companies_insert_own" on public.companies;
create policy "companies_insert_own"
  on public.companies for insert
  with check (auth.uid() = id);

drop policy if exists "companies_update_own" on public.companies;
create policy "companies_update_own"
  on public.companies for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- ---------------------------------------------------------------------
-- 2. Favoritos: listas y elementos guardados
-- ---------------------------------------------------------------------
create table if not exists public.company_favorite_lists (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),

  unique (company_id, name)
);

comment on table public.company_favorite_lists is 'Listas con nombre propio en las que una empresa organiza sus oportunidades favoritas (Fase 8).';

create index if not exists company_favorite_lists_company_id_idx
  on public.company_favorite_lists (company_id);

alter table public.company_favorite_lists enable row level security;

drop policy if exists "company_favorite_lists_select_own" on public.company_favorite_lists;
create policy "company_favorite_lists_select_own"
  on public.company_favorite_lists for select
  using (auth.uid() = company_id);

drop policy if exists "company_favorite_lists_insert_own" on public.company_favorite_lists;
create policy "company_favorite_lists_insert_own"
  on public.company_favorite_lists for insert
  with check (auth.uid() = company_id);

drop policy if exists "company_favorite_lists_update_own" on public.company_favorite_lists;
create policy "company_favorite_lists_update_own"
  on public.company_favorite_lists for update
  using (auth.uid() = company_id)
  with check (auth.uid() = company_id);

drop policy if exists "company_favorite_lists_delete_own" on public.company_favorite_lists;
create policy "company_favorite_lists_delete_own"
  on public.company_favorite_lists for delete
  using (auth.uid() = company_id);

create table if not exists public.company_favorites (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references auth.users (id) on delete cascade,
  list_id uuid not null references public.company_favorite_lists (id) on delete cascade,
  opportunity_id uuid not null references public.opportunities (id) on delete cascade,
  created_at timestamptz not null default now(),

  unique (list_id, opportunity_id)
);

comment on table public.company_favorites is 'Una oportunidad guardada por una empresa dentro de una de sus listas de favoritos (Fase 8).';

create index if not exists company_favorites_company_id_idx on public.company_favorites (company_id);
create index if not exists company_favorites_list_id_idx on public.company_favorites (list_id);
create index if not exists company_favorites_opportunity_id_idx on public.company_favorites (opportunity_id);

alter table public.company_favorites enable row level security;

drop policy if exists "company_favorites_select_own" on public.company_favorites;
create policy "company_favorites_select_own"
  on public.company_favorites for select
  using (auth.uid() = company_id);

-- Al insertar, además de que la fila sea de la propia empresa, la lista
-- indicada también tiene que ser suya (si no, cualquiera podría intentar
-- colar un favorito en la lista de otra empresa adivinando su id).
drop policy if exists "company_favorites_insert_own" on public.company_favorites;
create policy "company_favorites_insert_own"
  on public.company_favorites for insert
  with check (
    auth.uid() = company_id
    and exists (
      select 1 from public.company_favorite_lists l
      where l.id = list_id and l.company_id = auth.uid()
    )
  );

drop policy if exists "company_favorites_delete_own" on public.company_favorites;
create policy "company_favorites_delete_own"
  on public.company_favorites for delete
  using (auth.uid() = company_id);

-- ---------------------------------------------------------------------
-- 3. Solicitudes de contacto
-- ---------------------------------------------------------------------
create table if not exists public.contact_requests (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references auth.users (id) on delete cascade,
  club_id uuid not null references public.clubs (id) on delete cascade,
  -- Opcional: la solicitud puede ser sobre una oportunidad concreta o
  -- sobre el club en general. Si se borra la oportunidad, la solicitud
  -- no desaparece (queda sin oportunidad asociada).
  opportunity_id uuid references public.opportunities (id) on delete set null,
  message text not null,
  status text not null default 'new' check (
    status in ('new', 'seen', 'in_conversation', 'closed', 'discarded')
  ),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.contact_requests is 'Solicitud de contacto de una empresa a un club, opcionalmente sobre una oportunidad concreta (Fase 8). La plataforma solo pone en contacto: no hay chat interno ni gestión de cobros.';

drop trigger if exists contact_requests_set_updated_at on public.contact_requests;
create trigger contact_requests_set_updated_at
  before update on public.contact_requests
  for each row
  execute function public.set_updated_at();

create index if not exists contact_requests_club_id_idx on public.contact_requests (club_id, status);
create index if not exists contact_requests_company_id_idx on public.contact_requests (company_id);
create index if not exists contact_requests_opportunity_id_idx on public.contact_requests (opportunity_id);

alter table public.contact_requests enable row level security;

-- La empresa ve las solicitudes que ha enviado (sin panel dedicado
-- todavía, pero deja la puerta abierta a añadirlo más adelante sin tocar
-- la base de datos) y puede crear solicitudes propias.
drop policy if exists "contact_requests_select_company" on public.contact_requests;
create policy "contact_requests_select_company"
  on public.contact_requests for select
  using (auth.uid() = company_id);

drop policy if exists "contact_requests_insert_company" on public.contact_requests;
create policy "contact_requests_insert_company"
  on public.contact_requests for insert
  with check (auth.uid() = company_id);

-- El club ve y gestiona (cambia el estado de) las solicitudes que ha
-- recibido.
drop policy if exists "contact_requests_select_club" on public.contact_requests;
create policy "contact_requests_select_club"
  on public.contact_requests for select
  using (auth.uid() = club_id);

drop policy if exists "contact_requests_update_club" on public.contact_requests;
create policy "contact_requests_update_club"
  on public.contact_requests for update
  using (auth.uid() = club_id)
  with check (auth.uid() = club_id);


-- ===== 0006_dossier.sql =====

-- Fase 9: dossier comercial en PDF.
--
-- Crea la tabla `club_dossiers`: la configuración del dossier de cada
-- club (qué secciones y qué oportunidades incluir) y los datos de su
-- enlace público opcional (token, activo/inactivo, caducidad). El PDF
-- en sí no se guarda en ningún sitio: se genera al vuelo, tanto para la
-- descarga desde el panel como para el enlace público, a partir de esta
-- configuración y de los datos ya existentes del club (perfil,
-- equipos, patrocinadores, oportunidades). Así el dossier siempre
-- refleja los datos más recientes y no hay ningún archivo que limpiar.
--
-- Cómo aplicar esta migración: igual que las anteriores, pega el
-- contenido de este archivo en Supabase -> SQL Editor -> New query y
-- ejecútalo. Es seguro volver a ejecutarla.

create table if not exists public.club_dossiers (
  -- Una fila por club (como `clubs`/`companies`): el club solo tiene un
  -- dossier configurado a la vez.
  id uuid primary key references public.clubs (id) on delete cascade,

  -- Claves de las secciones incluidas (identidad, historia, equipos,
  -- cantera, audiencia, instalaciones, patrocinadores). Validadas en el
  -- código de la aplicación, no aquí, para no tener que tocar la base de
  -- datos si se añade o renombra alguna sección más adelante.
  sections jsonb not null default '[]'::jsonb,

  -- Ids de las oportunidades de patrocinio incluidas en el dossier.
  opportunity_ids jsonb not null default '[]'::jsonb,

  -- Enlace público opcional para compartir el dossier sin necesidad de
  -- sesión (por email o WhatsApp). `share_token` se genera solo cuando
  -- el club activa el enlace por primera vez y se renueva cada vez que
  -- lo reactiva tras haberlo desactivado, para que un enlace ya
  -- desactivado no pueda volver a funcionar por sorpresa.
  share_token text unique,
  share_enabled boolean not null default false,
  -- Null = sin fecha de caducidad.
  share_expires_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.club_dossiers is
  'Configuración del dossier comercial en PDF de un club y de su enlace público opcional (Fase 9).';

drop trigger if exists club_dossiers_set_updated_at on public.club_dossiers;
create trigger club_dossiers_set_updated_at
  before update on public.club_dossiers
  for each row
  execute function public.set_updated_at();

-- Solo el propio club gestiona la configuración de su dossier. El
-- enlace público NO se lee a través de RLS: la ruta pública
-- (`/dossier/[token]`) usa la clave de servicio, igual que ya se hace
-- en otros puntos de la app (p.ej. para leer el email de contacto del
-- club en su página pública), así que no hace falta ninguna política
-- adicional para el visitante anónimo.
alter table public.club_dossiers enable row level security;

drop policy if exists "club_dossiers_select_own" on public.club_dossiers;
create policy "club_dossiers_select_own"
  on public.club_dossiers for select
  using (auth.uid() = id);

drop policy if exists "club_dossiers_insert_own" on public.club_dossiers;
create policy "club_dossiers_insert_own"
  on public.club_dossiers for insert
  with check (auth.uid() = id);

drop policy if exists "club_dossiers_update_own" on public.club_dossiers;
create policy "club_dossiers_update_own"
  on public.club_dossiers for update
  using (auth.uid() = id)
  with check (auth.uid() = id);


-- ===== 0007_subscriptions.sql =====

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
  created_at,
  updated_at
from public.clubs
where subscription_status in ('trialing', 'active');

comment on view public.club_public_profiles is 'Vista pública de clubs (Fase 5): usada por /club/[slug]. Igual que `clubs`, pero contact_name/contact_phone solo se ven si contact_public_consent es true, y solo incluye clubes con suscripción activa o en prueba (Fase 10).';

grant select on public.club_public_profiles to anon, authenticated;

-- ---------------------------------------------------------------------
-- 3. Vista pública `opportunity_search_view` (Fase 7), mismo filtro.
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
  and c.subscription_status in ('trialing', 'active');

comment on view public.opportunity_search_view is 'Vista pública usada por el buscador (/buscar, Fase 7): cada fila es una oportunidad disponible y no archivada de un club con suscripción activa o en prueba (Fase 10), con los datos de su club.';

grant select on public.opportunity_search_view to anon, authenticated;
