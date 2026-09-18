-- =====================================================================
-- EMPRESAS: LO QUE FALTABA + LO NUEVO, EN UN SOLO ARCHIVO
--
-- Por qué existe este archivo.
--
-- El directorio de empresas se escribió hace meses (migración 0033) y
-- nunca llegó a ejecutarse en la base de datos de verdad, porque el
-- lado de empresa se quedó apagado. El SQL de las ofertas (migración
-- 0046) daba por hecho que aquello ya estaba puesto, y por eso falló
-- con "column c.province does not exist": estaba construyendo el piso
-- de arriba sin los cimientos.
--
-- Aquí van las dos cosas seguidas y en el orden correcto. Se puede
-- ejecutar entero aunque una parte ya estuviera puesta: todo está
-- escrito para poder repetirse sin romper nada ni duplicar datos.
--
-- Cómo se usa: copia TODO este archivo, pégalo en Supabase ->
-- SQL Editor -> New query, y pulsa Run. Una sola vez.
-- =====================================================================


-- =====================================================================
-- PARTE 1 de 2 — El directorio de empresas (migración 0033)
-- =====================================================================

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


-- =====================================================================
-- PARTE 2 de 2 — Lo que ofrece la empresa (migración 0046)
-- =====================================================================

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
