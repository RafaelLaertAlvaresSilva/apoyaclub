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
