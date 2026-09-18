-- ---------------------------------------------------------------------
-- ApoyaClub: TODAS las migraciones, en orden, en un solo archivo.
-- Para una base de datos nueva y vacia. Se puede repetir sin romper nada.
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


-- =====================================================================
-- 0018_mes_gratis_sin_tarjeta.sql
-- =====================================================================
-- ---------------------------------------------------------------------
-- El mes gratis empieza al crear el club, sin pasar por Stripe.
--
-- Hasta ahora `subscription_status` se quedaba en null hasta que el club
-- pasaba por el checkout, y las vistas públicas solo muestran clubes en
-- prueba o activos. Resultado: un club recién registrado no aparecía ni
-- en su propia página ni en el buscador, y para verse tenía que poner
-- una tarjeta. Justo lo contrario de lo que dice la oferta ("1 mes
-- gratis") y de lo que hace falta para enseñárselo a los primeros
-- clubes.
--
-- Con esto, al crearse la ficha del club empieza su mes de prueba. Si
-- después se suscribe, el webhook de Stripe manda: escribe el estado
-- real de la suscripción encima.
-- ---------------------------------------------------------------------

create or replace function public.iniciar_prueba_gratuita()
returns trigger
language plpgsql
as $$
begin
  -- Solo si nadie ha dicho lo contrario: si la fila llega ya con estado
  -- (por ejemplo desde el webhook de Stripe o desde los datos de
  -- prueba), se respeta tal cual.
  if new.subscription_status is null then
    new.subscription_status := 'trialing';
    new.trial_ends_at := coalesce(new.trial_ends_at, now() + interval '30 days');
    new.current_period_end := coalesce(new.current_period_end, new.trial_ends_at);
  end if;

  return new;
end;
$$;

comment on function public.iniciar_prueba_gratuita() is
  'Arranca el mes gratis al crear la ficha de un club, sin tarjeta ni Stripe (migración 0018).';

drop trigger if exists clubs_iniciar_prueba on public.clubs;
create trigger clubs_iniciar_prueba
  before insert on public.clubs
  for each row execute function public.iniciar_prueba_gratuita();

-- Los clubes que ya existían sin estado también entran en su mes
-- gratis: hasta ahora estaban invisibles sin saberlo.
update public.clubs
   set subscription_status = 'trialing',
       trial_ends_at = coalesce(trial_ends_at, now() + interval '30 days'),
       current_period_end = coalesce(current_period_end, now() + interval '30 days')
 where subscription_status is null;


-- =====================================================================
-- 0019_patrocinadores_clasificados.sql
-- =====================================================================
-- ---------------------------------------------------------------------
-- Patrocinadores actuales del club: categoría, texto y orden.
--
-- Hasta ahora `club_sponsors` solo guardaba nombre, logo y web. Eso
-- basta para una lista, pero no para lo que de verdad hace falta:
--
--   1. Que el club pueda enseñar su "muro de patrocinadores" agrupado
--      por importancia (principal, oficial, colaborador), igual que
--      aparece en una lona o en un dossier de verdad.
--   2. Que pueda escribir dos líneas sobre cada empresa — desde cuándo
--      colabora, qué aporta — que es lo que convierte un logo suelto en
--      una prueba social utilizable.
--
-- Esto además alimenta la estrategia de arranque: cada club que sube a
-- sus patrocinadores actuales mete en la plataforma empresas reales que
-- ya han patrocinado deporte, sin coste de captación.
--
-- Los cuatro niveles son los mismos que ya usa `opportunities.sponsor_level`
-- (migración 0011) para que la ficha del club y sus oportunidades hablen
-- el mismo idioma, más un nivel libre con etiqueta propia para el club
-- que use otra nomenclatura ("Patrocinador técnico", "Proveedor oficial").
-- ---------------------------------------------------------------------

alter table public.club_sponsors
  add column if not exists tier text not null default 'colaborador',
  add column if not exists tier_label text,
  add column if not exists description text,
  add column if not exists since_year int,
  add column if not exists sort_order int not null default 0;

-- Nivel dentro de un catálogo cerrado. 'otro' es la vía de escape: el
-- club escribe su propia etiqueta en `tier_label`.
alter table public.club_sponsors drop constraint if exists club_sponsors_tier_check;
alter table public.club_sponsors
  add constraint club_sponsors_tier_check
  check (tier in ('principal', 'oficial', 'colaborador', 'otro'));

-- La etiqueta libre solo tiene sentido en el nivel 'otro', y ahí es
-- obligatoria: un nivel "otro" sin nombre no se puede pintar.
alter table public.club_sponsors drop constraint if exists club_sponsors_tier_label_check;
alter table public.club_sponsors
  add constraint club_sponsors_tier_label_check
  check (
    (tier = 'otro' and tier_label is not null and length(btrim(tier_label)) between 1 and 40)
    or (tier <> 'otro' and tier_label is null)
  );

alter table public.club_sponsors drop constraint if exists club_sponsors_description_check;
alter table public.club_sponsors
  add constraint club_sponsors_description_check
  check (description is null or length(description) <= 400);

alter table public.club_sponsors drop constraint if exists club_sponsors_since_year_check;
alter table public.club_sponsors
  add constraint club_sponsors_since_year_check
  check (since_year is null or since_year between 1900 and 2100);

comment on column public.club_sponsors.tier is
  'Categoría del patrocinador: principal, oficial, colaborador u otro (etiqueta libre en tier_label).';
comment on column public.club_sponsors.tier_label is
  'Etiqueta propia del club cuando tier = ''otro'' (ej. "Patrocinador técnico"). Null en el resto de niveles.';
comment on column public.club_sponsors.description is
  'Dos líneas sobre la colaboración, escritas por el club. Se enseñan en la ficha pública.';
comment on column public.club_sponsors.since_year is
  'Año en que empezó a patrocinar, opcional. "Con nosotros desde 2019" vale más que un logo suelto.';
comment on column public.club_sponsors.sort_order is
  'Orden manual dentro de su categoría. A igualdad, se ordena por fecha de alta.';

-- Orden de pintado: primero por categoría, luego por el orden que haya
-- decidido el club. El índice cubre la consulta de la ficha pública.
create index if not exists club_sponsors_orden_idx
  on public.club_sponsors (club_id, tier, sort_order, created_at);

-- No hay cambios de RLS: las políticas de 0001 (el club gestiona los
-- suyos) y la de lectura pública de 0002 siguen valiendo tal cual,
-- porque son a nivel de fila y estas columnas van dentro de la fila.


-- =====================================================================
-- 0020_visibilidad_por_perfil_completo.sql
-- =====================================================================
-- ---------------------------------------------------------------------
-- La información completa da visibilidad.
--
-- Hasta ahora el porcentaje de perfil completado se calculaba en el
-- código de la app y solo servía para pintar una barra en el panel: era
-- un adorno. El club no tenía ningún motivo real para terminar su ficha.
--
-- Aquí ese porcentaje pasa a vivir en la base de datos (`clubs.profile_score`),
-- se mantiene solo mediante triggers, y entra en el orden del buscador:
-- a igualdad de todo lo demás, sale antes el club que ha contado más
-- cosas de sí mismo. Es lo que hace verdad la frase que se le enseña al
-- club: "cuanta más información, más visibilidad".
--
-- Se calcula como la media del progreso de ocho secciones, para que
-- ninguna pese más que las demás: un club con veinte fotos y nada más no
-- adelanta a uno que ha rellenado cantera, audiencia y patrocinadores.
-- ---------------------------------------------------------------------

alter table public.clubs
  add column if not exists profile_score int not null default 0;

comment on column public.clubs.profile_score is
  'Porcentaje (0-100) de ficha rellenada. Lo mantienen triggers; es la única definición del dato, la usan tanto el panel del club como el orden del buscador.';

-- ---------------------------------------------------------------------
-- 1. Cálculo
-- ---------------------------------------------------------------------
create or replace function public.calcular_profile_score(p_club_id uuid)
returns int
language sql
stable
security definer
set search_path = public
as $$
  with club as (
    select * from public.clubs where id = p_club_id
  ),
  secciones as (
    select unnest(array[
      -- 1. Identidad: quién es y qué cara tiene.
      (
        (c.logo_url is not null)::int +
        (coalesce(array_length(c.photo_urls, 1), 0) > 0)::int +
        (c.video_url is not null)::int +
        (c.description is not null)::int +
        (c.website is not null)::int +
        (c.social_links <> '{}'::jsonb)::int
      )::numeric / 6,
      -- 2. Nivel deportivo.
      (
        (c.top_category is not null)::int +
        (c.competitions is not null)::int +
        (c.achievements is not null)::int
      )::numeric / 3,
      -- 3. Equipos.
      (exists (select 1 from public.club_teams t where t.club_id = c.id))::int::numeric,
      -- 4. Cantera.
      (
        (c.youth_teams_count is not null)::int +
        (c.youth_players_count is not null)::int +
        (c.youth_families_count is not null)::int
      )::numeric / 3,
      -- 5. Historia.
      (
        (c.founding_year is not null)::int +
        (c.milestones <> '[]'::jsonb)::int
      )::numeric / 2,
      -- 6. Audiencia.
      (
        (c.followers_by_network <> '{}'::jsonb)::int +
        (c.estimated_reach is not null)::int +
        (c.average_attendance is not null)::int
      )::numeric / 3,
      -- 7. Comunidad.
      (c.community_actions <> '[]'::jsonb)::int::numeric,
      -- 8. Patrocinadores actuales.
      (exists (select 1 from public.club_sponsors s where s.club_id = c.id))::int::numeric
    ]) as fraccion
    from club c
  )
  select coalesce(round(avg(fraccion) * 100)::int, 0) from secciones;
$$;

comment on function public.calcular_profile_score(uuid) is
  'Media del progreso de las ocho secciones de la ficha, en porcentaje entero.';

-- ---------------------------------------------------------------------
-- 2. Mantenimiento automático
-- ---------------------------------------------------------------------

-- a) Cuando cambia la propia fila del club, se recalcula antes de
--    escribirla: así el valor viaja en el mismo UPDATE y no hace falta
--    una segunda escritura (que además reentraría en el trigger).
create or replace function public.refrescar_profile_score_propio()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.profile_score := (
    select coalesce(round(avg(fraccion) * 100)::int, 0)
    from unnest(array[
      (
        (new.logo_url is not null)::int +
        (coalesce(array_length(new.photo_urls, 1), 0) > 0)::int +
        (new.video_url is not null)::int +
        (new.description is not null)::int +
        (new.website is not null)::int +
        (new.social_links <> '{}'::jsonb)::int
      )::numeric / 6,
      (
        (new.top_category is not null)::int +
        (new.competitions is not null)::int +
        (new.achievements is not null)::int
      )::numeric / 3,
      (exists (select 1 from public.club_teams t where t.club_id = new.id))::int::numeric,
      (
        (new.youth_teams_count is not null)::int +
        (new.youth_players_count is not null)::int +
        (new.youth_families_count is not null)::int
      )::numeric / 3,
      (
        (new.founding_year is not null)::int +
        (new.milestones <> '[]'::jsonb)::int
      )::numeric / 2,
      (
        (new.followers_by_network <> '{}'::jsonb)::int +
        (new.estimated_reach is not null)::int +
        (new.average_attendance is not null)::int
      )::numeric / 3,
      (new.community_actions <> '[]'::jsonb)::int::numeric,
      (exists (select 1 from public.club_sponsors s where s.club_id = new.id))::int::numeric
    ]) as fraccion
  );
  return new;
