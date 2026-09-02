-- ---------------------------------------------------------------------
-- ApoyaClub — BLOQUE 3 de 4: legal, admin, anti-abuso, nivel de patrocinador y permisos.
--
-- Pegar en Supabase -> SQL Editor -> New query -> Run, en orden.
-- Se puede repetir sin romper nada.
-- ---------------------------------------------------------------------


-- ===== 0008_legal_privacy.sql =====

-- Fase 11: legal, privacidad y menores.
--
-- Crea `consent_records`, un registro con fecha de cada consentimiento
-- que da un usuario (aceptación de Términos y Política de Privacidad al
-- registrarse; confirmación sobre menores al subir fotos del club). No
-- sustituye a la revisión de un abogado sobre qué debe registrarse ni
-- cuánto tiempo debe conservarse tras eliminar la cuenta: eso queda
-- señalado en el propio código como pendiente de revisión jurídica.
--
-- Cómo aplicar esta migración: pega el contenido de este archivo en
-- Supabase -> SQL Editor -> New query, y ejecútalo. Es seguro volver a
-- ejecutarlo (usa `if not exists` / `or replace` donde es posible).

-- ---------------------------------------------------------------------
-- 1. Tabla `consent_records`
-- ---------------------------------------------------------------------
create table if not exists public.consent_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  -- Identificador del consentimiento: 'terms_and_privacy' (Términos y
  -- Condiciones + Política de Privacidad, al registrarse) o
  -- 'minors_photo_upload' (confirmación al subir fotos del club sobre
  -- menores identificables, Fase 11). Se guarda como texto libre (sin
  -- `check`) para poder añadir nuevos tipos sin otra migración.
  consent_type text not null,
  -- Versión del texto aceptado (ver `src/lib/legal.ts`), para poder
  -- demostrar qué redacción concreta aceptó el usuario y cuándo.
  version text not null,
  granted_at timestamptz not null default now()
);

comment on table public.consent_records is 'Registro con fecha de los consentimientos del usuario (Fase 11): aceptación de términos/privacidad y confirmaciones sobre menores. PENDIENTE DE REVISIÓN JURÍDICA: qué se registra y cuánto se conserva tras eliminar la cuenta.';

create index if not exists consent_records_user_id_idx on public.consent_records (user_id);

alter table public.consent_records enable row level security;

-- Es un registro de auditoría: solo se puede crear y leer, nunca editar
-- ni borrar desde el cliente (ni siquiera el propio usuario).
drop policy if exists "consent_records_select_own" on public.consent_records;
create policy "consent_records_select_own"
  on public.consent_records for select
  using (auth.uid() = user_id);

drop policy if exists "consent_records_insert_own" on public.consent_records;
create policy "consent_records_insert_own"
  on public.consent_records for insert
  with check (auth.uid() = user_id);


-- ===== 0009_admin_panel.sql =====

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


-- ===== 0010_antiabuso_y_geocache.sql =====

-- ---------------------------------------------------------------------
-- Fase 15: protección anti-abuso de los formularios públicos y caché de
-- geocodificación.
--
-- Dos problemas que tenía la aplicación:
--
-- 1. Ni el formulario de contacto de la landing ni la solicitud de
--    contacto de una empresa tenían ningún límite de envíos. Un script
--    podía llenar la bandeja de un club (y la factura de Resend) en
--    minutos.
-- 2. Cada búsqueda con radio geocodificaba la ciudad llamando a
--    Nominatim (OpenStreetMap), que es gratuito pero pide como mucho una
--    petición por segundo. Una ráfaga de búsquedas anónimas bastaba para
--    que nos bloquearan la IP y el radio dejara de funcionar para todos.
--
-- Las dos tablas son de uso interno: RLS activada y ninguna política,
-- así que solo la clave de servicio (código de servidor) las toca.
-- ---------------------------------------------------------------------

-- 1. Contador de intentos por "cubo" (formulario) e identificador
--    (IP, id de empresa, email...).
create table if not exists public.rate_limit_hits (
  id bigserial primary key,
  bucket text not null,
  identifier text not null,
  created_at timestamptz not null default now()
);

