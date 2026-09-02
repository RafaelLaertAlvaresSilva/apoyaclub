-- ---------------------------------------------------------------------
-- ApoyaClub — BLOQUE 1 de 4: perfil del club, su página pública y las oportunidades.
--
-- Pegar en Supabase -> SQL Editor -> New query -> Run, en orden.
-- Se puede repetir sin romper nada.
-- ---------------------------------------------------------------------


-- ===== 0001_club_profile.sql =====

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


-- ===== 0002_club_public_page.sql =====

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


-- ===== 0003_opportunities.sql =====

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