end;
$$;

drop trigger if exists clubs_refrescar_score on public.clubs;
create trigger clubs_refrescar_score
  before insert or update on public.clubs
  for each row execute function public.refrescar_profile_score_propio();

-- b) Cuando cambian las tablas hijas, se recalcula la fila del club.
create or replace function public.refrescar_profile_score_del_padre()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_club_id uuid := coalesce(new.club_id, old.club_id);
begin
  update public.clubs
     set profile_score = public.calcular_profile_score(v_club_id)
   where id = v_club_id;
  return coalesce(new, old);
end;
$$;

drop trigger if exists club_teams_refrescar_score on public.club_teams;
create trigger club_teams_refrescar_score
  after insert or delete on public.club_teams
  for each row execute function public.refrescar_profile_score_del_padre();

drop trigger if exists club_sponsors_refrescar_score on public.club_sponsors;
create trigger club_sponsors_refrescar_score
  after insert or delete on public.club_sponsors
  for each row execute function public.refrescar_profile_score_del_padre();

-- c) Puesta al día de lo que ya existe.
update public.clubs set profile_score = public.calcular_profile_score(id);

-- ---------------------------------------------------------------------
-- 3. El buscador lo tiene en cuenta
-- ---------------------------------------------------------------------
-- Se añade la columna a la vista pública de búsqueda para poder ordenar
-- por ella. Se redondea a decenas al ordenar (en el código de la app),
-- no aquí: así un 71 % y un 78 % se consideran iguales y desempata la
-- novedad, en vez de premiar diferencias que no significan nada.
drop view if exists public.opportunity_search_view cascade;

create view public.opportunity_search_view as
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
  -- Redondeo a decenas: un 71 % y un 78 % se consideran igual de
  -- completos y desempata la novedad. Así el orden premia terminar
  -- secciones, no rellenar un campo suelto para adelantar a otro club.
  (c.profile_score / 10) as club_visibility_bucket
from public.opportunities o
join public.clubs c on c.id = o.club_id
left join public.club_teams t on t.id = o.team_id
where o.status = 'available'
  and o.archived_at is null
  and c.subscription_status in ('trialing', 'active')
  and not c.admin_suspended;

comment on view public.opportunity_search_view is
  'Oportunidades visibles en el buscador, con los datos del club ya unidos. SECURITY DEFINER a propósito (ver 0012): expone solo columnas públicas de `clubs`.';

grant select on public.opportunity_search_view to anon, authenticated;

-- Índice para el orden por visibilidad del buscador.
create index if not exists clubs_profile_score_idx on public.clubs (profile_score desc);


-- =====================================================================
-- 0021_planes_de_precio.sql
-- =====================================================================
-- ---------------------------------------------------------------------
-- Tres planes en vez de uno.
--
-- Hasta ahora solo existía la cuota mensual de 29,90 €. El problema no
-- es el precio (es el más bajo del mercado español de software para
-- clubes), sino el ritmo de cobro: el patrocinio es estacional y una
-- junta directiva aprueba gastos una vez al año, no cada mes. Un club
-- que paga mes a mes se da de baja en enero, cuando no está buscando
-- patrocinadores.
--
--   mensual    29,90 €/mes  IVA incl.  — sigue existiendo
--   temporada  249 €/año    IVA incl.  — el que se quiere vender
--   fundador   199 €/año    IVA incl.  — solo las 50 primeras plazas,
--                                        precio congelado de por vida
--
-- El plan se guarda aquí, no solo en Stripe, porque hace falta para el
-- área financiera del administrador y para saber cuántas plazas de
-- fundador quedan sin tener que preguntárselo a Stripe en cada visita.
-- ---------------------------------------------------------------------

alter table public.clubs
  add column if not exists plan text,
  add column if not exists founder_number int;

alter table public.clubs drop constraint if exists clubs_plan_check;
alter table public.clubs
  add constraint clubs_plan_check
  check (plan is null or plan in ('mensual', 'temporada', 'fundador'));

-- Dos clubes no pueden ser el mismo número de fundador.
create unique index if not exists clubs_founder_number_idx
  on public.clubs (founder_number)
  where founder_number is not null;

comment on column public.clubs.plan is
  'Plan contratado: mensual, temporada o fundador. Null mientras está en el mes gratis sin haber elegido.';
comment on column public.clubs.founder_number is
  'Número de plaza de fundador (1-50). Se asigna al contratar el plan fundador y no se libera aunque el club se dé de baja: la plaza se gastó.';

-- ---------------------------------------------------------------------
-- Plazas de fundador
-- ---------------------------------------------------------------------
-- El número total vive en la base de datos y no en el código para poder
-- ampliarlo sin desplegar, que es justo la decisión que se querrá tomar
-- deprisa si las 50 se agotan.
create table if not exists public.plataforma_ajustes (
  clave text primary key,
  valor int not null,
  actualizado_en timestamptz not null default now()
);

comment on table public.plataforma_ajustes is
  'Ajustes numéricos de la plataforma que el administrador puede cambiar sin desplegar código.';

insert into public.plataforma_ajustes (clave, valor)
values ('plazas_fundador', 50)
on conflict (clave) do nothing;

alter table public.plataforma_ajustes enable row level security;
-- Sin políticas: solo la clave de servicio la lee y la escribe.

