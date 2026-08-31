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
