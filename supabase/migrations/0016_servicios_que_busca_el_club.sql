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
