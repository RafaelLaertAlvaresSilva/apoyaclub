-- ---------------------------------------------------------------------
-- 0033 — El directorio de empresas abiertas a patrocinar.
--
-- Hasta ahora ApoyaClub iba en una sola dirección: la empresa busca
-- clubes. Pero lo que quiere el dueño de una ferretería de barrio no es
-- ponerse a buscar clubes, es que le lleguen propuestas. Y un club que
-- publica sus oportunidades y no recibe nada tampoco tiene nada que
-- hacer salvo esperar.
--
-- Esto arregla las dos cosas con la misma pieza: la empresa se apunta,
-- aparece en un directorio público, y los clubes le escriben.
--
-- Tres decisiones que conviene no deshacer sin pensarlo:
--
--   * Aparecer es OPCIONAL y viene apagado (`open_to_sponsor` en
--     false). Una empresa se registró para buscar clubes, no para salir
--     en una lista; publicarla sin preguntar sería usarla.
--
--   * La vista pública NO enseña el presupuesto exacto, solo una franja.
--     Publicar "hasta 2.000 €" invita a que todos los clubes propongan
--     exactamente 2.000 €, y la empresa acabaría quitándose del
--     directorio. La franja sirve para filtrar sin dejar a nadie en
--     evidencia.
--
--   * Las propuestas van en su propia tabla y no en `contact_requests`.
--     Van al revés (club → empresa), las gestiona otro, y mezclarlas
--     obligaría a mirar la dirección en cada consulta del sistema.
-- ---------------------------------------------------------------------

-- ---------------------------------------------------------------------
-- 1. La empresa, como ficha pública
-- ---------------------------------------------------------------------
alter table public.companies add column if not exists slug text;
alter table public.companies add column if not exists description text;
alter table public.companies add column if not exists logo_url text;
alter table public.companies add column if not exists province text;
alter table public.companies add column if not exists open_to_sponsor boolean not null default false;

create unique index if not exists companies_slug_key on public.companies (slug);

alter table public.companies drop constraint if exists companies_description_check;
alter table public.companies
  add constraint companies_description_check
  check (description is null or length(description) <= 600);

comment on column public.companies.open_to_sponsor is
  'La empresa acepta aparecer en el directorio público y recibir propuestas de clubes. Apagado por defecto.';

-- Mismo mecanismo de slug que los clubes (migración 0002).
create or replace function public.assign_company_slug()
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

  base_slug := public.slugify(coalesce(new.name, ''));
  if base_slug is null or base_slug = '' then
    base_slug := 'empresa';
  end if;

  candidate := base_slug;
  while exists (select 1 from public.companies where slug = candidate and id <> new.id) loop
    suffix := suffix + 1;
    candidate := base_slug || '-' || suffix;
  end loop;

  new.slug := candidate;
  return new;
end;
$$;

-- En insert y en update: una empresa se crea sin nombre (la fila nace
-- al registrarse) y lo pone después, así que si solo actuara al insertar
-- se quedaría con el slug "empresa" para siempre.
drop trigger if exists companies_assign_slug on public.companies;
create trigger companies_assign_slug
  before insert or update of name on public.companies
  for each row
  when (new.slug is null or new.slug = '')
  execute function public.assign_company_slug();

-- Las que ya existían.
do $$
declare
  fila record;
  base_slug text;
  candidate text;
  suffix integer;
begin
  for fila in select id, name from public.companies where slug is null or slug = '' loop
    base_slug := public.slugify(coalesce(fila.name, ''));
    if base_slug is null or base_slug = '' then
      base_slug := 'empresa';
    end if;

    candidate := base_slug;
    suffix := 1;
    while exists (select 1 from public.companies where slug = candidate and id <> fila.id) loop
      suffix := suffix + 1;
      candidate := base_slug || '-' || suffix;
    end loop;

    update public.companies set slug = candidate where id = fila.id;
  end loop;
end;
$$;