create index if not exists rate_limit_hits_lookup_idx
  on public.rate_limit_hits (bucket, identifier, created_at desc);

alter table public.rate_limit_hits enable row level security;

comment on table public.rate_limit_hits is
  'Fase 15: intentos registrados para limitar los formularios públicos. Solo la clave de servicio escribe y lee aquí (RLS activa sin políticas).';

-- 2. Cuenta un intento y dice si se puede seguir adelante.
--    Devuelve true cuando queda cupo (y lo consume), false cuando se ha
--    superado el límite. De paso limpia lo que ya ha caducado para esa
--    misma clave, así que la tabla no crece indefinidamente.
create or replace function public.consume_rate_limit(
  p_bucket text,
  p_identifier text,
  p_limit integer,
  p_window_seconds integer
) returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  delete from public.rate_limit_hits
   where bucket = p_bucket
     and identifier = p_identifier
     and created_at < now() - make_interval(secs => p_window_seconds);

  select count(*)
    into v_count
    from public.rate_limit_hits
   where bucket = p_bucket
     and identifier = p_identifier
     and created_at > now() - make_interval(secs => p_window_seconds);

  if v_count >= p_limit then
    return false;
  end if;

  insert into public.rate_limit_hits (bucket, identifier) values (p_bucket, p_identifier);
  return true;
end;
$$;

comment on function public.consume_rate_limit(text, text, integer, integer) is
  'Fase 15: true si queda cupo para (bucket, identifier) en la ventana dada, consumiéndolo; false si se ha superado el límite.';

revoke all on function public.consume_rate_limit(text, text, integer, integer) from public;
revoke all on function public.consume_rate_limit(text, text, integer, integer) from anon;
revoke all on function public.consume_rate_limit(text, text, integer, integer) from authenticated;

-- 3. Caché de geocodificación: la misma ciudad no se vuelve a preguntar
--    a Nominatim. Se guardan también los fallos (`found = false`) para
--    no reintentar en bucle una dirección que no existe.
create table if not exists public.geocode_cache (
  query text primary key,
  latitude double precision,
  longitude double precision,
  found boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.geocode_cache enable row level security;

comment on table public.geocode_cache is
  'Fase 15: resultados de geocodificación (Nominatim) cacheados por texto de consulta normalizado. Solo la clave de servicio accede.';


-- ===== 0011_sponsor_level.sql =====

-- ---------------------------------------------------------------------
-- Nivel de patrocinador, exclusividad y equipo asociado.
--
-- La Fase 2 pedía estos campos en `opportunities` y se quedaron fuera al
-- implementar la Fase 6. Son justo los que una empresa usa para decidir:
-- si lo que compra es el patrocinio principal o una colaboración
-- pequeña, si lleva exclusividad en su sector, y a qué equipo del club
-- va asociado (primer equipo o un equipo concreto de cantera).
--
-- Los tres son opcionales para no invalidar nada de lo ya publicado:
-- las oportunidades que ya existen pasan a nivel "libre", que es
-- exactamente lo que eran.
-- ---------------------------------------------------------------------

alter table public.opportunities
  add column if not exists sponsor_level text not null default 'libre',
  add column if not exists exclusivity text,
  add column if not exists team_id uuid references public.club_teams (id) on delete set null;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'opportunities_sponsor_level_check'
  ) then
    alter table public.opportunities
      add constraint opportunities_sponsor_level_check
      check (sponsor_level in ('principal', 'oficial', 'colaborador', 'libre'));
  end if;
end $$;

comment on column public.opportunities.sponsor_level is
  'Nivel de patrocinador: principal (el de mayor visibilidad del club), oficial (con exclusividad de sector), colaborador o libre (sin categoría). Filtro del buscador.';
comment on column public.opportunities.exclusivity is
  'Sector en el que la oportunidad se ofrece en exclusiva, en texto libre ("automoción", "seguros"). Null = sin exclusividad.';
comment on column public.opportunities.team_id is
  'Equipo del club al que va asociada la oportunidad (club_teams). Null = al club entero.';

create index if not exists opportunities_sponsor_level_idx
  on public.opportunities (sponsor_level)
  where archived_at is null and status = 'available';

