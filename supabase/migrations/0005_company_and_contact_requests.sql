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