-- ---------------------------------------------------------------------
-- 2. La vista pública
--
-- Solo las que se han apuntado. Sin correo y sin el presupuesto exacto:
-- lo que sale es la franja. Añadir una columna aquí es publicar ese
-- dato — revísalo antes.
-- ---------------------------------------------------------------------
drop view if exists public.company_public_profiles;
create view public.company_public_profiles as
select
  id,
  slug,
  name,
  sector,
  city,
  province,
  website,
  description,
  logo_url,
  objectives,
  case
    when budget_min is null and budget_max is null then null
    when coalesce(budget_max, budget_min) < 500 then 'hasta_500'
    when coalesce(budget_max, budget_min) < 2000 then 'de_500_a_2000'
    else 'mas_2000'
  end as budget_band,
  created_at
from public.companies
where open_to_sponsor
  and name is not null
  and length(trim(name)) > 0;

grant select on public.company_public_profiles to anon, authenticated;

comment on view public.company_public_profiles is
  'Vista pública de empresas abiertas a patrocinar (migración 0033): la usa /empresas. Solo las que han activado open_to_sponsor. No expone el correo ni el presupuesto exacto, solo una franja: publicar la cifra invitaría a que todos los clubes pidieran justo el máximo.';

-- ---------------------------------------------------------------------
-- 3. Propuestas de un club a una empresa
-- ---------------------------------------------------------------------
create table if not exists public.club_proposals (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs (id) on delete cascade,
  company_id uuid not null references public.companies (id) on delete cascade,
  -- Opcional: la propuesta puede ser sobre una oportunidad concreta.
  opportunity_id uuid references public.opportunities (id) on delete set null,
  message text not null,
  status text not null default 'new' check (
    status in ('new', 'seen', 'in_conversation', 'discarded')
  ),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.club_proposals drop constraint if exists club_proposals_message_check;
alter table public.club_proposals
  add constraint club_proposals_message_check
  check (length(message) between 20 and 2000);

create index if not exists club_proposals_company_idx on public.club_proposals (company_id, status);
create index if not exists club_proposals_club_idx on public.club_proposals (club_id, created_at desc);

-- Un club no le escribe dos veces a la misma empresa. Sin esto, el
-- directorio se convierte en una lista de correo y las empresas se dan
-- de baja en una semana.
create unique index if not exists club_proposals_una_por_pareja
  on public.club_proposals (club_id, company_id);

drop trigger if exists club_proposals_set_updated_at on public.club_proposals;
create trigger club_proposals_set_updated_at
  before update on public.club_proposals
  for each row execute function public.set_updated_at();

alter table public.club_proposals enable row level security;

-- El club ve y crea las suyas.
drop policy if exists "club_proposals_select_club" on public.club_proposals;
create policy "club_proposals_select_club"
  on public.club_proposals for select
  using (auth.uid() = club_id);

drop policy if exists "club_proposals_insert_club" on public.club_proposals;
create policy "club_proposals_insert_club"
  on public.club_proposals for insert
  with check (auth.uid() = club_id);

-- La empresa ve las que ha recibido y cambia su estado.
drop policy if exists "club_proposals_select_company" on public.club_proposals;
create policy "club_proposals_select_company"
  on public.club_proposals for select
  using (auth.uid() = company_id);

drop policy if exists "club_proposals_update_company" on public.club_proposals;
create policy "club_proposals_update_company"
  on public.club_proposals for update
  using (auth.uid() = company_id)
  with check (auth.uid() = company_id);

-- Los permisos de tabla van aparte de las políticas (migraciones 0023 y
-- 0028). Sin esto sale "permission denied" antes de mirar RLS.
grant select, insert, update on public.club_proposals to authenticated;
grant all privileges on public.club_proposals to service_role;
revoke all on public.club_proposals from anon;

comment on table public.club_proposals is
  'Propuesta de patrocinio de un club a una empresa del directorio (migración 0033). Al revés que contact_requests. Una sola por pareja club-empresa.';