create index if not exists opportunities_team_id_idx on public.opportunities (team_id);

-- ---------------------------------------------------------------------
-- La vista del buscador expone los campos nuevos (van al final: es lo
-- único que `create or replace view` permite añadir sin recrearla).
-- El equipo se une por LEFT JOIN para que una oportunidad sin equipo
-- asociado siga apareciendo.
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
  c.longitude as club_longitude,
  o.sponsor_level,
  o.exclusivity,
  o.team_id,
  t.sport as team_sport,
  t.category as team_category,
  t.gender as team_gender,
  t.team_level as team_level
from public.opportunities o
join public.clubs c on c.id = o.club_id
left join public.club_teams t on t.id = o.team_id
where o.status = 'available'
  and o.archived_at is null
  and c.subscription_status in ('trialing', 'active')
  and not c.admin_suspended;

comment on view public.opportunity_search_view is 'Vista pública usada por el buscador (/buscar, Fase 7): cada fila es una oportunidad disponible y no archivada de un club con suscripción activa o en prueba (Fase 10) y no suspendido por un admin (Fase 12), con los datos de su club y, si la tiene, de su equipo asociado.';

grant select on public.opportunity_search_view to anon, authenticated;


-- ===== 0012_endurecer_acceso_publico.sql =====

-- ---------------------------------------------------------------------
-- Endurecer el acceso anónimo a las tablas base.
--
-- Contexto: las dos vistas públicas (`club_public_profiles` y
-- `opportunity_search_view`) se crean sin `security_invoker`, así que
-- leen las tablas base con los permisos de su propietario y se saltan
-- la RLS. Eso es deliberado y no se cambia aquí, porque es lo que
-- permite publicar una proyección recortada de `clubs`: la vista decide
-- qué columnas salen (por ejemplo, el teléfono solo si el club dio su
-- consentimiento) y qué filas (solo suscripción activa o en prueba, y no
-- suspendidos). Pasarlas a `security_invoker` obligaría a dar a `anon`
-- permiso de lectura sobre esas mismas columnas de `clubs`, con lo que
-- se podría consultar la tabla directamente y leer el teléfono sin
-- consentimiento y los identificadores de Stripe: sería peor, no mejor.
--
-- Lo que sí se corrige es que la RLS fuera el ÚNICO cerrojo sobre las
-- tablas con datos sensibles. Supabase concede por defecto SELECT a los
-- roles `anon` y `authenticated` sobre todo lo que hay en `public`, así
-- que una política mal escrita en el futuro bastaría para exponer una
-- tabla entera. Aquí se retira ese permiso a `anon` en las tablas que
-- ningún visitante sin sesión necesita leer directamente.
--
-- Lo que un visitante anónimo sigue pudiendo leer (y debe poder):
--   - las dos vistas públicas,
--   - `opportunities` (política pública: solo disponibles y no
--     archivadas),
--   - `club_teams` y `club_sponsors`, que alimentan la ficha pública.
-- ---------------------------------------------------------------------

revoke select on public.clubs from anon;
revoke select on public.companies from anon;
revoke select on public.contact_requests from anon;
revoke select on public.company_favorites from anon;
revoke select on public.company_favorite_lists from anon;
revoke select on public.club_dossiers from anon;
revoke select on public.consent_records from anon;

-- Tablas internas creadas en la migración 0010: nadie salvo el servidor
-- las toca, ni siquiera con sesión iniciada.
revoke all on public.rate_limit_hits from anon, authenticated;
revoke all on public.geocode_cache from anon, authenticated;

comment on view public.club_public_profiles is 'Vista pública de clubs (Fase 5): usada por /club/[slug]. Igual que `clubs`, pero contact_name/contact_phone solo se ven si contact_public_consent es true, solo incluye clubes con suscripción activa o en prueba (Fase 10) y excluye los suspendidos por un admin (Fase 12). Deliberadamente SECURITY DEFINER: es la única forma de publicar una proyección recortada de `clubs` sin dar acceso directo a la tabla (ver migración 0012). Al añadir una columna a esta vista se está publicando ese dato: revísalo antes.';
