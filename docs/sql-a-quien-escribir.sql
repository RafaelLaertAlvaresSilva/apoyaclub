-- ---------------------------------------------------------------------
-- A quién escribir: la lista de empresas que el club quiere abordar.
--
-- El club ya tiene su página, sus oportunidades y su cartel. Y entonces
-- se sienta, y no sabe por dónde empezar. Esa es la pared contra la que
-- choca de verdad un club de base: no le falta qué ofrecer, le falta a
-- quién ofrecérselo, y no tiene dónde apuntar a quién ya ha llamado.
--
-- Lo que NO es esto, a propósito: no es una base de datos de empresas
-- comprada ni raspada de ningún sitio. Eso sería correo comercial no
-- solicitado, que la LSSI prohíbe y que las condiciones de uso de la
-- propia plataforma prohíben también. Aquí el club escribe a quien ya
-- conoce, que además es a quien más probabilidades tiene de decirle que
-- sí: los padres de sus jugadores, los comercios de su calle y las
-- empresas que ya patrocinan a los clubes de su liga.
--
-- De ahí la columna `origin`: no es un adorno, es la pregunta que hace
-- pensar al club dónde mirar.
-- ---------------------------------------------------------------------

create table if not exists public.club_prospects (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs (id) on delete cascade,

  name text not null,
  sector text,

  -- A quién se llama y cómo. Texto libre: en un club de base esto es
  -- "Marta, la madre de Iker" más veces que un cargo de verdad.
  contact_name text,
  contact_info text,

  -- De dónde sale este nombre. Lo que convierte una lista en un método.
  origin text not null default 'otro'
    check (origin in ('familia', 'rival', 'barrio', 'conocido', 'otro')),

  status text not null default 'pendiente'
    check (status in ('pendiente', 'contactado', 'interesado', 'acuerdo', 'descartado')),

  notes text,

  -- Cuándo volver a llamar. La mitad de los patrocinios se pierden por
  -- no volver a llamar, no por un no.
  next_action_on date,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.club_prospects is
  'Empresas a las que un club quiere escribir, con su estado (migración 0041). Privada del club.';

create index if not exists club_prospects_club_id_idx on public.club_prospects (club_id);
create index if not exists club_prospects_proximo_idx
  on public.club_prospects (club_id, next_action_on)
  where next_action_on is not null;

drop trigger if exists club_prospects_set_updated_at on public.club_prospects;
create trigger club_prospects_set_updated_at
  before update on public.club_prospects
  for each row
  execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- Permisos: esto es la libreta del club y no la ve nadie más.
-- ---------------------------------------------------------------------
alter table public.club_prospects enable row level security;

drop policy if exists "club_prospects_select_propio" on public.club_prospects;
create policy "club_prospects_select_propio" on public.club_prospects
  for select using (auth.uid() = club_id);

drop policy if exists "club_prospects_insert_propio" on public.club_prospects;
create policy "club_prospects_insert_propio" on public.club_prospects
  for insert with check (auth.uid() = club_id);

drop policy if exists "club_prospects_update_propio" on public.club_prospects;
create policy "club_prospects_update_propio" on public.club_prospects
  for update using (auth.uid() = club_id) with check (auth.uid() = club_id);

drop policy if exists "club_prospects_delete_propio" on public.club_prospects;
create policy "club_prospects_delete_propio" on public.club_prospects
  for delete using (auth.uid() = club_id);

-- RLS y GRANT son dos puertas distintas: sin esto, las políticas de
-- arriba no llegan a evaluarse nunca.
grant select, insert, update, delete on public.club_prospects to authenticated;
grant all on public.club_prospects to service_role;
revoke all on public.club_prospects from anon;
