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
