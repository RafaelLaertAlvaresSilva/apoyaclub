-- ---------------------------------------------------------------------
-- ApoyaClub — todas las migraciones, de la 0001 a la 0017.
--
-- Para una base de datos nueva: Supabase -> SQL Editor -> pegar todo
-- esto -> Run.
--
-- Generado el 2026-09-02 a partir de
-- supabase/migrations/. Probado contra un PostgreSQL vacío: aplica sin
-- errores y se puede ejecutar dos veces sin romper nada.
-- ---------------------------------------------------------------------


-- =====================================================================
-- 0001_club_profile.sql
-- =====================================================================

-- Fase 4: perfil del club.
--
-- Crea la tabla `clubs` (una fila por club, con id = auth.users.id),
-- las tablas hijas `club_teams` y `club_sponsors`, el bucket de Storage
-- para logos/fotos y las políticas de RLS necesarias para que cada club
-- solo pueda leer y escribir sus propios datos.
--
-- Cómo aplicar esta migración: pega el contenido de este archivo en
-- Supabase -> SQL Editor -> New query, y ejecútalo. Es seguro volver a
-- ejecutarlo (usa `if not exists` / `or replace` donde es posible).

-- ---------------------------------------------------------------------
-- 1. Tabla `clubs`
-- ---------------------------------------------------------------------
create table if not exists public.clubs (
  id uuid primary key references auth.users (id) on delete cascade,

  -- Sección 1: identidad
  name text not null,
  city text not null,
  province text,
  postal_code text,
  facilities text,
  website text,
  social_links jsonb not null default '{}'::jsonb,
  description text,
  logo_url text,
  photo_urls text[] not null default '{}'::text[],
  video_url text,

  -- Sección 2: nivel deportivo
  top_category text,
  competitions text,
  achievements text,

  -- Sección 4: cantera (solo datos agregados)
  youth_teams_count integer,
  youth_players_count integer,
  youth_families_count integer,

  -- Sección 5: historia
  founding_year integer,
  milestones jsonb not null default '[]'::jsonb,

  -- Sección 6: audiencia
  followers_by_network jsonb not null default '{}'::jsonb,
  estimated_reach integer,
  average_attendance integer,

  -- Sección 7: comunidad
  community_actions jsonb not null default '[]'::jsonb,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.clubs is 'Perfil de un club (Fase 4). Una fila por club, id = auth.users.id.';

-- Mantiene `updated_at` al día en cada UPDATE.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists clubs_set_updated_at on public.clubs;
create trigger clubs_set_updated_at
  before update on public.clubs
  for each row
  execute function public.set_updated_at();

alter table public.clubs enable row level security;

drop policy if exists "clubs_select_own" on public.clubs;
create policy "clubs_select_own"
  on public.clubs for select
  using (auth.uid() = id);

drop policy if exists "clubs_insert_own" on public.clubs;
create policy "clubs_insert_own"
  on public.clubs for insert
  with check (
    auth.uid() = id
    and (auth.jwt() -> 'app_metadata' ->> 'role') = 'club'
  );

drop policy if exists "clubs_update_own" on public.clubs;
create policy "clubs_update_own"
  on public.clubs for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- ---------------------------------------------------------------------
-- 2. Tabla `club_teams` (Sección 3: equipos)
-- ---------------------------------------------------------------------
create table if not exists public.club_teams (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs (id) on delete cascade,
  sport text not null,
  category text,
  gender text,
  team_level text not null default 'primer_equipo' check (team_level in ('primer_equipo', 'cantera')),
  player_count integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.club_teams is 'Equipos de un club (Fase 4, sección Equipos).';

drop trigger if exists club_teams_set_updated_at on public.club_teams;
create trigger club_teams_set_updated_at
  before update on public.club_teams
  for each row
  execute function public.set_updated_at();

create index if not exists club_teams_club_id_idx on public.club_teams (club_id);

alter table public.club_teams enable row level security;

drop policy if exists "club_teams_select_own" on public.club_teams;
create policy "club_teams_select_own"
  on public.club_teams for select
  using (auth.uid() = club_id);

drop policy if exists "club_teams_insert_own" on public.club_teams;
create policy "club_teams_insert_own"
  on public.club_teams for insert
  with check (auth.uid() = club_id);

drop policy if exists "club_teams_update_own" on public.club_teams;
create policy "club_teams_update_own"
  on public.club_teams for update
  using (auth.uid() = club_id)
  with check (auth.uid() = club_id);

drop policy if exists "club_teams_delete_own" on public.club_teams;
create policy "club_teams_delete_own"
  on public.club_teams for delete
  using (auth.uid() = club_id);

-- ---------------------------------------------------------------------
-- 3. Tabla `club_sponsors` (Sección 8: patrocinadores actuales)
-- ---------------------------------------------------------------------
create table if not exists public.club_sponsors (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs (id) on delete cascade,
  name text not null,
  logo_url text,
  website text,
  created_at timestamptz not null default now()
);

comment on table public.club_sponsors is 'Patrocinadores actuales de un club (Fase 4, sección Patrocinadores).';

create index if not exists club_sponsors_club_id_idx on public.club_sponsors (club_id);

alter table public.club_sponsors enable row level security;

drop policy if exists "club_sponsors_select_own" on public.club_sponsors;
create policy "club_sponsors_select_own"
  on public.club_sponsors for select
  using (auth.uid() = club_id);

drop policy if exists "club_sponsors_insert_own" on public.club_sponsors;
create policy "club_sponsors_insert_own"
  on public.club_sponsors for insert
  with check (auth.uid() = club_id);

drop policy if exists "club_sponsors_update_own" on public.club_sponsors;
create policy "club_sponsors_update_own"
  on public.club_sponsors for update
  using (auth.uid() = club_id)
  with check (auth.uid() = club_id);

drop policy if exists "club_sponsors_delete_own" on public.club_sponsors;
create policy "club_sponsors_delete_own"
  on public.club_sponsors for delete
  using (auth.uid() = club_id);

-- ---------------------------------------------------------------------
-- 4. Storage: bucket `club-media` (logos y fotos)
-- ---------------------------------------------------------------------
-- Bucket público en lectura (las fotos/logo del club los verán las
-- empresas más adelante), pero solo el propio club puede escribir en su
-- carpeta (primer segmento de la ruta = su user id).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'club-media',
  'club-media',
  true,
  5242880, -- 5 MB, límite de seguridad además de la compresión en el navegador
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "club_media_public_read" on storage.objects;
create policy "club_media_public_read"
  on storage.objects for select
  using (bucket_id = 'club-media');

drop policy if exists "club_media_insert_own_folder" on storage.objects;
create policy "club_media_insert_own_folder"
  on storage.objects for insert
  with check (
    bucket_id = 'club-media'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "club_media_update_own_folder" on storage.objects;
create policy "club_media_update_own_folder"
  on storage.objects for update
  using (
    bucket_id = 'club-media'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "club_media_delete_own_folder" on storage.objects;
create policy "club_media_delete_own_folder"
  on storage.objects for delete
  using (
    bucket_id = 'club-media'
    and (storage.foldername(name))[1] = auth.uid()::text
  );


-- =====================================================================
-- 0002_club_public_page.sql
-- =====================================================================

-- Fase 5: página pública del club (`/club/[slug]`).
--
-- Añade:
--   1. Columna `slug` a `clubs`, asignada automáticamente (y una sola
--      vez) al crear el club, con una función que convierte el nombre
--      en una URL legible y garantiza que no se repita.
--   2. Columnas de contacto público (`contact_name`, `contact_phone`,
--      `contact_public_consent`): el club decide si quiere enseñar su
--      teléfono y nombre de contacto en la página pública. El correo de
--      contacto es siempre el de la cuenta (no se guarda aquí).
--   3. Una vista `club_public_profiles` que expone el perfil a
--      cualquier visitante (sin sesión), pero oculta `contact_name` y
--      `contact_phone` cuando el club no ha dado su autorización. Es la
--      única forma en que la página pública lee `clubs`: la tabla en sí
--      sigue restringida al propio club (RLS sin cambios).
--   4. Políticas de RLS para que `club_teams` y `club_sponsors` (sin
--      datos sensibles) también se puedan leer públicamente.
--
-- Cómo aplicar esta migración: igual que `0001_club_profile.sql`, pega
-- el contenido en Supabase -> SQL Editor -> New query y ejecútalo. Es
-- seguro volver a ejecutarla.

-- ---------------------------------------------------------------------
-- 1. Columnas nuevas
-- ---------------------------------------------------------------------
alter table public.clubs add column if not exists slug text;
alter table public.clubs add column if not exists contact_name text;
alter table public.clubs add column if not exists contact_phone text;
alter table public.clubs add column if not exists contact_public_consent boolean not null default false;

comment on column public.clubs.slug is 'Identificador único en la URL pública (/club/[slug]). Se asigna una sola vez al crear el club y no cambia aunque cambie el nombre.';
comment on column public.clubs.contact_public_consent is 'El club autoriza mostrar contact_name y contact_phone (además del correo de su cuenta) en su página pública.';

-- ---------------------------------------------------------------------
-- 2. Generación automática del slug
-- ---------------------------------------------------------------------
create or replace function public.slugify(valor text)
returns text
language sql
immutable
as $$
  select trim(both '-' from
    regexp_replace(
      translate(
        lower(valor),
        'áàäâãéèëêíìïîóòöôõúùüûñç',
        'aaaaaeeeeiiiiooooouuuunc'
      ),
      '[^a-z0-9]+', '-', 'g'
    )
  )
$$;

-- Asigna `slug` antes de insertar, solo si no viene ya informado, y
-- resuelve colisiones añadiendo -2, -3... al final.
create or replace function public.assign_club_slug()
returns trigger
language plpgsql
as $$
declare
  base_slug text;
  candidate text;
  suffix integer := 1;
begin
  if new.slug is not null and new.slug <> '' then
    return new;
  end if;

  base_slug := public.slugify(new.name);
  if base_slug is null or base_slug = '' then
    base_slug := 'club';
  end if;

  candidate := base_slug;
  while exists (select 1 from public.clubs where slug = candidate and id <> new.id) loop
    suffix := suffix + 1;
    candidate := base_slug || '-' || suffix;
  end loop;

  new.slug := candidate;
  return new;
end;
$$;

drop trigger if exists clubs_assign_slug on public.clubs;
create trigger clubs_assign_slug
  before insert on public.clubs
  for each row
  execute function public.assign_club_slug();

-- Rellena el slug de clubs que ya existieran antes de esta migración
-- (la nueva columna llega vacía y el trigger de arriba solo actúa en
-- inserciones nuevas).
do $$
declare
  fila record;
  base_slug text;
  candidate text;
  suffix integer;
begin
  for fila in select id, name from public.clubs where slug is null or slug = '' loop
    base_slug := public.slugify(fila.name);
    if base_slug is null or base_slug = '' then
      base_slug := 'club';
    end if;

    candidate := base_slug;
    suffix := 1;
    while exists (select 1 from public.clubs where slug = candidate and id <> fila.id) loop
      suffix := suffix + 1;
      candidate := base_slug || '-' || suffix;
    end loop;

    update public.clubs set slug = candidate where id = fila.id;
  end loop;
end;
$$;

alter table public.clubs alter column slug set not null;
create unique index if not exists clubs_slug_key on public.clubs (slug);

-- ---------------------------------------------------------------------
-- 3. Vista pública `club_public_profiles`
-- ---------------------------------------------------------------------
-- Se crea con el rol propietario de la tabla (el que ejecuta esta
-- migración), que en Supabase tiene permiso para saltarse las políticas
-- de RLS de `clubs`. Por eso una vista puede enseñar todas las filas a
-- `anon` sin necesidad de añadir una política pública a la tabla base:
-- la tabla sigue siendo legible solo por su dueño, y esta vista es el
-- único punto de lectura pública, con el filtro de `contact_public_consent`
-- aplicado siempre.
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

comment on view public.club_public_profiles is 'Vista pública de clubs (Fase 5): usada por /club/[slug]. Igual que `clubs`, pero contact_name/contact_phone solo se ven si contact_public_consent es true.';

grant select on public.club_public_profiles to anon, authenticated;

-- ---------------------------------------------------------------------
-- 4. Lectura pública de equipos y patrocinadores
-- ---------------------------------------------------------------------
-- Sin datos sensibles, así que aquí sí basta con una política de RLS
-- adicional sobre la tabla (se suma a las políticas "_own" existentes,
-- no las sustituye).
drop policy if exists "club_teams_select_public" on public.club_teams;
create policy "club_teams_select_public"
  on public.club_teams for select
  to anon, authenticated
  using (true);

drop policy if exists "club_sponsors_select_public" on public.club_sponsors;
create policy "club_sponsors_select_public"
  on public.club_sponsors for select
  to anon, authenticated
  using (true);


-- =====================================================================
-- 0003_opportunities.sql
-- =====================================================================

-- Fase 6: oportunidades de patrocinio.
--
-- Crea la tabla `opportunities`: el catálogo de oportunidades de
-- patrocinio que cada club publica (equipación, pabellón y partidos,
-- redes y contenido, eventos y torneos, cantera, servicios en especie).
-- El club fija libremente el valor de cada oportunidad; esta migración
-- no impone ni sugiere ningún rango de precio.
--
-- Cómo aplicar esta migración: igual que las anteriores, pega el
-- contenido de este archivo en Supabase -> SQL Editor -> New query y
-- ejecútalo. Es seguro volver a ejecutarla.

create table if not exists public.opportunities (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs (id) on delete cascade,

  title text not null,
  description text,
  opportunity_type text not null check (
    opportunity_type in (
      'equipment',
      'venue_matches',
      'social_content',
      'events_tournaments',
      'youth',
      'in_kind'
    )
  ),
  status text not null default 'available' check (status in ('available', 'reserved', 'closed')),
  -- El club fija el valor libremente: sin rango mínimo ni máximo, solo
  -- se exige que no sea negativo.
  value numeric(10, 2) not null check (value >= 0),
  duration text,

  -- No nulo = oportunidad archivada (oculta del catálogo público y, por
  -- defecto, del listado principal del panel; no se borra).
  archived_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.opportunities is 'Catálogo de oportunidades de patrocinio de un club (Fase 6).';

drop trigger if exists opportunities_set_updated_at on public.opportunities;
create trigger opportunities_set_updated_at
  before update on public.opportunities
  for each row
  execute function public.set_updated_at();

create index if not exists opportunities_club_id_idx on public.opportunities (club_id);
create index if not exists opportunities_public_idx
  on public.opportunities (club_id, status)
  where archived_at is null;

alter table public.opportunities enable row level security;

-- El propio club ve y gestiona todas sus oportunidades (incluidas
-- reservadas, cerradas y archivadas).
drop policy if exists "opportunities_select_own" on public.opportunities;
create policy "opportunities_select_own"
  on public.opportunities for select
  using (auth.uid() = club_id);

drop policy if exists "opportunities_insert_own" on public.opportunities;
create policy "opportunities_insert_own"
  on public.opportunities for insert
  with check (auth.uid() = club_id);

drop policy if exists "opportunities_update_own" on public.opportunities;
create policy "opportunities_update_own"
  on public.opportunities for update
  using (auth.uid() = club_id)
  with check (auth.uid() = club_id);

drop policy if exists "opportunities_delete_own" on public.opportunities;
create policy "opportunities_delete_own"
  on public.opportunities for delete
  using (auth.uid() = club_id);

-- Lectura pública: solo las oportunidades disponibles y no archivadas
-- (la página pública del club, Fase 5). Sin datos sensibles, así que
-- basta con una política adicional sobre la propia tabla, igual que en
-- `club_teams`/`club_sponsors`.
drop policy if exists "opportunities_select_public" on public.opportunities;
create policy "opportunities_select_public"
  on public.opportunities for select
  to anon, authenticated
  using (status = 'available' and archived_at is null);


-- =====================================================================
-- 0004_search.sql
-- =====================================================================

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


-- =====================================================================
-- 0005_company_and_contact_requests.sql
-- =====================================================================

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


-- =====================================================================
-- 0006_dossier.sql
-- =====================================================================

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


-- =====================================================================
-- 0007_subscriptions.sql
-- =====================================================================

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


-- =====================================================================
-- 0008_legal_privacy.sql
-- =====================================================================

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


-- =====================================================================
-- 0009_admin_panel.sql
-- =====================================================================

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


-- =====================================================================
-- 0010_antiabuso_y_geocache.sql
-- =====================================================================

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


-- =====================================================================
-- 0011_sponsor_level.sql
-- =====================================================================

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


-- =====================================================================
-- 0012_endurecer_acceso_publico.sql
-- =====================================================================

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


-- =====================================================================
-- 0013_emails_del_ciclo.sql
-- =====================================================================

-- ---------------------------------------------------------------------
-- Emails del ciclo de vida.
--
-- Hasta ahora solo salían tres emails: nueva solicitud al club, aviso de
-- caducidad tras cancelar, y el formulario de contacto de la landing.
-- Faltaban justo los que sostienen la retención:
--
--   - bienvenida cuando alguien confirma su cuenta,
--   - aviso a la empresa cuando el club responde a su solicitud,
--   - recordatorio al club de solicitudes sin abrir a las 48 horas,
--   - aviso de fin de la prueba gratuita (el anterior solo avisaba a
--     quien ya había cancelado).
--
-- Todo lo que se envía una sola vez se apunta aquí para no repetirlo.
-- ---------------------------------------------------------------------

create table if not exists public.email_log (
  user_id uuid not null,
  -- 'welcome_club', 'welcome_empresa', 'trial_3d', 'trial_1d'…
  kind text not null,
  sent_at timestamptz not null default now(),
  primary key (user_id, kind)
);

alter table public.email_log enable row level security;

comment on table public.email_log is
  'Emails de una sola vez ya enviados a un usuario (bienvenida, avisos de fin de prueba). Solo lo escribe el servidor con la clave de servicio: RLS activa y sin políticas.';

create index if not exists email_log_kind_idx on public.email_log (kind, sent_at desc);

-- El recordatorio de solicitud sin abrir es por solicitud, no por
-- usuario, así que vive en la propia fila.
alter table public.contact_requests
  add column if not exists unread_reminder_sent_at timestamptz;

comment on column public.contact_requests.unread_reminder_sent_at is
  'Cuándo se recordó al club que esta solicitud seguía sin abrir (48 h). Null = todavía no se ha recordado.';

create index if not exists contact_requests_sin_abrir_idx
  on public.contact_requests (created_at)
  where status = 'new' and unread_reminder_sent_at is null;


-- =====================================================================
-- 0014_metricas_del_club.sql
-- =====================================================================

-- ---------------------------------------------------------------------
-- Métricas del club: qué recibe a cambio de sus 29,90 €.
--
-- El riesgo del negocio no es que un club no se registre, es que pague
-- tres meses, no vea nada y se dé de baja. La plataforma ya sabía
-- cuántas búsquedas se hacían (`search_logs`, Fase 12), pero el club no
-- veía nada de eso: ni cuántas veces había aparecido, ni cuántas visitas
-- tenía su página.
--
-- Tres tablas de eventos, deliberadamente tontas (una fila por evento,
-- sin datos personales ni de sesión): así se puede contar por periodos
-- sin tener que decidir hoy qué agregados harán falta mañana.
-- ---------------------------------------------------------------------

-- 1. Visitas a la página pública del club.
create table if not exists public.club_page_views (
  id bigserial primary key,
  club_id uuid not null references public.clubs (id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists club_page_views_club_idx
  on public.club_page_views (club_id, created_at desc);

alter table public.club_page_views enable row level security;

comment on table public.club_page_views is
  'Una fila por visita a /club/[slug]. Sin IP ni identificador de usuario: solo el club y la fecha. Se deduplica por IP y hora antes de insertar (lib/rate-limit).';

-- 2. Apariciones del club en resultados de búsqueda.
create table if not exists public.club_search_appearances (
  id bigserial primary key,
  club_id uuid not null references public.clubs (id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists club_search_appearances_club_idx
  on public.club_search_appearances (club_id, created_at desc);

alter table public.club_search_appearances enable row level security;

comment on table public.club_search_appearances is
  'Una fila por cada vez que una oportunidad del club sale en la primera página de una búsqueda.';

-- 3. Aperturas del dossier compartido por enlace público.
create table if not exists public.dossier_views (
  id bigserial primary key,
  club_id uuid not null references public.clubs (id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists dossier_views_club_idx
  on public.dossier_views (club_id, created_at desc);

alter table public.dossier_views enable row level security;

comment on table public.dossier_views is
  'Una fila por apertura del enlace público del dossier de un club.';

-- Las tres las escribe y las lee el servidor con la clave de servicio
-- (RLS activa y sin políticas): el club ve sus números ya agregados en
-- el panel, no la tabla de eventos.


-- =====================================================================
-- 0015_plantillas_oportunidad.sql
-- =====================================================================

-- ---------------------------------------------------------------------
-- Plantillas de oportunidad en base de datos.
--
-- Hasta ahora eran una lista fija dentro de `lib/opportunities.ts`: para
-- añadir una idea nueva había que tocar el código y desplegar, y las
-- buenas ideas de un club no le servían a nadie más.
--
-- La tabla nace con las mismas plantillas que había (created_by null =
-- plantilla de la plataforma) y deja la puerta abierta a que un club
-- comparta las suyas.
-- ---------------------------------------------------------------------

create table if not exists public.opportunity_templates (
  id uuid primary key default gen_random_uuid(),
  opportunity_type text not null check (
    opportunity_type in (
      'equipment',
      'venue_matches',
      'social_content',
      'events_tournaments',
      'youth',
      'in_kind'
    )
  ),
  title text not null,
  description text,
  -- Club que la compartió. Null = plantilla de la propia plataforma.
  created_by uuid references public.clubs (id) on delete set null,
  is_public boolean not null default true,
  created_at timestamptz not null default now()
);

comment on table public.opportunity_templates is
  'Plantillas para crear una oportunidad sin partir de cero. created_by null = las de la plataforma; con valor = las que ha compartido un club.';

-- Sin duplicados: ni dos plantillas iguales de la plataforma, ni que un
-- club comparta dos veces la misma.
create unique index if not exists opportunity_templates_plataforma_idx
  on public.opportunity_templates (opportunity_type, title)
  where created_by is null;

create unique index if not exists opportunity_templates_club_idx
  on public.opportunity_templates (created_by, opportunity_type, title)
  where created_by is not null;

create index if not exists opportunity_templates_publicas_idx
  on public.opportunity_templates (opportunity_type)
  where is_public;

alter table public.opportunity_templates enable row level security;

-- Cualquier club con sesión ve las públicas y siempre las suyas.
drop policy if exists "opportunity_templates_select" on public.opportunity_templates;
create policy "opportunity_templates_select"
  on public.opportunity_templates for select
  to authenticated
  using (is_public or created_by = auth.uid());

-- Un club solo puede compartir plantillas a su nombre, y retirarlas.
drop policy if exists "opportunity_templates_insert_own" on public.opportunity_templates;
create policy "opportunity_templates_insert_own"
  on public.opportunity_templates for insert
  to authenticated
  with check (created_by = auth.uid());

drop policy if exists "opportunity_templates_delete_own" on public.opportunity_templates;
create policy "opportunity_templates_delete_own"
  on public.opportunity_templates for delete
  to authenticated
  using (created_by = auth.uid());

-- Las mismas plantillas que estaban escritas en el código.
insert into public.opportunity_templates (opportunity_type, title, description) values
  ('equipment', 'Patrocinador de la camiseta principal', 'Tu logo en la parte delantera de la camiseta del primer equipo durante toda la temporada.'),
  ('equipment', 'Camiseta de entrenamiento de la cantera', 'Tu marca en las camisetas de entrenamiento de uno o varios equipos de cantera.'),
  ('equipment', 'Patrocinador del chándal o la bolsa de deporte', 'Tu logo en el chándal, la bolsa o la equipación de calle del equipo.'),
  ('venue_matches', 'Patrocinio del descanso de los partidos de casa', 'Mención y presencia de tu marca durante el descanso de cada partido que el club juega en casa.'),
  ('venue_matches', 'Naming del pabellón o campo', 'Tu marca en el nombre del recinto deportivo del club durante la temporada.'),
  ('venue_matches', 'Publicidad estática en el terreno de juego', 'Una valla o lona con tu marca visible durante los partidos de casa.'),
  ('social_content', 'Marca patrocinadora en redes sociales', 'Menciones y tu logo en las publicaciones del club durante toda la temporada.'),
  ('social_content', 'Vídeo o reel patrocinado', 'Una pieza de contenido en redes dedicada a presentar tu marca a la comunidad del club.'),
  ('events_tournaments', 'Patrocinador oficial de un torneo', 'Tu marca asociada a un torneo o evento puntual organizado por el club.'),
  ('events_tournaments', 'Photocall con tu marca en la presentación de la temporada', 'Presencia de tu marca en el evento de presentación de equipos ante la afición.'),
  ('youth', 'Equipación de un equipo de cantera', 'Patrocinio íntegro de un equipo de las categorías inferiores del club.'),
  ('youth', 'Beca deportiva para familias de la cantera', 'Ayuda a que una familia pueda mantener a su hijo o hija en el club durante la temporada.'),
  ('in_kind', 'Colaboración en especie con material deportivo', 'Aportación de material, equipación o productos en lugar de una aportación económica.'),
  ('in_kind', 'Servicios profesionales para el club', 'Un servicio (fisioterapia, transporte, catering, imprenta…) a cambio de visibilidad para tu marca.')
on conflict do nothing;


-- =====================================================================
-- 0016_servicios_que_busca_el_club.sql
-- =====================================================================

-- ---------------------------------------------------------------------
-- Servicios que el club necesita.
--
-- Hasta ahora la plataforma solo contemplaba una dirección: el club
-- ofrece visibilidad y la empresa paga por ella. Pero un club también
-- necesita cosas —fisioterapia, transporte, imprenta, comidas de
-- equipo— y hay muchas empresas pequeñas que no tienen presupuesto de
-- patrocinio pero sí un servicio que ofrecer a cambio de visibilidad.
--
-- Ese es el camino de entrada más fácil para una empresa local, y es
-- una de las ideas originales del proyecto que se había quedado fuera.
-- ---------------------------------------------------------------------

create table if not exists public.club_service_needs (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs (id) on delete cascade,

  -- Categoría del catálogo (ver `lib/service-needs.ts`): salud,
  -- transporte, hosteleria, material, imprenta, formacion, otros.
  category text not null,
  title text not null,
  description text,

  -- 'open' = lo sigue buscando; 'covered' = ya lo tiene cubierto.
  status text not null default 'open' check (status in ('open', 'covered')),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists club_service_needs_club_idx on public.club_service_needs (club_id);
create index if not exists club_service_needs_abiertos_idx
  on public.club_service_needs (category)
  where status = 'open';

drop trigger if exists set_club_service_needs_updated_at on public.club_service_needs;
create trigger set_club_service_needs_updated_at
  before update on public.club_service_needs
  for each row execute function public.set_updated_at();

alter table public.club_service_needs enable row level security;

-- El club gestiona los suyos.
drop policy if exists "club_service_needs_select_own" on public.club_service_needs;
create policy "club_service_needs_select_own"
  on public.club_service_needs for select
  using (auth.uid() = club_id);

drop policy if exists "club_service_needs_insert_own" on public.club_service_needs;
create policy "club_service_needs_insert_own"
  on public.club_service_needs for insert
  with check (auth.uid() = club_id);

drop policy if exists "club_service_needs_update_own" on public.club_service_needs;
create policy "club_service_needs_update_own"
  on public.club_service_needs for update
  using (auth.uid() = club_id)
  with check (auth.uid() = club_id);

drop policy if exists "club_service_needs_delete_own" on public.club_service_needs;
create policy "club_service_needs_delete_own"
  on public.club_service_needs for delete
  using (auth.uid() = club_id);

-- ---------------------------------------------------------------------
-- Vista pública: lo que ve una empresa sin sesión.
--
-- Mismo criterio que las demás vistas públicas (migración 0012): solo
-- clubes con suscripción activa o en prueba y no suspendidos, y solo las
-- necesidades que siguen abiertas. Es una proyección recortada, por eso
-- es SECURITY DEFINER y las tablas base siguen cerradas a `anon`.
-- ---------------------------------------------------------------------
-- Se borra antes de recrearla: `create or replace view` no permite
-- cambiar el orden de las columnas, y aquí se añaden en medio.
drop view if exists public.club_service_needs_public cascade;

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
  and not c.admin_suspended;

comment on view public.club_service_needs_public is
  'Servicios que buscan los clubes visibles (/servicios y la ficha del club). Solo necesidades abiertas de clubes con suscripción activa o en prueba y no suspendidos.';

grant select on public.club_service_needs_public to anon, authenticated;


-- =====================================================================
-- 0017_oportunidades_por_plazas.sql
-- =====================================================================

-- ---------------------------------------------------------------------
-- Oportunidades repartidas entre varias empresas.
--
-- La idea original del proyecto: un evento con un coste total que se
-- reparte entre varios patrocinadores. "Buscamos 10 empresas que pongan
-- 100 € cada una para el torneo de Navidad; cada una sale en la lona, en
-- el cartel y en redes". Hasta ahora una oportunidad solo podía cerrarse
-- con una empresa, así que estas se publicaban a mano o no se publicaban.
--
-- Deliberadamente sin automatismos: la plataforma no reserva plazas ni
-- cobra nada. El club marca cuántas lleva cubiertas, igual que marca una
-- oportunidad como reservada o cerrada.
-- ---------------------------------------------------------------------

alter table public.opportunities
  add column if not exists slots_total integer,
  add column if not exists slots_taken integer not null default 0;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'opportunities_slots_check') then
    alter table public.opportunities
      add constraint opportunities_slots_check
      check (
        (slots_total is null and slots_taken = 0)
        or (slots_total >= 2 and slots_taken >= 0 and slots_taken <= slots_total)
      );
  end if;
end $$;

comment on column public.opportunities.slots_total is
  'Número de patrocinadores que busca esta oportunidad. Null = un único patrocinador (el caso normal). A partir de 2, se muestra como plazas y el valor es lo que aporta cada empresa.';
comment on column public.opportunities.slots_taken is
  'Plazas ya cubiertas, que lleva el club a mano. La plataforma no reserva ni cobra nada.';

-- La vista del buscador expone las dos columnas (al final, que es lo
-- único que permite `create or replace view`).
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
  t.team_level as team_level,
  o.slots_total,
  o.slots_taken
from public.opportunities o
join public.clubs c on c.id = o.club_id
left join public.club_teams t on t.id = o.team_id
where o.status = 'available'
  and o.archived_at is null
  and c.subscription_status in ('trialing', 'active')
  and not c.admin_suspended;

grant select on public.opportunity_search_view to anon, authenticated;