/**
 * Reserva la siguiente plaza de fundador para un club, si queda alguna.
 * Devuelve el número asignado, o null si ya están todas ocupadas.
 *
 * Se hace en la base de datos y no en el código de la app porque dos
 * clubes pueden pulsar "contratar" a la vez: el bloqueo de la fila de
 * ajustes serializa las dos peticiones y evita repartir la misma plaza
 * dos veces.
 */
create or replace function public.reservar_plaza_fundador(p_club_id uuid)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_total int;
  v_ocupadas int;
  v_asignado int;
  v_actual int;
begin
  -- Si este club ya tenía plaza, se le devuelve la suya.
  select founder_number into v_actual from public.clubs where id = p_club_id;
  if v_actual is not null then
    return v_actual;
  end if;

  -- El bloqueo de esta fila es lo que serializa las peticiones a la vez.
  select valor into v_total
    from public.plataforma_ajustes
   where clave = 'plazas_fundador'
     for update;

  if v_total is null then
    return null;
  end if;

  select count(*) into v_ocupadas from public.clubs where founder_number is not null;

  if v_ocupadas >= v_total then
    return null;
  end if;

  select coalesce(max(founder_number), 0) + 1 into v_asignado from public.clubs;

  update public.clubs
     set founder_number = v_asignado,
         plan = 'fundador'
   where id = p_club_id;

  return v_asignado;
end;
$$;

comment on function public.reservar_plaza_fundador(uuid) is
  'Asigna la siguiente plaza de fundador libre a un club. Null si ya no quedan.';

/** Cuántas plazas de fundador quedan libres. */
create or replace function public.plazas_fundador_libres()
returns int
language sql
stable
security definer
set search_path = public
as $$
  select greatest(
    0,
    coalesce((select valor from public.plataforma_ajustes where clave = 'plazas_fundador'), 0)
      - (select count(*)::int from public.clubs where founder_number is not null)
  );
$$;

grant execute on function public.plazas_fundador_libres() to anon, authenticated;


-- =====================================================================
-- 0022_quien_mira_a_cada_club.sql
-- =====================================================================
-- ---------------------------------------------------------------------
-- Quién mira a cada club.
--
-- La migración 0014 ya contaba visitas, pero de forma anónima: el club
-- sabía "12 visitas" y nada más. Faltaban las dos preguntas que de
-- verdad importan, tanto para el club como para el administrador de la
-- plataforma:
--
--   1. ¿Cuántas EMPRESAS (no visitantes sueltos) han entrado en la ficha?
--   2. ¿Cuántas han llegado a mirar los datos de contacto?
--
-- La segunda es la señal más valiosa que produce la plataforma: una
-- empresa que abre el teléfono de un club está a un paso de escribirle.
-- Es también la métrica con la que se defiende la cuota: "este mes tres
-- empresas miraron tu contacto" vale más que cualquier gráfica.
--
-- Se guarda quién, no solo cuántos, porque son datos de empresa (una
-- persona jurídica mirando una oferta comercial), no de navegación
-- personal: el club ve el nombre de la empresa, igual que vería quién
-- entra por la puerta del pabellón.
-- ---------------------------------------------------------------------

-- 1. Las visitas pasan a saber si venían de una empresa registrada.
alter table public.club_page_views
  add column if not exists company_id uuid references auth.users (id) on delete set null;

create index if not exists club_page_views_company_idx
  on public.club_page_views (club_id, company_id, created_at desc)
  where company_id is not null;

comment on column public.club_page_views.company_id is
  'Empresa registrada que hizo la visita, si había sesión iniciada. Null en visitas anónimas.';

