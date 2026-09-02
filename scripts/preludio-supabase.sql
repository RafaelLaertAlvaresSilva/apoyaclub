-- ---------------------------------------------------------------------
-- Lo que Supabase ya trae de serie y aquí hay que imitar para poder
-- probar las migraciones contra un PostgreSQL vacío (ver
-- scripts/probar-migraciones.sh).
--
-- No forma parte del esquema de la aplicación: en Supabase estas piezas
-- ya existen y este archivo no se ejecuta nunca allí.
-- ---------------------------------------------------------------------
create schema if not exists auth;
create schema if not exists storage;

create table if not exists auth.users (
  id uuid primary key,
  email text,
  raw_app_meta_data jsonb default '{}'::jsonb
);

create or replace function auth.uid() returns uuid
  language sql stable as $$ select null::uuid $$;

create or replace function auth.jwt() returns jsonb
  language sql stable as $$ select '{}'::jsonb $$;

create table if not exists storage.buckets (
  id text primary key,
  name text,
  owner uuid,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  public boolean default false,
  avif_autodetection boolean default false,
  file_size_limit bigint,
  allowed_mime_types text[],
  owner_id text
);

create table if not exists storage.objects (
  id uuid primary key default gen_random_uuid(),
  bucket_id text,
  name text,
  owner uuid
);

create or replace function storage.foldername(name text) returns text[]
  language sql stable as $$ select string_to_array(name, '/') $$;

do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then create role anon nologin; end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then create role authenticated nologin; end if;
  if not exists (select 1 from pg_roles where rolname = 'service_role') then create role service_role nologin; end if;
end $$;
