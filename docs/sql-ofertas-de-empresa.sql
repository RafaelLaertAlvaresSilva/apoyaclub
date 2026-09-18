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