-- 2. Aperturas de los datos de contacto.
create table if not exists public.club_contact_views (
  id bigserial primary key,
  club_id uuid not null references public.clubs (id) on delete cascade,
  company_id uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists club_contact_views_club_idx
  on public.club_contact_views (club_id, created_at desc);

create index if not exists club_contact_views_company_idx
  on public.club_contact_views (club_id, company_id)
  where company_id is not null;

alter table public.club_contact_views enable row level security;
-- Sin políticas: la escribe y la lee el servidor con la clave de
-- servicio, igual que el resto de tablas de eventos (0014).

comment on table public.club_contact_views is
  'Una fila cada vez que alguien despliega los datos de contacto de un club. Es la señal previa al primer correo.';


-- =====================================================================
-- 0023_permisos_de_tabla.sql
-- =====================================================================
-- ---------------------------------------------------------------------
-- Dar permiso de tabla explícito a quien tiene sesión iniciada.
--
-- En Postgres hay dos puertas antes de escribir en una tabla: el permiso
-- de tabla (GRANT) y, después, la regla de fila (RLS). Todas las
-- migraciones anteriores escribieron con cuidado las reglas de fila y
-- ninguna se ocupó de la primera puerta: se daba por hecho el permiso
-- automático que Supabase concede a las tablas nuevas.
--
-- Cuando ese automatismo no se aplica —y no siempre se aplica—, un club
-- con sesión iniciada y todos sus permisos en regla se encuentra con
-- "permission denied for table clubs" al intentar guardar su ficha. La
-- ficha no se puede rellenar, el logo no se puede subir y nada de esto
-- lo arregla el propio club.
--
-- Aquí se concede lo justo, tabla por tabla. No es un permiso general:
-- la RLS sigue decidiendo qué filas ve y toca cada uno, y las tablas que
-- solo escribe el servidor se quedan fuera a propósito.
-- ---------------------------------------------------------------------

-- Uso del esquema. Sin esto, ningún GRANT de tabla sirve de nada.
grant usage on schema public to anon, authenticated;

-- ---------------------------------------------------------------------
-- 1. Tablas del club: las gestiona su dueño desde el panel.
-- ---------------------------------------------------------------------
grant select, insert, update on public.clubs to authenticated;
grant select, insert, update, delete on public.club_teams to authenticated;
grant select, insert, update, delete on public.club_sponsors to authenticated;
grant select, insert, update, delete on public.club_service_needs to authenticated;
grant select, insert, update, delete on public.opportunities to authenticated;
grant select, insert, update, delete on public.club_dossiers to authenticated;

-- Un club no se borra a sí mismo desde el panel (la baja de la cuenta va
-- por otro camino), así que `clubs` no lleva delete.

-- ---------------------------------------------------------------------
-- 2. Tablas de la empresa.
-- ---------------------------------------------------------------------
grant select, insert, update on public.companies to authenticated;
grant select, insert, update, delete on public.company_favorites to authenticated;
grant select, insert, update, delete on public.company_favorite_lists to authenticated;

-- ---------------------------------------------------------------------
-- 3. Tablas que comparten los dos lados.
-- ---------------------------------------------------------------------
-- Las solicitudes las crea la empresa y las actualiza el club al
-- responderlas; ninguno de los dos las borra.
grant select, insert, update on public.contact_requests to authenticated;

-- Las plantillas de oportunidad: se leen las públicas y las propias, y
-- cada uno gestiona las suyas.
grant select, insert, delete on public.opportunity_templates to authenticated;

-- El registro de consentimientos se escribe al aceptar las condiciones y
-- no se modifica nunca: es su valor como prueba.
grant select, insert on public.consent_records to authenticated;

-- ---------------------------------------------------------------------
-- 4. Lectura pública sin sesión
-- ---------------------------------------------------------------------
-- La ficha pública de un club la ve cualquiera, y se sirve de estas dos
-- tablas hijas más las vistas públicas (que ya tienen su grant).
grant select on public.club_teams to anon;
grant select on public.club_sponsors to anon;
grant select on public.opportunities to anon;
grant select on public.opportunity_templates to anon;

-- ---------------------------------------------------------------------
-- 5. Lo que sigue siendo solo del servidor
-- ---------------------------------------------------------------------
-- Estas tablas las escribe la plataforma con su clave de servicio y no
-- las toca nadie más: ni con sesión iniciada ni sin ella. Se revoca de
-- forma explícita para que ningún permiso automático las abra por la
-- puerta de atrás.
revoke all on public.rate_limit_hits from anon, authenticated;
revoke all on public.geocode_cache from anon, authenticated;
revoke all on public.club_page_views from anon, authenticated;
revoke all on public.club_search_appearances from anon, authenticated;
revoke all on public.club_contact_views from anon, authenticated;
revoke all on public.dossier_views from anon, authenticated;
revoke all on public.search_logs from anon, authenticated;
revoke all on public.email_log from anon, authenticated;
revoke all on public.plataforma_ajustes from anon, authenticated;

-- Y lo que la migración 0012 ya había cerrado a los visitantes sin
-- sesión, por si el permiso automático lo hubiera vuelto a abrir.
revoke select on public.clubs from anon;
revoke select on public.companies from anon;
revoke select on public.contact_requests from anon;
revoke select on public.company_favorites from anon;
revoke select on public.company_favorite_lists from anon;
revoke select on public.club_dossiers from anon;
revoke select on public.consent_records from anon;
revoke select on public.club_service_needs from anon;

-- ---------------------------------------------------------------------
-- 6. Secuencias
-- ---------------------------------------------------------------------
-- Las tablas con id autonumérico necesitan además permiso sobre su
-- secuencia para poder insertar. Ninguna de las que puede escribir un
-- usuario con sesión lo usa hoy (todas van con uuid), pero dejarlo
-- escrito evita el mismo susto la próxima vez que se añada una.
grant usage on all sequences in schema public to authenticated;


-- =====================================================================
-- 0024_correo_de_contacto_del_club.sql
-- =====================================================================
-- ---------------------------------------------------------------------
-- Un correo de contacto propio, distinto del de la cuenta.
--
-- Hasta ahora el correo que veía la empresa era, por fuerza, el de la
-- cuenta con la que se registró el club. Eso obliga a que el correo
-- personal de quien creó la cuenta salga publicado, y no deja poner el
-- buzón que el club usa de verdad para esto (info@, patrocinios@, el del
-- responsable comercial).
--
-- Si no se rellena, se sigue usando el de la cuenta: nadie se queda sin
-- forma de contacto por no haber rellenado un campo más.
-- ---------------------------------------------------------------------

alter table public.clubs
  add column if not exists contact_email text;

alter table public.clubs drop constraint if exists clubs_contact_email_check;
alter table public.clubs
  add constraint clubs_contact_email_check
  check (
    contact_email is null
    or (length(contact_email) between 5 and 254 and contact_email like '%_@_%.__%')
  );

comment on column public.clubs.contact_email is
  'Correo de contacto que el club quiere publicar. Si es null se usa el de su cuenta.';


-- =====================================================================
-- 0025_portada_instalaciones_y_horario.sql
-- =====================================================================
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


-- =====================================================================
-- 0026_encuadre_de_la_portada.sql
-- =====================================================================
-- ---------------------------------------------------------------------
-- Dónde se corta la portada.
--
-- La imagen de portada es apaisada y muy baja (de lado a lado, unos 320
-- píxeles de alto), así que de una foto normal solo cabe una franja. Por
-- defecto se coge la del centro, y eso deja fuera justo lo que importa
-- la mitad de las veces: en una foto de equipo salen los pies, y en una
-- del pabellón se corta el marcador.
--
-- Esto guarda a qué altura de la foto se hace ese corte, en porcentaje:
-- 0 es pegado arriba, 100 pegado abajo, 50 el centro de siempre. El club
-- lo ajusta con un deslizador viendo el resultado.
-- ---------------------------------------------------------------------

alter table public.clubs
  add column if not exists cover_position int not null default 50;

alter table public.clubs drop constraint if exists clubs_cover_position_check;
alter table public.clubs
  add constraint clubs_cover_position_check
  check (cover_position between 0 and 100);

comment on column public.clubs.cover_position is
  'Altura del recorte de la portada, en porcentaje: 0 arriba, 50 centro, 100 abajo.';

-- La columna se añade AL FINAL de la vista a propósito. Postgres permite
-- ampliar una vista por el final con "create or replace" sin tener que
-- borrarla y volver a crearla, y así este cambio no aparece como una
-- operación destructiva en el editor de Supabase.
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
  cover_position
from public.clubs
where subscription_status in ('trialing', 'active')
  and not admin_suspended;

grant select on public.club_public_profiles to anon, authenticated;


-- =====================================================================
-- 0027_aviso_al_patrocinador.sql
-- =====================================================================
-- ---------------------------------------------------------------------
-- Avisar al patrocinador de que el club le ha añadido.
--
-- Es la pieza que resuelve el arranque en frío de la plataforma: cada
-- club que sube a sus patrocinadores actuales trae empresas que ya han
-- demostrado que patrocinan deporte, sin coste de captación. El aviso
-- convierte eso de pasivo en activo.
--
-- Con una condición que manda sobre todo lo demás: el correo lo manda el
-- CLUB, no ApoyaClub. Escribir a una empresa que no ha dado su dirección
-- a nadie es spam en el sentido legal (art. 21 LSSI, RGPD por encima), y
-- la consecuencia práctica más probable no es una multa, es que el
-- dominio se queme y dejen de llegar los correos que sí importan: las
-- solicitudes de contacto.
--
-- Entre el club y su patrocinador SÍ hay relación previa, y ahí es donde
-- se apoya todo esto. Por eso se guarda, con fecha, que el club ha
-- confirmado esa relación; y por eso el aviso se manda UNA sola vez por
-- empresa, lo que garantiza `notified_at`.
-- ---------------------------------------------------------------------

alter table public.club_sponsors
  add column if not exists contact_email text,
  add column if not exists relationship_confirmed_at timestamptz,
  add column if not exists notified_at timestamptz;

alter table public.club_sponsors drop constraint if exists club_sponsors_contact_email_check;
alter table public.club_sponsors
  add constraint club_sponsors_contact_email_check
  check (
    contact_email is null
    or (length(contact_email) between 5 and 254 and contact_email like '%_@_%.__%')
  );

-- No se puede haber avisado a quien no ha confirmado su relación con el
-- club: la confirmación es la base sobre la que se manda el correo, así
-- que la restricción lo deja imposible por construcción y no solo por
-- disciplina del código.
alter table public.club_sponsors drop constraint if exists club_sponsors_aviso_check;
alter table public.club_sponsors
  add constraint club_sponsors_aviso_check
  check (notified_at is null or relationship_confirmed_at is not null);

comment on column public.club_sponsors.contact_email is
  'Correo de contacto de la empresa patrocinadora, que aporta el club. Nunca se publica.';
comment on column public.club_sponsors.relationship_confirmed_at is
  'Cuándo confirmó el club que esta empresa colabora con él y que tiene relación con esa dirección.';
comment on column public.club_sponsors.notified_at is
  'Cuándo se le mandó el aviso de agradecimiento. Solo se manda una vez, nunca dos.';


-- =====================================================================
-- 0037_registro_de_publico.sql
-- =====================================================================
-- ---------------------------------------------------------------------
-- 0037 — El registro de público en los partidos.
--
-- Hasta ahora el club escribía a mano un número en su ficha,
-- `clubs.average_attendance`, y ese número era exactamente eso: un
-- número escrito a mano. Una empresa que se plantea poner 1.200 € en
-- una valla no tiene forma de saber si detrás hay un recuento o una
-- corazonada, y el club que sí cuenta a su gente no tiene manera de
-- demostrarlo.
--
-- Esta tabla es el recuento. Una fila = un partido jugado, con cuánta
-- gente hubo. De ahí salen la media, el total de la temporada y el
-- mejor partido, que es lo que de verdad se le enseña a un patrocinador:
-- "por delante de tu valla han pasado 4.300 personas este año".
--
-- Decisiones:
--
--   * `attendance` es obligatorio. La tabla se llama registro de
--     público: un partido sin el dato de público no aporta nada aquí y
--     ensuciaría todas las medias con filas vacías.
--
--   * No se guarda ninguna media. Se calcula al leer, como el
--     "caducado" de las tareas (migración 0030). Una media guardada se
--     queda vieja en cuanto alguien corrige un partido, y nadie se
--     entera.
--
--   * `clubs.average_attendance` se queda tal cual, escrita a mano. El
--     club decide con un botón si quiere llevarse la media real a su
--     ficha; no se le pisa el dato por detrás.
--
--   * Es privada. La ficha pública enseña el resumen a través de
--     `average_attendance`, no partido a partido: el calendario de un
--     club de cantera no tiene por qué ser público.
-- ---------------------------------------------------------------------

create table if not exists public.club_matches (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs (id) on delete cascade,

  played_on date not null,
  -- Contra quién. Texto libre: aquí no hay una base de datos de rivales
  -- de regional y no la va a haber.
  opponent text not null,
  -- Liga, copa, amistoso, torneo de verano...
  competition text,
  -- Qué equipo del club jugó: "Primer equipo masculino", "Cadete A".
  -- Sin esto, un club con ocho equipos mezcla en la misma media al
  -- primer equipo y a los prebenjamines.
  team text,
  -- En casa o fuera. La media que le importa a un patrocinador de valla
  -- es la de casa, y sin este campo no se pueden separar.
  home boolean not null default true,

  attendance integer not null,
  notes text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.club_matches
  drop constraint if exists club_matches_attendance_check;
alter table public.club_matches
  add constraint club_matches_attendance_check
  check (attendance between 0 and 200000);

alter table public.club_matches
  drop constraint if exists club_matches_textos_check;
alter table public.club_matches
  add constraint club_matches_textos_check
  check (
    length(opponent) between 1 and 120
    and (competition is null or length(competition) <= 120)
    and (team is null or length(team) <= 120)
    and (notes is null or length(notes) <= 1000)
  );

-- La consulta de siempre: los partidos de un club, del más reciente al
-- más antiguo.
create index if not exists club_matches_club_fecha_idx
  on public.club_matches (club_id, played_on desc);

drop trigger if exists set_club_matches_updated_at on public.club_matches;
create trigger set_club_matches_updated_at
  before update on public.club_matches
  for each row execute function public.set_updated_at();

alter table public.club_matches enable row level security;

drop policy if exists "club_matches_select_own" on public.club_matches;
create policy "club_matches_select_own"
  on public.club_matches for select
  using (auth.uid() = club_id);

drop policy if exists "club_matches_insert_own" on public.club_matches;
create policy "club_matches_insert_own"
  on public.club_matches for insert
  with check (auth.uid() = club_id);

drop policy if exists "club_matches_update_own" on public.club_matches;
create policy "club_matches_update_own"
  on public.club_matches for update
  using (auth.uid() = club_id)
  with check (auth.uid() = club_id);

drop policy if exists "club_matches_delete_own" on public.club_matches;
create policy "club_matches_delete_own"
  on public.club_matches for delete
  using (auth.uid() = club_id);

-- Los permisos de tabla van aparte de las políticas: son dos puertas
-- distintas y esta base no recibió nunca los permisos automáticos de
-- Supabase (ver migraciones 0023 y 0028).
grant select, insert, update, delete on public.club_matches to authenticated;
grant all privileges on public.club_matches to service_role;
revoke all on public.club_matches from anon;

comment on table public.club_matches is
  'Registro privado de público por partido. De aquí salen la media, el total y el mejor partido; no se guarda ninguna media calculada.';
comment on column public.club_matches.home is
  'true = partido en casa. La media que le interesa a un patrocinador de valla o de megafonía es la de casa.';


-- =====================================================================
-- 0038_equipos_y_necesidades.sql
-- =====================================================================
-- ---------------------------------------------------------------------
-- 0038 — Dos cosas que faltaban: el detalle de cada equipo y lo que el
-- club NECESITA (además de lo que ofrece).
--
-- 1. EQUIPOS. Hasta ahora un equipo era deporte, categoría, sexo,
--    número de jugadores y poco más. Faltaba lo que de verdad le dice
--    algo a una empresa: en qué compite y qué ha ganado. "Cadete" no
--    significa nada fuera del mundillo; "Primera Autonómica, campeón
--    provincial 2025" sí.
--
-- 2. NECESIDADES. Hasta ahora todas las oportunidades iban en la misma
--    dirección: el club ofrece visibilidad y la empresa paga. Pero un
--    club de barrio necesita también un fisio, un fotógrafo, un
--    autobús o material, y a cambio ofrece lo mismo —marca, presencia,
--    redes—. Eso es una oportunidad igual de real, solo que al revés,
--    y para un fisioterapeuta del barrio es probablemente la mejor de
--    todas.
--
--    Se resuelve con una bandera en la misma tabla y no con una tabla
--    nueva: comparte absolutamente todo con una oportunidad normal
--    (título, descripción, plazas, equipo, objetivos, estado), y
--    duplicarlo habría significado duplicar también el buscador, la
--    ficha pública y el panel.
-- ---------------------------------------------------------------------

-- ---------- 1. Equipos ----------

alter table public.club_teams
  add column if not exists competition_level text,
  add column if not exists achievements text;

alter table public.club_teams
  drop constraint if exists club_teams_textos_check;
alter table public.club_teams
  add constraint club_teams_textos_check
  check (
    (competition_level is null or length(competition_level) <= 200)
    and (achievements is null or length(achievements) <= 1000)
  );

comment on column public.club_teams.competition_level is
  'En qué compite este equipo, en texto libre: "Primera Autonómica", "Liga comarcal". La categoría (cadete, sénior) va aparte, en `category`.';
comment on column public.club_teams.achievements is
  'Logros de este equipo concreto. Los del club entero siguen en clubs.achievements.';

-- `gender` ya existía y sigue siendo texto libre: hay clubes con
-- equipos mixtos y con nomenclaturas propias, y cerrarlo a tres valores
-- rompería lo que ya hay escrito. Lo que cambia es el formulario, que
-- ahora ofrece las tres opciones normales en un desplegable para que
-- "Masculino", "masculino" y "M" dejen de ser tres cosas distintas.

-- ---------- 2. Necesidades del club ----------

alter table public.opportunities
  add column if not exists is_need boolean not null default false,
  add column if not exists need_category text;

alter table public.opportunities
  drop constraint if exists opportunities_need_check;
alter table public.opportunities
  add constraint opportunities_need_check
  check (
    -- Una oportunidad normal no lleva categoría de necesidad.
    (not is_need and need_category is null)
    or (
      is_need
      and need_category in (
        'fisioterapia', 'medico', 'fotografia', 'video', 'marketing',
        'imprenta', 'transporte', 'material', 'equipacion', 'limpieza',
        'restauracion', 'alojamiento', 'gimnasio', 'nutricion',
        'asesoria', 'informatica', 'otro'
      )
    )
  );

comment on column public.opportunities.is_need is
  'true = el club NECESITA esto (un servicio, un producto) y ofrece visibilidad a cambio. false = lo normal: el club ofrece visibilidad y la empresa paga.';
comment on column public.opportunities.need_category is
  'Qué clase de servicio o producto necesita. Solo se rellena cuando is_need es true.';

-- Las necesitadas se buscan por su cuenta: un fisioterapeuta que entra
-- quiere ver solo estas.
create index if not exists opportunities_necesidades_idx
  on public.opportunities (need_category)
  where is_need;

-- ---------- 3. La vista del buscador ----------
-- Las columnas nuevas van AL FINAL, detrás de las dos que añadió la
-- 0020. `create or replace view` en Postgres solo deja añadir columnas
-- por el final: meterlas en medio, o cambiarles el nombre, obliga a
-- borrar la vista, y eso Supabase lo marca como operación destructiva.
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
  o.need_category
from public.opportunities o
join public.clubs c on c.id = o.club_id
left join public.club_teams t on t.id = o.team_id
where o.status = 'available'
  and o.archived_at is null
  and c.subscription_status in ('trialing', 'active')
  and not c.admin_suspended;

grant select on public.opportunity_search_view to anon, authenticated;


-- =====================================================================
-- 0039_publico_por_equipo.sql
-- =====================================================================

-- ---------------------------------------------------------------------
-- El público, equipo por equipo.
--
-- `club_matches.team` era texto libre con una lista de sugerencias. En
-- la práctica no sugería nada: la consulta que llenaba esa lista pedía
-- una columna `name` que la tabla de equipos nunca ha tenido,
-- así que fallaba en silencio y el club acababa escribiendo el nombre a
-- mano, distinto cada vez. Con "Senior masculino", "senior masc." y
-- "1er equipo" repartidos por la libreta, no hay estadística por equipo
-- que valga.
--
-- Ahora el partido apunta al equipo de verdad. El texto se conserva
-- —es el nombre que tenía el equipo el día del partido— para que un
-- equipo borrado no se lleve por delante su historial de público.
-- ---------------------------------------------------------------------

alter table public.club_matches
  add column if not exists team_id uuid references public.club_teams (id) on delete set null;

comment on column public.club_matches.team_id is
  'Equipo que jugó el partido (migración 0039). Null si el club escribió el nombre a mano o si el equipo se borró después; en ese caso queda el texto de `team`.';

create index if not exists club_matches_team_id_idx
  on public.club_matches (team_id);


-- =====================================================================
-- 0040_plazas_fundador_que_se_sueltan.sql
-- =====================================================================

-- ---------------------------------------------------------------------
-- Una plaza de fundador reservada y no pagada vuelve al montón.
--
-- La plaza se reserva ANTES de abrir el pago, y eso está bien: si se
-- reservase después, dos clubes podrían pagar la misma y habría que
-- devolverle el dinero a uno. Lo que faltaba era lo contrario: nadie
-- soltaba la plaza si el club se echaba atrás.
--
-- Pasó en la primera prueba real. Un club abrió el pago de Fundador, no
-- lo terminó, y acabó contratando Temporada; su ficha se quedó diciendo
-- "Plan Temporada" y debajo "eres el club fundador nº 1", con la plaza
-- gastada para siempre. Con 50 plazas contadas y clubes mirando precios
-- antes de decidirse, diez arrepentimientos dejan diez plazas muertas y
-- el undécimo club, que sí quiere pagar, se encuentra con que no quedan.
--
-- Lo que NO cambia: un club que llegó a contratar Fundador conserva su
-- número aunque luego se dé de baja. Esa plaza sí se gastó.
-- ---------------------------------------------------------------------

alter table public.clubs
  add column if not exists founder_reserved_at timestamptz;

comment on column public.clubs.founder_reserved_at is
  'Cuándo se reservó la plaza de fundador (migración 0040). Sirve para soltar las reservas que nunca llegaron a pago.';

-- Las plazas que ya existían se dan por reservadas ahora: así ninguna
-- que esté a mitad de un pago en este momento se suelta por sorpresa.
update public.clubs
   set founder_reserved_at = now()
 where founder_number is not null
   and founder_reserved_at is null;

-- La reserva, ahora con fecha.
create or replace function public.reservar_plaza_fundador(p_club_id uuid)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_total int;
  v_ocupadas int;
  v_asignado int;
  v_actual int;
begin
  select founder_number into v_actual from public.clubs where id = p_club_id;
  if v_actual is not null then
    return v_actual;
  end if;

  select valor into v_total
    from public.plataforma_ajustes
   where clave = 'plazas_fundador'
     for update;

  if v_total is null then
    return null;
  end if;

  select count(*) into v_ocupadas from public.clubs where founder_number is not null;

  if v_ocupadas >= v_total then
    return null;
  end if;

  select coalesce(max(founder_number), 0) + 1 into v_asignado from public.clubs;

  update public.clubs
     set founder_number = v_asignado,
         founder_reserved_at = now(),
         plan = 'fundador'
   where id = p_club_id;

  return v_asignado;
end;
$$;

/**
 * Suelta la plaza de un club concreto.
 *
 * Se llama en el momento en que el club contrata otro plan: ahí ya no
 * hay ninguna duda, ha elegido, y no tiene sentido hacerle esperar a
 * que pase el cron para devolver la plaza.
 *
 * No toca el plan: de eso se encarga quien la llama, que es el único
 * que sabe cuál es el nuevo.
 */
create or replace function public.liberar_plaza_fundador(p_club_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Esta función corre con permisos elevados, así que tiene que
  -- comprobar de quién es la plaza. Sin esto, cualquier club con la
  -- sesión abierta podría dejar sin plaza de fundador a otro con una
  -- sola llamada. `auth.uid()` es null cuando la llama el servidor con
  -- la clave de servicio, y ahí sí se permite.
  if auth.uid() is not null and auth.uid() <> p_club_id then
    raise exception 'No puedes soltar la plaza de fundador de otro club.';
  end if;

  update public.clubs
     set founder_number = null,
         founder_reserved_at = null
   where id = p_club_id;
end;
$$;

comment on function public.liberar_plaza_fundador(uuid) is
  'Devuelve al montón la plaza de fundador de un club (migración 0040).';

revoke all on function public.liberar_plaza_fundador(uuid) from public;
grant execute on function public.liberar_plaza_fundador(uuid) to authenticated, service_role;

/**
 * Suelta las reservas que no llegaron a nada. Devuelve cuántas.
 *
 * Dos casos, y solo dos:
 *
 *   1. El club acabó en otro plan. No hay nada que esperar: eligió.
 *   2. El club sigue marcado como fundador pero nunca hubo suscripción
 *      en Stripe, y la reserva ya tiene sus horas. Una sesión de pago de
 *      Stripe caduca a las 24 h, así que pasado ese plazo no va a llegar
 *      ningún pago tardío que nos pille soltando la plaza.
 *
 * Un club que sí contrató Fundador y después canceló no entra por
 * ninguno de los dos: conserva su número.
 */
create or replace function public.liberar_plazas_fundador_caducadas(p_horas int default 24)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_soltadas int;
begin
  with liberadas as (
    update public.clubs
       set founder_number = null,
           founder_reserved_at = null,
           -- Al que nunca llegó a pagar se le quita también el plan: si
           -- se le dejara puesto, su panel seguiría diciéndole "Plan
           -- Fundador" para siempre por haber abierto una pantalla de
           -- pago que cerró. Al que sí pagó no se le toca.
           plan = case
                    when plan = 'fundador' and stripe_subscription_id is null then null
                    else plan
                  end
     where founder_number is not null
       and (
         plan is distinct from 'fundador'
         or (
           stripe_subscription_id is null
           and coalesce(founder_reserved_at, now()) < now() - make_interval(hours => p_horas)
         )
       )
    returning 1
  )
  select count(*)::int into v_soltadas from liberadas;

  return v_soltadas;
end;
$$;

comment on function public.liberar_plazas_fundador_caducadas(int) is
  'Devuelve al montón las plazas de fundador reservadas que nunca llegaron a pago (migración 0040). La llama el cron diario.';

revoke all on function public.liberar_plazas_fundador_caducadas(int) from public;
grant execute on function public.liberar_plazas_fundador_caducadas(int) to service_role;


-- =====================================================================
-- 0041_a_quien_escribir.sql
-- =====================================================================

-- ---------------------------------------------------------------------
-- A quién escribir: la lista de empresas que el club quiere abordar.
--
-- El club ya tiene su página, sus oportunidades y su cartel. Y entonces
-- se sienta, y no sabe por dónde empezar. Esa es la pared contra la que
-- choca de verdad un club de base: no le falta qué ofrecer, le falta a
-- quién ofrecérselo, y no tiene dónde apuntar a quién ya ha llamado.
--
-- Lo que NO es esto, a propósito: no es una base de datos de empresas
-- comprada ni raspada de ningún sitio. Eso sería correo comercial no
-- solicitado, que la LSSI prohíbe y que las condiciones de uso de la
-- propia plataforma prohíben también. Aquí el club escribe a quien ya
-- conoce, que además es a quien más probabilidades tiene de decirle que
-- sí: los padres de sus jugadores, los comercios de su calle y las
-- empresas que ya patrocinan a los clubes de su liga.
--
-- De ahí la columna `origin`: no es un adorno, es la pregunta que hace
-- pensar al club dónde mirar.
-- ---------------------------------------------------------------------

create table if not exists public.club_prospects (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs (id) on delete cascade,

  name text not null,
  sector text,

  -- A quién se llama y cómo. Texto libre: en un club de base esto es
  -- "Marta, la madre de Iker" más veces que un cargo de verdad.
  contact_name text,
  contact_info text,

  -- De dónde sale este nombre. Lo que convierte una lista en un método.
  origin text not null default 'otro'
    check (origin in ('familia', 'rival', 'barrio', 'conocido', 'otro')),

  status text not null default 'pendiente'
    check (status in ('pendiente', 'contactado', 'interesado', 'acuerdo', 'descartado')),

  notes text,

  -- Cuándo volver a llamar. La mitad de los patrocinios se pierden por
  -- no volver a llamar, no por un no.
  next_action_on date,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.club_prospects is
  'Empresas a las que un club quiere escribir, con su estado (migración 0041). Privada del club.';

create index if not exists club_prospects_club_id_idx on public.club_prospects (club_id);
create index if not exists club_prospects_proximo_idx
  on public.club_prospects (club_id, next_action_on)
  where next_action_on is not null;

drop trigger if exists club_prospects_set_updated_at on public.club_prospects;
create trigger club_prospects_set_updated_at
  before update on public.club_prospects
  for each row
  execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- Permisos: esto es la libreta del club y no la ve nadie más.
-- ---------------------------------------------------------------------
alter table public.club_prospects enable row level security;

drop policy if exists "club_prospects_select_propio" on public.club_prospects;
create policy "club_prospects_select_propio" on public.club_prospects
  for select using (auth.uid() = club_id);

drop policy if exists "club_prospects_insert_propio" on public.club_prospects;
create policy "club_prospects_insert_propio" on public.club_prospects
  for insert with check (auth.uid() = club_id);

drop policy if exists "club_prospects_update_propio" on public.club_prospects;
create policy "club_prospects_update_propio" on public.club_prospects
  for update using (auth.uid() = club_id) with check (auth.uid() = club_id);

drop policy if exists "club_prospects_delete_propio" on public.club_prospects;
create policy "club_prospects_delete_propio" on public.club_prospects
  for delete using (auth.uid() = club_id);

-- RLS y GRANT son dos puertas distintas: sin esto, las políticas de
-- arriba no llegan a evaluarse nunca.
grant select, insert, update, delete on public.club_prospects to authenticated;
grant all on public.club_prospects to service_role;
revoke all on public.club_prospects from anon;


-- =====================================================================
-- 0042_socios_del_club.sql
-- =====================================================================

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

-- ---------------------------------------------------------------------
-- Lo que el club necesita, en un solo sitio.
--
-- Había dos formas de decir exactamente lo mismo, y el club las tenía
-- las dos en la misma pantalla sin que nada le avisara de la
-- diferencia:
--
--   1. Una oportunidad con el interruptor "es una necesidad"
--      (`opportunities.is_need`, migración 0038). Esta SÍ sale en el
--      buscador: la vista `opportunity_search_view` la indexa.
--   2. El formulario "Servicios que necesitamos"
--      (`club_service_needs`, migración 0016). Esta NO salía en ningún
--      buscador: solo se veía en la ficha del club y en /servicios.
--
-- O sea que un club podía estar apuntando lo que necesita en el sitio
-- donde nadie lo iba a encontrar. Y encima con catálogos de categorías
-- distintos: siete en uno y diecisiete en el otro.
--
-- Aquí se pasa todo lo de (2) a (1) y se deja de escribir en la tabla
-- vieja. No se borra: los datos se quedan donde están por si hubiera
-- que mirar atrás, con la fecha de traspaso apuntada para no traer dos
-- veces lo mismo.
-- ---------------------------------------------------------------------

alter table public.club_service_needs
  add column if not exists migrated_at timestamptz;

comment on column public.club_service_needs.migrated_at is
  'Cuándo se pasó esta fila a `opportunities` como necesidad (migración 0043). No nula = ya traspasada; la tabla queda solo de archivo.';

comment on table public.club_service_needs is
  'RETIRADA (migración 0043). Lo que el club necesita vive ahora en `opportunities` con is_need = true. Esta tabla se conserva como archivo de lo que se apuntó antes; no se escribe en ella.';

-- Las siete categorías viejas, a las diecisiete de las oportunidades.
-- "formacion" no tiene equivalente y cae en "otro": es preferible a
-- inventarle una que no le corresponde.
create or replace function public.categoria_de_servicio_a_necesidad(p_categoria text)
returns text
language sql
immutable
as $$
  select case p_categoria
    when 'salud' then 'medico'
    when 'transporte' then 'transporte'
    when 'hosteleria' then 'restauracion'
    when 'material' then 'material'
    when 'imprenta' then 'imprenta'
    when 'formacion' then 'otro'
    else 'otro'
  end;
$$;

comment on function public.categoria_de_servicio_a_necesidad(text) is
  'Traduce las 7 categorías de `club_service_needs` a las 17 de `opportunities.need_category` (migración 0043).';

-- El traspaso.
--
-- `value = 0` porque una necesidad no lleva precio: lo que se ofrece es
-- el servicio y a cambio va visibilidad.
--
-- `opportunity_type = 'in_kind'` porque eso es exactamente lo que es:
-- una aportación en especie.
--
-- Un servicio ya cubierto entra como 'reserved', que es lo que
-- significa en el catálogo nuevo.
insert into public.opportunities (
  club_id,
  title,
  description,
  opportunity_type,
  status,
  value,
  is_need,
  need_category,
  created_at
)
select
  s.club_id,
  s.title,
  s.description,
  'in_kind',
  case when s.status = 'covered' then 'reserved' else 'available' end,
  0,
  true,
  public.categoria_de_servicio_a_necesidad(s.category),
  s.created_at
from public.club_service_needs s
where s.migrated_at is null;

update public.club_service_needs
   set migrated_at = now()
 where migrated_at is null;

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

-- ---------------------------------------------------------------------
-- Las bajas: qué clubes se han ido y cuándo.
--
-- Hasta ahora, cuando un club borraba su cuenta desde "Privacidad" no
-- quedaba absolutamente nada: la fila se va en cascada y el usuario de
-- Auth también. Eso está bien para el derecho de supresión, pero deja
-- ApoyaClub sin poder responder a la única pregunta que importa cuando
-- alguien se va: cuántos se van, cuándo y después de cuánto tiempo.
--
-- Esta tabla es el registro de esas bajas. Guarda lo justo para contar
-- y para llamar por teléfono si procede:
--
--   · El nombre del club, que es el de una entidad, no el de una
--     persona.
--   · Dónde está, qué plan tenía y si llegó a pagar alguna vez.
--   · Cuándo se dio de alta y cuándo se fue.
--
-- Y NO guarda nada personal: ni el correo, ni el teléfono, ni el
-- nombre de la persona de contacto. Todo eso se va con la cuenta, como
-- tiene que irse. Si algún club pide que se borre también su rastro de
-- aquí, se borra su fila y ya está: nada depende de ella.
-- ---------------------------------------------------------------------

create table if not exists public.club_closures (
  id uuid primary key default gen_random_uuid(),

  -- Sin clave foránea a propósito: la fila del club ya no existe
  -- cuando esta se escribe.
  club_id uuid not null,

  club_name text not null,
  city text,
  province text,

  plan text,
  -- El estado de la suscripción en el momento de irse.
  subscription_status text,
  -- Si llegó a pagar alguna vez, o se fue durante la prueba.
  ever_paid boolean not null default false,

  signed_up_at timestamptz,
  closed_at timestamptz not null default now(),

  -- Quién cerró: el propio club desde su panel, o ApoyaClub.
  closed_by text not null default 'club'
    constraint club_closures_closed_by_check check (closed_by in ('club', 'admin')),

  -- Lo que contó el club al irse, si contó algo.
  reason text
);

comment on table public.club_closures is
  'Registro de bajas de clubes (migración 0045). Se escribe al eliminar la cuenta. No contiene datos personales: ni correo, ni teléfono, ni persona de contacto.';

create index if not exists club_closures_closed_at_idx
  on public.club_closures (closed_at desc);

-- Solo la escribe y la lee el servidor, con la clave de servicio: aquí
-- no entra nadie con sesión de club. Sin GRANT no hay forma de tocarla
-- desde el navegador, ni siquiera con la RLS abierta.
alter table public.club_closures enable row level security;

revoke all on public.club_closures from anon, authenticated;

-- ---------------------------------------------------------------------
-- Lo que la empresa ofrece, y lo que se guarda para luego.
--
-- ApoyaClub iba en una sola dirección: el club publica y la empresa
-- mira. La migración 0033 dejó preparado el directorio de empresas y
-- nunca se encendió, porque faltaba lo único que hace que un directorio
-- sirva de algo: que la empresa pueda decir QUÉ ofrece, en concreto.
--
-- "Estoy abierta a patrocinar" no lleva a ningún sitio; "ofrezco cuatro
-- sesiones de fisioterapia al mes a cambio del logo en la camiseta"
-- sí. Esta migración añade eso, que es la imagen en espejo de lo que ya
-- publica el club.
--
-- Dos decisiones que conviene no deshacer sin pensarlo:
--
--   * Publicar una oferta te pone en el directorio. No hay un segundo
--     interruptor que haya que acordarse de encender: una oferta
--     publicada que no se ve no es una oferta. `open_to_sponsor`
--     (migración 0033) sigue existiendo para la empresa que quiere
--     salir SIN publicar nada.
--
--   * Los favoritos dejan de exigir una lista. Se crearon con listas
--     con nombre (Fase 8) y eso obliga a inventarse una lista antes de
--     poder guardar lo primero. Ahora la lista es opcional: se guarda
--     con un clic y ya se ordenará, si alguna vez hace falta.
-- ---------------------------------------------------------------------

-- ---------------------------------------------------------------------
-- 1. Lo que ofrece la empresa
-- ---------------------------------------------------------------------
create table if not exists public.company_offers (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,

  title text not null constraint company_offers_title_check check (length(trim(title)) between 3 and 150),
  description text constraint company_offers_description_check check (description is null or length(description) <= 1000),

  -- Qué pone la empresa. Mismo reparto que en las oportunidades del
  -- club, visto desde el otro lado.
  offer_type text not null default 'in_kind' constraint company_offers_type_check check (
    offer_type in ('money', 'in_kind', 'service')
  ),

  -- Misma familia de categorías que las necesidades del club
  -- (migración 0038): es lo que permite cruzar una cosa con la otra.
  category text,

  -- Solo para las ofertas de dinero. Cero o nulo en las demás: lo que
  -- se ofrece ES el servicio, y ponerle precio confunde.
  value numeric(10, 2) constraint company_offers_value_check check (value is null or value >= 0),

  -- Qué pide a cambio. En texto libre a propósito: lo que quiere una
  -- clínica de fisioterapia no se parece a lo que quiere una imprenta.
  wants text constraint company_offers_wants_check check (wants is null or length(wants) <= 500),

  -- Hasta dónde llega. Nulo = toda España.
  province text,

  status text not null default 'available' constraint company_offers_status_check check (
    status in ('available', 'reserved', 'closed')
  ),

  -- No nulo = archivada. Como en las oportunidades del club: no se
  -- borra, se esconde.
  archived_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.company_offers is
  'Lo que una empresa ofrece a los clubes (migración 0046). La imagen en espejo de `opportunities`: aquí pone la empresa y pide el club.';

create index if not exists company_offers_company_idx
  on public.company_offers (company_id, created_at desc);
create index if not exists company_offers_publicas_idx
  on public.company_offers (status, created_at desc)
  where archived_at is null;

drop trigger if exists company_offers_set_updated_at on public.company_offers;
create trigger company_offers_set_updated_at
  before update on public.company_offers
  for each row execute function public.set_updated_at();

alter table public.company_offers enable row level security;

-- La empresa manda sobre las suyas y sobre ninguna más.
drop policy if exists "company_offers_select_own" on public.company_offers;
create policy "company_offers_select_own"
  on public.company_offers for select
  using (auth.uid() = company_id);

drop policy if exists "company_offers_insert_own" on public.company_offers;
create policy "company_offers_insert_own"
  on public.company_offers for insert
  with check (auth.uid() = company_id);

drop policy if exists "company_offers_update_own" on public.company_offers;
create policy "company_offers_update_own"
  on public.company_offers for update
  using (auth.uid() = company_id)
  with check (auth.uid() = company_id);

drop policy if exists "company_offers_delete_own" on public.company_offers;
create policy "company_offers_delete_own"
  on public.company_offers for delete
  using (auth.uid() = company_id);

grant select, insert, update, delete on public.company_offers to authenticated;
grant all privileges on public.company_offers to service_role;
revoke all on public.company_offers from anon;

-- ---------------------------------------------------------------------
-- 2. La vista pública de ofertas
--
-- Lo que ve un club al buscar empresas. Lleva los datos de la empresa
-- ya pegados para no tener que cruzar nada al leer. Sin correo: para
-- eso están las propuestas (migración 0033).
-- ---------------------------------------------------------------------
drop view if exists public.company_offers_public;
create view public.company_offers_public as
select
  o.id,
  o.company_id,
  o.title,
  o.description,
  o.offer_type,
  o.category,
  o.value,
  o.wants,
  -- La de la oferta si la tiene; si no, la de la empresa.
  coalesce(o.province, c.province) as province,
  o.created_at,
  c.slug as company_slug,
  c.name as company_name,
  c.sector as company_sector,
  c.city as company_city,
  c.logo_url as company_logo_url
from public.company_offers o
join public.companies c on c.id = o.company_id
where o.archived_at is null
  and o.status = 'available'
  and c.name is not null
  and length(trim(c.name)) > 0;

grant select on public.company_offers_public to anon, authenticated;

comment on view public.company_offers_public is
  'Ofertas de empresa visibles para los clubes (migración 0046). Solo las activas y de empresas con nombre. No expone el correo.';

-- ---------------------------------------------------------------------
-- 3. La empresa que publica sale en el directorio
--
-- Sin un segundo interruptor que haya que acordarse de encender.
-- ---------------------------------------------------------------------
create or replace function public.company_offer_opens_directory()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.companies
     set open_to_sponsor = true
   where id = new.company_id
     and not open_to_sponsor;
  return new;
end;
$$;

drop trigger if exists company_offers_open_directory on public.company_offers;
create trigger company_offers_open_directory
  after insert on public.company_offers
  for each row execute function public.company_offer_opens_directory();

comment on function public.company_offer_opens_directory() is
  'Publicar una oferta pone a la empresa en el directorio (migración 0046). Una oferta que no se ve no es una oferta.';

-- ---------------------------------------------------------------------
-- 4. Favoritos: sin lista obligatoria, y también de clubes
--
-- Antes había que crearse una lista con nombre antes de poder guardar
-- lo primero, y solo se podían guardar oportunidades. Guardar algo
-- tiene que ser un clic.
-- ---------------------------------------------------------------------
alter table public.company_favorites alter column list_id drop not null;
alter table public.company_favorites alter column opportunity_id drop not null;
alter table public.company_favorites
  add column if not exists club_id uuid references public.clubs (id) on delete cascade;

-- Una cosa u otra, nunca las dos ni ninguna.
alter table public.company_favorites drop constraint if exists company_favorites_una_cosa_check;
alter table public.company_favorites
  add constraint company_favorites_una_cosa_check
  check ((opportunity_id is null) <> (club_id is null));

-- La regla de antes colgaba de la lista, que ahora puede no estar.
alter table public.company_favorites drop constraint if exists company_favorites_list_id_opportunity_id_key;

create unique index if not exists company_favorites_una_oportunidad
  on public.company_favorites (company_id, opportunity_id)
  where opportunity_id is not null;

create unique index if not exists company_favorites_un_club
  on public.company_favorites (company_id, club_id)
  where club_id is not null;

create index if not exists company_favorites_club_idx on public.company_favorites (club_id);

comment on table public.company_favorites is
  'Lo que una empresa ha guardado: una oportunidad o un club (migración 0046). La lista es opcional; guardar es un clic.';

-- ---------------------------------------------------------------------
-- Cómo se contacta con la empresa.
--
-- La migración 0046 dejó que la empresa publicara lo que ofrece, y se
-- olvidó de lo único que hace falta después: cómo la llaman. Un club
-- entraba en su ficha, veía "4 sesiones de fisioterapia al mes a cambio
-- del logo en la camiseta"… y ahí se acababa el camino. Publicar sin
-- forma de contacto no sirve de nada.
--
-- Mismas columnas y mismo criterio que en `clubs`, para que las dos
-- partes de la plataforma funcionen igual:
--
--   * El consentimiento es explícito y va en su propia columna. El
--     nombre y el teléfono de una persona no se publican porque sí,
--     ni aunque la empresa quiera que la llamen.
--
--   * Viene encendido, como en los clubes (migración 0029): quien
--     publica una oferta es porque quiere que le escriban, y dejarlo
--     apagado por defecto obligaría a un paso más que nadie da.
--
--   * Nada de esto entra en la vista pública. Se sirve detrás de un
--     clic, desde el servidor: un correo escrito en el HTML de una
--     página pública lo recoge cualquier robot que pase, y la empresa
--     acaba recibiendo basura por haber querido ayudar a un club.
-- ---------------------------------------------------------------------

alter table public.companies
  add column if not exists contact_name text,
  add column if not exists contact_email text,
  add column if not exists contact_phone text,
  add column if not exists contact_public_consent boolean not null default true;

comment on column public.companies.contact_name is
  'Persona de contacto de la empresa (migración 0047). Solo se enseña si contact_public_consent.';
comment on column public.companies.contact_email is
  'Correo de contacto (migración 0047). Nunca sale en `company_public_profiles`: se sirve detrás de un clic para que no lo recojan los robots de spam.';
comment on column public.companies.contact_phone is
  'Teléfono de contacto (migración 0047). Mismo criterio que el correo.';
comment on column public.companies.contact_public_consent is
  'La empresa acepta que se enseñen sus datos de contacto a quien entre en su ficha (migración 0047). Encendido por defecto, como en los clubes.';

-- La vista pública se deja EXACTAMENTE como estaba. Está escrita aquí
-- para que se vea que es a propósito y no un olvido: ninguna de las
-- columnas de arriba entra aquí. Quien quiera el contacto pasa por
-- /api/contacto-empresa, que comprueba el consentimiento, lleva cuenta
-- de cuántos se piden por hora y no deja nada escrito en el HTML.
